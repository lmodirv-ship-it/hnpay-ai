import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, StatCard, Card, Section, Badge, EmptyState } from "@/components/admin/AdminShell";
import {
  Wallet, RefreshCw, Users, CreditCard, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, XCircle, Globe, Webhook, Plus, Link2, FileText, PlayCircle, DollarSign,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "مركز القيادة · HN-PAY" }] }),
  component: OverviewPage,
});

type Range = "7d" | "30d" | "90d";

function OverviewPage() {
  const [range, setRange] = useState<Range>("30d");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [sites, setSites] = useState<any[]>([]);
  const [projectsById, setProjectsById] = useState<Record<string, any>>({});
  const [domainsByProject, setDomainsByProject] = useState<Record<string, string[]>>({});
  const [providers, setProviders] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<{ level: "critical" | "warn" | "info"; title: string; desc?: string }[]>([]);
  const [webhookStats, setWebhookStats] = useState({ total: 0, ok: 0, fail: 0, pending: 0 });
  const [series, setSeries] = useState<{ d: string; v: number; prev: number }[]>([]);
  const [kpi, setKpi] = useState({
    today: 0, month: 0, total: 0, mrr: 0, arr: 0, activeSubs: 0, trialing: 0,
    succeeded: 0, failed: 0, refunded: 0, refundAmount: 0, churnRate: 0,
    aov: 0, net: 0, customers: 0, newCustomers: 0,
  });

  useEffect(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const from = new Date(Date.now() - days * 86400_000);
    const prevFrom = new Date(Date.now() - 2 * days * 86400_000);
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    (async () => {
      const [
        sitesQ, provQ, paysAllQ, paysPrevQ, paysMonthQ, paysTodayQ, paysTotalQ,
        subsQ, subsCanceledQ, custsAllQ, custsNewQ, recentQ, whQ, upcomingQ,
      ] = await Promise.all([
        supabase.from("sites").select("id, name, domain, slug, enabled_providers, is_active, is_group_site, project_id, environment, integration_status").order("created_at", { ascending: true }),
        supabase.from("payment_providers").select("*").order("is_default", { ascending: false }),
        supabase.from("payments").select("amount, currency, status, created_at, site_id, provider").gte("created_at", from.toISOString()),
        supabase.from("payments").select("amount, status").gte("created_at", prevFrom.toISOString()).lt("created_at", from.toISOString()),
        supabase.from("payments").select("amount").eq("status", "succeeded").gte("created_at", startOfMonth.toISOString()),
        supabase.from("payments").select("amount").eq("status", "succeeded").gte("created_at", startOfDay.toISOString()),
        supabase.from("payments").select("amount").eq("status", "succeeded"),
        supabase.from("subscriptions").select("id, plan_id, status, current_period_end, site_id, customer_id").in("status", ["active", "trialing", "past_due"]),
        supabase.from("subscriptions").select("id").eq("status", "canceled").gte("updated_at", from.toISOString()),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }).gte("created_at", from.toISOString()),
        supabase.from("payments").select("id, public_id, amount, currency, status, provider, created_at, site_id, customer_email").order("created_at", { ascending: false }).limit(10),
        supabase.from("webhook_events").select("id, delivered, attempts, last_response_status, created_at, event_type, site_id").gte("created_at", from.toISOString()).order("created_at", { ascending: false }).limit(500),
        supabase.from("subscriptions").select("id, current_period_end, plan_id, customer_id, site_id, status").in("status", ["active", "trialing", "past_due"]).order("current_period_end", { ascending: true }).limit(10),
      ]);

      const sitesArr = sitesQ.data ?? [];
      setSites(sitesArr);
      setProviders(provQ.data ?? []);

      // Fetch projects + domains for interconnection view
      const projectIds = Array.from(new Set(sitesArr.map((s: any) => s.project_id).filter(Boolean)));
      if (projectIds.length) {
        const [projQ, domQ] = await Promise.all([
          supabase.from("hn_projects").select("id, code, name, status, portfolio_id").in("id", projectIds),
          supabase.from("project_domains").select("project_id, domain").in("project_id", projectIds),
        ]);
        const pmap: Record<string, any> = {};
        (projQ.data ?? []).forEach((p: any) => (pmap[p.id] = p));
        setProjectsById(pmap);
        const dmap: Record<string, string[]> = {};
        (domQ.data ?? []).forEach((d: any) => {
          (dmap[d.project_id] = dmap[d.project_id] ?? []).push(d.domain);
        });
        setDomainsByProject(dmap);
      }

      const filterFn = (r: any) => siteFilter === "all" || r.site_id === siteFilter;
      const pays = (paysAllQ.data ?? []).filter(filterFn);
      const succeeded = pays.filter((p) => p.status === "succeeded");
      const failed = pays.filter((p) => p.status === "failed");
      const refunded = pays.filter((p) => p.status === "refunded" || p.status === "partially_refunded");
      const totalRev = succeeded.reduce((s, p) => s + Number(p.amount ?? 0), 0);
      const refundAmt = refunded.reduce((s, p) => s + Number(p.amount ?? 0), 0);

      // MRR/ARR
      const activeSubs = (subsQ.data ?? []).filter(filterFn);
      const trialing = activeSubs.filter((s) => s.status === "trialing");
      const planIds = Array.from(new Set(activeSubs.map((s) => s.plan_id)));
      let mrr = 0;
      if (planIds.length) {
        const { data: plans } = await supabase.from("plans").select("id, amount, billing_interval").in("id", planIds);
        const byId: Record<string, { amount: number; interval: string | null }> = {};
        (plans ?? []).forEach((p: any) => (byId[p.id] = { amount: Number(p.amount), interval: p.billing_interval }));
        activeSubs.forEach((s) => {
          const p = byId[s.plan_id]; if (!p) return;
          if (p.interval === "year") mrr += p.amount / 12;
          else mrr += p.amount;
        });
      }

      const canceled = (subsCanceledQ.data ?? []).length;
      const churnRate = activeSubs.length + canceled > 0 ? (canceled / (activeSubs.length + canceled)) * 100 : 0;
      const aov = succeeded.length ? totalRev / succeeded.length : 0;

      setKpi({
        today: (paysTodayQ.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0),
        month: (paysMonthQ.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0),
        total: (paysTotalQ.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0),
        mrr, arr: mrr * 12,
        activeSubs: activeSubs.filter((s) => s.status === "active").length,
        trialing: trialing.length,
        succeeded: succeeded.length,
        failed: failed.length,
        refunded: refunded.length,
        refundAmount: refundAmt,
        churnRate,
        aov,
        net: totalRev - refundAmt,
        customers: custsAllQ.count ?? 0,
        newCustomers: custsNewQ.count ?? 0,
      });

      // Series with prev comparison
      const buckets: Record<string, { v: number; prev: number }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000); d.setHours(0, 0, 0, 0);
        buckets[d.toISOString().slice(0, 10)] = { v: 0, prev: 0 };
      }
      succeeded.forEach((p) => {
        const k = new Date(p.created_at).toISOString().slice(0, 10);
        if (k in buckets) buckets[k].v += Number(p.amount ?? 0);
      });
      (paysPrevQ.data ?? []).filter((p) => p.status === "succeeded").forEach((p: any) => {
        const idx = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400_000) - days;
        const d = new Date(Date.now() - (idx + days) * 86400_000); d.setHours(0, 0, 0, 0);
        const k = d.toISOString().slice(0, 10);
        if (k in buckets) buckets[k].prev += Number(p.amount ?? 0);
      });
      setSeries(Object.entries(buckets).map(([d, v]) => ({ d, ...v })));

      setRecent((recentQ.data ?? []).filter(filterFn));

      // Renewals — upcoming
      const upcoming = (upcomingQ.data ?? []).filter(filterFn);
      setRenewals(upcoming);

      // Webhook stats
      const wh = (whQ.data ?? []).filter(filterFn);
      setWebhookStats({
        total: wh.length,
        ok: wh.filter((w) => w.delivered).length,
        fail: wh.filter((w) => !w.delivered && (w.attempts ?? 0) > 0 && (w.last_response_status ?? 0) >= 400).length,
        pending: wh.filter((w) => !w.delivered && ((w.attempts ?? 0) === 0 || (w.last_response_status ?? 0) < 400)).length,
      });

      // Alerts
      const a: typeof alerts = [];
      const failedProv = (provQ.data ?? []).filter((p: any) => p.last_test_status === "fail");
      failedProv.forEach((p: any) => a.push({ level: "critical", title: `فشل اتصال مزود الدفع: ${p.display_name}`, desc: p.last_test_message ?? undefined }));
      if (failed.length > 0 && succeeded.length + failed.length > 0) {
        const rate = (failed.length / (failed.length + succeeded.length)) * 100;
        if (rate > 15) a.push({ level: "critical", title: `نسبة فشل المدفوعات مرتفعة (${rate.toFixed(1)}%)`, desc: `${failed.length} فاشلة من أصل ${failed.length + succeeded.length}` });
      }
      const whFail = wh.filter((w) => !w.delivered && (w.attempts ?? 0) > 2).length;
      if (whFail > 0) a.push({ level: "warn", title: `${whFail} Webhook فاشل في آخر ${days} يوم` });
      const inactiveSites = sitesArr.filter((s: any) => !s.is_active).length;
      if (inactiveSites) a.push({ level: "warn", title: `${inactiveSites} موقع غير نشط` });
      const pastDue = activeSubs.filter((s) => s.status === "past_due").length;
      if (pastDue) a.push({ level: "warn", title: `${pastDue} اشتراك متأخر عن الدفع` });
      if (!a.length) a.push({ level: "info", title: "كل شيء يعمل بشكل طبيعي" });
      setAlerts(a);
    })();
  }, [range, siteFilter]);

  const max = useMemo(() => Math.max(1, ...series.flatMap((s) => [s.v, s.prev])), [series]);
  const currRev = series.reduce((s, x) => s + x.v, 0);
  const prevRev = series.reduce((s, x) => s + x.prev, 0);
  const delta = prevRev > 0 ? ((currRev - prevRev) / prevRev) * 100 : 0;

  return (
    <AdminShell
      title="مركز القيادة"
      subtitle="نظرة شاملة على النظام المالي والتقني لمجموعة HN."
      actions={
        <div className="flex flex-wrap gap-2">
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-neutral-200"
          >
            <option value="all">كل المواقع</option>
            {sites.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
          <div className="inline-flex overflow-hidden rounded-lg border border-white/10 bg-black/40 text-xs">
            {(["7d", "30d", "90d"] as Range[]).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 ${range === r ? "bg-amber-500/20 text-amber-200" : "text-neutral-400 hover:text-white"}`}>
                {r === "7d" ? "7 أيام" : r === "30d" ? "30 يوم" : "90 يوم"}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {/* Quick actions */}
      <Section title="مهام سريعة">
        <div className="flex flex-wrap gap-2">
          <QuickBtn to="/admin/products" icon={<Globe className="h-3.5 w-3.5" />} label="إضافة موقع" />
          <QuickBtn to="/admin/plans" icon={<Plus className="h-3.5 w-3.5" />} label="إنشاء خطة" />
          <QuickBtn to="/admin/providers" icon={<Wallet className="h-3.5 w-3.5" />} label="مزود دفع" />
          <QuickBtn to="/admin/orders" icon={<Link2 className="h-3.5 w-3.5" />} label="رابط دفع" />
          <QuickBtn to="/admin/invoices" icon={<FileText className="h-3.5 w-3.5" />} label="إنشاء فاتورة" />
          <QuickBtn to="/admin/customers" icon={<Users className="h-3.5 w-3.5" />} label="إضافة عميل" />
          <QuickBtn to="/admin/integration" icon={<PlayCircle className="h-3.5 w-3.5" />} label="اختبار البوابة" />
          <QuickBtn to="/admin/reports" icon={<FileText className="h-3.5 w-3.5" />} label="تصدير تقرير" />
        </div>
      </Section>

      {/* KPI grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<Wallet className="h-5 w-5" />} label="إيرادات اليوم" value={fmt(kpi.today)} tone="amber" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="إيرادات الشهر" value={fmt(kpi.month)} tone="emerald" />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="إجمالي الإيرادات" value={fmt(kpi.total)} tone="emerald" />
        <StatCard icon={<RefreshCw className="h-5 w-5" />} label="MRR" value={fmt(kpi.mrr)} tone="sky" />
        <StatCard icon={<RefreshCw className="h-5 w-5" />} label="ARR" value={fmt(kpi.arr)} tone="sky" />
        <StatCard icon={<Users className="h-5 w-5" />} label="اشتراكات نشطة" value={kpi.activeSubs} hint={`${kpi.trialing} تجريبي`} tone="violet" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="مدفوعات ناجحة" value={kpi.succeeded} tone="emerald" />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="مدفوعات فاشلة" value={kpi.failed} tone="rose" />
        <StatCard icon={<Undo className="h-5 w-5" />} label="المسترجعات" value={fmt(kpi.refundAmount)} hint={`${kpi.refunded} عملية`} tone="rose" />
        <StatCard icon={<TrendingDown className="h-5 w-5" />} label="معدل الإلغاء" value={`${kpi.churnRate.toFixed(1)}%`} tone="rose" />
        <StatCard icon={<CreditCard className="h-5 w-5" />} label="متوسط العملية" value={fmt(kpi.aov)} tone="sky" />
        <StatCard icon={<Users className="h-5 w-5" />} label="العملاء" value={kpi.customers} hint={`+${kpi.newCustomers} جديد`} tone="violet" />
      </div>

      {/* Alerts + Chart */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title={`الإيرادات — الفترة الحالية مقارنة بالسابقة (${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%)`}>
            <Card>
              <div className="flex h-52 items-end gap-1">
                {series.map((s) => (
                  <div key={s.d} className="group relative flex-1">
                    <div className="absolute bottom-0 left-0 w-full rounded-t bg-neutral-700/40" style={{ height: `${(s.prev / max) * 100}%`, minHeight: 1 }} />
                    <div className="relative w-full rounded-t bg-gradient-to-t from-amber-500/80 to-amber-300/50 transition group-hover:from-amber-400"
                      style={{ height: `${(s.v / max) * 100}%`, minHeight: 2 }} title={`${s.d}: ${fmt(s.v)} (سابقًا ${fmt(s.prev)})`} />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-500">
                <span>{series[0]?.d ?? ""}</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" /> الحالية {fmt(currRev)}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-neutral-600" /> السابقة {fmt(prevRev)}</span>
                </div>
                <span>{series[series.length - 1]?.d ?? ""}</span>
              </div>
            </Card>
          </Section>
        </div>

        <div>
          <Section title="التنبيهات الحرجة">
            <Card className="space-y-2 p-3">
              {alerts.map((a, i) => {
                const tone = a.level === "critical" ? "border-rose-400/40 bg-rose-500/10 text-rose-200"
                  : a.level === "warn" ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                  : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
                return (
                  <div key={i} className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${tone}`}>
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold">{a.title}</div>
                      {a.desc && <div className="mt-0.5 text-[11px] opacity-80">{a.desc}</div>}
                    </div>
                  </div>
                );
              })}
            </Card>
          </Section>
        </div>
      </div>

      {/* Sites summary — full ecosystem view */}
      {(() => {
        const total = sites.length;
        const active = sites.filter((s) => s.is_active).length;
        const groupSites = sites.filter((s) => s.is_group_site).length;
        const linkedProjects = new Set(sites.map((s) => s.project_id).filter(Boolean)).size;
        const totalDomains = Object.values(domainsByProject).reduce((n, arr) => n + arr.length, 0);
        return (
          <Section
            title={`ملخص المواقع المرتبطة — ${total} موقع`}
            actions={<Link to="/owner/sites" className="text-xs text-amber-300 hover:underline">إدارة المواقع ←</Link>}
          >
            <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-5">
              <StatCard icon={<Globe className="h-5 w-5" />} label="إجمالي المواقع" value={total} tone="amber" />
              <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="مواقع نشطة" value={active} tone="emerald" />
              <StatCard icon={<Link2 className="h-5 w-5" />} label="مشاريع مرتبطة" value={linkedProjects} tone="sky" />
              <StatCard icon={<Globe className="h-5 w-5" />} label="نطاقات (Aliases)" value={totalDomains} tone="violet" />
              <StatCard icon={<Users className="h-5 w-5" />} label="ضمن مجموعة HN" value={groupSites} tone="emerald" />
            </div>

            {sites.length === 0 ? (
              <EmptyState title="لا توجد مواقع مرتبطة بعد" />
            ) : (
              <Card className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-right text-[10px] uppercase tracking-wider text-neutral-500">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">الموقع</th>
                        <th className="px-4 py-3">Slug</th>
                        <th className="px-4 py-3">الدومين</th>
                        <th className="px-4 py-3">المشروع (code)</th>
                        <th className="px-4 py-3">نطاقات مرتبطة</th>
                        <th className="px-4 py-3">HN Group</th>
                        <th className="px-4 py-3">البيئة</th>
                        <th className="px-4 py-3">الحالة</th>
                        <th className="px-4 py-3">التكامل</th>
                        <th className="px-4 py-3">مزودو الدفع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((s, i) => {
                        const proj = s.project_id ? projectsById[s.project_id] : null;
                        const aliases = s.project_id ? domainsByProject[s.project_id] ?? [] : [];
                        return (
                          <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-4 py-3 text-[11px] text-neutral-500">{i + 1}</td>
                            <td className="px-4 py-3 font-semibold">{s.name}</td>
                            <td className="px-4 py-3 font-mono text-[11px] text-neutral-400">{s.slug ?? "—"}</td>
                            <td className="px-4 py-3 font-mono text-[11px] text-neutral-400">{s.domain}</td>
                            <td className="px-4 py-3 font-mono text-[11px] text-amber-200">{proj?.code ?? "—"}</td>
                            <td className="px-4 py-3 text-[11px] text-neutral-400" title={aliases.join(", ")}>
                              {aliases.length}
                            </td>
                            <td className="px-4 py-3">
                              <Badge tone={s.is_group_site ? "green" : "neutral"}>
                                {s.is_group_site ? "عضو" : "خارجي"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-neutral-400">{s.environment ?? "—"}</td>
                            <td className="px-4 py-3"><Badge tone={s.is_active ? "green" : "red"}>{s.is_active ? "نشط" : "متوقف"}</Badge></td>
                            <td className="px-4 py-3">
                              <Badge tone={s.integration_status === "connected" ? "green" : s.integration_status === "degraded" ? "amber" : s.integration_status === "disconnected" ? "red" : "neutral"}>
                                {s.integration_status ?? "—"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-neutral-400">{(s.enabled_providers ?? []).join(", ") || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </Section>
        );
      })()}



      {/* Providers status */}
      <Section title="حالة مزودي الدفع" actions={<Link to="/admin/providers" className="text-xs text-amber-300 hover:underline">إدارة المزودين ←</Link>}>
        {providers.length === 0 ? (
          <EmptyState title="لم تُعرَّف مزودات دفع بعد" desc="أضف Stripe أو CMI أو PayPal لبدء تحصيل المدفوعات." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Card key={p.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold">{p.display_name}</div>
                      {p.is_default && <Badge tone="amber">افتراضي</Badge>}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-neutral-500">{p.code} · {p.environment}</div>
                  </div>
                  <Badge tone={p.is_enabled ? "green" : "neutral"}>{p.is_enabled ? "مفعّل" : "متوقف"}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">آخر اختبار</span>
                  <Badge tone={p.last_test_status === "ok" ? "green" : p.last_test_status === "fail" ? "red" : "neutral"}>
                    {p.last_test_status ?? "—"}
                  </Badge>
                </div>
                {p.last_test_message && <div className="mt-2 truncate text-[10px] text-neutral-500">{p.last_test_message}</div>}
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Webhooks & API summary */}
      <Section title="Webhooks & API" actions={<Link to="/admin/webhooks" className="text-xs text-amber-300 hover:underline">عرض السجل ←</Link>}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={<Webhook className="h-5 w-5" />} label="إجمالي Webhooks" value={webhookStats.total} tone="sky" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="ناجحة" value={webhookStats.ok} tone="emerald" />
          <StatCard icon={<XCircle className="h-5 w-5" />} label="فاشلة" value={webhookStats.fail} tone="rose" />
          <StatCard icon={<RefreshCw className="h-5 w-5" />} label="بانتظار المحاولة" value={webhookStats.pending} tone="amber" />
        </div>
      </Section>

      {/* Recent payments + upcoming renewals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="آخر المدفوعات" actions={<Link to="/admin/payments" className="text-xs text-amber-300 hover:underline">الكل ←</Link>}>
          {recent.length === 0 ? <EmptyState title="لا مدفوعات بعد" /> : (
            <Card className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-white/5 text-right text-[10px] uppercase text-neutral-500">
                    <th className="px-4 py-2">المعرف</th><th className="px-4 py-2">العميل</th>
                    <th className="px-4 py-2">المبلغ</th><th className="px-4 py-2">الحالة</th>
                  </tr></thead>
                  <tbody>
                    {recent.map((r) => (
                      <tr key={r.id} className="border-b border-white/5">
                        <td className="px-4 py-2 font-mono text-[10px] text-neutral-400">{r.public_id ?? r.id.slice(0, 8)}</td>
                        <td className="px-4 py-2 truncate max-w-[140px]">{r.customer_email ?? "—"}</td>
                        <td className="px-4 py-2 font-semibold">{Number(r.amount).toFixed(2)} {r.currency}</td>
                        <td className="px-4 py-2"><Badge tone={r.status === "succeeded" ? "green" : r.status === "failed" ? "red" : "amber"}>{r.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </Section>

        <Section title="التجديدات القادمة" actions={<Link to="/admin/renewals" className="text-xs text-amber-300 hover:underline">الكل ←</Link>}>
          {renewals.length === 0 ? <EmptyState title="لا تجديدات قريبة" /> : (
            <Card className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-white/5 text-right text-[10px] uppercase text-neutral-500">
                    <th className="px-4 py-2">الاشتراك</th><th className="px-4 py-2">التجديد</th><th className="px-4 py-2">الحالة</th>
                  </tr></thead>
                  <tbody>
                    {renewals.map((r) => (
                      <tr key={r.id} className="border-b border-white/5">
                        <td className="px-4 py-2 font-mono text-[10px] text-neutral-400">{r.id.slice(0, 8)}</td>
                        <td className="px-4 py-2">{r.current_period_end ? new Date(r.current_period_end).toLocaleDateString("ar-MA") : "—"}</td>
                        <td className="px-4 py-2"><Badge tone={r.status === "active" ? "green" : r.status === "past_due" ? "red" : "amber"}>{r.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </Section>
      </div>
    </AdminShell>
  );
}

function QuickBtn({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to as any}
      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20">
      {icon} {label}
    </Link>
  );
}

function Undo(props: any) { return <Undo2Icon {...props} />; }
function Undo2Icon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>;
}

function fmt(n: number) {
  return new Intl.NumberFormat("ar-MA", { maximumFractionDigits: 2 }).format(n);
}
