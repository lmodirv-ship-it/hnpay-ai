import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, CheckCircle2, XCircle, Clock, Zap, Radio } from "lucide-react";
import { getHubMetrics } from "@/lib/hn-pay/portfolios.functions";
import { OwnerShell } from "@/routes/_authenticated/owner/dashboard";
import { useHnSession } from "@/lib/auth/use-session";

export const Route = createFileRoute("/_authenticated/owner/hn-pay/monitor")({
  ssr: false,
  head: () => ({ meta: [{ title: "HN-Pay Monitor" }] }),
  component: MonitorPage,
});

function MonitorPage() {
  const { profile, signOut } = useHnSession();
  const fn = useServerFn(getHubMetrics);
  const { data, isLoading } = useQuery({
    queryKey: ["hn-pay", "metrics"],
    queryFn: () => fn(),
    refetchInterval: 15000,
  });

  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <div className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">Command Deck</div>
        <h1 className="text-3xl font-bold">HN-Pay Monitor</h1>
        <p className="mt-1 text-sm text-neutral-400">Live payments, subscriptions, and webhook delivery across the network. Auto-refresh every 15s.</p>
      </div>

      {isLoading || !data ? (
        <div className="text-sm text-neutral-500">Loading metrics…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard icon={<Radio />} label="Active sites" value={`${data.sites.active}/${data.sites.total}`} tone="amber" />
            <KpiCard icon={<Zap />} label="Revenue (all-time)" value={money(data.revenue)} tone="emerald" />
            <KpiCard icon={<Activity />} label="Active subs" value={data.subscriptions.active} tone="sky" />
            <KpiCard icon={<CheckCircle2 />} label="Webhook success" value={`${Math.round(data.webhooks.deliveryRate * 100)}%`} tone={data.webhooks.deliveryRate > 0.95 ? "emerald" : "amber"} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <MiniStat icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />} label="Succeeded" value={data.payments.succeeded} />
            <MiniStat icon={<Clock className="h-4 w-4 text-amber-300" />} label="Pending / Awaiting" value={data.payments.pending} />
            <MiniStat icon={<XCircle className="h-4 w-4 text-red-300" />} label="Failed" value={data.payments.failed} />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Recent payments">
              {data.recentPayments.length === 0 ? (
                <Empty text="No payments yet." />
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase text-neutral-500">
                    <tr><th className="pb-2 text-left">When</th><th className="pb-2 text-left">Amount</th><th className="pb-2 text-left">Provider</th><th className="pb-2 text-left">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.recentPayments.map((p: any, i: number) => (
                      <tr key={i} className="text-neutral-300">
                        <td className="py-2 text-neutral-500">{when(p.created_at)}</td>
                        <td className="py-2 font-mono">{money(p.amount, p.currency)}</td>
                        <td className="py-2">{p.provider ?? "—"}</td>
                        <td className="py-2"><Badge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
            <Panel title="Recent webhook events">
              {data.recentEvents.length === 0 ? (
                <Empty text="No webhook events yet." />
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase text-neutral-500">
                    <tr><th className="pb-2 text-left">When</th><th className="pb-2 text-left">Type</th><th className="pb-2 text-left">Attempts</th><th className="pb-2 text-left">Delivered</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.recentEvents.map((e: any, i: number) => (
                      <tr key={i} className="text-neutral-300">
                        <td className="py-2 text-neutral-500">{when(e.created_at)}</td>
                        <td className="py-2 font-mono">{e.event_type}</td>
                        <td className="py-2">{e.attempts ?? 0}</td>
                        <td className="py-2">{e.delivered ? <span className="text-emerald-300">✓</span> : <span className="text-red-300">✗</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>
        </>
      )}
    </OwnerShell>
  );
}

function money(n: number, cur = "USD") {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(Number(n) || 0); }
  catch { return `${cur} ${Number(n).toFixed(2)}`; }
}
function when(iso: string) { const d = new Date(iso); return d.toLocaleString(); }

function KpiCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone: "amber" | "emerald" | "sky" }) {
  const tones: Record<string, string> = {
    amber: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    emerald: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    sky: "border-sky-400/40 bg-sky-500/10 text-sky-300",
  };
  return (
    <div className="rounded-2xl border border-amber-500/15 bg-white/[0.02] p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">{label}</div>
          <div className="mt-2 text-2xl font-bold">{value}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-neutral-400">{icon} {label}</div>
      <div className="text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300/80">{title}</div>
      {children}
    </div>
  );
}
function Empty({ text }: { text: string }) { return <div className="py-6 text-center text-xs text-neutral-500">{text}</div>; }
function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    succeeded: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    paid: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    failed: "border-red-400/40 bg-red-500/10 text-red-300",
    pending: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    awaiting_confirmation: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  };
  const cls = map[status] ?? "border-neutral-600/40 bg-neutral-700/20 text-neutral-300";
  return <span className={`rounded border px-2 py-0.5 text-[10px] ${cls}`}>{status}</span>;
}
