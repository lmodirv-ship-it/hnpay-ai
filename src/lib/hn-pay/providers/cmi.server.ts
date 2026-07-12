import type { PaymentProvider } from "./types";

/**
 * CMI (Centre Monétique Interbancaire) Morocco adapter.
 * Placeholder for Morocco's local card gateway. The real integration requires
 * CMI merchant credentials and their hosted payment page (HPP) redirect.
 */
export const cmiProvider: PaymentProvider = {
  code: "cmi",
  displayName: "CMI (Centre Monétique Interbancaire) — Morocco",
  async initiate({ session }) {
    const { loadProviderConfig } = await import("./registry.server");
    const cfg = await loadProviderConfig("cmi", session.site_id);
    if (!cfg?.merchant_id || !cfg?.secret_key) {
      throw new Error("CMI is not configured for this site. Add merchant_id and secret_key in Payment Providers.");
    }

    const origin = process.env.PUBLIC_APP_URL ?? "https://hnpay.example.com";
    const returnUrl = session.success_url ?? `${origin}/checkout/${session.public_id}?status=success`;
    const callbackUrl = `${origin}/api/public/webhooks/cmi`;

    const fields: Record<string, string> = {
      oid: session.public_id,
      okUrl: returnUrl,
      failUrl: session.cancel_url ?? `${origin}/checkout/${session.public_id}?status=cancel`,
      callbackUrl,
      shopurl: origin,
      amount: String(Number(session.amount).toFixed(2)),
      currency: session.currency.toUpperCase(),
      lang: "fr",
      // Placeholder: real CMI integration builds the HMAC over sorted fields.
      rnd: Date.now().toString(),
      storetype: "3D_PAY_HOSTING",
      hashAlgorithm: "ver3",
      encoding: "utf-8",
      merchant_id: cfg.merchant_id,
    };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("checkout_sessions")
      .update({
        provider: "cmi",
        provider_session_id: session.public_id,
        provider_checkout_url: origin, // placeholder
      })
      .eq("id", session.id);

    const url = `https://testpay.cmi.co.ma/${cfg.merchant_id}?${new URLSearchParams(fields).toString()}`;
    return { kind: "redirect", url, providerSessionId: session.public_id };
  },
};
