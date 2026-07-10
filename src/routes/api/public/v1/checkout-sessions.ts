import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { hashApiKey } from "@/lib/hn-pay/crypto.server";

const BodySchema = z.object({
  plan_code: z.string().min(1).max(64),
  customer: z
    .object({
      external_id: z.string().min(1).max(128),
      email: z.string().email().max(255).optional(),
      name: z.string().max(255).optional(),
    })
    .optional(),
  success_url: z.string().url().max(2048).optional(),
  cancel_url: z.string().url().max(2048).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-allow-methods": "POST, OPTIONS",
};

function jsonError(status: number, code: string, message: string) {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

async function readOrigin(request: Request): Promise<string> {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export const Route = createFileRoute("/api/public/v1/checkout-sessions")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        // 1) auth: Bearer sk_live_xxx
        const auth = request.headers.get("authorization") ?? "";
        const match = auth.match(/^Bearer\s+(.+)$/i);
        if (!match) return jsonError(401, "missing_api_key", "Missing Bearer API key");
        const apiKey = match[1].trim();
        const keyHash = hashApiKey(apiKey);

        // 2) parse body
        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return jsonError(400, "invalid_json", "Body must be valid JSON");
        }
        const parsed = BodySchema.safeParse(json);
        if (!parsed.success) {
          return jsonError(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid body");
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 3) resolve site by api key
        const { data: keyRow } = await supabaseAdmin
          .from("site_api_keys")
          .select("id, site_id, revoked_at")
          .eq("key_hash", keyHash)
          .maybeSingle();

        if (!keyRow || keyRow.revoked_at) {
          return jsonError(401, "invalid_api_key", "API key is invalid or revoked");
        }

        // 4) resolve plan by (site_id, code)
        const { data: plan } = await supabaseAdmin
          .from("plans")
          .select("id, site_id, code, name, amount, currency, is_active")
          .eq("site_id", keyRow.site_id)
          .eq("code", parsed.data.plan_code)
          .maybeSingle();

        if (!plan || !plan.is_active) {
          return jsonError(404, "plan_not_found", `Plan '${parsed.data.plan_code}' not found`);
        }

        // 5) touch last_used_at (fire and forget)
        await supabaseAdmin
          .from("site_api_keys")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", keyRow.id);

        // 6) create checkout session
        const { data: session, error } = await supabaseAdmin
          .from("checkout_sessions")
          .insert({
            site_id: plan.site_id,
            plan_id: plan.id,
            customer_external_id: parsed.data.customer?.external_id ?? null,
            customer_email: parsed.data.customer?.email ?? null,
            customer_name: parsed.data.customer?.name ?? null,
            amount: plan.amount,
            currency: plan.currency,
            success_url: parsed.data.success_url ?? null,
            cancel_url: parsed.data.cancel_url ?? null,
            metadata: (parsed.data.metadata ?? {}) as never,
          })
          .select("public_id, status, expires_at, amount, currency")
          .single();

        if (error || !session) {
          console.error("[hn-pay] checkout insert failed", error);
          return jsonError(500, "server_error", "Failed to create checkout session");
        }

        const origin = await readOrigin(request);

        return new Response(
          JSON.stringify({
            checkout_id: session.public_id,
            checkout_url: `${origin}/checkout/${session.public_id}`,
            status: session.status,
            amount: session.amount,
            currency: session.currency,
            expires_at: session.expires_at,
          }),
          { status: 201, headers: { "content-type": "application/json", ...CORS } },
        );
      },
    },
  },
});
