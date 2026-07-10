import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Simulated payment-provider inbound webhook.
 *
 * Auth: a shared secret sent as `x-mock-secret` header, compared against
 * env HN_PAY_MOCK_SECRET (falls back to a dev default so first-run works).
 *
 * Body:
 *   { event: "charge.succeeded" | "charge.failed",
 *     provider_ref: "mock_xxx",
 *     checkout_public_id: "cs_..." }
 *
 * On success it delegates to the shared settlement engine, which:
 *   - creates the payment row
 *   - creates/updates subscription
 *   - fires payment.succeeded + subscription.activated outbound webhooks
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

export const Route = createFileRoute("/api/public/v1/webhooks/mock")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.HN_PAY_MOCK_SECRET ?? "mock_dev_secret";
        const provided = request.headers.get("x-mock-secret") ?? "";
        if (provided !== secret) {
          return json(401, { error: "invalid_secret" });
        }

        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch (err) {
          return json(400, { error: "invalid_body", detail: String(err) });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency — reject duplicate deliveries of the same provider event
        const eventKey = `mock:${parsed.event}:${parsed.provider_ref}`;
        const { data: existing } = await supabaseAdmin
          .from("processed_webhook_events")
          .select("event_key")
          .eq("event_key", eventKey)
          .maybeSingle();

        if (existing) {
          return json(200, { ok: true, deduped: true });
        }

        // Find the checkout session
        const { data: session } = await supabaseAdmin
          .from("checkout_sessions")
          .select("id, public_id, status")
          .eq("public_id", parsed.checkout_public_id)
          .maybeSingle();

        if (!session) return json(404, { error: "session_not_found" });

        if (parsed.event === "charge.failed") {
          await supabaseAdmin
            .from("checkout_sessions")
            .update({ status: "failed" })
            .eq("id", session.id);
          await supabaseAdmin.from("processed_webhook_events").insert({ event_key: eventKey });
          return json(200, { ok: true, status: "failed" });
        }

        // charge.succeeded → run shared settlement
        const { settleCheckoutSession } = await import("@/lib/hn-pay/settlement.server");
        const result = await settleCheckoutSession({
          admin: supabaseAdmin,
          sessionId: session.id,
          provider: "mock",
          providerRef: parsed.provider_ref,
        });

        await supabaseAdmin.from("processed_webhook_events").insert({ event_key: eventKey });

        return json(200, { ok: true, ...result });
      },
    },
  },
});
