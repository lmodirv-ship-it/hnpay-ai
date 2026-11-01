import type { PaymentProvider } from "./types";

/**
 * HN-Pay Universal Consumer Wallet (NAWAT Pass balance).
 * Debits the consumer's balance atomically (public.wallet_apply) and settles
 * the checkout instantly — zero gateway fees.
 */
export const walletProvider: PaymentProvider = {
  code: "wallet",
  displayName: "HN-Pay Wallet",
  async initiate({ session }) {
    const currency = session.currency.toUpperCase();
    if (!["EUR", "USD", "MAD"].includes(currency)) throw new Error("Wallet supports EUR, USD or MAD only.");
    if (!session.customer_email) throw new Error("Wallet payment requires the customer email.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles").select("id, email").ilike("email", session.customer_email).maybeSingle();
    if (!profile) throw new Error("No HN-Pay account for this email.");

    const { data: wallet } = await supabaseAdmin
      .from("consumer_wallets").select("*").eq("user_id", profile.id).maybeSingle();
    const balance = Number((wallet as Record<string, unknown> | null)?.[`balance_${currency.toLowerCase()}`] ?? 0);
    if (balance < Number(session.amount)) throw new Error("Insufficient wallet balance.");

    const { data: txId, error } = await supabaseAdmin.rpc("wallet_apply", {
      _user_id: profile.id, _email: profile.email, _type: "spend",
      _amount: Number(session.amount), _currency: currency,
      _site_id: session.site_id, _reference: session.public_id,
    });
    if (error) throw new Error(error.message);

    const { settleCheckoutSession } = await import("../settlement.server");
    await settleCheckoutSession({
      admin: supabaseAdmin, sessionId: session.id, provider: "wallet",
      providerRef: String(txId), notes: "Paid with HN-Pay Wallet",
    });
    return { kind: "immediate_success" };
  },
};
