import type { PaymentProvider } from "./types";

/**
 * Google Pay adapter.
 * In production this requires a Google Pay merchant ID and gateway tokenization
 * (usually Stripe/PayPal). This server path redirects to the same checkout page
 * with provider=google_pay so the client can trigger Google Pay.
 */
export const googlePayProvider: PaymentProvider = {
  code: "google_pay",
  displayName: "Google Pay",
  async initiate({ session }) {
    const { loadProviderConfig } = await import("./registry.server");
    const cfg = await loadProviderConfig("google_pay", session.site_id);
    if (!cfg?.merchant_id || !cfg?.public_key) {
      throw new Error("Google Pay is not configured for this site. Add merchant_id and public_key in Payment Providers.");
    }

    const origin = process.env.PUBLIC_APP_URL ?? "https://hnpay.example.com";
    const checkoutUrl = `${origin}/checkout/${session.public_id}?provider=google_pay`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("checkout_sessions")
      .update({
        provider: "google_pay",
        provider_session_id: session.public_id,
        provider_checkout_url: checkoutUrl,
      })
      .eq("id", session.id);

    return { kind: "redirect", url: checkoutUrl, providerSessionId: session.public_id };
  },
};
