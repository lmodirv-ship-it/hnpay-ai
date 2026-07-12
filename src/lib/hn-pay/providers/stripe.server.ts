import type { PaymentProvider } from "./types";

/**
 * Stripe adapter (BYOK). Uses STRIPE_SECRET_KEY when present.
 * Creates a Stripe Checkout Session on the fly and returns its hosted URL.
 * Result confirmation arrives via /api/public/webhooks/stripe.
 */
export const stripeProvider: PaymentProvider = {
  code: "stripe",
  displayName: "Credit / Debit Card (Stripe)",
  async initiate({ session, site }) {
    const { loadProviderConfig } = await import("./registry.server");
    const cfg = await loadProviderConfig("stripe", session.site_id);
    const key = cfg?.secret_key ?? process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "Stripe is not configured for this site. Add a Stripe entry in Payment Providers or set STRIPE_SECRET_KEY.",
      );
    }

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("client_reference_id", session.public_id);
    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", session.currency.toLowerCase());
    form.set(
      "line_items[0][price_data][unit_amount]",
      String(Math.round(Number(session.amount) * 100)),
    );
    form.set("line_items[0][price_data][product_data][name]", `${site.name} · ${session.public_id}`);
    if (session.customer_email) form.set("customer_email", session.customer_email);
    form.set("success_url", session.success_url ?? `${originForSession()}/checkout/${session.public_id}?status=success`);
    form.set("cancel_url", session.cancel_url ?? `${originForSession()}/checkout/${session.public_id}?status=cancel`);
    form.set("metadata[hnpay_session]", session.public_id);
    form.set("metadata[hnpay_site]", session.site_id);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Bearer ${key}`,
      },
      body: form.toString(),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Stripe error: ${res.status} ${body.slice(0, 400)}`);
    }
    const data = (await res.json()) as { id: string; url: string };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("checkout_sessions")
      .update({
        provider: "stripe",
        provider_session_id: data.id,
        provider_checkout_url: data.url,
      })
      .eq("id", session.id);

    return { kind: "redirect", url: data.url, providerSessionId: data.id };
  },
};

function originForSession(): string {
  // best-effort default; overridden by success_url/cancel_url when the caller supplies them
  return process.env.PUBLIC_APP_URL ?? "https://hnpay.example.com";
}
