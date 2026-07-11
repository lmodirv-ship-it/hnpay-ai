import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({ meta: [{ title: "المنتجات والخدمات · HN-PAY" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: a }] = await Promise.all([
        supabase.from("sites").select("id, name, domain, is_active, created_at").order("created_at", { ascending: false }),
        supabase.from("hn_apps").select("id, app_id, name, category, active, domain, description"),
      ]);
      setSites(s ?? []);
      setApps(a ?? []);
    })();
  }, []);

  return (
    <AdminShell title="المنتجات والخدمات" subtitle="المواقع المسجّلة والتطبيقات المتصلة بـ HN-PAY.">
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">المواقع</h2>
          <Link to="/owner/sites" className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20">إدارة المواقع</Link>
        </div>
        {sites.length === 0 ? (
          <EmptyState title="لا توجد مواقع بعد" />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sites.map((s) => (
              <Card key={s.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold">{s.name}</div>
                    <div className="mt-1 text-[11px] text-neutral-400">{s.domain ?? "—"}</div>
                  </div>
                  <Badge tone={s.is_active ? "green" : "neutral"}>{s.is_active ? "مفعّل" : "معطّل"}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">تطبيقات HN</h2>
          <Link to="/owner/apps" className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5">إدارة التطبيقات</Link>
        </div>
        {apps.length === 0 ? (
          <EmptyState title="لا توجد تطبيقات" />
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-right text-[10px] uppercase tracking-wider text-neutral-500">
                    <th className="px-5 py-3">التطبيق</th>
                    <th className="px-5 py-3">الفئة</th>
                    <th className="px-5 py-3">النطاق</th>
                    <th className="px-5 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id} className="border-b border-white/5">
                      <td className="px-5 py-3">
                        <div className="font-semibold">{a.name}</div>
                        <div className="text-[10px] text-neutral-500">{a.app_id}</div>
                      </td>
                      <td className="px-5 py-3 text-[11px]">{a.category ?? "—"}</td>
                      <td className="px-5 py-3 font-mono text-[11px] text-sky-300">{a.domain ?? "—"}</td>
                      <td className="px-5 py-3"><Badge tone={a.active ? "green" : "neutral"}>{a.active ? "نشط" : "متوقف"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
