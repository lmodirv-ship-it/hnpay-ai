import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell, Card, Section, Badge } from "@/components/admin/AdminShell";
import { listFinancialProjects, type FinancialProjectRow } from "@/lib/hn-pay/financial-projects.functions";
import { CheckCircle2, XCircle, Search, Download, Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/financial-projects")({
  ssr: false,
  head: () => ({ meta: [{ title: "المشاريع المالية · HN-PAY" }] }),
  component: FinancialProjectsPage,
});

function Bool({ v }: { v: boolean }) {
  return v ? <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-400" /> : <XCircle className="mx-auto h-4 w-4 text-neutral-600" />;
}

function FinancialProjectsPage() {
  const listFn = useServerFn(listFinancialProjects);
  const { data = [], isLoading } = useQuery<FinancialProjectRow[]>({
    queryKey: ["hn-pay", "financial-projects"],
    queryFn: () => listFn() as Promise<FinancialProjectRow[]>,
  });

  const [q, setQ] = useState("");
  const [envFilter, setEnvFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");

  const projects = useMemo(() => {
    const m = new Map<string, string>();
    data.forEach((r) => m.set(r.project_id, r.project_name));
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [data]);

  const rows = useMemo(() => {
    return data.filter((r) => {
      if (envFilter && r.environment !== envFilter) return false;
      if (projectFilter && r.project_id !== projectFilter) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!r.domain.toLowerCase().includes(s) && !r.project_name.toLowerCase().includes(s) && !r.project_code.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [data, q, envFilter, projectFilter]);

  const totals = useMemo(() => {
    return rows.reduce(
      (a, r) => {
        a.sales += r.sales_count;
        a.revenue += r.total_revenue;
        a.customers += r.customers_count;
        return a;
      },
      { sales: 0, revenue: 0, customers: 0 },
    );
  }, [rows]);

  function exportCSV() {
    const headers = [
      "product_id","product_code","project_name","project_id","site_id","domain","service_type","billing_type",
      "default_provider","allow_subscription","is_renewable","is_taxable","visible_in_store","requires_approval",
      "display_order","keywords","sales_count","total_revenue","customers_count","environment","verification"
    ];
    const lines = [headers.join(",")];
    rows.forEach((r) => {
      lines.push([
        r.product_id ?? "", r.product_code ?? "", r.project_name, r.project_id, r.site_id ?? "", r.domain,
        r.service_type ?? "", r.billing_type ?? "", r.default_provider_name ?? "",
        r.allow_subscription, r.is_renewable, r.is_taxable, r.visible_in_store, r.requires_approval,
        r.display_order, (r.keywords ?? "").replace(/,/g, ";"),
        r.sales_count, r.total_revenue, r.customers_count, r.environment, r.verification_status,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `financial-projects-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell
      title="المشاريع المالية"
      subtitle="جميع النطاقات والمواقع المالية للمجموعة في جدول موحّد"
      actions={
        <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 hover:bg-amber-500/20">
          <Download className="h-4 w-4" /> تصدير CSV
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><Section title="إجمالي المواقع"><div className="text-2xl font-bold text-white">{data.length}</div></Section></Card>
        <Card><Section title="مواقع مطابقة للفلتر"><div className="text-2xl font-bold text-white">{rows.length}</div></Section></Card>
        <Card><Section title="إجمالي المبيعات"><div className="text-2xl font-bold text-white">{totals.sales}</div></Section></Card>
        <Card><Section title="إجمالي الإيرادات"><div className="text-2xl font-bold text-amber-300">{totals.revenue.toLocaleString()}</div></Section></Card>
      </div>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 p-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث بالنطاق أو المشروع..."
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 pr-9 text-xs text-white placeholder:text-neutral-500 focus:border-amber-400/40 focus:outline-none"
            />
          </div>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white">
            <option value="">كل المشاريع</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={envFilter} onChange={(e) => setEnvFilter(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white">
            <option value="">كل البيئات</option>
            <option value="production">production</option>
            <option value="staging">staging</option>
            <option value="development">development</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-[11px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-2 py-2">معرف المنتج</th>
                <th className="px-2 py-2">اسم المشروع</th>
                <th className="px-2 py-2">معرف المشروع</th>
                <th className="px-2 py-2">معرف الموقع</th>
                <th className="px-2 py-2">النطاق</th>
                <th className="px-2 py-2">نوع الخدمة</th>
                <th className="px-2 py-2">نوع الفوترة</th>
                <th className="px-2 py-2">مزود الدفع</th>
                <th className="px-2 py-2 text-center">اشتراك</th>
                <th className="px-2 py-2 text-center">تجديد</th>
                <th className="px-2 py-2 text-center">ضريبة</th>
                <th className="px-2 py-2 text-center">في المتجر</th>
                <th className="px-2 py-2 text-center">موافقة</th>
                <th className="px-2 py-2 text-center">الترتيب</th>
                <th className="px-2 py-2">الكلمات المفتاحية</th>
                <th className="px-2 py-2 text-center">مبيعات</th>
                <th className="px-2 py-2 text-center">إيرادات</th>
                <th className="px-2 py-2 text-center">عملاء</th>
                <th className="px-2 py-2 text-center">البيئة</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={19} className="px-4 py-8 text-center text-neutral-500">جارٍ التحميل...</td></tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={19} className="px-4 py-8 text-center text-neutral-500">لا توجد نتائج</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.domain_id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-2 py-2 font-mono text-[10px] text-amber-300">{r.product_code ?? "—"}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {r.brand_color && <span className="h-2 w-2 rounded-full" style={{ background: r.brand_color }} />}
                      <span className="font-medium text-white">{r.project_name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 font-mono text-[10px] text-neutral-400">{r.project_code}</td>
                  <td className="px-2 py-2 font-mono text-[10px] text-neutral-500">{r.site_id ? r.site_id.slice(0, 8) : "—"}</td>
                  <td className="px-2 py-2">
                    <a href={`https://${r.domain}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-300 hover:underline">
                      <Globe className="h-3 w-3" />{r.domain}
                    </a>
                    {r.is_primary && <span className="mr-1"><Badge tone="amber">أساسي</Badge></span>}
                  </td>
                  <td className="px-2 py-2">{r.service_type ?? "—"}</td>
                  <td className="px-2 py-2">{r.billing_type ?? "—"}</td>
                  <td className="px-2 py-2">{r.default_provider_name ?? "—"}</td>
                  <td className="px-2 py-2"><Bool v={r.allow_subscription} /></td>
                  <td className="px-2 py-2"><Bool v={r.is_renewable} /></td>
                  <td className="px-2 py-2"><Bool v={r.is_taxable} /></td>
                  <td className="px-2 py-2"><Bool v={r.visible_in_store} /></td>
                  <td className="px-2 py-2"><Bool v={r.requires_approval} /></td>
                  <td className="px-2 py-2 text-center">{r.display_order}</td>
                  <td className="max-w-[160px] truncate px-2 py-2 text-neutral-400" title={r.keywords ?? ""}>{r.keywords ?? "—"}</td>
                  <td className="px-2 py-2 text-center">{r.sales_count}</td>
                  <td className="px-2 py-2 text-center">{r.total_revenue.toLocaleString()} {r.default_currency}</td>
                  <td className="px-2 py-2 text-center">{r.customers_count}</td>
                  <td className="px-2 py-2 text-center">
                    <Badge tone={r.environment === "production" ? "green" : "neutral"}>{r.environment}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
}
