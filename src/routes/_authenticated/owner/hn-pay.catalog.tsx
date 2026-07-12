import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Package, Plus, RefreshCw, Search, Filter, Upload, Download, Pencil, Trash2,
  Copy, Eye, EyeOff, Archive, MoreHorizontal, X, Save, ChevronLeft, ChevronRight,
  CheckCircle2, Layers, Boxes, Globe, FileText, TrendingUp, Loader2, Tag,
  ArrowUpDown, AlertTriangle,
} from "lucide-react";
import { OwnerShell } from "@/routes/_authenticated/owner/dashboard";
import { useHnSession } from "@/lib/auth/use-session";
import {
  listCatalogCentral, getCatalogMeta, getCatalogItemDetail,
  upsertCatalogItemCentral, setCatalogItemStatus, deleteCatalogItemCentral,
  duplicateCatalogItem, importCatalogCsv,
  ITEM_TYPES, BILLING_TYPES, BILLING_INTERVALS, ITEM_STATUSES, TAX_BEHAVIORS,
} from "@/lib/hn-pay/catalog-central.functions";

export const Route = createFileRoute("/_authenticated/owner/hn-pay/catalog")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Catalog · HN-Pay" },
      { name: "description", content: "Central catalog of products, services, subscriptions and plans across all HN sites." },
    ],
  }),
  component: CatalogCentralPage,
});

/* ────────── i18n ────────── */
type Lang = "ar" | "en";
const t = (lang: Lang, ar: string, en: string) => (lang === "ar" ? ar : en);

const TYPE_LABEL: Record<string, { ar: string; en: string }> = {
  product: { ar: "منتج", en: "Product" },
  service: { ar: "خدمة", en: "Service" },
  subscription: { ar: "اشتراك", en: "Subscription" },
  course: { ar: "دورة", en: "Course" },
  hosting: { ar: "استضافة", en: "Hosting" },
  license: { ar: "ترخيص", en: "License" },
  api: { ar: "API", en: "API" },
  storage: { ar: "تخزين", en: "Storage" },
  consulting: { ar: "استشارة", en: "Consulting" },
  booking: { ar: "حجز", en: "Booking" },
  digital: { ar: "منتج رقمي", en: "Digital" },
};
const BILLING_LABEL: Record<string, { ar: string; en: string }> = {
  one_time: { ar: "مرة واحدة", en: "One-time" },
  recurring: { ar: "متكرر", en: "Recurring" },
  usage: { ar: "حسب الاستخدام", en: "Usage-based" },
  free: { ar: "مجاني", en: "Free" },
};
const STATUS_LABEL: Record<string, { ar: string; en: string; tone: string }> = {
  active: { ar: "نشط", en: "Active", tone: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" },
  draft: { ar: "مسودة", en: "Draft", tone: "border-neutral-500/40 bg-neutral-500/10 text-neutral-300" },
  hidden: { ar: "مخفي", en: "Hidden", tone: "border-sky-400/40 bg-sky-500/10 text-sky-300" },
  archived: { ar: "مؤرشف", en: "Archived", tone: "border-amber-400/40 bg-amber-500/10 text-amber-300" },
};

const genCode = (prefix = "P") => `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;

/* ────────── page ────────── */

function CatalogCentralPage() {
  const { profile, signOut } = useHnSession();
  const [lang, setLang] = useState<Lang>("ar");
  const dir = lang === "ar" ? "rtl" : "ltr";

  const qc = useQueryClient();
  const listFn = useServerFn(listCatalogCentral);
  const metaFn = useServerFn(getCatalogMeta);
  const upsertFn = useServerFn(upsertCatalogItemCentral);
  const delFn = useServerFn(deleteCatalogItemCentral);
  const statusFn = useServerFn(setCatalogItemStatus);
  const dupFn = useServerFn(duplicateCatalogItem);
  const detailFn = useServerFn(getCatalogItemDetail);
  const importFn = useServerFn(importCatalogCsv);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<"updated_at" | "created_at" | "name_ar" | "item_code" | "status" | "item_type">("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [q, setQ] = useState("");
  const [siteId, setSiteId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [itemType, setItemType] = useState("");
  const [billingType, setBillingType] = useState("");
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("");

  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<any | null>(null);

  const meta = useQuery({ queryKey: ["catalog-central-meta"], queryFn: () => metaFn() });
  const list = useQuery({
    queryKey: ["catalog-central-list", page, pageSize, sortBy, sortDir, q, siteId, categoryId, itemType, billingType, status, currency],
    queryFn: () => listFn({ data: { page, pageSize, sortBy, sortDir, q, siteId, categoryId, itemType, billingType, status, currency } }),
  });

  const refetchAll = () => { qc.invalidateQueries({ queryKey: ["catalog-central-list"] }); qc.invalidateQueries({ queryKey: ["catalog-central-meta"] }); };

  const upsertMut = useMutation({
    mutationFn: (payload: any) => upsertFn({ data: payload }),
    onSuccess: () => { refetchAll(); setShowForm(false); setEditing(null); },
  });
  const delMut = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => { refetchAll(); setConfirmDel(null); } });
  const statusMut = useMutation({ mutationFn: (v: { id: string; status: string }) => statusFn({ data: v }), onSuccess: refetchAll });
  const dupMut = useMutation({ mutationFn: (id: string) => dupFn({ data: { id } }), onSuccess: refetchAll });
  const importMut = useMutation({ mutationFn: (rows: any[]) => importFn({ data: { rows } }), onSuccess: refetchAll });

  const clearFilters = () => {
    setQ(""); setSiteId(""); setCategoryId(""); setItemType(""); setBillingType(""); setStatus(""); setCurrency(""); setPage(1);
  };

  const exportCsv = () => {
    const rows = list.data?.rows ?? [];
    const header = ["item_code","name_ar","name_en","site_id","category_id","item_type","status","default_price_amount","default_price_currency","default_billing_type","prices_count","created_at","updated_at"];
    const csv = [header.join(",")].concat(
      rows.map((r: any) => header.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `hn-catalog-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (f: File) => {
    const text = await f.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((ln) => {
      const cols = ln.match(/("([^"]|"")*"|[^,]*)/g)?.filter((_v, i) => i % 2 === 0) ?? [];
      const obj: any = {};
      headers.forEach((h, i) => {
        let v: any = (cols[i] ?? "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
        if (h === "amount") v = Number(v || 0);
        obj[h] = v;
      });
      return obj;
    });
    importMut.mutate(rows);
  };

  const s = meta.data?.stats;

  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <div dir={dir} className={lang === "ar" ? "font-[Cairo,Inter,ui-sans-serif]" : "font-[Inter,ui-sans-serif]"}>
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-300">
                <Boxes className="h-4 w-4" />
              </div>
              <h1 className="text-2xl font-bold">{t(lang, "الكتالوج المركزي", "Central Catalog")}</h1>
            </div>
            <p className="mt-1 text-sm text-neutral-400">
              {t(lang,
                "منتجات، خدمات، اشتراكات وخطط جميع مواقع مجموعة HN في مكان واحد.",
                "Products, services, subscriptions and plans across every HN site — unified.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5"
            >{lang === "ar" ? "EN" : "AR"}</button>
            <button
              onClick={() => { qc.invalidateQueries({ queryKey: ["catalog-central-list"] }); qc.invalidateQueries({ queryKey: ["catalog-central-meta"] }); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5"
            ><RefreshCw className="h-3.5 w-3.5" /> {t(lang, "تحديث", "Refresh")}</button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5">
              <Upload className="h-3.5 w-3.5" /> {t(lang, "استيراد CSV", "Import CSV")}
              <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && onImportFile(e.target.files[0])} />
            </label>
            <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5">
              <Download className="h-3.5 w-3.5" /> {t(lang, "تصدير CSV", "Export CSV")}
            </button>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400"
            ><Plus className="h-3.5 w-3.5" /> {t(lang, "إضافة عنصر", "Add item")}</button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <StatBox label={t(lang, "الإجمالي", "Total")} value={s?.total ?? 0} icon={<Package className="h-4 w-4" />} tone="amber" />
          <StatBox label={t(lang, "المنتجات", "Products")} value={s?.products ?? 0} icon={<Boxes className="h-4 w-4" />} tone="sky" />
          <StatBox label={t(lang, "الخدمات", "Services")} value={s?.services ?? 0} icon={<Layers className="h-4 w-4" />} tone="violet" />
          <StatBox label={t(lang, "الاشتراكات", "Subscriptions")} value={s?.subscriptions ?? 0} icon={<RefreshCw className="h-4 w-4" />} tone="emerald" />
          <StatBox label={t(lang, "نشط", "Active")} value={s?.active ?? 0} icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
          <StatBox label={t(lang, "مسودة", "Draft")} value={s?.draft ?? 0} icon={<FileText className="h-4 w-4" />} tone="amber" />
          <StatBox label={t(lang, "المواقع", "Sites")} value={s?.sites_with_items ?? 0} icon={<Globe className="h-4 w-4" />} tone="sky" />
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-2xl border border-amber-500/10 bg-white/[0.02] p-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" style={{ [lang === "ar" ? "right" : "left"]: "0.75rem" } as any} />
              <input
                value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder={t(lang, "بحث بالاسم أو الكود…", "Search by name or code…")}
                className={`w-full rounded-lg border border-white/10 bg-black/40 py-2 ${lang === "ar" ? "pr-9 pl-3" : "pl-9 pr-3"} text-sm outline-none placeholder:text-neutral-500 focus:border-amber-400/40`}
              />
            </div>
            <Select value={siteId} onChange={(v) => { setSiteId(v); setPage(1); }} label={t(lang, "الموقع", "Site")}>
              <option value="">{t(lang, "كل المواقع", "All sites")}</option>
              {(meta.data?.sites ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select value={categoryId} onChange={(v) => { setCategoryId(v); setPage(1); }} label={t(lang, "الفئة", "Category")}>
              <option value="">{t(lang, "كل الفئات", "All categories")}</option>
              {(meta.data?.categories ?? []).filter((c: any) => !siteId || c.site_id === siteId).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name_ar}</option>
              ))}
            </Select>
            <Select value={itemType} onChange={(v) => { setItemType(v); setPage(1); }} label={t(lang, "النوع", "Type")}>
              <option value="">{t(lang, "كل الأنواع", "All types")}</option>
              {ITEM_TYPES.map((tp) => <option key={tp} value={tp}>{TYPE_LABEL[tp][lang]}</option>)}
            </Select>
            <Select value={billingType} onChange={(v) => { setBillingType(v); setPage(1); }} label={t(lang, "الفوترة", "Billing")}>
              <option value="">{t(lang, "الكل", "All")}</option>
              {BILLING_TYPES.map((b) => <option key={b} value={b}>{BILLING_LABEL[b][lang]}</option>)}
            </Select>
            <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} label={t(lang, "الحالة", "Status")}>
              <option value="">{t(lang, "الكل", "All")}</option>
              {ITEM_STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABEL[st][lang]}</option>)}
            </Select>
            <Select value={currency} onChange={(v) => { setCurrency(v); setPage(1); }} label={t(lang, "العملة", "Currency")}>
              <option value="">{t(lang, "الكل", "All")}</option>
              {(meta.data?.currencies ?? []).map((c: string) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-neutral-300 hover:bg-white/5">
              <X className="h-3.5 w-3.5" /> {t(lang, "مسح", "Clear")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-amber-500/10 bg-white/[0.02] backdrop-blur-xl">
          {list.isLoading ? (
            <div className="flex items-center justify-center py-16 text-neutral-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : list.isError ? (
            <div className="flex items-center justify-center gap-2 py-16 text-red-400">
              <AlertTriangle className="h-5 w-5" /> {(list.error as Error)?.message}
            </div>
          ) : !list.data?.rows.length ? (
            <div className="py-16 text-center text-neutral-500">
              <Package className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <div>{t(lang, "لا توجد عناصر بعد", "No catalog items yet")}</div>
              <button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400">
                <Plus className="h-3.5 w-3.5" /> {t(lang, "أول عنصر", "First item")}
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/5 bg-black/40 text-xs uppercase tracking-wider text-neutral-500">
                    <tr>
                      <Th onClick={() => toggleSort(sortBy, sortDir, setSortBy, setSortDir, "item_code")} label={t(lang, "الكود", "Code")} />
                      <Th onClick={() => toggleSort(sortBy, sortDir, setSortBy, setSortDir, "name_ar")} label={t(lang, "الاسم", "Name")} />
                      <th className="p-3 text-start">{t(lang, "الموقع", "Site")}</th>
                      <Th onClick={() => toggleSort(sortBy, sortDir, setSortBy, setSortDir, "item_type")} label={t(lang, "النوع", "Type")} />
                      <th className="p-3 text-start">{t(lang, "الفئة", "Category")}</th>
                      <th className="p-3 text-start">{t(lang, "السعر", "Price")}</th>
                      <th className="p-3 text-start">{t(lang, "الفوترة", "Billing")}</th>
                      <th className="p-3 text-start">{t(lang, "الأسعار", "Prices")}</th>
                      <Th onClick={() => toggleSort(sortBy, sortDir, setSortBy, setSortDir, "status")} label={t(lang, "الحالة", "Status")} />
                      <Th onClick={() => toggleSort(sortBy, sortDir, setSortBy, setSortDir, "updated_at")} label={t(lang, "التحديث", "Updated")} />
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.rows.map((r: any) => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {r.image_url ? (
                              <img src={r.image_url} alt="" className="h-8 w-8 rounded-md object-cover" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-neutral-500">
                                <Package className="h-3.5 w-3.5" />
                              </div>
                            )}
                            <code className="text-[11px] text-amber-300">{r.item_code}</code>
                          </div>
                        </td>
                        <td className="p-3">
                          <button onClick={() => setDetailId(r.id)} className="text-start font-medium hover:text-amber-300">
                            {lang === "ar" ? r.name_ar : (r.name_en || r.name_ar)}
                          </button>
                        </td>
                        <td className="p-3 text-xs text-neutral-400">
                          {r.site_name ? <><div>{r.site_name}</div><div className="text-[10px] text-neutral-500">{r.site_domain}</div></> : "—"}
                        </td>
                        <td className="p-3 text-xs">{TYPE_LABEL[r.item_type]?.[lang] ?? r.item_type}</td>
                        <td className="p-3 text-xs text-neutral-400">{r.category_name ?? "—"}</td>
                        <td className="p-3 text-xs">
                          {r.default_price_amount != null
                            ? <><span className="font-semibold text-amber-300">{Number(r.default_price_amount).toFixed(2)}</span> <span className="text-neutral-500">{r.default_price_currency}</span></>
                            : <span className="text-neutral-600">—</span>}
                        </td>
                        <td className="p-3 text-xs text-neutral-400">
                          {r.default_billing_type ? BILLING_LABEL[r.default_billing_type]?.[lang] : "—"}
                          {r.default_billing_interval ? <span className="text-neutral-600"> · {r.default_billing_interval}</span> : null}
                        </td>
                        <td className="p-3 text-xs"><span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5">{r.prices_count}</span></td>
                        <td className="p-3"><span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] ${STATUS_LABEL[r.status]?.tone ?? ""}`}>{STATUS_LABEL[r.status]?.[lang] ?? r.status}</span></td>
                        <td className="p-3 text-[11px] text-neutral-500">{new Date(r.updated_at).toLocaleDateString(lang === "ar" ? "ar-MA" : "en-US")}</td>
                        <td className="p-3">
                          <RowMenu
                            lang={lang}
                            onView={() => setDetailId(r.id)}
                            onEdit={() => { setEditing(r); setShowForm(true); }}
                            onDuplicate={() => dupMut.mutate(r.id)}
                            onToggleStatus={() => statusMut.mutate({ id: r.id, status: r.status === "active" ? "hidden" : "active" })}
                            onArchive={() => statusMut.mutate({ id: r.id, status: "archived" })}
                            onDelete={() => setConfirmDel(r)}
                            isActive={r.status === "active"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-xs text-neutral-400">
                <div>{t(lang, "الإجمالي", "Total")}: <span className="text-white">{list.data.total}</span></div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-white/10 p-1.5 disabled:opacity-30 hover:bg-white/5"
                  >{lang === "ar" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
                  <span>{page} / {Math.max(1, Math.ceil(list.data.total / pageSize))}</span>
                  <button
                    disabled={page >= Math.ceil(list.data.total / pageSize)}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-md border border-white/10 p-1.5 disabled:opacity-30 hover:bg-white/5"
                  >{lang === "ar" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Import feedback */}
        {importMut.data && (
          <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {t(lang, "تم استيراد", "Imported")} {importMut.data.imported} · {importMut.data.errors.length ? `${t(lang, "أخطاء", "errors")}: ${importMut.data.errors.length}` : t(lang, "بدون أخطاء", "no errors")}
          </div>
        )}
      </div>

      {showForm && (
        <ItemForm
          lang={lang}
          initial={editing}
          meta={meta.data}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={(payload) => upsertMut.mutate(payload)}
          saving={upsertMut.isPending}
          error={upsertMut.error instanceof Error ? upsertMut.error.message : null}
        />
      )}

      {detailId && (
        <ItemDetail lang={lang} id={detailId} fetchDetail={detailFn} onClose={() => setDetailId(null)} />
      )}

      {confirmDel && (
        <ConfirmDelete
          lang={lang}
          name={lang === "ar" ? confirmDel.name_ar : (confirmDel.name_en || confirmDel.name_ar)}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => delMut.mutate(confirmDel.id)}
          loading={delMut.isPending}
        />
      )}
    </OwnerShell>
  );
}

function toggleSort(cur: string, curDir: "asc" | "desc", setBy: any, setDir: any, next: string) {
  if (cur === next) setDir(curDir === "asc" ? "desc" : "asc");
  else { setBy(next); setDir("desc"); }
}

/* ────────── shared UI ────────── */

function StatBox({ label, value, icon, tone }: { label: string; value: number | string; icon: React.ReactNode; tone: "amber" | "emerald" | "sky" | "violet" }) {
  const tones: Record<string, string> = {
    amber: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    emerald: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    sky: "border-sky-400/40 bg-sky-500/10 text-sky-300",
    violet: "border-violet-400/40 bg-violet-500/10 text-violet-300",
  };
  return (
    <div className="rounded-xl border border-amber-500/10 bg-white/[0.02] p-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-neutral-500">{label}</div>
          <div className="mt-1 text-xl font-bold">{value}</div>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

function Select({ value, onChange, children, label }: { value: string; onChange: (v: string) => void; children: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</span>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-neutral-200 outline-none focus:border-amber-400/40"
      >{children}</select>
    </div>
  );
}

function Th({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <th className="p-3 text-start">
      <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-amber-300">
        {label} <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}

function RowMenu({ lang, isActive, onView, onEdit, onDuplicate, onToggleStatus, onArchive, onDelete }: any) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [open]);
  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }} className="rounded-md border border-white/10 p-1.5 hover:bg-white/5"><MoreHorizontal className="h-4 w-4" /></button>
      {open && (
        <div className={`absolute z-30 mt-1 w-44 rounded-lg border border-white/10 bg-[#0a0b16] p-1 text-xs shadow-lg ${lang === "ar" ? "left-0" : "right-0"}`}>
          <MItem icon={<Eye className="h-3.5 w-3.5" />} label={t(lang, "عرض", "View")} onClick={onView} />
          <MItem icon={<Pencil className="h-3.5 w-3.5" />} label={t(lang, "تعديل", "Edit")} onClick={onEdit} />
          <MItem icon={<Copy className="h-3.5 w-3.5" />} label={t(lang, "نسخ", "Duplicate")} onClick={onDuplicate} />
          <MItem icon={isActive ? <EyeOff className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />} label={isActive ? t(lang, "إخفاء", "Hide") : t(lang, "تفعيل", "Activate")} onClick={onToggleStatus} />
          <MItem icon={<Archive className="h-3.5 w-3.5" />} label={t(lang, "أرشفة", "Archive")} onClick={onArchive} />
          <div className="my-1 h-px bg-white/5" />
          <MItem icon={<Trash2 className="h-3.5 w-3.5" />} label={t(lang, "حذف", "Delete")} onClick={onDelete} danger />
        </div>
      )}
    </div>
  );
}

function MItem({ icon, label, onClick, danger }: any) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start ${danger ? "text-red-300 hover:bg-red-500/10" : "text-neutral-200 hover:bg-white/5"}`}
    >{icon}{label}</button>
  );
}

function ConfirmDelete({ lang, name, onCancel, onConfirm, loading }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#0a0b16] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 text-red-300"><AlertTriangle className="h-5 w-5" /><h3 className="font-bold">{t(lang, "تأكيد الحذف", "Confirm delete")}</h3></div>
        <p className="mt-3 text-sm text-neutral-300">{t(lang, "سيتم حذف", "About to delete")} <span className="font-semibold text-white">{name}</span> {t(lang, "نهائياً بجميع أسعاره ومزاياه.", "permanently with all its prices and features.")}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5">{t(lang, "إلغاء", "Cancel")}</button>
          <button onClick={onConfirm} disabled={loading} className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400 disabled:opacity-60">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{t(lang, "حذف", "Delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────── form modal ────────── */

type FormPrice = {
  id?: string; price_code: string; name_ar: string; name_en: string; currency: string; amount: number;
  billing_type: (typeof BILLING_TYPES)[number]; billing_interval: (typeof BILLING_INTERVALS)[number] | "";
  interval_count: number; trial_days: number; setup_fee: number; tax_rate: number;
  tax_behavior: (typeof TAX_BEHAVIORS)[number]; is_default: boolean; is_active: boolean;
};
type FormFeature = { id?: string; name_ar: string; name_en: string; value_text: string; included: boolean; display_order: number };

function ItemForm({ lang, initial, meta, onClose, onSave, saving, error }: any) {
  const isEdit = !!initial;
  const [tab, setTab] = useState<"basic" | "pricing" | "features" | "providers" | "integration">("basic");

  const [siteId, setSiteId] = useState<string>(initial?.site_id ?? "");
  const [categoryId, setCategoryId] = useState<string>(initial?.category_id ?? "");
  const [itemCode, setItemCode] = useState<string>(initial?.item_code ?? genCode("P"));
  const [itemType, setItemType] = useState<(typeof ITEM_TYPES)[number]>((initial?.item_type as any) ?? "product");
  const [nameAr, setNameAr] = useState<string>(initial?.name_ar ?? "");
  const [nameEn, setNameEn] = useState<string>(initial?.name_en ?? "");
  const [slug, setSlug] = useState<string>(initial?.slug ?? "");
  const [shortAr, setShortAr] = useState<string>(initial?.short_description_ar ?? "");
  const [shortEn, setShortEn] = useState<string>(initial?.short_description_en ?? "");
  const [descAr, setDescAr] = useState<string>(initial?.description_ar ?? "");
  const [descEn, setDescEn] = useState<string>(initial?.description_en ?? "");
  const [image, setImage] = useState<string>(initial?.image_url ?? "");
  const [status, setStatus] = useState<(typeof ITEM_STATUSES)[number]>((initial?.status as any) ?? "draft");
  const [isPublic, setIsPublic] = useState<boolean>(initial?.is_public ?? true);
  const [requiresApproval, setRequiresApproval] = useState<boolean>(initial?.requires_approval ?? false);
  const [metaJson, setMetaJson] = useState<string>(JSON.stringify(initial?.metadata ?? {}, null, 2));
  const [metaJsonErr, setMetaJsonErr] = useState<string | null>(null);

  const [prices, setPrices] = useState<FormPrice[]>(initial?.__prices ?? [{
    price_code: `${itemCode}-DEFAULT`, name_ar: "", name_en: "", currency: "MAD", amount: 0,
    billing_type: "one_time", billing_interval: "", interval_count: 1, trial_days: 0,
    setup_fee: 0, tax_rate: 0, tax_behavior: "exclusive", is_default: true, is_active: true,
  }]);
  const [features, setFeatures] = useState<FormFeature[]>(initial?.__features ?? []);
  const [providers, setProviders] = useState<{ provider_id: string; is_enabled: boolean; is_default: boolean }[]>(initial?.__providers ?? []);

  // On edit, hydrate prices/features/providers from server if missing
  const detailFn = useServerFn(getCatalogItemDetail);
  useEffect(() => {
    if (isEdit && initial?.id && !initial.__prices) {
      detailFn({ data: { id: initial.id } }).then((d: any) => {
        if (d.prices?.length) setPrices(d.prices.map((p: any) => ({
          id: p.id, price_code: p.price_code, name_ar: p.name_ar ?? "", name_en: p.name_en ?? "",
          currency: p.currency, amount: Number(p.amount ?? 0), billing_type: p.billing_type,
          billing_interval: p.billing_interval ?? "", interval_count: p.interval_count ?? 1,
          trial_days: p.trial_days ?? 0, setup_fee: Number(p.setup_fee ?? 0), tax_rate: Number(p.tax_rate ?? 0),
          tax_behavior: p.tax_behavior ?? "exclusive", is_default: !!p.is_default, is_active: !!p.is_active,
        })));
        if (d.features?.length) setFeatures(d.features.map((f: any) => ({
          id: f.id, name_ar: f.name_ar, name_en: f.name_en ?? "", value_text: f.value_text ?? "",
          included: f.included, display_order: f.display_order ?? 0,
        })));
        if (d.providers?.length) setProviders(d.providers.map((p: any) => ({
          provider_id: p.provider_id, is_enabled: p.is_enabled, is_default: p.is_default,
        })));
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = () => {
    let metadata: any = {};
    if (metaJson.trim()) {
      try { metadata = JSON.parse(metaJson); setMetaJsonErr(null); }
      catch (e) { setMetaJsonErr(t(lang, "JSON غير صالح", "Invalid JSON")); setTab("integration"); return; }
    }
    if (!siteId) { setTab("basic"); return; }
    if (!nameAr) { setTab("basic"); return; }
    onSave({
      id: initial?.id, site_id: siteId, category_id: categoryId || null, item_code: itemCode,
      item_type: itemType, name_ar: nameAr, name_en: nameEn, slug, short_description_ar: shortAr,
      short_description_en: shortEn, description_ar: descAr, description_en: descEn, image_url: image,
      status, is_public: isPublic, requires_approval: requiresApproval, metadata,
      prices: prices.map((p) => ({ ...p, billing_interval: p.billing_interval || null })),
      features, providers,
    });
  };

  const filteredCats = (meta?.categories ?? []).filter((c: any) => !siteId || c.site_id === siteId);
  const siteProviders = (meta?.providers ?? []).filter((p: any) => p.is_enabled);

  const Tab = ({ id, label }: any) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-lg px-3 py-1.5 text-xs ${tab === id ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}`}
    >{label}</button>
  );

  const inputCls = "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:border-amber-400/40";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4" onClick={onClose}>
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="my-8 w-full max-w-4xl rounded-2xl border border-amber-500/20 bg-[#0a0b16] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold">{isEdit ? t(lang, "تعديل عنصر", "Edit item") : t(lang, "إضافة عنصر", "Add item")}</h2>
            <p className="text-xs text-neutral-500">{t(lang, "الكتالوج المركزي", "Central catalog")}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-neutral-400 hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-4 flex flex-wrap gap-1 border-b border-white/5 pb-3">
          <Tab id="basic" label={t(lang, "المعلومات الأساسية", "Basics")} />
          <Tab id="pricing" label={t(lang, "التسعير", "Pricing")} />
          <Tab id="features" label={t(lang, "المزايا", "Features")} />
          <Tab id="providers" label={t(lang, "وسائل الدفع", "Providers")} />
          <Tab id="integration" label={t(lang, "التكامل", "Integration")} />
        </div>

        <div className="mt-4 space-y-4">
          {tab === "basic" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label={t(lang, "الموقع *", "Site *")}>
                <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  {(meta?.sites ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name} · {s.domain}</option>)}
                </select>
              </Field>
              <Field label={t(lang, "الفئة", "Category")}>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  {filteredCats.map((c: any) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                </select>
              </Field>
              <Field label={t(lang, "الكود", "Code")}>
                <div className="flex gap-1">
                  <input value={itemCode} onChange={(e) => setItemCode(e.target.value)} className={inputCls} />
                  <button onClick={() => setItemCode(genCode(itemType[0].toUpperCase()))} className="rounded-lg border border-white/10 px-2 text-xs text-neutral-300 hover:bg-white/5">↻</button>
                </div>
              </Field>
              <Field label={t(lang, "النوع", "Type")}>
                <select value={itemType} onChange={(e) => setItemType(e.target.value as any)} className={inputCls}>
                  {ITEM_TYPES.map((tp) => <option key={tp} value={tp}>{TYPE_LABEL[tp][lang]}</option>)}
                </select>
              </Field>
              <Field label={t(lang, "الاسم بالعربية *", "Name (AR) *")}>
                <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t(lang, "الاسم بالإنجليزية", "Name (EN)")}>
                <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t(lang, "المعرف (slug)", "Slug")}>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} placeholder="e.g. premium-plan" />
              </Field>
              <Field label={t(lang, "الحالة", "Status")}>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={inputCls}>
                  {ITEM_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s][lang]}</option>)}
                </select>
              </Field>
              <Field label={t(lang, "وصف مختصر (AR)", "Short description (AR)")} full>
                <input value={shortAr} onChange={(e) => setShortAr(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t(lang, "وصف مختصر (EN)", "Short description (EN)")} full>
                <input value={shortEn} onChange={(e) => setShortEn(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t(lang, "الوصف الكامل (AR)", "Description (AR)")} full>
                <textarea value={descAr} onChange={(e) => setDescAr(e.target.value)} rows={3} className={inputCls} />
              </Field>
              <Field label={t(lang, "الوصف الكامل (EN)", "Description (EN)")} full>
                <textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={3} className={inputCls} />
              </Field>
              <Field label={t(lang, "رابط الصورة", "Image URL")} full>
                <input value={image} onChange={(e) => setImage(e.target.value)} className={inputCls} placeholder="https://…" />
              </Field>
              <div className="md:col-span-2 flex flex-wrap items-center gap-4 text-xs">
                <Toggle checked={isPublic} onChange={setIsPublic} label={t(lang, "يظهر للعامة", "Public")} />
                <Toggle checked={requiresApproval} onChange={setRequiresApproval} label={t(lang, "يحتاج موافقة", "Requires approval")} />
              </div>
            </div>
          )}

          {tab === "pricing" && (
            <div className="space-y-3">
              {prices.map((p, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold text-amber-300">#{i + 1} {p.name_ar || p.price_code}</div>
                    <div className="flex items-center gap-2">
                      <Toggle checked={p.is_default} onChange={(v) => setPrices((s) => s.map((x, idx) => ({ ...x, is_default: idx === i ? v : (v ? false : x.is_default) })))} label={t(lang, "افتراضي", "Default")} />
                      <Toggle checked={p.is_active} onChange={(v) => setPrices((s) => s.map((x, idx) => idx === i ? { ...x, is_active: v } : x))} label={t(lang, "نشط", "Active")} />
                      <button onClick={() => setPrices((s) => s.filter((_, idx) => idx !== i))} className="rounded-md p-1 text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <input placeholder={t(lang, "كود السعر", "Price code")} value={p.price_code} onChange={(e) => setPrices((s) => s.map((x, idx) => idx === i ? { ...x, price_code: e.target.value } : x))} className={inputCls} />
                    <input placeholder={t(lang, "الاسم (AR)", "Name (AR)")} value={p.name_ar} onChange={(e) => setPrices((s) => s.map((x, idx) => idx === i ? { ...x, name_ar: e.target.value } : x))} className={inputCls} />
                    <input placeholder="MAD" maxLength={3} value={p.currency} onChange={(e) => setPrices((s) => s.map((x, idx) => idx === i ? { ...x, currency: e.target.value.toUpperCase() } : x))} className={inputCls} />
                    <input type="number" step="0.01" placeholder={t(lang, "المبلغ", "Amount")} value={p.amount} onChange={(e) => setPrices((s) => s.map((x, idx) => idx === i ? { ...x, amount: Number(e.target.value) } : x))} className={inputCls} />
                    <select value={p.billing_type} onChange={(e) => setPrices((s) => s.map((x, idx) => idx === i ? { ...x, billing_type: e.target.value as any } : x))} className={inputCls}>
                      {BILLING_TYPES.map((b) => <option key={b} value={b}>{BILLING_LABEL[b][lang]}</option>)}
                    </select>
                    {p.billing_type === "recurring" && (
                      <>
                        <select value={p.billing_interval} onChange={(e) => setPrices((s) => s.map((x, idx) => idx === i ? { ...x, billing_interval: e.target.value as any } : x))} className={inputCls}>
                          <option value="">—</option>
                          {BILLING_INTERVALS.map((iv) => <option key={iv} value={iv}>{iv}</option>)}
                        </select>
                        <input type="number" min={1} placeholder={t(lang, "كل كم فترة", "Every N")} value={p.interval_count} onChange={(e) => setPrices((s) => s.map((x, idx) => idx === i ? { ...x, interval_count: Number(e.target.value) } : x))} className={inputCls} />
                        <input type="number" min={0} placeholder={t(lang, "أيام التجربة", "Trial days")} value={p.trial_days} onChange={(e) => setPrices((s) => s.map((x, idx) => idx === i ? { ...x, trial_days: Number(e.target.value) } : x))} className={inputCls} />
                      </>
                    )}
                    <input type="number" step="0.01" placeholder={t(lang, "رسوم الإعداد", "Setup fee")} value={p.setup_fee} onChange={(e) => setPrices((s) => s.map((x, idx) => idx === i ? { ...x, setup_fee: Number(e.target.value) } : x))} className={inputCls} />
                    <input type="number" step="0.01" placeholder={t(lang, "الضريبة %", "Tax %")} value={p.tax_rate} onChange={(e) => setPrices((s) => s.map((x, idx) => idx === i ? { ...x, tax_rate: Number(e.target.value) } : x))} className={inputCls} />
                    <select value={p.tax_behavior} onChange={(e) => setPrices((s) => s.map((x, idx) => idx === i ? { ...x, tax_behavior: e.target.value as any } : x))} className={inputCls}>
                      {TAX_BEHAVIORS.map((tb) => <option key={tb} value={tb}>{tb}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <button onClick={() => setPrices((s) => [...s, {
                price_code: `${itemCode}-${s.length + 1}`, name_ar: "", name_en: "", currency: "MAD", amount: 0,
                billing_type: "one_time", billing_interval: "", interval_count: 1, trial_days: 0,
                setup_fee: 0, tax_rate: 0, tax_behavior: "exclusive", is_default: s.length === 0, is_active: true,
              }])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-neutral-300 hover:bg-white/5">
                <Plus className="h-3.5 w-3.5" /> {t(lang, "إضافة سعر", "Add price")}
              </button>
            </div>
          )}

          {tab === "features" && (
            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
                  <input placeholder={t(lang, "الاسم (AR)", "Name (AR)")} value={f.name_ar} onChange={(e) => setFeatures((s) => s.map((x, idx) => idx === i ? { ...x, name_ar: e.target.value } : x))} className={inputCls} />
                  <input placeholder={t(lang, "الاسم (EN)", "Name (EN)")} value={f.name_en} onChange={(e) => setFeatures((s) => s.map((x, idx) => idx === i ? { ...x, name_en: e.target.value } : x))} className={inputCls} />
                  <input placeholder={t(lang, "القيمة", "Value")} value={f.value_text} onChange={(e) => setFeatures((s) => s.map((x, idx) => idx === i ? { ...x, value_text: e.target.value } : x))} className={inputCls} />
                  <Toggle checked={f.included} onChange={(v) => setFeatures((s) => s.map((x, idx) => idx === i ? { ...x, included: v } : x))} label={t(lang, "مشمول", "Included")} />
                  <button onClick={() => setFeatures((s) => s.filter((_, idx) => idx !== i))} className="rounded-md p-1 text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <button onClick={() => setFeatures((s) => [...s, { name_ar: "", name_en: "", value_text: "", included: true, display_order: s.length }])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-neutral-300 hover:bg-white/5">
                <Plus className="h-3.5 w-3.5" /> {t(lang, "إضافة ميزة", "Add feature")}
              </button>
            </div>
          )}

          {tab === "providers" && (
            <div className="space-y-2">
              <p className="text-xs text-neutral-500">{t(lang, "المزودون المفعّلون على مستوى النظام:", "Providers enabled at system level:")}</p>
              {siteProviders.length === 0 && <p className="text-xs text-amber-300">{t(lang, "لا يوجد مزودون مفعّلون. فعّل مزوداً من صفحة Payment Providers أولاً.", "No enabled providers. Enable one from Payment Providers first.")}</p>}
              {siteProviders.map((prov: any) => {
                const link = providers.find((p) => p.provider_id === prov.id);
                return (
                  <div key={prov.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    <div>
                      <div className="text-sm font-semibold">{prov.display_name}</div>
                      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{prov.code}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={!!link?.is_enabled}
                        onChange={(v) => setProviders((s) => {
                          const others = s.filter((p) => p.provider_id !== prov.id);
                          return v ? [...others, { provider_id: prov.id, is_enabled: true, is_default: link?.is_default ?? false }] : others;
                        })}
                        label={t(lang, "مفعّل", "Enabled")}
                      />
                      <Toggle
                        checked={!!link?.is_default}
                        onChange={(v) => setProviders((s) => s.map((p) => ({ ...p, is_default: p.provider_id === prov.id ? v : (v ? false : p.is_default) })))}
                        label={t(lang, "افتراضي", "Default")}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "integration" && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <ReadOnly label="site_id" value={siteId || "—"} />
                <ReadOnly label="catalog_item_id" value={initial?.id ?? t(lang, "(بعد الحفظ)", "(after save)")} />
                <ReadOnly label="default_price_id" value={initial?.__prices?.find((p: any) => p.is_default)?.id ?? "—"} />
                <ReadOnly label="checkout URL" value={initial?.id ? `/checkout/${initial.id}` : "—"} />
              </div>
              <Field label={t(lang, "metadata (JSON)", "metadata (JSON)")} full>
                <textarea value={metaJson} onChange={(e) => { setMetaJson(e.target.value); setMetaJsonErr(null); }} rows={6} className={`${inputCls} font-mono text-xs`} />
                {metaJsonErr && <p className="mt-1 text-xs text-red-400">{metaJsonErr}</p>}
              </Field>
            </div>
          )}
        </div>

        {error && <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-2 border-t border-white/5 pt-4">
          <button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5">{t(lang, "إلغاء", "Cancel")}</button>
          <button onClick={submit} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-60">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t(lang, "حفظ", "Save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-neutral-500">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-neutral-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5 accent-amber-500" />
      {label}
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-2">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-0.5 truncate font-mono text-xs text-neutral-200">{value}</div>
    </div>
  );
}

/* ────────── detail modal ────────── */

function ItemDetail({ lang, id, fetchDetail, onClose }: any) {
  const q = useQuery({ queryKey: ["catalog-central-detail", id], queryFn: () => fetchDetail({ data: { id } }) });
  const d = q.data;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4" onClick={onClose}>
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="my-8 w-full max-w-4xl rounded-2xl border border-amber-500/20 bg-[#0a0b16] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold">{t(lang, "تفاصيل العنصر", "Item details")}</h2>
            {d?.item && <p className="text-xs text-amber-300">{d.item.item_code} · {d.item.name_ar}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-neutral-400 hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        {q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-neutral-500" /></div>
        ) : q.isError ? (
          <p className="mt-4 text-sm text-red-400">{(q.error as Error).message}</p>
        ) : d ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Section title={t(lang, "الأسعار", "Prices")} count={d.prices.length}>
              {d.prices.length ? d.prices.map((p: any) => (
                <div key={p.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{p.name_ar || p.price_code}</span>
                    <span className="text-amber-300">{Number(p.amount).toFixed(2)} {p.currency}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-neutral-500">{BILLING_LABEL[p.billing_type]?.[lang]}{p.billing_interval ? ` · ${p.billing_interval}` : ""}{p.is_default ? " · ★" : ""}</div>
                </div>
              )) : <Empty lang={lang} />}
            </Section>
            <Section title={t(lang, "الخطط المرتبطة", "Linked plans")} count={d.plans.length}>
              {d.plans.length ? d.plans.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-2 text-xs">
                  <span>{p.name}</span>
                  <span className="text-amber-300">{Number(p.amount).toFixed(2)} {p.currency}</span>
                </div>
              )) : <Empty lang={lang} />}
            </Section>
            <Section title={t(lang, "المزايا", "Features")} count={d.features.length}>
              {d.features.length ? d.features.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-2 text-xs">
                  <span className={f.included ? "" : "line-through text-neutral-500"}>{f.name_ar}</span>
                  <span className="text-neutral-400">{f.value_text ?? ""}</span>
                </div>
              )) : <Empty lang={lang} />}
            </Section>
            <Section title={t(lang, "وسائل الدفع", "Providers")} count={d.providers.length}>
              {d.providers.length ? d.providers.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-2 text-xs">
                  <span>{p.payment_providers?.display_name ?? p.provider_id}</span>
                  <span className="text-neutral-500">{p.is_enabled ? "✓" : "✗"}{p.is_default ? " ★" : ""}</span>
                </div>
              )) : <Empty lang={lang} />}
            </Section>
            <Section title={t(lang, "الاشتراكات", "Subscriptions")} count={d.subscriptions.length}>
              {d.subscriptions.length ? d.subscriptions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-2 text-[11px]">
                  <span className="truncate">{s.id.slice(0, 8)}</span>
                  <span className="text-neutral-400">{s.status}</span>
                </div>
              )) : <Empty lang={lang} />}
            </Section>
            <Section title={`${t(lang, "المدفوعات", "Payments")} · ${t(lang, "الإيراد", "Revenue")}: ${d.revenue.toFixed(2)}`} count={d.payments.length}>
              {d.payments.length ? d.payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-2 text-[11px]">
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  <span className="text-amber-300">{Number(p.amount).toFixed(2)} {p.currency}</span>
                  <span className="text-neutral-400">{p.status}</span>
                </div>
              )) : <Empty lang={lang} />}
            </Section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-amber-300">{title}</span>
        <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-neutral-400">{count}</span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Empty({ lang }: { lang: Lang }) {
  return <div className="rounded-lg border border-dashed border-white/10 p-3 text-center text-[11px] text-neutral-500">{t(lang, "لا يوجد", "None")}</div>;
}
