import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyHub } from "@/lib/hn-pay/consumer-hub.functions";
import { Wallet, Crown, FileText, Plus } from "lucide-react";

type Hub = Awaited<ReturnType<typeof getMyHub>>;

export function ConsumerHub() {
  const load = useServerFn(getMyHub);
  const [hub, setHub] = useState<Hub | null>(null);
  const [topup, setTopup] = useState(false);
  useEffect(() => { load().then(setHub).catch(() => setHub(null)); }, []);
  const w = hub?.wallet;
  const activeCount = (hub?.subscriptions ?? []).filter((s) => s.status === "active" || s.status === "trialing").length;

  return (
    <section className="mb-10 grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-emerald-400/20 bg-white/[0.02] p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-emerald-300"><Wallet className="h-4 w-4" /> HN-Pay Wallet</div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {(["eur", "usd", "mad"] as const).map((c) => (
            <div key={c} className="rounded-lg border border-white/10 bg-black/30 p-2">
              <div className="text-[10px] text-neutral-500">{c.toUpperCase()}</div>
              <div className="font-mono text-lg">{Number((w as Record<string, unknown> | null)?.[`balance_${c}`] ?? 0).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setTopup(true)} className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-emerald-400/40 bg-emerald-500/10 py-2 text-sm text-emerald-100">
          <Plus className="h-4 w-4" /> Top Up Wallet
        </button>
        {topup && (
          <div className="mt-3 rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] text-neutral-300">
            Send a bank transfer or pay at an agency with reference <span className="font-mono text-emerald-300">WALLET-{(hub?.wallet?.id ?? "NEW").slice(0, 8).toUpperCase()}</span>. Your balance is credited as soon as the payment is confirmed.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-transparent p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-amber-300"><Crown className="h-4 w-4" /> NAWAT Pass</div>
        <div className="mt-3 text-2xl font-bold">{activeCount > 0 ? "Active" : "Not active"}</div>
        <p className="mt-1 text-xs text-neutral-400">One master subscription unlocks premium tiers across every connected Groupe-HN platform.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Recent wallet activity</div>
        <ul className="mt-3 space-y-1 text-xs">
          {(hub?.txs ?? []).length === 0 ? <li className="text-neutral-500">No activity yet.</li> :
            hub!.txs.map((t) => <li key={t.id} className="flex justify-between"><span className="capitalize">{t.type}</span><span className="font-mono">{t.type === "spend" ? "-" : "+"}{Number(t.amount).toFixed(2)} {t.currency}</span></li>)}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-3">
        <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-neutral-400">All subscriptions across Groupe-HN</div>
        {(hub?.subscriptions ?? []).length === 0 ? <div className="text-xs text-neutral-500">No subscriptions yet.</div> : (
          <table className="w-full text-xs">
            <thead className="text-neutral-500"><tr><th className="p-2 text-start">Site</th><th className="p-2 text-start">Plan</th><th className="p-2">Status</th><th className="p-2">Renews</th></tr></thead>
            <tbody>
              {hub!.subscriptions.map((s) => {
                const site = s.sites as { name?: string; domain?: string } | null;
                const plan = s.plans as { name?: string; amount?: number; currency?: string } | null;
                return (
                  <tr key={s.id} className="border-t border-white/5">
                    <td className="p-2">{site?.name ?? "—"}<div className="text-[10px] text-neutral-500">{site?.domain}</div></td>
                    <td className="p-2">{plan?.name} · {plan?.amount} {plan?.currency}</td>
                    <td className="p-2 text-center">{s.status}</td>
                    <td className="p-2 text-center">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {(hub?.payments ?? []).length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-neutral-400"><FileText className="h-3 w-3" /> Invoices</div>
            <ul className="space-y-1 text-xs">
              {hub!.payments.map((p) => (
                <li key={p.id} className="flex justify-between border-b border-white/5 py-1">
                  <span>{(p.sites as { name?: string } | null)?.name} · {new Date(p.created_at).toLocaleDateString()}</span>
                  <span className="font-mono">{Number(p.amount).toFixed(2)} {p.currency} · {p.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
