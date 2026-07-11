import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, StatCard, EmptyState } from "@/components/admin/AdminShell";
import { Landmark, DollarSign, Percent, Undo2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settlements")({
  head: () => ({ meta: [{ title: "التسويات المالية · HN-PAY" }] }),
  component: SettlementsPage,
});

const FEE_RATE = 0.024; // 2.4% تقديري

function SettlementsPage() {
  const [days, setDays] = useState<{ d: string; gross: number; fee: number; refund: number; net: number }[]>([]);
  const [totals, setTotals] = useState({ gross: 0, fee: 0, refund: 0, net: 0, count: 0 });

  useEffect(() => {
    (async () => {
      const from = new Date(Date.now() - 30 * 86400_000);
      const { data } = await supabase
        .from("payments")
        .select("amount, status, created_at")
        .gte("created_at", from.toISOString());
      const buckets: Record<string, { gross: number; refund: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000); d.setHours(0, 0, 0, 0);
        buckets[d.toISOString().slice(0, 10)] = { gross: 0, refund: 0 };
      }
      (data ?? []).forEach((p: any) => {
        const k = new Date(p.created_at).toISOString().slice(0, 10);
        if (!(k in buckets)) return;
        const amt = Number(p.amount ?? 0);
        if (p.status === "succeeded") buckets[k].gross += amt;
        if (p.status === "refunded" || p.status === "partially_refunded") buckets[k].refund += amt;
      });
      const rows = Object.entries(buckets).map(([d, v]) => {
        const fee = v.gross * FEE_RATE;
        return { d, gross: v.gross, fee, refund: v.refund, net: v.gross - fee - v.refund };
      });
      setDays(rows);
      const t = rows.reduce((a, r) => ({
        gross: a.gross + r.gross, fee: a.fee + r.fee, refund: a.refund + r.refund, net: a.net + r.net,
      }), { gross: 0, fee: 0, refund: 0, net: 0 });
      setTotals({ ...t, count: (data ?? []).filter((p: any) => p.status === "succeeded").length });
    })();
  }, []);

  return (
    <AdminShell title="التسويات المالية" subtitle="مطابقة الإيرادات، العمولات، والاسترجاعات — آخر 30 يومًا.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="الإجمالي" value={totals.gross.toFixed(2)} tone="emerald" />
        <StatCard icon={<Percent className="h-5 w-5" />} label={`العمولات (${(FEE_RATE * 100).toFixed(1)}%)`} value={totals.fee.toFixed(2)} tone="amber" />
        <StatCard icon={<Undo2 className="h-5 w-5" />} label="المسترجع" value={totals.refund.toFixed(2)} tone="rose" />
        <StatCard icon={<Landmark className="h-5 w-5" />} label="صافي التسوية" value={totals.net.toFixed(2)} tone="sky" />
      </div>

      {days.every((d) => d.gross === 0) ? <EmptyState title="لا معاملات في آخر 30 يومًا" /> : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase text-neutral-500">
                  <th className="px-4 py-3">اليوم</th>
                  <th className="px-4 py-3">الإجمالي</th>
                  <th className="px-4 py-3">العمولات</th>
                  <th className="px-4 py-3">المسترجع</th>
                  <th className="px-4 py-3">الصافي</th>
                </tr>
              </thead>
              <tbody>
                {days.slice().reverse().filter((r) => r.gross > 0 || r.refund > 0).map((r) => (
                  <tr key={r.d} className="border-b border-white/5">
                    <td className="px-4 py-3 text-[11px] text-neutral-400">{r.d}</td>
                    <td className="px-4 py-3 font-semibold">{r.gross.toFixed(2)}</td>
                    <td className="px-4 py-3 text-amber-200">-{r.fee.toFixed(2)}</td>
                    <td className="px-4 py-3 text-rose-200">-{r.refund.toFixed(2)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-200">{r.net.toFixed(2)}</td>
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
