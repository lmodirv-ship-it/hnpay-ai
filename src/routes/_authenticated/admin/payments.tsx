import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState } from "@/components/admin/AdminShell";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({ meta: [{ title: "المدفوعات · HN-PAY" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");

  useEffect(() => {
    (async () => {
      let q = supabase.from("payments").select("id, public_id, amount, currency, status, provider, provider_ref, created_at, site_id").order("created_at", { ascending: false }).limit(300);
      if (status) q = q.eq("status", status);
      if (provider) q = q.eq("provider", provider);
      const { data } = await q;
      setRows(data ?? []);
    })();
  }, [status, provider]);

  const exportCsv = () => {
    const header = ["public_id", "amount", "currency", "status", "provider", "provider_ref", "created_at"];
    const csv = [header.join(","), ...rows.map((r) => header.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "hn-pay-payments.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell
      title="المدفوعات"
      subtitle="جميع المدفوعات عبر جميع مزودي الدفع مع فلترة وتصدير."
      actions={
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20">
          <Download className="h-3.5 w-3.5" /> تصدير CSV
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs">
          <option value="">كل الحالات</option>
          <option value="succeeded">succeeded</option>
          <option value="pending">pending</option>
          <option value="failed">failed</option>
          <option value="refunded">refunded</option>
        </select>
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs">
          <option value="">كل المزودين</option>
          <option value="stripe">stripe</option>
          <option value="paypal">paypal</option>
          <option value="cmi">cmi</option>
          <option value="naps">naps</option>
          <option value="manual">manual</option>
          <option value="mock">mock</option>
        </select>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="لا توجد مدفوعات" />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3">المعرف</th>
                  <th className="px-5 py-3">المبلغ</th>
                  <th className="px-5 py-3">المزود</th>
                  <th className="px-5 py-3">المرجع</th>
                  <th className="px-5 py-3">الحالة</th>
                  <th className="px-5 py-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-5 py-3 font-mono text-[11px] text-neutral-400">{r.public_id}</td>
                    <td className="px-5 py-3 font-semibold">{Number(r.amount).toFixed(2)} {r.currency}</td>
                    <td className="px-5 py-3"><Badge tone="sky">{r.provider ?? "—"}</Badge></td>
                    <td className="px-5 py-3 font-mono text-[10px] text-neutral-500">{r.provider_ref ?? "—"}</td>
                    <td className="px-5 py-3"><Badge tone={r.status === "succeeded" ? "green" : r.status === "failed" ? "red" : "amber"}>{r.status}</Badge></td>
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
