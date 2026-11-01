import type { PaymentProvider } from "./types";

/**
 * CMI (Centre Monétique Interbancaire) — Morocco.
 * Implements the official "ver3" hash: all request fields sorted
 * case-insensitively (excluding `hash` and `encoding`), values escaped
 * (`\` → `\\`, `|` → `\|`), joined with `|`, then `|` + escaped storekey,
 * SHA-512, Base64.
 * Config mapping: merchant_id = clientid, secret_key = storekey.
 */
export function cmiEscape(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

export function cmiPlainText(fields: Record<string, string>, storeKey: string): string {
  const keys = Object.keys(fields)
    .filter((k) => !["hash", "encoding"].includes(k.toLowerCase()))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  return keys.map((k) => cmiEscape(fields[k] ?? "")).join("|") + "|" + cmiEscape(storeKey);
}

export async function cmiHash(fields: Record<string, string>, storeKey: string): Promise<string> {
  const data = new TextEncoder().encode(cmiPlainText(fields, storeKey));
  const digest = await crypto.subtle.digest("SHA-512", data);
  let bin = "";
  for (const b of new Uint8Array(digest)) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** ISO 4217 numeric codes required by CMI. */
const CMI_CURRENCY: Record<string, string> = { MAD: "504", EUR: "978", USD: "840", GBP: "826" };

export const cmiProvider: PaymentProvider = {
  code: "cmi",
  displayName: "CMI Maroc — Cartes bancaires",
  async initiate({ session }) {
    const { loadProviderConfig } = await import("./registry.server");
    const cfg = await loadProviderConfig("cmi", session.site_id);
    if (!cfg?.merchant_id || !cfg?.secret_key) {
      throw new Error("CMI is not configured for this site. Add clientid (merchant_id) and storekey (secret_key).");
    }
    const origin = process.env.PUBLIC_APP_URL ?? "https://www.hnpay.live";
    const fields: Record<string, string> = {
      clientid: cfg.merchant_id,
      oid: session.public_id,
      amount: Number(session.amount).toFixed(2),
      currency: CMI_CURRENCY[session.currency.toUpperCase()] ?? "504",
      okUrl: session.success_url ?? `${origin}/checkout/${session.public_id}?status=success`,
      failUrl: session.cancel_url ?? `${origin}/checkout/${session.public_id}?status=cancel`,
      callbackUrl: `${origin}/api/public/webhooks/cmi`,
      shopurl: origin,
      TranType: "PreAuth",
      storetype: "3D_PAY_HOSTING",
      hashAlgorithm: "ver3",
      lang: "fr",
      rnd: crypto.randomUUID().replace(/-/g, "").slice(0, 20),
      email: session.customer_email ?? "",
      BillToName: session.customer_name ?? "",
      encoding: "UTF-8",
    };
    fields.hash = await cmiHash(fields, cfg.secret_key);

    const gateway = cfg.environment === "production"
      ? "https://payment.cmi.co.ma/fim/est3Dgate"
      : "https://testpayment.cmi.co.ma/fim/est3Dgate";
    // CMI requires an auto-submitted POST form; we expose it via a GET bridge URL.
    const url = `${origin}/pay/cmi-bridge?gateway=${encodeURIComponent(gateway)}&f=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(fields)))))}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("checkout_sessions").update({
      provider: "cmi", provider_session_id: session.public_id, provider_checkout_url: gateway,
    }).eq("id", session.id);

    return { kind: "redirect", url, providerSessionId: session.public_id };
  },
};
