import type { PaymentProvider } from "./types";

/**
 * Payzone (UK/EU) adapter placeholder.
 * Requires Payzone gateway credentials and their hosted payment page / API.
 */
export const payzoneProvider: PaymentProvider = {
  code: "payzone",
  displayName: "Payzone",
  async initiate({ session }) {
    const { loadProviderConfig } = await import("./registry.server");
    const cfg = await loadProviderConfig("payzone", session.site_id);
    if (!cfg?.merchant_id || !cfg?.secret_key) {
      throw new Error("Payzone is not configured for this site. Add merchant_id and secret_key in Payment Providers.");
    }

    const origin = process.env.PUBLIC_APP_URL ?? "https://hnpay.example.com";
    const returnUrl = session.success_url ?? `${origin}/checkout/${session.public_id}?status=success`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("checkout_sessions")
      .update({
        provider: "payzone",
        provider_session_id: session.public_id,
        provider_checkout_url: returnUrl,
      })
      .eq("id", session.id);

    return { kind: "redirect", url: returnUrl, providerSessionId: session.public_id };
  },
};
