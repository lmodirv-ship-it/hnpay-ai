import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState, StatCard } from "@/components/admin/AdminShell";
import { Undo2, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/refunds")({
  head: () => ({ meta: [{ title: "الاسترجاعات والنزاعات · HN-PAY" }] }),
  component: RefundsPage,
});

function RefundsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .in("status", ["refunded", "partially_refunded", "disputed"])
        .order("created_at", { ascending: false })
        .limit(200);
      const list = data ?? [];
      setRows(list);
      setTotal(list.reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0));
    })();
  }, []);

  return (
    <AdminShell title="الاسترجاعات والنزاعات" subtitle="جميع عمليات الاسترجاع والنزاعات المسجلة.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard icon={<Undo2 className="h-5 w-5" />} label="عدد العمليات" value={rows.length} tone="rose" />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="إجمالي المبلغ" value={total.toFixed(2)} tone="rose" />
        <StatCard icon={<Undo2 className="h-5 w-5" />} label="نزاعات" value={rows.filter((r) => r.status === "disputed").length} tone="amber" />
      </div>
      {rows.length === 0 ? <EmptyState title="لا توجد استرجاعات أو نزاعات" desc="ستظهر هنا أي عملية استرجاع أو نزاع تلقائيًا." /> : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase text-neutral-500">
                  <th className="px-4 py-3">المعرف</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3">المزود</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-400">{r.public_id ?? r.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-semibold">{Number(r.amount).toFixed(2)} {r.currency}</td>
                    <td className="px-4 py-3 text-[11px]">{r.provider ?? "—"}</td>
                    <td className="px-4 py-3"><Badge tone={r.status === "disputed" ? "amber" : "red"}>{r.status}</Badge></td>
                    <td className="px-4 py-3 text-[11px] text-neutral-500">{new Date(r.created_at).toLocaleString("ar-MA")}</td>
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
