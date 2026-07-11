import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState, StatCard } from "@/components/admin/AdminShell";
import { RefreshCw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/renewals")({
  head: () => ({ meta: [{ title: "التجديدات · HN-PAY" }] }),
  component: RenewalsPage,
});

function RenewalsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [counts, setCounts] = useState({ upcoming: 0, past_due: 0, trialing: 0, active: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .in("status", ["active", "trialing", "past_due"])
        .order("current_period_end", { ascending: true })
        .limit(200);
      const list = data ?? [];
      setRows(list);
      const soon = list.filter((s: any) => {
        if (!s.current_period_end) return false;
        const d = new Date(s.current_period_end).getTime() - Date.now();
        return d > 0 && d < 7 * 86400_000;
      }).length;
      setCounts({
        upcoming: soon,
        past_due: list.filter((s: any) => s.status === "past_due").length,
        trialing: list.filter((s: any) => s.status === "trialing").length,
        active: list.filter((s: any) => s.status === "active").length,
      });
    })();
  }, []);

  return (
    <AdminShell title="التجديدات" subtitle="متابعة التجديدات القادمة، الاشتراكات المتأخرة، وحالات التجربة.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Clock className="h-5 w-5" />} label="تجديد خلال 7 أيام" value={counts.upcoming} tone="amber" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="متأخر عن الدفع" value={counts.past_due} tone="rose" />
        <StatCard icon={<RefreshCw className="h-5 w-5" />} label="اشتراكات تجريبية" value={counts.trialing} tone="sky" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="اشتراكات نشطة" value={counts.active} tone="emerald" />
      </div>
      {rows.length === 0 ? <EmptyState title="لا توجد تجديدات قريبة" /> : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase text-neutral-500">
                  <th className="px-4 py-3">الاشتراك</th>
                  <th className="px-4 py-3">التجديد التالي</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-400">{r.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{r.current_period_end ? new Date(r.current_period_end).toLocaleString("ar-MA") : "—"}</td>
                    <td className="px-4 py-3"><Badge tone={r.status === "active" ? "green" : r.status === "past_due" ? "red" : "amber"}>{r.status}</Badge></td>
                    <td className="px-4 py-3 text-[11px] text-neutral-500">{new Date(r.updated_at ?? r.created_at).toLocaleDateString("ar-MA")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminShell>
  );
}
