import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  listPaymentProviders, togglePaymentProvider, setDefaultPaymentProvider, testPaymentProvider, deletePaymentProvider,
} from "@/lib/hn-pay/payment-providers.functions";
import { AdminShell, Card, Badge, EmptyState, StatCard } from "@/components/admin/AdminShell";
import { RoutingMatrix } from "@/components/admin/RoutingMatrix";
import { Wallet, CheckCircle2, XCircle, PlayCircle, Trash2, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/providers")({
  head: () => ({ meta: [{ title: "مزودو الدفع · HN-PAY" }] }),
  component: ProvidersPage,
});

function ProvidersPage() {
  const list = useServerFn(listPaymentProviders);
  const toggle = useServerFn(togglePaymentProvider);
  const setDef = useServerFn(setDefaultPaymentProvider);
  const test = useServerFn(testPaymentProvider);
  const del = useServerFn(deletePaymentProvider);
  const [rows, setRows] = useState<any[]>([]);
  const router = useRouter();

  const refresh = async () => setRows((await list({ data: { include_global: true } })) as any[]);
  useEffect(() => { void refresh(); }, []);

  return (
    <AdminShell
      title="مزودو الدفع"
      subtitle="إدارة مركزية لكل بوابات الدفع المتاحة عبر مواقع مجموعة HN."
      actions={
        <a href="/owner/hn-pay/providers"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/25">
          إضافة / تعديل مزود
        </a>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Wallet className="h-5 w-5" />} label="إجمالي المزودين" value={rows.length} tone="amber" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="مفعّل" value={rows.filter((r) => r.is_enabled).length} tone="emerald" />
        <StatCard icon={<Star className="h-5 w-5" />} label="افتراضي" value={rows.filter((r) => r.is_default).length} tone="sky" />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="بحاجة انتباه" value={rows.filter((r) => r.last_test_status === "fail").length} tone="rose" />
      </div>

      <div className="mb-6"><RoutingMatrix /></div>

      {rows.length === 0 ? <EmptyState title="لم تُعرَّف مزودات دفع بعد" desc="أنشئ مزودًا جديدًا من واجهة المزودين." /> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-base font-bold">{p.display_name}</div>
                    {p.is_default && <Badge tone="amber">افتراضي</Badge>}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-neutral-500">{p.code} · {p.environment}</div>
                </div>
                <Badge tone={p.is_enabled ? "green" : "neutral"}>{p.is_enabled ? "مفعّل" : "متوقف"}</Badge>
              </div>

              <div className="mt-3 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">آخر اختبار</span>
                  <Badge tone={p.last_test_status === "ok" ? "green" : p.last_test_status === "fail" ? "red" : "neutral"}>
                    {p.last_test_status ?? "—"}
                  </Badge>
                </div>
                {p.last_tested_at && <div className="text-[10px] text-neutral-500">{new Date(p.last_tested_at).toLocaleString("ar-MA")}</div>}
                {p.last_test_message && <div className="rounded-md bg-white/[0.03] p-2 text-[10px] text-neutral-500">{p.last_test_message}</div>}
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <button onClick={async () => { await test({ data: { id: p.id } }); await refresh(); }}
                  className="inline-flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[10px] text-sky-200 hover:bg-sky-500/20">
                  <PlayCircle className="h-3 w-3" /> اختبار
                </button>
                <button onClick={async () => { await toggle({ data: { id: p.id, enabled: !p.is_enabled } }); await refresh(); }}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-neutral-200 hover:bg-white/10">
                  {p.is_enabled ? "تعطيل" : "تفعيل"}
                </button>
                {!p.is_default && (
                  <button onClick={async () => { await setDef({ data: { id: p.id } }); await refresh(); }}
                    className="inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-200 hover:bg-amber-500/20">
                    <Star className="h-3 w-3" /> تعيين افتراضي
                  </button>
                )}
                <button onClick={async () => { if (confirm("حذف هذا المزود؟")) { await del({ data: { id: p.id } }); await refresh(); router.invalidate(); } }}
                  className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200 hover:bg-rose-500/20">
                  <Trash2 className="h-3 w-3" /> حذف
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
