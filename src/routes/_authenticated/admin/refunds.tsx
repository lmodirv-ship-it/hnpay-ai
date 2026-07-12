import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState, StatCard } from "@/components/admin/AdminShell";
import { Undo2, DollarSign, X, Loader2 } from "lucide-react";
import { refundPayment } from "@/lib/hn-pay/admin-actions.functions";

export const Route = createFileRoute("/_authenticated/admin/refunds")({
  head: () => ({ meta: [{ title: "الاسترجاعات والنزاعات · HN-PAY" }] }),
  component: RefundsPage,
});

function RefundsPage() {
  const refundFn = useServerFn(refundPayment);
  const [rows, setRows] = useState<any[]>([]);
  const [refundables, setRefundables] = useState<any[]>([]);
  const [target, setTarget] = useState<any | null>(null);
  const [partial, setPartial] = useState(false);
  const [note, setNote] = useState("");

  const load = async () => {
    const [{ data: refunded }, { data: succ }] = await Promise.all([
      supabase.from("payments").select("*").in("status", ["refunded", "partially_refunded", "disputed"]).order("created_at", { ascending: false }).limit(200),
      supabase.from("payments").select("id, public_id, amount, currency, provider, created_at").eq("status", "succeeded").order("created_at", { ascending: false }).limit(50),
    ]);
    setRows(refunded ?? []);
    setRefundables(succ ?? []);
  };
  useEffect(() => { void load(); }, []);

  const mut = useMutation({
    mutationFn: () => refundFn({ data: { id: target.id, partial, note: note.trim() || undefined } }),
    onSuccess: () => { setTarget(null); setNote(""); setPartial(false); void load(); },
  });

  const total = rows.reduce((s, r) => s + Number(r.amount ?? 0), 0);

  return (
    <AdminShell title="الاسترجاعات والنزاعات" subtitle="تنفيذ الاسترجاعات وإدارة النزاعات.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard icon={<Undo2 className="h-5 w-5" />} label="عدد العمليات" value={rows.length} tone="rose" />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="إجمالي المبلغ" value={total.toFixed(2)} tone="rose" />
        <StatCard icon={<Undo2 className="h-5 w-5" />} label="نزاعات" value={rows.filter((r) => r.status === "disputed").length} tone="amber" />
      </div>

      <Card className="mb-6">
        <h3 className="mb-3 text-sm font-bold">مدفوعات ناجحة قابلة للاسترجاع (آخر 50)</h3>
        {refundables.length === 0 ? <div className="text-xs text-neutral-500">لا مدفوعات ناجحة.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/5 text-right text-[10px] uppercase text-neutral-500">
                <th className="px-3 py-2">المعرف</th><th className="px-3 py-2">المبلغ</th><th className="px-3 py-2">المزود</th><th className="px-3 py-2">التاريخ</th><th className="px-3 py-2"></th>
              </tr></thead>
              <tbody>
                {refundables.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-3 py-2 font-mono text-[11px] text-neutral-400">{r.public_id}</td>
                    <td className="px-3 py-2 font-semibold">{Number(r.amount).toFixed(2)} {r.currency}</td>
                    <td className="px-3 py-2 text-[11px]">{r.provider ?? "—"}</td>
                    <td className="px-3 py-2 text-[11px] text-neutral-500">{new Date(r.created_at).toLocaleDateString("ar-MA")}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => setTarget(r)}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/20">
                        <Undo2 className="h-3 w-3" /> استرجاع
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {rows.length === 0 ? <EmptyState title="لا توجد استرجاعات أو نزاعات" /> : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/5 text-right text-[10px] uppercase text-neutral-500">
                <th className="px-4 py-3">المعرف</th><th className="px-4 py-3">المبلغ</th><th className="px-4 py-3">المزود</th><th className="px-4 py-3">الحالة</th><th className="px-4 py-3">التاريخ</th>
              </tr></thead>
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

      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setTarget(null)}>
          <div dir="rtl" className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#0a0b16] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-rose-300">تأكيد الاسترجاع</h3><button onClick={() => setTarget(null)}><X className="h-4 w-4" /></button></div>
            <div className="text-sm text-neutral-300">
              <div className="mb-2">المدفوعة: <span className="font-mono text-amber-300">{target.public_id}</span></div>
              <div>المبلغ: <span className="font-semibold">{Number(target.amount).toFixed(2)} {target.currency}</span></div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={partial} onChange={(e) => setPartial(e.target.checked)} /> استرجاع جزئي
            </label>
            <label className="mt-3 block">
              <span className="text-[10px] uppercase text-neutral-500">ملاحظة (اختياري)</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm" />
            </label>
            {mut.error && <div className="mt-2 rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-xs text-rose-200">{(mut.error as Error).message}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setTarget(null)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs">إلغاء</button>
              <button onClick={() => mut.mutate()} disabled={mut.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-400 disabled:opacity-50">
                {mut.isPending && <Loader2 className="h-3 w-3 animate-spin" />} تأكيد الاسترجاع
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
