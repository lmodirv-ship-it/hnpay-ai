import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/plans")({
  head: () => ({ meta: [{ title: "الخطط · HN-PAY" }] }),
  component: PlansPage,
});

function PlansPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [sites, setSites] = useState<Record<string, string>>({});

  const load = async () => {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("plans").select("*").order("created_at", { ascending: false }),
      supabase.from("sites").select("id, name"),
    ]);
    setRows(p ?? []);
    const map: Record<string, string> = {};
    (s ?? []).forEach((r: any) => (map[r.id] = r.name));
    setSites(map);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("plans").update({ is_active: !is_active }).eq("id", id);
    load();
  };

  return (
    <AdminShell title="الخطط" subtitle="الخطط الشهرية والسنوية والتجريبية المعروضة للعملاء.">
      {rows.length === 0 ? (
        <EmptyState title="لا توجد خطط بعد" desc="أضف خطة من صفحة الموقع لإتاحتها للعملاء." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500">{sites[p.site_id] ?? p.site_id.slice(0, 6)}</div>
                  <div className="mt-1 text-lg font-bold">{p.name}</div>
                  <div className="text-[11px] text-neutral-400">{p.code}</div>
                </div>
                <Badge tone={p.is_active ? "green" : "neutral"}>{p.is_active ? "مفعّلة" : "متوقفة"}</Badge>
              </div>
              <div className="mt-4 text-3xl font-extrabold text-amber-300">
                {Number(p.amount).toFixed(2)} <span className="text-sm text-neutral-400">{p.currency}</span>
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                لكل {p.billing_interval === "year" ? "سنة" : p.billing_interval === "month" ? "شهر" : p.billing_interval ?? "مرة"}
                {p.trial_days ? ` · تجربة ${p.trial_days} يومًا` : ""}
              </div>
              {p.description && <div className="mt-3 text-xs text-neutral-400">{p.description}</div>}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => toggle(p.id, p.is_active)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5"
                >
                  {p.is_active ? "إيقاف" : "تفعيل"}
                </button>
                <Badge tone="sky">{p.provider}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
