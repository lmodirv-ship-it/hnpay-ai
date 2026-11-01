import type { PaymentProvider } from "./types";

/**
 * Lemon Squeezy — Merchant of Record (global VAT handled by Lemon Squeezy).
 * Config: secret_key = API key, merchant_id = store id.
 * Variant: session.metadata.ls_variant_id (or provider public_key as default variant).
 */
export const lemonSqueezyProvider: PaymentProvider = {
  code: "lemon_squeezy",
  displayName: "Lemon Squeezy (MoR)",
  async initiate({ session }) {
    const { loadProviderConfig } = await import("./registry.server");
    const cfg = await loadProviderConfig("lemon_squeezy", session.site_id);
    if (!cfg?.secret_key || !cfg.merchant_id) throw new Error("Lemon Squeezy is not configured: add API key and store id.");
    const variantId = String((session.metadata?.ls_variant_id as string | undefined) ?? cfg.public_key ?? "");
    if (!variantId) throw new Error("Lemon Squeezy variant id missing (metadata.ls_variant_id).");
    const origin = process.env.PUBLIC_APP_URL ?? "https://www.hnpay.live";

    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.secret_key}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            custom_price: Math.round(Number(session.amount) * 100),
            checkout_data: {
              email: session.customer_email ?? undefined,
              name: session.customer_name ?? undefined,
              custom: { hnpay_session: session.public_id },
            },
            product_options: {
              redirect_url: session.success_url ?? `${origin}/checkout/${session.public_id}?status=success`,
            },
            test_mode: cfg.environment !== "production",
          },
          relationships: {
            store: { data: { type: "stores", id: cfg.merchant_id } },
            variant: { data: { type: "variants", id: variantId } },
          },
        },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: { id?: string; attributes?: { url?: string } }; errors?: { detail?: string }[] };
    const url = json.data?.attributes?.url;
    if (!res.ok || !url) throw new Error(`Lemon Squeezy checkout failed: ${json.errors?.[0]?.detail ?? res.status}`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("checkout_sessions").update({
      provider: "lemon_squeezy", provider_session_id: json.data?.id ?? null, provider_checkout_url: url,
    }).eq("id", session.id);
    return { kind: "redirect", url, providerSessionId: json.data?.id };
  },
};
