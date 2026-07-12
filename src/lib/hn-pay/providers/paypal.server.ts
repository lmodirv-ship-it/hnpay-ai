import type { PaymentProvider } from "./types";

/**
 * PayPal adapter (BYOK). Creates a PayPal order and returns its checkout URL.
 * Requires PAYPAL_CLIENT_ID + PAYPAL_SECRET (or payment_providers table secret_key).
 * Webhook: /api/public/webhooks/paypal
 */
export const paypalProvider: PaymentProvider = {
  code: "paypal",
  displayName: "PayPal",
  async initiate({ session, site }) {
    const { loadProviderConfig } = await import("./registry.server");
    const cfg = await loadProviderConfig("paypal", session.site_id);
    const secret = cfg?.secret_key ?? process.env.PAYPAL_SECRET;
    const clientId = cfg?.public_key ?? process.env.PAYPAL_CLIENT_ID;
    if (!secret || !clientId) {
      throw new Error("PayPal is not configured for this site. Add Client ID and Secret in Payment Providers.");
    }

    const sandbox = cfg?.environment === "sandbox";
    const base = sandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
    const origin = process.env.PUBLIC_APP_URL ?? "https://hnpay.example.com";
    const returnUrl = session.success_url ?? `${origin}/checkout/${session.public_id}?status=success`;
    const cancelUrl = session.cancel_url ?? `${origin}/checkout/${session.public_id}?status=cancel`;

    // Get access token
    const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!tokenRes.ok) throw new Error("PayPal token request failed");
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${access_token}`,
        "content-type": "application/json",
        "prefer": "return=representation",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: session.currency.toUpperCase(),
              value: String(Number(session.amount).toFixed(2)),
            },
            custom_id: session.public_id,
          },
        ],
        application_context: {
          brand_name: site.name,
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    if (!orderRes.ok) {
      const text = await orderRes.text();
      throw new Error(`PayPal order error: ${orderRes.status} ${text.slice(0, 400)}`);
    }
    const data = (await orderRes.json()) as {
      id: string;
      status: string;
      links?: { rel: string; href: string }[];
    };

    const approveUrl = data.links?.find((l) => l.rel === "approve")?.href;
    if (!approveUrl) {
      throw new Error("PayPal response did not include an approve URL");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("checkout_sessions")
      .update({
        provider: "paypal",
        provider_session_id: data.id,
        provider_checkout_url: approveUrl,
      })
      .eq("id", session.id);

    return { kind: "redirect", url: approveUrl, providerSessionId: data.id };
  },
};
