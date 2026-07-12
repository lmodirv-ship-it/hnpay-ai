import type { PaymentProvider } from "./types";

/**
 * USDT (crypto) adapter.
 * Creates a payment request and redirects to a wallet/invoice URL.
 * In production, integrate with a crypto payment processor (e.g. Coinbase Commerce,
 * NOWPayments) or generate a static wallet address and watch the chain.
 */
export const usdtProvider: PaymentProvider = {
  code: "usdt",
  displayName: "USDT (Tether)",
  async initiate({ session }) {
    const { loadProviderConfig } = await import("./registry.server");
    const cfg = await loadProviderConfig("usdt", session.site_id);
    const walletAddress = cfg?.public_key;
    if (!walletAddress) {
      throw new Error("USDT is not configured for this site. Add a wallet address (public_key) in Payment Providers.");
    }

    const origin = process.env.PUBLIC_APP_URL ?? "https://hnpay.example.com";
    const network = cfg?.merchant_id ?? "trc20";
    const memo = session.public_id;
    const checkoutUrl = `${origin}/checkout/${session.public_id}?provider=usdt&to=${encodeURIComponent(walletAddress)}&network=${network}&amount=${session.amount}&memo=${memo}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("checkout_sessions")
      .update({
        provider: "usdt",
        provider_session_id: session.public_id,
        provider_checkout_url: checkoutUrl,
      })
      .eq("id", session.id);

    return { kind: "redirect", url: checkoutUrl, providerSessionId: session.public_id };
  },
};
