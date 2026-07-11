import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState } from "@/components/admin/AdminShell";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/invoices")({
  head: () => ({ meta: [{ title: "الفواتير · HN-PAY" }] }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("payments")
        .select("id, public_id, amount, currency, status, provider, provider_invoice_id, created_at")
        .eq("status", "succeeded")
        .order("created_at", { ascending: false })
        .limit(200);
      setRows(data ?? []);
    })();
  }, []);

  const printInvoice = (r: any) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html dir="rtl"><head><title>Invoice ${r.public_id}</title>
      <style>body{font-family:system-ui;padding:40px;color:#111}h1{color:#b45309}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{border:1px solid #ddd;padding:10px;text-align:right}</style>
      </head><body>
        <h1>HN-PAY · فاتورة</h1>
        <p>رقم الفاتورة: <b>${r.public_id}</b></p>
        <p>التاريخ: ${new Date(r.created_at).toLocaleString("ar-MA")}</p>
        <table>
          <tr><th>الوصف</th><th>المبلغ</th></tr>
          <tr><td>دفع عبر ${r.provider ?? "—"}</td><td>${Number(r.amount).toFixed(2)} ${r.currency}</td></tr>
          <tr><th>الإجمالي</th><th>${Number(r.amount).toFixed(2)} ${r.currency}</th></tr>
        </table>
        <p style="margin-top:40px;color:#666;font-size:12px">شكرًا لاستخدامكم منصة HN-PAY.</p>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <AdminShell title="الفواتير" subtitle="فواتير وإيصالات آلية لكل عملية دفع ناجحة.">
      {rows.length === 0 ? (
        <EmptyState title="لا توجد فواتير بعد" />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3">رقم الفاتورة</th>
                  <th className="px-5 py-3">المبلغ</th>
                  <th className="px-5 py-3">المزود</th>
                  <th className="px-5 py-3">مرجع الفاتورة</th>
                  <th className="px-5 py-3">التاريخ</th>
                  <th className="px-5 py-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-5 py-3 font-mono text-[11px] text-neutral-400">{r.public_id}</td>
                    <td className="px-5 py-3 font-semibold">{Number(r.amount).toFixed(2)} {r.currency}</td>
                    <td className="px-5 py-3"><Badge tone="sky">{r.provider ?? "—"}</Badge></td>
                    <td className="px-5 py-3 font-mono text-[10px] text-neutral-500">{r.provider_invoice_id ?? "—"}</td>
                    <td className="px-5 py-3 text-[11px] text-neutral-500">{new Date(r.created_at).toLocaleDateString("ar-MA")}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => printInvoice(r)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200 hover:bg-amber-500/20"
                      >
                        <Printer className="h-3 w-3" /> طباعة
                      </button>
                    </td>
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
