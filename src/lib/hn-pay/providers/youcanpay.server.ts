import type { PaymentProvider } from "./types";

/**
 * YouCan Pay — Moroccan & international cards.
 * Flow: tokenize (server, private key) → redirect to hosted payment form → webhook.
 * Config: secret_key = private key (pri_...), public_key = pub_..., webhook_secret optional.
 */
export const youcanPayProvider: PaymentProvider = {
  code: "youcan_pay",
  displayName: "YouCan Pay",
  async initiate({ session }) {
    const { loadProviderConfig } = await import("./registry.server");
    const cfg = await loadProviderConfig("youcan_pay", session.site_id);
    if (!cfg?.secret_key) throw new Error("YouCan Pay is not configured: add the private key.");
    const sandbox = cfg.environment !== "production";
    const base = sandbox ? "https://youcanpay.com/sandbox" : "https://youcanpay.com";
    const origin = process.env.PUBLIC_APP_URL ?? "https://www.hnpay.live";

    const body = new URLSearchParams({
      pri_key: cfg.secret_key,
      order_id: session.public_id,
      amount: String(Math.round(Number(session.amount) * 100)), // minor units
      currency: session.currency.toUpperCase(),
      success_url: session.success_url ?? `${origin}/checkout/${session.public_id}?status=success`,
      error_url: session.cancel_url ?? `${origin}/checkout/${session.public_id}?status=cancel`,
      customer_ip: "0.0.0.0",
      "customer[email]": session.customer_email ?? "",
      "customer[name]": session.customer_name ?? "",
    });
    const res = await fetch(`${base}/api/tokenize`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
    });
    const json = (await res.json().catch(() => ({}))) as { token?: { id?: string }; message?: string };
    const token = json.token?.id;
    if (!res.ok || !token) throw new Error(`YouCan Pay tokenize failed: ${json.message ?? res.status}`);

    const url = `${base}/payment-form/${token}?lang=fr`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("checkout_sessions").update({
      provider: "youcan_pay", provider_session_id: token, provider_checkout_url: url,
    }).eq("id", session.id);
    return { kind: "redirect", url, providerSessionId: token };
  },
};
