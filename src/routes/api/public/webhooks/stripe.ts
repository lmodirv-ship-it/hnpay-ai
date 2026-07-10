import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stripe → HN-PAY webhook receiver.
 * Verifies Stripe-Signature (v1 scheme), enforces idempotency, then settles.
 */
export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Stripe webhook not configured", { status: 503 });

        const sigHeader = request.headers.get("stripe-signature") ?? "";
        const rawBody = await request.text();

        if (!verifyStripeSignature(secret, sigHeader, rawBody)) {
          return new Response("invalid signature", { status: 401 });
        }

        let event: { id: string; type: string; data: { object: Record<string, unknown> } };
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency: one insert per (provider, provider_event_id)
        const { error: dupErr } = await supabaseAdmin
          .from("provider_events")
          .insert({
            provider: "stripe",
            provider_event_id: event.id,
            event_type: event.type,
            payload: event as never,
          });
        if (dupErr && !String(dupErr.message).toLowerCase().includes("duplicate")) {
          console.error("[stripe-webhook] insert error", dupErr);
          return new Response("db error", { status: 500 });
        }
        if (dupErr) {
          // duplicate → already processed
          return new Response("ok", { status: 200 });
        }

        if (
          event.type === "checkout.session.completed" ||
          event.type === "checkout.session.async_payment_succeeded"
        ) {
          const obj = event.data.object as {
            id: string;
            client_reference_id?: string;
            metadata?: { hnpay_session?: string };
            payment_intent?: string;
          };
          const publicId = obj.metadata?.hnpay_session ?? obj.client_reference_id;
          if (publicId) {
            const { data: session } = await supabaseAdmin
              .from("checkout_sessions")
              .select("id")
              .eq("public_id", publicId)
              .maybeSingle();
            if (session) {
              const { settleCheckoutSession } = await import("@/lib/hn-pay/settlement.server");
              await settleCheckoutSession({
                admin: supabaseAdmin,
                sessionId: session.id,
                provider: "stripe",
                providerRef: obj.payment_intent ?? obj.id,
              });
            }
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});

/** Verify `Stripe-Signature: t=...,v1=...` per https://stripe.com/docs/webhooks/signatures */
function verifyStripeSignature(secret: string, header: string, body: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const [k, ...rest] = kv.split("=");
      return [k.trim(), rest.join("=").trim()];
    }),
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;

  // reject stale (>5min) signatures
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - Number(t)) > 300) return false;

  const expected = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  try {
    const a = Buffer.from(v1, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
