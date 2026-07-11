import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-allow-methods": "GET, OPTIONS",
};

/**
 * Public status endpoint.
 * Auth: either
 *   - Bearer sk_(live|test)_... (server-side polling by the site backend), OR
 *   - ?ct=<client_token> (short-lived, from create-session response)
 */
export const Route = createFileRoute("/api/public/v1/checkout-sessions/$sessionId")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const ct = url.searchParams.get("ct");
        const auth = request.headers.get("authorization") ?? "";
        const bearerMatch = auth.match(/^Bearer\s+(.+)$/i);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: session } = await supabaseAdmin
          .from("checkout_sessions")
          .select(
            "public_id, status, amount, currency, provider, provider_session_id, expires_at, completed_at, client_token, client_token_expires_at, site_id",
          )
          .eq("public_id", params.sessionId)
          .maybeSingle();

        if (!session) {
          return new Response(
            JSON.stringify({ error: { code: "not_found", message: "Session not found" } }),
            { status: 404, headers: { "content-type": "application/json", ...CORS } },
          );
        }

        // authorize
        let authorized = false;
        if (ct && session.client_token && ct === session.client_token) {
          if (
            session.client_token_expires_at &&
            new Date(session.client_token_expires_at) > new Date()
          ) {
            authorized = true;
          }
        } else if (bearerMatch) {
          const { hashApiKey } = await import("@/lib/hn-pay/crypto.server");
          const keyHash = hashApiKey(bearerMatch[1].trim());
          const { data: keyRow } = await supabaseAdmin
            .from("site_api_keys")
            .select("site_id, revoked_at")
            .eq("key_hash", keyHash)
            .maybeSingle();
          if (keyRow && !keyRow.revoked_at && keyRow.site_id === session.site_id) {
            authorized = true;
          }
        }

        if (!authorized) {
          return new Response(
            JSON.stringify({ error: { code: "unauthorized", message: "Invalid credentials" } }),
            { status: 401, headers: { "content-type": "application/json", ...CORS } },
          );
        }

        // If succeeded, include the subscription created for THIS session
        // (looked up via the payment row that references the session).
        let subscriptionPublicId: string | null = null;
        if (session.status === "succeeded") {
          const { data: sessionRow } = await supabaseAdmin
            .from("checkout_sessions")
            .select("id, plan_id, site_id")
            .eq("public_id", session.public_id)
            .single();
          if (sessionRow) {
            const { data: pay } = await supabaseAdmin
              .from("payments")
              .select("customer_id")
              .eq("checkout_session_id", sessionRow.id)
              .maybeSingle();
            if (pay?.customer_id) {
              const { data: sub } = await supabaseAdmin
                .from("subscriptions")
                .select("public_id")
                .eq("site_id", sessionRow.site_id)
                .eq("customer_id", pay.customer_id)
                .eq("plan_id", sessionRow.plan_id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
              subscriptionPublicId = sub?.public_id ?? null;
            }
          }
        }

        return new Response(
          JSON.stringify({
            checkout_id: session.public_id,
            status: session.status,
            amount: session.amount,
            currency: session.currency,
            provider: session.provider,
            provider_session_id: session.provider_session_id,
            completed_at: session.completed_at,
            expires_at: session.expires_at,
            subscription_id: subscriptionPublicId,
          }),
          { status: 200, headers: { "content-type": "application/json", ...CORS } },
        );
      },
    },
  },
});
