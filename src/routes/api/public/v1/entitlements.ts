import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { hashApiKey } from "@/lib/hn-pay/crypto.server";
import { shouldHideAds } from "@/lib/google-ecosystem/adsense";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...CORS } });

const Query = z.object({ email: z.string().email().max(255), site_id: z.string().uuid() });

export const Route = createFileRoute("/api/public/v1/entitlements")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = Query.safeParse({ email: url.searchParams.get("email"), site_id: url.searchParams.get("site_id") });
        if (!parsed.success) return json(400, { error: "invalid_request", details: parsed.error.flatten() });
        const { email, site_id } = parsed.data;

        // Caller must be the site itself: Bearer sk_live_/sk_test_ key belonging to site_id.
        const m = (request.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
        if (!m) return json(401, { error: "missing_api_key" });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: key } = await supabaseAdmin.from("site_api_keys")
          .select("site_id").eq("key_hash", hashApiKey(m[1].trim())).is("revoked_at", null).maybeSingle();
        if (!key || key.site_id !== site_id) return json(403, { error: "forbidden" });

        const { data: site } = await supabaseAdmin.from("sites").select("id, adsense_enabled").eq("id", site_id).maybeSingle();
        if (!site) return json(404, { error: "site_not_found" });

        const { data: customers } = await supabaseAdmin.from("customers").select("id").ilike("email", email);
        const ids = (customers ?? []).map((c) => c.id);
        let subs: { id: string; site_id: string; status: string; current_period_end: string | null; plan_id: string }[] = [];
        if (ids.length) {
          const { data } = await supabaseAdmin.from("subscriptions")
            .select("id, site_id, status, current_period_end, plan_id")
            .in("customer_id", ids).in("status", ["active", "trialing"]);
          subs = data ?? [];
        }
        const siteSub = subs.find((s) => s.site_id === site_id) ?? null;
        // NAWAT Pass: an active subscription on any group plan unlocks premium everywhere.
        const nawatPass = subs.length > 0 && !siteSub;
        const hasActivePlan = !!siteSub || nawatPass;

        return json(200, {
          email,
          site_id,
          has_active_plan: hasActivePlan,
          via: siteSub ? "site_subscription" : nawatPass ? "nawat_pass" : null,
          current_period_end: siteSub?.current_period_end ?? null,
          hide_ads: shouldHideAds({ adsenseEnabled: site.adsense_enabled, hasActivePlan }),
        });
      },
    },
  },
});
