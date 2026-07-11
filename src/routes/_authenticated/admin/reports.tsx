import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, EmptyState } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "التقارير · HN-PAY" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const [bySite, setBySite] = useState<{ site: string; total: number; count: number }[]>([]);
  const [byProvider, setByProvider] = useState<{ provider: string; total: number; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: pays }, { data: sites }] = await Promise.all([
        supabase.from("payments").select("amount, provider, site_id, status").eq("status", "succeeded"),
        supabase.from("sites").select("id, name"),
      ]);
      const siteName: Record<string, string> = {};
      (sites ?? []).forEach((s: any) => (siteName[s.id] = s.name));
      const s: Record<string, { total: number; count: number }> = {};
      const p: Record<string, { total: number; count: number }> = {};
      (pays ?? []).forEach((r: any) => {
        const sk = siteName[r.site_id] ?? r.site_id.slice(0, 8);
        s[sk] ??= { total: 0, count: 0 }; s[sk].total += Number(r.amount); s[sk].count++;
        const pk = r.provider ?? "unknown";
        p[pk] ??= { total: 0, count: 0 }; p[pk].total += Number(r.amount); p[pk].count++;
      });
      setBySite(Object.entries(s).map(([site, v]) => ({ site, ...v })).sort((a, b) => b.total - a.total));
      setByProvider(Object.entries(p).map(([provider, v]) => ({ provider, ...v })).sort((a, b) => b.total - a.total));
    })();
  }, []);

  return (
    <AdminShell title="التقارير" subtitle="تقارير مالية مصنّفة حسب الموقع ومزود الدفع.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReportTable title="الإيرادات حسب الموقع" rows={bySite.map((r) => ({ label: r.site, ...r }))} />
        <ReportTable title="الإيرادات حسب المزود" rows={byProvider.map((r) => ({ label: r.provider, ...r }))} />
      </div>
    </AdminShell>
  );
}

function ReportTable({ title, rows }: { title: string; rows: { label: string; total: number; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-300">{title}</h3>
      {rows.length === 0 ? (
        <EmptyState title="لا بيانات" />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-neutral-300">{r.label}</span>
                <span className="font-semibold text-amber-300">{r.total.toFixed(2)} <span className="text-[10px] text-neutral-500">({r.count})</span></span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-l from-amber-500 to-amber-300" style={{ width: `${(r.total / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
