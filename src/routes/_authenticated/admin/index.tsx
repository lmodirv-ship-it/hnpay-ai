import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, StatCard, Card, Section, Badge, EmptyState } from "@/components/admin/AdminShell";
import { Wallet, RefreshCw, Users, CreditCard, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "لوحة المالك · HN-PAY" }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const [stats, setStats] = useState({ today: 0, month: 0, mrr: 0, activeSubs: 0, customers: 0, payments: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [series, setSeries] = useState<{ d: string; v: number }[]>([]);

  useEffect(() => {
    (async () => {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const thirtyAgo = new Date(Date.now() - 30 * 86400_000);

      const [pAll, pMonth, pToday, subs, custs, recentP] = await Promise.all([
        supabase.from("payments").select("amount, currency, status, created_at").eq("status", "succeeded").gte("created_at", thirtyAgo.toISOString()),
        supabase.from("payments").select("amount").eq("status", "succeeded").gte("created_at", startOfMonth.toISOString()),
        supabase.from("payments").select("amount").eq("status", "succeeded").gte("created_at", startOfDay.toISOString()),
        supabase.from("subscriptions").select("id, plan_id, status").in("status", ["active", "trialing"]),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("id, public_id, amount, currency, status, provider, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      const today = (pToday.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
      const month = (pMonth.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);

      // MRR ~ current active monthly amount from plans
      const planIds = Array.from(new Set((subs.data ?? []).map((s: any) => s.plan_id)));
      let mrr = 0;
      if (planIds.length) {
        const { data: plans } = await supabase.from("plans").select("id, amount, billing_interval").in("id", planIds);
        const byId: Record<string, { amount: number; interval: string | null }> = {};
        (plans ?? []).forEach((p: any) => (byId[p.id] = { amount: Number(p.amount), interval: p.billing_interval }));
        (subs.data ?? []).forEach((s: any) => {
          const p = byId[s.plan_id]; if (!p) return;
          if (p.interval === "year") mrr += p.amount / 12;
          else mrr += p.amount;
        });
      }

      // 30-day series
      const buckets: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000); d.setHours(0, 0, 0, 0);
        buckets[d.toISOString().slice(0, 10)] = 0;
      }
      (pAll.data ?? []).forEach((p: any) => {
        const k = new Date(p.created_at).toISOString().slice(0, 10);
        if (k in buckets) buckets[k] += Number(p.amount ?? 0);
      });

      setStats({
        today, month, mrr,
        activeSubs: (subs.data ?? []).length,
        customers: custs.count ?? 0,
        payments: (pAll.data ?? []).length,
      });
      setSeries(Object.entries(buckets).map(([d, v]) => ({ d, v })));
      setRecent(recentP.data ?? []);
    })();
  }, []);

  const max = useMemo(() => Math.max(1, ...series.map((s) => s.v)), [series]);

  return (
    <AdminShell title="نظرة عامة" subtitle="مؤشرات مباشرة لحالة HN-PAY عبر مواقع المجموعة.">
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={<Wallet className="h-5 w-5" />} label="إيرادات اليوم" value={fmt(stats.today)} tone="amber" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="إيرادات الشهر" value={fmt(stats.month)} tone="emerald" />
        <StatCard icon={<RefreshCw className="h-5 w-5" />} label="MRR تقديري" value={fmt(stats.mrr)} tone="sky" />
        <StatCard icon={<Users className="h-5 w-5" />} label="اشتراكات نشطة" value={stats.activeSubs} tone="violet" />
        <StatCard icon={<CreditCard className="h-5 w-5" />} label="العملاء" value={stats.customers} tone="rose" />
      </div>

      <Section title="الإيرادات خلال 30 يومًا">
        <Card>
          <div className="flex h-40 items-end gap-1">
            {series.map((s) => (
              <div key={s.d} className="group relative flex-1">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-amber-500/70 to-amber-300/40 transition group-hover:from-amber-400 group-hover:to-amber-200"
                  style={{ height: `${(s.v / max) * 100}%`, minHeight: 2 }}
                  title={`${s.d} · ${fmt(s.v)}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-neutral-500">
            <span>{series[0]?.d ?? ""}</span>
            <span>{series[series.length - 1]?.d ?? ""}</span>
          </div>
        </Card>
      </Section>

      <Section title="آخر المدفوعات">
        {recent.length === 0 ? (
          <EmptyState title="لا توجد مدفوعات بعد" desc="ستظهر هنا آخر 10 عمليات دفع تلقائيًا." />
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-right text-[10px] uppercase tracking-wider text-neutral-500">
                    <th className="px-5 py-3">المعرف</th>
                    <th className="px-5 py-3">المبلغ</th>
                    <th className="px-5 py-3">المزود</th>
                    <th className="px-5 py-3">الحالة</th>
                    <th className="px-5 py-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="px-5 py-3 font-mono text-[11px] text-neutral-400">{r.public_id ?? r.id.slice(0, 8)}</td>
                      <td className="px-5 py-3 font-semibold">{Number(r.amount).toFixed(2)} {r.currency}</td>
                      <td className="px-5 py-3 text-[11px]">{r.provider ?? "—"}</td>
                      <td className="px-5 py-3"><Badge tone={r.status === "succeeded" ? "green" : r.status === "failed" ? "red" : "amber"}>{r.status}</Badge></td>
                      <td className="px-5 py-3 text-[11px] text-neutral-500">{new Date(r.created_at).toLocaleString("ar-MA")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </Section>
    </AdminShell>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("ar-MA", { maximumFractionDigits: 2 }).format(n);
}
