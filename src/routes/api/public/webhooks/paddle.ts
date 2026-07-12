import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paddle → HN-PAY webhook receiver.
 * Verifies Paddle webhook signature (Paddle-Signature header), enforces idempotency, then settles.
 */
export const Route = createFileRoute("/api/public/webhooks/paddle")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("paddle-signature") ?? "";

        let event: Record<string, unknown>;
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const eventId = (event.event_id as string) ?? "";
        const eventType = (event.event_type as string) ?? "";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency: one insert per (provider, provider_event_id)
        const { error: dupErr } = await supabaseAdmin
          .from("provider_events")
          .insert({
            provider: "paddle",
            provider_event_id: eventId,
            event_type: eventType,
            payload: event as never,
          });
        if (dupErr && !String(dupErr.message).toLowerCase().includes("duplicate")) {
          console.error("[paddle-webhook] insert error", dupErr);
          return new Response("db error", { status: 500 });
        }
        if (dupErr) {
          return new Response("ok", { status: 200 });
        }

        // Resolve transaction from the event data
        const dataObj = (event.data ?? {}) as Record<string, unknown>;
        const transactionId = (dataObj.id as string) ?? "";
        const customData = (dataObj.custom_data as Record<string, string>) ?? {};
        const publicId = customData.hnpay_session ?? "";

        // Verify signature against the matching webhook secret
        // Try site-specific config first, then global fallback, then env var.
        let secret: string | null = null;
        if (customData.hnpay_site) {
          const { data: provider } = await supabaseAdmin
            .from("payment_providers")
            .select("webhook_secret")
            .eq("site_id", customData.hnpay_site)
            .eq("code", "paddle")
            .maybeSingle();
          secret = provider?.webhook_secret ?? null;
        }
        if (!secret) {
          const { data: provider } = await supabaseAdmin
            .from("payment_providers")
            .select("webhook_secret")
            .is("site_id", null)
            .eq("code", "paddle")
            .maybeSingle();
          secret = provider?.webhook_secret ?? null;
        }
        secret = secret ?? process.env.PADDLE_WEBHOOK_SECRET ?? null;

        if (!secret) {
          return new Response("Paddle webhook not configured", { status: 503 });
        }

        if (!verifyPaddleSignature(secret, signature, rawBody)) {
          return new Response("invalid signature", { status: 401 });
        }

        if (eventType === "transaction.completed" || eventType === "transaction.ready") {
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
                provider: "paddle",
                providerRef: transactionId,
              });
            }
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});

/**
 * Verify Paddle-Signature header.
 * Header format: ts=...,h1=...
 * h1 = hmac_sha256(webhook_secret, ts + "." + raw_body)
 */
function verifyPaddleSignature(secret: string, header: string, body: string): boolean {
  const parts = Object.fromEntries(
    header.split(";").map((kv) => {
      const [k, ...rest] = kv.trim().split("=");
      return [k.trim(), rest.join("=").trim()];
    }),
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - Number(ts)) > 300) return false;

  const expected = createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  try {
    const a = Buffer.from(h1, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
