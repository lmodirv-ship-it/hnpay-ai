import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Package, Layers, RefreshCw, CheckCircle2, PauseCircle, TrendingUp, Wallet,
  Plus, Search, LayoutGrid, Table as TableIcon, Filter, Download, Upload,
  Pencil, Trash2, X, Save, MoreHorizontal, Boxes,
} from "lucide-react";
import { AdminShell, Card, StatCard, Badge, EmptyState } from "@/components/admin/AdminShell";
import {
  listCatalog, upsertCatalogItem, deleteCatalogItem, bulkCatalogAction,
} from "@/lib/hn-pay/catalog.functions";

export const Route = createFileRoute("/_authenticated/admin/catalog")({
  head: () => ({ meta: [{ title: "المنتجات والخدمات · HN-PAY" }] }),
  component: CatalogPage,
});

type Row = {
  id: string;
  product_code: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  project_id: string | null;
  project_name: string | null;
  project_code: string | null;
  project_color: string | null;
  site_id: string | null;
  type: string;
  category: string | null;
  tags: string[];
  billing_type: string;
  price: number;
  currency: string;
  tax_rate: number;
  setup_fee: number;
  trial_days: number;
  subscription_interval: string | null;
  status: string;
  allowed_providers: string[];
  is_taxable: boolean;
  is_renewable: boolean;
  requires_approval: boolean;
  visible_in_store: boolean;
  display_order: number;
  keywords: string | null;
  sales_count: number;
  customers_count: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
};

type Project = { id: string; name: string; code: string; brand_color: string | null; category: string | null };

const TYPE_LABELS: Record<string, string> = {
  product: "منتج", service: "خدمة", subscription: "اشتراك", course: "دورة",
  hosting: "استضافة", license: "ترخيص", api: "API", storage: "تخزين",
  consulting: "استشارة", booking: "حجز",
};
const BILLING_LABELS: Record<string, string> = {
  one_time: "مرة واحدة", monthly: "شهري", yearly: "سنوي",
  weekly: "أسبوعي", usage: "حسب الاستخدام", free: "مجاني",
};
const STATUS_LABELS: Record<string, string> = {
  active: "نشط", hidden: "مخفي", paused: "متوقف", draft: "مسودة",
};
const PROVIDERS = ["cmi", "naps", "stripe", "paypal", "manual", "payzone"];

function CatalogPage() {
  const list = useServerFn(listCatalog);
  const upsert = useServerFn(upsertCatalogItem);
  const del = useServerFn(deleteCatalogItem);
  const bulk = useServerFn(bulkCatalogAction);

  const [rows, setRows] = useState<Row[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; project_id: string | null; color: string | null }[]>([]);
  const [stats, setStats] = useState({
    total: 0, products: 0, services: 0, subscriptions: 0,
    active: 0, inactive: 0, totalRevenue: 0, totalSales: 0,
  });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "cards">("table");
  const [q, setQ] = useState("");
  const [fProject, setFProject] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fType, setFType] = useState("");
  const [fBilling, setFBilling] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Row | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [detailOf, setDetailOf] = useState<Row | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await list();
      setRows(res.rows as Row[]);
      setProjects(res.projects as Project[]);
      setCategories((res as any).categories ?? []);
      setStats(res.stats);
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (fProject && r.project_id !== fProject) return false;
      if (fCategory && (r as any).category_id !== fCategory) return false;
      if (fType && r.type !== fType) return false;
      if (fBilling && r.billing_type !== fBilling) return false;
      if (fStatus && r.status !== fStatus) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!(
          r.name.toLowerCase().includes(s) ||
          r.product_code.toLowerCase().includes(s) ||
          (r.project_name ?? "").toLowerCase().includes(s) ||
          (r.category ?? "").toLowerCase().includes(s)
        )) return false;
      }
      return true;
    });
  }, [rows, q, fProject, fCategory, fType, fBilling, fStatus]);

  const exportCsv = () => {
    const headers = ["product_code","name","project_code","type","category","billing_type","price","currency","status","sales_count","total_revenue"];
    const lines = [headers.join(",")];
    filtered.forEach((r) => {
      lines.push([
        r.product_code, r.name, r.project_code ?? "", r.type, r.category ?? "",
        r.billing_type, r.price, r.currency, r.status, r.sales_count, r.total_revenue,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `hn-catalog-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSel = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  const doBulk = async (action: "activate" | "pause" | "hide" | "delete" | "archive") => {
    if (!selected.size) return;
    if (action === "delete" && !confirm(`حذف ${selected.size} عنصر؟`)) return;
    await bulk({ data: { ids: Array.from(selected), action } });
    setSelected(new Set());
    reload();
  };

  return (
    <AdminShell
      title="المنتجات والخدمات"
      subtitle="الكتالوج المركزي لكل ما تبيعه مجموعة HN عبر مختلف المشاريع والمواقع."
      actions={
        <>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400">
            <Plus className="h-3.5 w-3.5" /> إضافة منتج / خدمة
          </button>
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5">
            <Download className="h-3.5 w-3.5" /> تصدير
          </button>
          <button disabled className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-500">
            <Upload className="h-3.5 w-3.5" /> استيراد
          </button>
        </>
      }
    >
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Boxes className="h-4 w-4" />} label="إجمالي العناصر" value={stats.total} tone="amber" />
        <StatCard icon={<Package className="h-4 w-4" />} label="منتجات" value={stats.products} tone="sky" />
        <StatCard icon={<Layers className="h-4 w-4" />} label="خدمات" value={stats.services} tone="violet" />
        <StatCard icon={<RefreshCw className="h-4 w-4" />} label="اشتراكات" value={stats.subscriptions} tone="emerald" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="نشط" value={stats.active} tone="emerald" />
        <StatCard icon={<PauseCircle className="h-4 w-4" />} label="غير نشط" value={stats.inactive} tone="rose" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="إجمالي المبيعات" value={stats.totalSales.toLocaleString()} tone="sky" />
        <StatCard icon={<Wallet className="h-4 w-4" />} label="إجمالي الإيرادات" value={`${stats.totalRevenue.toLocaleString()} DH`} tone="amber" />
      </div>

      {/* Toolbar */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم/المعرف/المشروع..."
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 pr-9 text-xs outline-none focus:border-amber-400/50" />
          </div>
          <select value={fProject} onChange={(e) => { setFProject(e.target.value); setFCategory(""); }} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs">
            <option value="">كل المشاريع</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs">
            <option value="">كل الفئات</option>
            {categories.filter((c) => !fProject || c.project_id === fProject).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={fType} onChange={(e) => setFType(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs">
            <option value="">كل الأنواع</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={fBilling} onChange={(e) => setFBilling(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs">
            <option value="">كل أنواع الدفع</option>
            {Object.entries(BILLING_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs">
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            <button onClick={() => setView("table")} className={`px-3 py-2 text-xs ${view === "table" ? "bg-amber-500/20 text-amber-200" : "text-neutral-400 hover:bg-white/5"}`}>
              <TableIcon className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setView("cards")} className={`px-3 py-2 text-xs ${view === "cards" ? "bg-amber-500/20 text-amber-200" : "text-neutral-400 hover:bg-white/5"}`}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/5 px-3 py-2 text-xs">
            <span className="text-amber-200">{selected.size} محدد</span>
            <button onClick={() => doBulk("activate")} className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-200 hover:bg-emerald-500/20">تفعيل</button>
            <button onClick={() => doBulk("pause")} className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-amber-200 hover:bg-amber-500/20">إيقاف</button>
            <button onClick={() => doBulk("hide")} className="rounded-md border border-white/10 px-2 py-1 text-neutral-300 hover:bg-white/5">إخفاء</button>
            <button onClick={() => doBulk("archive")} className="rounded-md border border-white/10 px-2 py-1 text-neutral-300 hover:bg-white/5">أرشفة</button>
            <button onClick={() => doBulk("delete")} className="rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-rose-200 hover:bg-rose-500/20">حذف</button>
          </div>
        )}
      </Card>

      {/* List */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-14 text-center text-sm text-neutral-500">جارِ التحميل...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="لا توجد عناصر بعد"
          desc="ابدأ بإضافة أول منتج أو خدمة إلى الكتالوج المركزي."
          action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black">
            <Plus className="h-3.5 w-3.5" /> إضافة أول منتج
          </button>}
        />
      ) : view === "table" ? (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-3"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                  <th className="px-4 py-3">المعرف</th>
                  <th className="px-4 py-3">الاسم</th>
                  <th className="px-4 py-3">المشروع</th>
                  <th className="px-4 py-3">النوع</th>
                  <th className="px-4 py-3">الدفع</th>
                  <th className="px-4 py-3">السعر</th>
                  <th className="px-4 py-3">المبيعات</th>
                  <th className="px-4 py-3">الإيرادات</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSel(r.id)} /></td>
                    <td className="px-4 py-3 font-mono text-[11px] text-amber-300">{r.product_code}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailOf(r)} className="font-semibold hover:text-amber-300">{r.name}</button>
                      {r.category && <div className="text-[10px] text-neutral-500">{r.category}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {r.project_name ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px]">
                          <span className="h-2 w-2 rounded-full" style={{ background: r.project_color ?? "#f59e0b" }} />
                          {r.project_name}
                        </span>
                      ) : <span className="text-[10px] text-neutral-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[11px]">{TYPE_LABELS[r.type] ?? r.type}</td>
                    <td className="px-4 py-3 text-[11px] text-neutral-400">{BILLING_LABELS[r.billing_type] ?? r.billing_type}</td>
                    <td className="px-4 py-3 font-semibold">{Number(r.price).toLocaleString()} <span className="text-[10px] text-neutral-500">{r.currency}</span></td>
                    <td className="px-4 py-3 text-[11px]">{r.sales_count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[11px] text-emerald-300">{Number(r.total_revenue).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.status === "active" ? "green" : r.status === "paused" ? "amber" : r.status === "draft" ? "neutral" : "red"}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditing(r); setShowForm(true); }} className="rounded p-1 text-neutral-400 hover:text-amber-300"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={async () => { if (confirm("حذف؟")) { await del({ data: { id: r.id } }); reload(); } }} className="rounded p-1 text-neutral-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <Card key={r.id} className="cursor-pointer transition hover:border-amber-400/40" >
              <div onClick={() => setDetailOf(r)}>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[10px] text-amber-300">{r.product_code}</div>
                    <div className="mt-1 text-sm font-bold">{r.name}</div>
                  </div>
                  <Badge tone={r.status === "active" ? "green" : "neutral"}>{STATUS_LABELS[r.status]}</Badge>
                </div>
                {r.project_name && (
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <span className="h-2 w-2 rounded-full" style={{ background: r.project_color ?? "#f59e0b" }} />
                    {r.project_name}
                  </div>
                )}
                <div className="mb-3 line-clamp-2 text-[11px] text-neutral-500">{r.description ?? "—"}</div>
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="text-lg font-bold">{Number(r.price).toLocaleString()} <span className="text-[10px] text-neutral-500">{r.currency}</span></div>
                  <div className="text-[10px] text-neutral-500">{BILLING_LABELS[r.billing_type]}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <FormDrawer
          initial={editing}
          projects={projects}
          categories={categories}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={async (payload) => { await upsert({ data: payload }); setShowForm(false); setEditing(null); reload(); }}
        />
      )}

      {detailOf && (
        <DetailDrawer
          row={detailOf}
          onClose={() => setDetailOf(null)}
          onEdit={() => { setEditing(detailOf); setDetailOf(null); setShowForm(true); }}
        />
      )}
    </AdminShell>
  );
}

/* ─────── Form ─────── */

function FormDrawer({
  initial, projects, onClose, onSave,
}: { initial: Row | null; projects: Project[]; onClose: () => void; onSave: (p: any) => Promise<void> }) {
  const [f, setF] = useState({
    id: initial?.id,
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    image_url: initial?.image_url ?? "",
    project_id: initial?.project_id ?? "",
    type: initial?.type ?? "product",
    category: initial?.category ?? "",
    billing_type: initial?.billing_type ?? "one_time",
    price: initial?.price ?? 0,
    currency: initial?.currency ?? "MAD",
    tax_rate: initial?.tax_rate ?? 0,
    setup_fee: initial?.setup_fee ?? 0,
    trial_days: initial?.trial_days ?? 0,
    subscription_interval: initial?.subscription_interval ?? "",
    status: initial?.status ?? "active",
    allowed_providers: initial?.allowed_providers ?? [],
    is_taxable: initial?.is_taxable ?? false,
    is_renewable: initial?.is_renewable ?? false,
    requires_approval: initial?.requires_approval ?? false,
    visible_in_store: initial?.visible_in_store ?? true,
    keywords: initial?.keywords ?? "",
  });
  const [saving, setSaving] = useState(false);

  const toggleProvider = (p: string) => {
    setF((s) => ({ ...s, allowed_providers: s.allowed_providers.includes(p) ? s.allowed_providers.filter((x) => x !== p) : [...s.allowed_providers, p] }));
  };

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({
        ...f,
        project_id: f.project_id || null,
        price: Number(f.price),
        tax_rate: Number(f.tax_rate),
        setup_fee: Number(f.setup_fee),
        trial_days: Number(f.trial_days),
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl overflow-y-auto border-l border-amber-500/20 bg-[#0a0b14] p-6 text-white">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "تعديل عنصر" : "إضافة منتج / خدمة"}</h2>
          <button onClick={onClose} className="rounded p-1 text-neutral-400 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          <Field label="الاسم *"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="المشروع">
              <select value={f.project_id} onChange={(e) => setF({ ...f, project_id: e.target.value })} className="input">
                <option value="">— بدون —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="الفئة"><input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="input" placeholder="SaaS, متجر, دورة..." /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="النوع">
              <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className="input">
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="نوع الدفع">
              <select value={f.billing_type} onChange={(e) => setF({ ...f, billing_type: e.target.value })} className="input">
                {Object.entries(BILLING_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="الحالة">
              <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="input">
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="السعر"><input type="number" step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} className="input" /></Field>
            <Field label="العملة">
              <select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} className="input">
                <option>MAD</option><option>USD</option><option>EUR</option>
              </select>
            </Field>
            <Field label="ضريبة %"><input type="number" step="0.01" value={f.tax_rate} onChange={(e) => setF({ ...f, tax_rate: Number(e.target.value) })} className="input" /></Field>
          </div>
          {(f.billing_type === "monthly" || f.billing_type === "yearly" || f.billing_type === "weekly") && (
            <div className="grid grid-cols-3 gap-3">
              <Field label="فترة التجربة (أيام)"><input type="number" value={f.trial_days} onChange={(e) => setF({ ...f, trial_days: Number(e.target.value) })} className="input" /></Field>
              <Field label="رسوم الإعداد"><input type="number" step="0.01" value={f.setup_fee} onChange={(e) => setF({ ...f, setup_fee: Number(e.target.value) })} className="input" /></Field>
              <Field label="مدة الاشتراك"><input value={f.subscription_interval} onChange={(e) => setF({ ...f, subscription_interval: e.target.value })} className="input" placeholder="month, year..." /></Field>
            </div>
          )}
          <Field label="الوصف">
            <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} className="input" />
          </Field>
          <Field label="صورة (URL)"><input value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} className="input" /></Field>
          <Field label="الكلمات المفتاحية"><input value={f.keywords} onChange={(e) => setF({ ...f, keywords: e.target.value })} className="input" /></Field>

          <div>
            <div className="mb-2 text-xs text-neutral-400">وسائل الدفع المسموحة</div>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <button key={p} type="button" onClick={() => toggleProvider(p)}
                  className={`rounded-lg border px-3 py-1.5 text-xs uppercase ${f.allowed_providers.includes(p) ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-white/10 text-neutral-500 hover:bg-white/5"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Toggle label="خاضع للضريبة" value={f.is_taxable} onChange={(v) => setF({ ...f, is_taxable: v })} />
            <Toggle label="قابل للتجديد" value={f.is_renewable} onChange={(v) => setF({ ...f, is_renewable: v })} />
            <Toggle label="يتطلب موافقة" value={f.requires_approval} onChange={(v) => setF({ ...f, requires_approval: v })} />
            <Toggle label="ظاهر في المتجر" value={f.visible_in_store} onChange={(v) => setF({ ...f, visible_in_store: v })} />
          </div>
        </div>

        <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-white/5 bg-[#0a0b14] pt-4">
          <button onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-neutral-300 hover:bg-white/5">إلغاء</button>
          <button onClick={submit} disabled={saving || !f.name} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50">
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

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${value ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-white/10 text-neutral-400 hover:bg-white/5"}`}>
      <span>{label}</span>
      <span className={`h-2 w-2 rounded-full ${value ? "bg-emerald-400" : "bg-neutral-600"}`} />
    </button>
  );
}

/* ─────── Detail ─────── */

function DetailDrawer({ row, onClose, onEdit }: { row: Row; onClose: () => void; onEdit: () => void }) {
  const [tab, setTab] = useState<"general" | "pricing" | "subscription" | "payment" | "stats" | "activity">("general");
  const tabs: { id: typeof tab; label: string }[] = [
    { id: "general", label: "عام" },
    { id: "pricing", label: "التسعير" },
    { id: "subscription", label: "الاشتراك" },
    { id: "payment", label: "الدفع" },
    { id: "stats", label: "الإحصائيات" },
    { id: "activity", label: "السجل" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-3xl overflow-y-auto border-l border-amber-500/20 bg-[#0a0b14] p-6 text-white">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-mono text-[10px] text-amber-300">{row.product_code}</div>
            <h2 className="mt-1 truncate text-xl font-bold">{row.name}</h2>
            {row.project_name && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400">
                <span className="h-2 w-2 rounded-full" style={{ background: row.project_color ?? "#f59e0b" }} />
                {row.project_name}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"><Pencil className="h-3 w-3" /> تعديل</button>
            <button onClick={onClose} className="rounded p-1 text-neutral-400 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-1 border-b border-white/5">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-xs ${tab === t.id ? "border-b-2 border-amber-400 text-amber-200" : "text-neutral-500 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "general" && (
          <div className="space-y-3">
            <InfoRow k="النوع" v={TYPE_LABELS[row.type] ?? row.type} />
            <InfoRow k="الفئة" v={row.category ?? "—"} />
            <InfoRow k="الحالة" v={<Badge tone={row.status === "active" ? "green" : "neutral"}>{STATUS_LABELS[row.status]}</Badge>} />
            <InfoRow k="الوصف" v={row.description ?? "—"} />
            <InfoRow k="ظاهر في المتجر" v={row.visible_in_store ? "نعم" : "لا"} />
            <InfoRow k="يتطلب موافقة" v={row.requires_approval ? "نعم" : "لا"} />
            <InfoRow k="أُنشئ في" v={new Date(row.created_at).toLocaleString("ar-MA")} />
          </div>
        )}
        {tab === "pricing" && (
          <div className="space-y-3">
            <InfoRow k="السعر" v={`${Number(row.price).toLocaleString()} ${row.currency}`} />
            <InfoRow k="الضريبة" v={`${row.tax_rate}%`} />
            <InfoRow k="خاضع للضريبة" v={row.is_taxable ? "نعم" : "لا"} />
            <InfoRow k="رسوم الإعداد" v={`${row.setup_fee} ${row.currency}`} />
          </div>
        )}
        {tab === "subscription" && (
          <div className="space-y-3">
            <InfoRow k="نوع الفوترة" v={BILLING_LABELS[row.billing_type] ?? row.billing_type} />
            <InfoRow k="مدة الاشتراك" v={row.subscription_interval ?? "—"} />
            <InfoRow k="فترة التجربة" v={`${row.trial_days} يوم`} />
            <InfoRow k="قابل للتجديد" v={row.is_renewable ? "نعم" : "لا"} />
          </div>
        )}
        {tab === "payment" && (
          <div>
            <div className="mb-3 text-xs text-neutral-400">وسائل الدفع المسموحة</div>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <Badge key={p} tone={row.allowed_providers.includes(p) ? "green" : "neutral"}>
                  {row.allowed_providers.includes(p) ? "✓" : "✗"} {p.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {tab === "stats" && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="المبيعات" value={row.sales_count} tone="sky" />
            <StatCard icon={<Wallet className="h-4 w-4" />} label="الإيرادات" value={`${Number(row.total_revenue).toLocaleString()} ${row.currency}`} tone="amber" />
            <StatCard icon={<Package className="h-4 w-4" />} label="العملاء" value={row.customers_count} tone="violet" />
            <StatCard icon={<Layers className="h-4 w-4" />} label="متوسط الطلب" value={row.sales_count > 0 ? Math.round(Number(row.total_revenue) / row.sales_count).toLocaleString() : 0} tone="emerald" />
          </div>
        )}
        {tab === "activity" && (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 text-center text-xs text-neutral-500">
            سجل النشاط سيتم تفعيله قريبًا.
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between border-b border-white/5 py-2">
      <div className="text-[11px] text-neutral-500">{k}</div>
      <div className="max-w-[60%] text-right text-xs">{v}</div>
    </div>
  );
}
