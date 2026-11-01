import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMyHub } from "@/lib/hn-pay/consumer-hub.functions";
import { startWalletTopup, confirmWalletTopup } from "@/lib/hn-pay/wallet-topup.functions";
import { setSubscriptionPaused, getUpgradeOptions, upgradeSubscription } from "@/lib/hn-pay/subscription-manage.functions";
import { Wallet, Crown, FileText, Plus, CreditCard, Landmark, Pause, Play, ArrowUpCircle, Printer, X, Loader2 } from "lucide-react";

type Hub = Awaited<ReturnType<typeof getMyHub>>;
type Method = "card" | "paypal" | "youcan_pay" | "bank_transfer";
type Cur = "EUR" | "USD" | "MAD";

const METHODS: { id: Method; label: string; hint: string; icon: typeof CreditCard }[] = [
  { id: "card", label: "Bank card", hint: "Visa · Mastercard · CMI cards", icon: CreditCard },
  { id: "paypal", label: "PayPal", hint: "EUR / USD", icon: Wallet },
  { id: "youcan_pay", label: "YouCan Pay", hint: "MAD · Moroccan cards", icon: CreditCard },
  { id: "bank_transfer", label: "Bank transfer", hint: "Manual confirmation", icon: Landmark },
];

export function ConsumerHub() {
  const load = useServerFn(getMyHub);
  const startTopup = useServerFn(startWalletTopup);
  const confirmTopup = useServerFn(confirmWalletTopup);
  const pauseFn = useServerFn(setSubscriptionPaused);
  const optsFn = useServerFn(getUpgradeOptions);
  const upgradeFn = useServerFn(upgradeSubscription);

  const [hub, setHub] = useState<Hub | null>(null);
  const [topup, setTopup] = useState(false);
  const [amount, setAmount] = useState("50");
  const [currency, setCurrency] = useState<Cur>("MAD");
  const [method, setMethod] = useState<Method>("card");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [upgrade, setUpgrade] = useState<{ subId: string; plans: Awaited<ReturnType<typeof getUpgradeOptions>> } | null>(null);

  const refresh = () => load().then(setHub).catch(() => setHub(null));

  useEffect(() => {
    refresh();
    const q = new URLSearchParams(window.location.search);
    const pid = q.get("topup");
    if (!pid) return;
    const clean = () => window.history.replaceState({}, "", window.location.pathname);
    if (q.get("status") === "cancel") { setMsg({ tone: "err", text: "Top-up canceled." }); clean(); return; }
    setMsg({ tone: "ok", text: "Verifying your payment…" });
    confirmTopup({ data: { publicId: pid, transactionId: q.get("transaction_id") ?? undefined } })
      .then((r) => {
        if (r.status === "completed") setMsg({ tone: "ok", text: "Wallet credited successfully ✓" });
        else setMsg({ tone: "err", text: "Payment not confirmed yet. It will be credited once the provider confirms it." });
        refresh();
      })
      .catch(() => setMsg({ tone: "err", text: "Could not verify payment." }))
      .finally(clean);
  }, []);

  // Keep currency compatible with the chosen method.
  useEffect(() => {
    if (method === "youcan_pay") setCurrency("MAD");
    if (method === "paypal" && currency === "MAD") setCurrency("EUR");
  }, [method]);

  const submitTopup = async () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return setMsg({ tone: "err", text: "Enter a valid amount." });
    setBusy(true); setMsg(null);
    try {
      const r = await startTopup({ data: { amount: n, currency, method } });
      if (!r.ok) return setMsg({ tone: "err", text: r.error });
      if (r.kind === "redirect") { window.location.href = r.url; return; }
      setMsg({ tone: "ok", text: `Bank transfer reference: ${r.reference} — your balance is credited once the transfer is confirmed.` });
    } catch {
      setMsg({ tone: "err", text: "Top-up failed, try again." });
    } finally { setBusy(false); }
  };

  const doPause = async (id: string, action: "pause" | "resume") => {
    const r = await pauseFn({ data: { id, action } });
    setMsg(r.ok ? { tone: "ok", text: action === "pause" ? "Subscription paused." : "Subscription resumed." } : { tone: "err", text: r.error ?? "Error" });
    refresh();
  };
  const openUpgrade = async (id: string) => setUpgrade({ subId: id, plans: await optsFn({ data: { id } }) });
  const doUpgrade = async (planId: string) => {
    if (!upgrade) return;
    const r = await upgradeFn({ data: { id: upgrade.subId, planId } });
    setMsg(r.ok ? { tone: "ok", text: "Plan upgraded." } : { tone: "err", text: r.error ?? "Error" });
    setUpgrade(null); refresh();
  };

  const w = hub?.wallet;
  const activeCount = (hub?.subscriptions ?? []).filter((s) => s.status === "active" || s.status === "trialing").length;

  return (
    <section className="mb-10 grid gap-4 lg:grid-cols-3">
      {msg && (
        <div role="status" className={`lg:col-span-3 flex items-center justify-between rounded-xl border px-4 py-2 text-sm ${msg.tone === "ok" ? "border-fx-green/30 bg-fx-green/10 text-fx-green" : "border-rose-400/30 bg-rose-500/10 text-rose-100"}`}>
          <span>{msg.text}</span><button aria-label="Dismiss" onClick={() => setMsg(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="rounded-2xl border border-fx-green/20 bg-fx-card p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-fx-green"><Wallet className="h-4 w-4" /> HN-Pay Wallet</div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {(["eur", "usd", "mad"] as const).map((c) => (
            <div key={c} className="rounded-lg border border-fx-line bg-fx-bg/60 p-2">
              <div className="text-[10px] text-fx-muted">{c.toUpperCase()}</div>
              <div className="font-mono text-lg">{Number((w as Record<string, unknown> | null)?.[`balance_${c}`] ?? 0).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setTopup((v) => !v)} className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-fx-green/40 bg-fx-green/10 py-2 text-sm text-fx-green">
          <Plus className="h-4 w-4" /> Top Up Wallet
        </button>
        {topup && (
          <div className="mt-3 space-y-3 rounded-lg border border-fx-line bg-fx-bg/60 p-3">
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)} aria-pressed={method === m.id}
                  className={`rounded-lg border p-2 text-start text-xs ${method === m.id ? "border-fx-green/60 bg-fx-green/15" : "border-fx-line"}`}>
                  <div className="flex items-center gap-1 font-medium"><m.icon className="h-3.5 w-3.5" />{m.label}</div>
                  <div className="text-[10px] text-fx-muted">{m.hint}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input aria-label="Amount" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-fx-line bg-fx-bg/60 px-3 py-2 font-mono text-sm" />
              <select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value as Cur)} className="rounded-lg border border-fx-line bg-fx-bg/60 px-2 text-sm">
                {(method === "youcan_pay" ? ["MAD"] : method === "paypal" ? ["EUR", "USD"] : ["MAD", "EUR", "USD"]).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-1">{[50, 100, 250, 500].map((v) => <button key={v} onClick={() => setAmount(String(v))} className="flex-1 rounded border border-fx-line py-1 text-[11px]">{v}</button>)}</div>
            <button disabled={busy} onClick={submitTopup} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-fx-green py-2 text-sm font-semibold text-black disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {method === "bank_transfer" ? "Get transfer reference" : `Pay ${amount || 0} ${currency} now`}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-fx-blue/30 bg-gradient-to-br from-fx-blue/10 to-transparent p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-fx-blue"><Crown className="h-4 w-4" /> NAWAT Pass</div>
        <div className="mt-3 text-2xl font-bold">{activeCount > 0 ? "Active" : "Not active"}</div>
        <p className="mt-1 text-xs text-fx-muted">One master subscription unlocks premium tiers across every connected Groupe-HN platform.</p>
      </div>

      <div className="rounded-2xl border border-fx-line bg-fx-card p-6">
        <div className="text-[11px] uppercase tracking-[0.2em] text-fx-muted">Recent wallet activity</div>
        <ul className="mt-3 space-y-1 text-xs">
          {(hub?.txs ?? []).length === 0 ? <li className="text-fx-muted">No activity yet.</li> :
            hub!.txs.map((t) => <li key={t.id} className="flex justify-between"><span className="capitalize">{t.type}</span><span className="font-mono">{t.type === "spend" ? "-" : "+"}{Number(t.amount).toFixed(2)} {t.currency}</span></li>)}
        </ul>
      </div>

      <div className="rounded-2xl border border-fx-line bg-fx-card p-6 lg:col-span-3">
        <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-fx-muted">All subscriptions across Groupe-HN</div>
        {(hub?.subscriptions ?? []).length === 0 ? <div className="text-xs text-fx-muted">No subscriptions yet.</div> : (
          <table className="w-full text-xs">
            <thead className="text-fx-muted"><tr><th className="p-2 text-start">Site</th><th className="p-2 text-start">Plan</th><th className="p-2">Status</th><th className="p-2">Renews</th><th className="p-2">Manage</th></tr></thead>
            <tbody>
              {hub!.subscriptions.map((s) => {
                const site = s.sites as { name?: string; domain?: string } | null;
                const plan = s.plans as { name?: string; amount?: number; currency?: string } | null;
                const canPause = s.status === "active" || s.status === "trialing";
                return (
                  <tr key={s.id} className="border-t border-fx-line">
                    <td className="p-2">{site?.name ?? "—"}<div className="text-[10px] text-fx-muted">{site?.domain}</div></td>
                    <td className="p-2">{plan?.name} · {plan?.amount} {plan?.currency}</td>
                    <td className="p-2 text-center">{s.status}</td>
                    <td className="p-2 text-center">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : "—"}</td>
                    <td className="p-2">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openUpgrade(s.id)} className="inline-flex items-center gap-1 rounded border border-fx-blue/40 px-2 py-1 text-fx-blue"><ArrowUpCircle className="h-3 w-3" />Upgrade</button>
                        {canPause && <button onClick={() => doPause(s.id, "pause")} className="inline-flex items-center gap-1 rounded border border-fx-line px-2 py-1"><Pause className="h-3 w-3" />Pause</button>}
                        {s.status === "paused" && <button onClick={() => doPause(s.id, "resume")} className="inline-flex items-center gap-1 rounded border border-fx-green/40 px-2 py-1 text-fx-green"><Play className="h-3 w-3" />Resume</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {upgrade && (
          <div className="mt-3 rounded-lg border border-fx-blue/30 bg-fx-bg/60 p-3 text-xs">
            <div className="mb-2 flex justify-between"><b>Choose a higher plan</b><button aria-label="Close" onClick={() => setUpgrade(null)}><X className="h-4 w-4" /></button></div>
            {upgrade.plans.length === 0 ? <div className="text-fx-muted">You are already on the highest plan for this site.</div> :
              <div className="grid gap-2 sm:grid-cols-3">{upgrade.plans.map((p) => (
                <button key={p.id} onClick={() => doUpgrade(p.id)} className="rounded-lg border border-fx-line p-3 text-start hover:border-fx-blue/60">
                  <div className="font-medium">{p.name}</div><div className="font-mono text-fx-blue">{Number(p.amount).toFixed(2)} {p.currency}</div><div className="text-[10px] text-fx-muted">{p.billing_interval}</div>
                </button>))}</div>}
          </div>
        )}
        {(hub?.payments ?? []).length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-fx-muted"><FileText className="h-3 w-3" /> Invoices</div>
            <ul className="space-y-1 text-xs">
              {hub!.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between border-b border-fx-line py-1">
                  <span>{(p.sites as { name?: string } | null)?.name} · {new Date(p.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono">{Number(p.amount).toFixed(2)} {p.currency} · {p.status}</span>
                    <Link to="/user/invoice/$publicId" params={{ publicId: p.public_id }} className="inline-flex items-center gap-1 rounded border border-fx-line px-2 py-0.5"><Printer className="h-3 w-3" />PDF</Link>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
