import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";

/**
 * Simulated payment-provider inbound webhook.
 *
 * Auth: a shared secret sent as `x-mock-secret` header, compared against
 * env HN_PAY_MOCK_SECRET. When the env var is unset, the endpoint is
 * disabled entirely (returns 503) — there is NO hardcoded fallback.
 *
 * Additional guard: the target checkout session's site MUST have the
 * "mock" provider enabled in `sites.enabled_providers`; otherwise
 * settlement is rejected. This prevents anyone from faking a paid
 * status on production checkouts even if the secret leaked.
 */
const Body = z.object({
  event: z.enum(["charge.succeeded", "charge.failed"]),
  provider_ref: z.string().min(4).max(128),
  checkout_public_id: z.string().min(4).max(128),
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export const Route = createFileRoute("/api/public/v1/webhooks/mock")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.HN_PAY_MOCK_SECRET;
        if (!secret) {
          return json(503, { error: "mock_disabled" });
        }
        const provided = request.headers.get("x-mock-secret") ?? "";
        if (!safeEq(provided, secret)) {
          return json(401, { error: "invalid_secret" });
        }

        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch (err) {
          return json(400, { error: "invalid_body", detail: String(err) });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency
        const eventKey = `mock:${parsed.event}:${parsed.provider_ref}`;
        const { data: existing } = await supabaseAdmin
          .from("processed_webhook_events")
          .select("event_id")
          .eq("event_id", eventKey)
          .eq("source", "mock")
          .maybeSingle();
        if (existing) return json(200, { ok: true, deduped: true });

        const { data: session } = await supabaseAdmin
          .from("checkout_sessions")
          .select("id, public_id, status, site_id")
          .eq("public_id", parsed.checkout_public_id)
          .maybeSingle();
        if (!session) return json(404, { error: "session_not_found" });

        // Guard: the site must have the mock provider explicitly enabled.
        const { data: site } = await supabaseAdmin
          .from("sites")
          .select("enabled_providers")
          .eq("id", session.site_id)
          .maybeSingle();
        const enabled = (site?.enabled_providers ?? []) as string[];
        if (!enabled.includes("mock")) {
          return json(403, { error: "mock_not_enabled_for_site" });
        }

        if (parsed.event === "charge.failed") {
          await supabaseAdmin
            .from("checkout_sessions")
            .update({ status: "failed" })
            .eq("id", session.id);
          await supabaseAdmin
            .from("processed_webhook_events")
            .insert({ event_id: eventKey, source: "mock" });
          return json(200, { ok: true, status: "failed" });
        }

        const { settleCheckoutSession } = await import("@/lib/hn-pay/settlement.server");
        const result = await settleCheckoutSession({
          admin: supabaseAdmin,
          sessionId: session.id,
          provider: "mock",
          providerRef: parsed.provider_ref,
        });

        await supabaseAdmin
          .from("processed_webhook_events")
          .insert({ event_id: eventKey, source: "mock" });

        return json(200, { ok: true, ...result });
      },
    },
  },
});
