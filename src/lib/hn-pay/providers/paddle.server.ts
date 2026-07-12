import type { PaymentProvider } from "./types";

/**
 * Paddle adapter (BYOK). Uses Paddle API v2 (https://developer.paddle.com/).
 * Creates a Paddle Checkout transaction and returns its URL.
 * Result confirmation arrives via /api/public/webhooks/paddle.
 */
export const paddleProvider: PaymentProvider = {
  code: "paddle",
  displayName: "Paddle (Merchant of Record)",
  async initiate({ session, site }) {
    const { loadProviderConfig } = await import("./registry.server");
    const cfg = await loadProviderConfig("paddle", session.site_id);
    const key = cfg?.secret_key;
    if (!key) {
      throw new Error(
        "Paddle is not configured for this site. Add a Paddle entry in Payment Providers with the API key.",
      );
    }

    const host = cfg.environment === "production" ? "api.paddle.com" : "sandbox-api.paddle.com";
    const origin = originForSession();
    const successUrl = session.success_url ?? `${origin}/checkout/${session.public_id}?status=success`;
    const cancelUrl = session.cancel_url ?? `${origin}/checkout/${session.public_id}?status=cancel`;

    // Paddle API v2: create a transaction to get a checkout URL.
    // Reference: https://developer.paddle.com/api-reference/transactions/create-transaction
    const body = {
      items: [
        {
          price: {
            description: `${site.name} · ${session.public_id}`,
            unit_price: {
              amount: String(Math.round(Number(session.amount) * 100)), // minor units
              currency_code: session.currency.toUpperCase(),
            },
          },
          quantity: 1,
        },
      ],
      customer: session.customer_email
        ? { email: session.customer_email, name: session.customer_name || undefined }
        : undefined,
      client_reference_id: session.public_id,
      success_url: successUrl,
      cancel_url: cancelUrl,
      custom_data: {
        hnpay_session: session.public_id,
        hnpay_site: session.site_id,
      },
    };

    const res = await fetch(`https://${host}/v2/transactions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Paddle error: ${res.status} ${text.slice(0, 400)}`);
    }
    const data = (await res.json()) as {
      data?: {
        id: string;
        checkout?: { url: string };
      };
      error?: { detail: string };
    };

    if (data.error) throw new Error(`Paddle error: ${data.error.detail}`);
    const transactionId = data.data?.id;
    const checkoutUrl = data.data?.checkout?.url;
    if (!transactionId || !checkoutUrl) {
      throw new Error("Paddle response did not include a checkout URL");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("checkout_sessions")
      .update({
        provider: "paddle",
        provider_session_id: transactionId,
        provider_checkout_url: checkoutUrl,
      })
      .eq("id", session.id);

    return { kind: "redirect", url: checkoutUrl, providerSessionId: transactionId };
  },
};

function originForSession(): string {
  return process.env.PUBLIC_APP_URL ?? "https://hnpay.example.com";
}
