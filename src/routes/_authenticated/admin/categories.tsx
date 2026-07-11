import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, X, Save, FolderTree, Package, Layers, RefreshCw, FolderKanban, Search } from "lucide-react";
import { AdminShell, Card, StatCard, Badge, EmptyState } from "@/components/admin/AdminShell";
import { listCategories, upsertCategory, deleteCategory } from "@/lib/hn-pay/categories.functions";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({ meta: [{ title: "الفئات · HN-PAY" }] }),
  component: CategoriesPage,
});

type Cat = {
  id: string;
  project_id: string | null;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
  products_count: number;
  services_count: number;
  plans_count: number;
  created_at: string;
};
type Proj = { id: string; name: string; code: string; brand_color: string | null };

function CategoriesPage() {
  const load = useServerFn(listCategories);
  const save = useServerFn(upsertCategory);
  const del = useServerFn(deleteCategory);

  const [rows, setRows] = useState<Cat[]>([]);
  const [projects, setProjects] = useState<Proj[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [fProject, setFProject] = useState("");
  const [editing, setEditing] = useState<Cat | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [preselectProject, setPreselectProject] = useState<string>("");

  const reload = async () => {
    setLoading(true);
    try { const r = await load(); setRows(r.rows as Cat[]); setProjects(r.projects as Proj[]); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (fProject && r.project_id !== fProject) return false;
    if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [rows, q, fProject]);

  // group by project
  const grouped = useMemo(() => {
    const g = new Map<string, Cat[]>();
    filtered.forEach((r) => {
      const k = r.project_id ?? "__none__";
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(r);
    });
    return g;
  }, [filtered]);

  const projectById = useMemo(() => {
    const m = new Map<string, Proj>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const stats = {
    total: rows.length,
    active: rows.filter((r) => r.is_active).length,
    projectsWith: new Set(rows.map((r) => r.project_id).filter(Boolean)).size,
    totalItems: rows.reduce((s, r) => s + r.products_count + r.services_count + r.plans_count, 0),
  };

  return (
    <AdminShell
      title="الفئات"
      subtitle="طبقة تنظيم الكتالوج: مشروع ← فئة ← (منتج / خدمة / خطة)."
      actions={
        <button onClick={() => { setEditing(null); setPreselectProject(""); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400">
          <Plus className="h-3.5 w-3.5" /> إضافة فئة
        </button>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<FolderTree className="h-4 w-4" />} label="إجمالي الفئات" value={stats.total} tone="amber" />
        <StatCard icon={<FolderKanban className="h-4 w-4" />} label="مشاريع مصنّفة" value={stats.projectsWith} tone="sky" />
        <StatCard icon={<Layers className="h-4 w-4" />} label="عناصر مرتبطة" value={stats.totalItems.toLocaleString()} tone="violet" />
        <StatCard icon={<Package className="h-4 w-4" />} label="فئات نشطة" value={stats.active} tone="emerald" />
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث عن فئة..."
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 pr-9 text-xs outline-none focus:border-amber-400/50" />
          </div>
          <select value={fProject} onChange={(e) => setFProject(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs">
            <option value="">كل المشاريع</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-14 text-center text-sm text-neutral-500">جارِ التحميل...</div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="لا توجد فئات بعد"
          desc="ابدأ بإضافة فئات لتنظيم منتجاتك وخدماتك داخل كل مشروع."
          action={<button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black">
            <Plus className="h-3.5 w-3.5" /> إضافة أول فئة
          </button>}
        />
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([pid, cats]) => {
            const proj = pid === "__none__" ? null : projectById.get(pid);
            return (
              <div key={pid}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: proj?.brand_color ?? "#666" }} />
                    {proj?.name ?? "بدون مشروع"}
                    <span className="text-[10px] font-normal text-neutral-500">({cats.length} فئة)</span>
                  </h2>
                  {proj && (
                    <button onClick={() => { setEditing(null); setPreselectProject(proj.id); setShowForm(true); }}
                      className="text-[11px] text-amber-300 hover:text-amber-200">+ إضافة فئة إلى {proj.name}</button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {cats.map((c) => (
                    <Card key={c.id} className="group relative">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border" style={{ borderColor: (c.color ?? "#f59e0b") + "60", background: (c.color ?? "#f59e0b") + "15" }}>
                            <FolderTree className="h-4 w-4" style={{ color: c.color ?? "#f59e0b" }} />
                          </div>
                          <div>
                            <div className="font-semibold">{c.name}</div>
                            <div className="font-mono text-[10px] text-neutral-500">{c.slug}</div>
                          </div>
                        </div>
                        <Badge tone={c.is_active ? "green" : "neutral"}>{c.is_active ? "نشط" : "متوقف"}</Badge>
                      </div>
                      {c.description && <div className="mb-3 line-clamp-2 text-[11px] text-neutral-500">{c.description}</div>}
                      <div className="flex items-center gap-3 border-t border-white/5 pt-3 text-[11px] text-neutral-400">
                        <span className="inline-flex items-center gap-1"><Package className="h-3 w-3" /> {c.products_count}</span>
                        <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> {c.services_count}</span>
                        <span className="inline-flex items-center gap-1"><RefreshCw className="h-3 w-3" /> {c.plans_count}</span>
                        <div className="ms-auto flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <button onClick={() => { setEditing(c); setShowForm(true); }} className="rounded p-1 text-neutral-400 hover:text-amber-300"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={async () => { if (confirm(`حذف "${c.name}"؟`)) { await del({ data: { id: c.id } }); reload(); } }} className="rounded p-1 text-neutral-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <FormDrawer
          initial={editing}
          projects={projects}
          allCategories={rows}
          preselectProject={preselectProject}
          onClose={() => { setShowForm(false); setEditing(null); setPreselectProject(""); }}
          onSave={async (p) => { await save({ data: p }); setShowForm(false); setEditing(null); reload(); }}
        />
      )}
    </AdminShell>
  );
}

function FormDrawer({
  initial, projects, allCategories, preselectProject, onClose, onSave,
}: {
  initial: Cat | null;
  projects: Proj[];
  allCategories: Cat[];
  preselectProject: string;
  onClose: () => void;
  onSave: (p: any) => Promise<void>;
}) {
  const [f, setF] = useState({
    id: initial?.id,
    project_id: initial?.project_id ?? preselectProject ?? "",
    parent_id: initial?.parent_id ?? "",
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    icon: initial?.icon ?? "",
    color: initial?.color ?? "#f59e0b",
    display_order: initial?.display_order ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const parentOptions = allCategories.filter((c) => c.project_id === (f.project_id || null) && c.id !== initial?.id);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({
        ...f,
        project_id: f.project_id || null,
        parent_id: f.parent_id || null,
        display_order: Number(f.display_order),
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  };

  const autoSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl overflow-y-auto border-l border-amber-500/20 bg-[#0a0b14] p-6 text-white">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "تعديل فئة" : "إضافة فئة"}</h2>
          <button onClick={onClose} className="rounded p-1 text-neutral-400 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          <Field label="المشروع *">
            <select value={f.project_id} onChange={(e) => setF({ ...f, project_id: e.target.value, parent_id: "" })} className="input">
              <option value="">— بدون —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="الاسم *">
            <input value={f.name} onChange={(e) => {
              const name = e.target.value;
              setF((s) => ({ ...s, name, slug: s.slug || autoSlug(name) }));
            }} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug *"><input value={f.slug} onChange={(e) => setF({ ...f, slug: autoSlug(e.target.value) })} className="input font-mono" /></Field>
            <Field label="الأيقونة"><input value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} className="input" placeholder="اختياري" /></Field>
          </div>
          <Field label="الفئة الأم (اختياري)">
            <select value={f.parent_id} onChange={(e) => setF({ ...f, parent_id: e.target.value })} className="input">
              <option value="">— لا شيء (فئة رئيسية) —</option>
              {parentOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="الوصف">
            <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} className="input" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="اللون">
              <input type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} className="input h-9 p-1" />
            </Field>
            <Field label="ترتيب العرض"><input type="number" value={f.display_order} onChange={(e) => setF({ ...f, display_order: Number(e.target.value) })} className="input" /></Field>
            <Field label="الحالة">
              <button type="button" onClick={() => setF({ ...f, is_active: !f.is_active })}
                className={`w-full rounded-lg border px-3 py-2 text-xs ${f.is_active ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-white/10 text-neutral-400"}`}>
                {f.is_active ? "نشط" : "متوقف"}
              </button>
            </Field>
          </div>
        </div>

        <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-white/5 bg-[#0a0b14] pt-4">
          <button onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-neutral-300 hover:bg-white/5">إلغاء</button>
          <button onClick={submit} disabled={saving || !f.name || !f.slug} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50">
            <Save className="h-3.5 w-3.5" /> {saving ? "جارِ الحفظ..." : "حفظ"}
          </button>
        </div>
        <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.4);padding:0.5rem 0.75rem;font-size:0.75rem;outline:none;color:white;}
        .input:focus{border-color:rgba(251,191,36,0.5);}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] text-neutral-400">{label}</div>
      {children}
    </label>
  );
}
