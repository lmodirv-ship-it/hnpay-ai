import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [{ title: "الطلبات · HN-PAY" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      let q = supabase.from("checkout_sessions").select("id, public_id, amount, currency, status, provider, customer_email, created_at").order("created_at", { ascending: false }).limit(200);
      if (status) q = q.eq("status", status);
      const { data } = await q;
      setRows(data ?? []);
    })();
  }, [status]);

  return (
    <AdminShell title="الطلبات" subtitle="جلسات الدفع (Checkout) عبر جميع المزودين.">
      <div className="mb-4 flex gap-2">
        {["", "pending", "completed", "expired", "failed"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`rounded-lg border px-3 py-1.5 text-xs ${status === s ? "border-amber-400/40 bg-amber-500/10 text-amber-200" : "border-white/10 text-neutral-300 hover:bg-white/5"}`}
          >
            {s === "" ? "الكل" : s}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="لا توجد طلبات" />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3">المعرف</th>
                  <th className="px-5 py-3">العميل</th>
                  <th className="px-5 py-3">المبلغ</th>
                  <th className="px-5 py-3">المزود</th>
                  <th className="px-5 py-3">الحالة</th>
                  <th className="px-5 py-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-5 py-3 font-mono text-[11px] text-neutral-400">{r.public_id}</td>
                    <td className="px-5 py-3 text-[11px]">{r.customer_email ?? "—"}</td>
                    <td className="px-5 py-3 font-semibold">{Number(r.amount).toFixed(2)} {r.currency}</td>
                    <td className="px-5 py-3"><Badge tone="sky">{r.provider}</Badge></td>
                    <td className="px-5 py-3">
                      <Badge tone={r.status === "completed" ? "green" : r.status === "pending" ? "amber" : "red"}>{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-neutral-500">{new Date(r.created_at).toLocaleString("ar-MA")}</td>
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
