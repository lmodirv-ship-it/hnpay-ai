import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Universal consumer view: wallet + every subscription/payment across all Groupe-HN sites for the signed-in email. */
export const getMyHub = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string }).email ?? null;
    const { data: wallet } = await context.supabase.from("consumer_wallets").select("*").eq("user_id", context.userId).maybeSingle();
    const { data: txs } = wallet
      ? await context.supabase.from("wallet_transactions").select("id, type, amount, currency, reference, created_at").eq("wallet_id", wallet.id).order("created_at", { ascending: false }).limit(10)
      : { data: [] };

    if (!email) return { wallet, txs: txs ?? [], subscriptions: [], payments: [] };
    // Customers are per-site records owned by merchants; read them server-side, filtered strictly to this user's verified email.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: customers } = await supabaseAdmin.from("customers").select("id").ilike("email", email);
    const ids = (customers ?? []).map((c) => c.id);
    if (!ids.length) return { wallet, txs: txs ?? [], subscriptions: [], payments: [] };
    const [subs, pays] = await Promise.all([
      supabaseAdmin.from("subscriptions").select("id, public_id, status, current_period_end, cancel_at_period_end, sites(name, domain), plans(name, amount, currency, billing_interval)").in("customer_id", ids).order("created_at", { ascending: false }),
      supabaseAdmin.from("payments").select("id, public_id, amount, currency, status, created_at, sites(name)").in("customer_id", ids).order("created_at", { ascending: false }).limit(20),
    ]);
    return { wallet, txs: txs ?? [], subscriptions: subs.data ?? [], payments: pays.data ?? [] };
  });
