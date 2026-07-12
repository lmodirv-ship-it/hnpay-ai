import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({ meta: [{ title: "المنتجات والخدمات · HN-PAY" }] }),
  component: ProductsPage,
});

type Project = { id: string; name: string; code: string; category: string | null; brand_color: string | null };
type Item = { id: string; name: string; status: string | null; total_revenue: number | null; project_id: string | null };

const CATEGORY_LABEL: Record<string, string> = {
  logistics: "خدمات لوجستية", services: "خدمات", chat: "محادثة", ai: "ذكاء اصطناعي",
  health: "صحة", finance: "مالية", ecommerce: "تجارة إلكترونية", realestate: "عقارات",
  hr: "موارد بشرية", islamic: "إسلامي", store: "متجر", content: "محتوى",
  database: "قاعدة بيانات", brand: "علامة تجارية", internal: "داخلي", portal: "بوابة",
  callcenter: "مركز اتصال", print: "طباعة",
};

function ProductsPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: s }, { data: a }, { data: p }, { data: it }] = await Promise.all([
      supabase.from("sites").select("id, name, domain, is_active, created_at").order("created_at", { ascending: false }),
      supabase.from("hn_apps").select("id, app_id, name, category, active, domain, description"),
      supabase.from("hn_projects").select("id, name, code, category, brand_color").order("name"),
      supabase.from("products_services").select("id, name, status, total_revenue, project_id"),
    ]);
    setSites(s ?? []);
    setApps(a ?? []);
    setProjects((p ?? []) as Project[]);
    setItems((it ?? []) as Item[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const byProj = new Map<string, Item[]>();
    items.forEach((r) => {
      if (!r.project_id) return;
      const arr = byProj.get(r.project_id) ?? [];
      arr.push(r);
      byProj.set(r.project_id, arr);
    });
    return projects.map((p) => {
      const list = byProj.get(p.id) ?? [];
      const active = list.filter((x) => x.status === "active");
      const revenue = list.reduce((s, x) => s + Number(x.total_revenue ?? 0), 0);
      const status: "active" | "draft" | "paused" =
        active.length > 0 ? "active" : list.length === 0 ? "draft" : "paused";
      const services = (active.length > 0 ? active : list).map((x) => x.name);
      return { project: p, count: list.length, activeCount: active.length, revenue, status, services };
    });
  }, [projects, items]);

  return (
    <AdminShell title="المنتجات والخدمات" subtitle="تحليل الخدمات التي يقدّمها كل موقع من مواقع المجموعة.">
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">الخدمات حسب الموقع</h2>
          <div className="flex items-center gap-2">
            <button onClick={load} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5">تحديث</button>
            <Link to="/owner/hn-pay/catalog" className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20">إدارة الكتالوج</Link>
          </div>
        </div>
        {loading ? (
          <Card><div className="text-xs text-neutral-500">جارٍ التحميل…</div></Card>
        ) : rows.length === 0 ? (
          <EmptyState title="لا توجد مشاريع" />
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-right text-[10px] uppercase tracking-wider text-neutral-500">
                    <th className="px-5 py-3">الموقع</th>
                    <th className="px-5 py-3">الفئة</th>
                    <th className="px-5 py-3">عدد الخدمات</th>
                    <th className="px-5 py-3 min-w-[360px]">الخدمات المقدّمة</th>
                    <th className="px-5 py-3">الإيرادات</th>
                    <th className="px-5 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ project, count, activeCount, revenue, status, services }) => {
                    const shown = services.slice(0, 6);
                    const rest = services.length - shown.length;
                    const color = project.brand_color ?? "#f59e0b";
                    return (
                      <tr key={project.id} className="border-b border-white/5 align-top">
                        <td className="px-5 py-3">
                          <Link
                            to="/owner/hn-pay/catalog"
                            search={{ project: project.code } as any}
                            className="font-bold hover:underline"
                            style={{ color }}
                          >
                            {project.name}
                          </Link>
                          <div className="text-[10px] font-mono text-neutral-500">{project.code}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px]"
                            style={{ borderColor: `${color}55`, color, background: `${color}15` }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                            {CATEGORY_LABEL[project.category ?? ""] ?? project.category ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[11px]">
                          <span className="font-mono text-neutral-200">{count}</span>
                          {activeCount !== count && (
                            <span className="text-neutral-500"> · <span className="text-emerald-400">{activeCount}</span> نشط</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {services.length === 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-neutral-500">لا توجد خدمات بعد</span>
                              <Link
                                to="/owner/hn-pay/catalog"
                                search={{ project: project.code, new: 1 } as any}
                                className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200 hover:bg-amber-500/20"
                              >
                                + إضافة خدمة
                              </Link>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {shown.map((n, i) => (
                                <Link
                                  key={i}
                                  to="/owner/hn-pay/catalog"
                                  search={{ project: project.code, q: n } as any}
                                  className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-neutral-200 hover:bg-white/10"
                                  title={n}
                                >
                                  {n.length > 32 ? n.slice(0, 32) + "…" : n}
                                </Link>
                              ))}
                              {rest > 0 && (
                                <Link
                                  to="/owner/hn-pay/catalog"
                                  search={{ project: project.code } as any}
                                  className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-neutral-400 hover:bg-white/5"
                                >
                                  +{rest}
                                </Link>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 font-mono text-[11px]">{revenue.toFixed(2)}</td>
                        <td className="px-5 py-3">
                          <Badge tone={status === "active" ? "green" : status === "draft" ? "neutral" : "amber"}>
                            {status === "active" ? "نشط" : status === "draft" ? "مسودة" : "متوقّف"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">المواقع المسجّلة</h2>
          <Link to="/owner/sites" className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5">إدارة المواقع</Link>
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
