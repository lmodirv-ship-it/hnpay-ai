import type { PaymentProvider } from "./types";

/**
 * NAPS (National Automated Payment System, Qatar) adapter.
 * Placeholder: requires a NAPS merchant account and their hosted payment page.
 */
export const napsProvider: PaymentProvider = {
  code: "naps",
  displayName: "NAPS — Qatar",
  async initiate({ session }) {
    const { loadProviderConfig } = await import("./registry.server");
    const cfg = await loadProviderConfig("naps", session.site_id);
    if (!cfg?.merchant_id || !cfg?.secret_key) {
      throw new Error("NAPS is not configured for this site. Add merchant_id and secret_key in Payment Providers.");
    }

    const origin = process.env.PUBLIC_APP_URL ?? "https://hnpay.example.com";
    const returnUrl = session.success_url ?? `${origin}/checkout/${session.public_id}?status=success`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("checkout_sessions")
      .update({
        provider: "naps",
        provider_session_id: session.public_id,
        provider_checkout_url: returnUrl,
      })
      .eq("id", session.id);

    return { kind: "redirect", url: returnUrl, providerSessionId: session.public_id };
  },
};
