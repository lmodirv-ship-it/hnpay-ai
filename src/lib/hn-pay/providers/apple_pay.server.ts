import type { PaymentProvider } from "./types";

/**
 * Apple Pay adapter.
 * In production this requires a merchant certificate, domain registration,
 * and Apple Pay Session on the client. This server path initiates a Stripe
 * or Braintree-backed Apple Pay session if the provider is configured that way.
 * For HN-PAY, treat it as a redirect that tells the client to present Apple Pay.
 */
export const applePayProvider: PaymentProvider = {
  code: "apple_pay",
  displayName: "Apple Pay",
  async initiate({ session }) {
    const { loadProviderConfig } = await import("./registry.server");
    const cfg = await loadProviderConfig("apple_pay", session.site_id);
    if (!cfg?.merchant_id || !cfg?.secret_key) {
      throw new Error("Apple Pay is not configured for this site. Add merchant_id and secret_key in Payment Providers.");
    }

    const origin = process.env.PUBLIC_APP_URL ?? "https://hnpay.example.com";
    const checkoutUrl = `${origin}/checkout/${session.public_id}?provider=apple_pay`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("checkout_sessions")
      .update({
        provider: "apple_pay",
        provider_session_id: session.public_id,
        provider_checkout_url: checkoutUrl,
      })
      .eq("id", session.id);

    return { kind: "redirect", url: checkoutUrl, providerSessionId: session.public_id };
  },
};
