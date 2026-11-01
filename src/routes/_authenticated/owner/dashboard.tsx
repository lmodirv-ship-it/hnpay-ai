import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHnSession } from "@/lib/auth/use-session";
import { useServerFn } from "@tanstack/react-start";
import { Crown, LogOut, Users, Boxes, Wallet, Activity, RefreshCcw, Globe2, Repeat, CreditCard, ShieldCheck, CheckCircle2, AlertTriangle, Landmark, Zap } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { getOwnerOverview, approveManualTopup } from "@/lib/hn-pay/owner-overview.functions";

export const Route = createFileRoute("/_authenticated/owner/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { next: "/owner/dashboard", app: "" } });
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const isOwner = (r ?? []).some((row: any) => row.role === "owner" || row.role === "admin");
    if (!isOwner) throw redirect({ to: "/user/dashboard" });
  },
  head: () => ({ meta: [{ title: "لوحة تحكم المالك · HN-Pay Live" }] }),
  component: OwnerDashboardPage,
});

function OwnerDashboardPage() {
  const { profile, signOut } = useHnSession();
  const load = useServerFn(getOwnerOverview);
  const approve = useServerFn(approveManualTopup);
  const [d, setD] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const refresh = () => load().then(setD).catch((e) => setErr(String(e?.message ?? e)));
  useEffect(() => { refresh(); }, []);

  const act = async (publicId: string, action: "approve" | "reject") => {
    const r = await approve({ data: { publicId, action } });
    if (!r.ok) setErr(r.error ?? "Error");
    refresh();
  };

  const k = d?.kpis;
  const rev = d ? Object.entries(d.revenue) : [];
  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-fx-cyan">مركز التحكم الشامل</div>
          <h1 className="mt-1 text-3xl font-bold">لوحة تحكم المالك</h1>
          <p className="mt-1 text-sm text-fx-muted">المنصة العالمية للدفعات والاشتراكات الموحدة عبر الإنترنت — بيانات حية من قاعدة البيانات.</p>
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-2 rounded-lg border border-fx-line px-3 py-2 text-sm hover:bg-fx-text/5"><RefreshCcw className="h-4 w-4" />تحديث</button>
      </div>
      {err && <div className="mb-4 rounded-lg border border-fx-red/40 bg-fx-red/10 px-4 py-2 text-sm">{err}</div>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Stat icon={<Globe2 className="h-5 w-5" />} label="المواقع المتصلة" value={k ? `${k.activeSites}/${k.sites}` : "…"} />
        <Stat icon={<Boxes className="h-5 w-5" />} label="المشاريع" value={k?.projects ?? "…"} sub={k ? `${k.domains} نطاق` : ""} />
        <Stat icon={<Users className="h-5 w-5" />} label="المستخدمون / العملاء" value={k ? `${k.users} / ${k.customers}` : "…"} />
        <Stat icon={<Repeat className="h-5 w-5" />} label="اشتراكات نشطة" value={k?.activeSubs ?? "…"} sub={k ? `${k.pausedSubs} موقوفة` : ""} />
        <Stat icon={<CreditCard className="h-5 w-5" />} label="مدفوعات 30 يوماً" value={k?.succeeded ?? "…"} sub={k ? `${k.failed} فاشلة` : ""} />
        <Stat icon={<Crown className="h-5 w-5" />} label="أعضاء مجموعة HN" value={k?.groupMembers ?? "…"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="الإيرادات (30 يوماً)" icon={<Wallet className="h-4 w-4" />}>
          {rev.length === 0 ? <Empty text="لا توجد مدفوعات ناجحة بعد" /> : rev.map(([c, v]) => <Row key={c} a={c} b={v.toFixed(2)} />)}
        </Card>
        <Card title="أرصدة محافظ العملاء" icon={<Wallet className="h-4 w-4" />}>
          {d ? (["MAD", "EUR", "USD"] as const).map((c) => <Row key={c} a={c} b={d.float[c].toFixed(2)} />) : <Empty text="…" />}
        </Card>
        <Card title="جاهزية المنصة للتحصيل" icon={<ShieldCheck className="h-4 w-4" />}>
          <ul className="space-y-2 text-sm">
            {(d?.checks ?? []).map((c) => (
              <li key={c.key} className="flex items-start gap-2">
                {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-fx-green" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-fx-red" />}
                <span>{c.label}{!c.ok && c.hint && <span className="block text-[11px] text-fx-muted">{c.hint}</span>}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="طلبات شحن المحافظ" icon={<Landmark className="h-4 w-4" />}>
          {(d?.topups ?? []).length === 0 ? <Empty text="لا توجد طلبات شحن" /> : (
            <table className="w-full text-xs"><tbody>
              {d!.topups.map((t) => (
                <tr key={t.public_id} className="border-b border-fx-line/60">
                  <td className="py-2">{t.email}<div className="font-fx-mono text-[10px] text-fx-muted">{t.public_id}</div></td>
                  <td className="py-2 font-fx-mono" dir="ltr">{Number(t.amount).toFixed(2)} {t.currency}</td>
                  <td className="py-2 text-fx-muted">{t.method}</td>
                  <td className="py-2"><StatusPill s={t.status} /></td>
                  <td className="py-2 text-end">
                    {t.status === "pending" && t.method === "bank_transfer" && (
                      <span className="inline-flex gap-1">
                        <button onClick={() => act(t.public_id, "approve")} className="rounded bg-fx-green/20 px-2 py-1 text-fx-green">تأكيد الاستلام</button>
                        <button onClick={() => act(t.public_id, "reject")} className="rounded border border-fx-line px-2 py-1">رفض</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody></table>
          )}
        </Card>
        <Card title="آخر المدفوعات" icon={<Activity className="h-4 w-4" />}>
          {(d?.recentPayments ?? []).length === 0 ? <Empty text="لا توجد مدفوعات بعد" /> : (
            <table className="w-full text-xs"><tbody>
              {d!.recentPayments.map((p) => (
                <tr key={p.public_id} className="border-b border-fx-line/60">
                  <td className="py-2">{(p.sites as { name?: string } | null)?.name}</td>
                  <td className="py-2 font-fx-mono" dir="ltr">{Number(p.amount).toFixed(2)} {p.currency}</td>
                  <td className="py-2 text-fx-muted">{p.provider}</td>
                  <td className="py-2"><StatusPill s={p.status} /></td>
                </tr>
              ))}
            </tbody></table>
          )}
        </Card>
      </div>

      <h2 className="mb-3 mt-10 text-lg font-bold">إدارة المنصة</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MODULES.map((m) => (
          <div key={m.title} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 font-semibold"><span className="text-fx-cyan">{m.icon}</span>{m.title}</div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {m.links.map((l) => (
                <li key={l.to}><Link to={l.to as "/"} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-fx-muted hover:bg-fx-text/5 hover:text-fx-text"><span>{l.label}</span><span className="text-[11px]">←</span></Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </OwnerShell>
  );
}

type Overview = Awaited<ReturnType<typeof getOwnerOverview>>;

const MODULES = [
  { title: "المدفوعات والتحصيل", icon: <CreditCard className="h-4 w-4" />, links: [
    { to: "/admin/payments", label: "المدفوعات" }, { to: "/admin/orders", label: "جلسات الدفع" }, { to: "/admin/refunds", label: "الاسترجاعات والنزاعات" }, { to: "/admin/settlements", label: "التسويات المالية" }, { to: "/admin/invoices", label: "الفواتير" },
  ] },
  { title: "الاشتراكات والعملاء", icon: <Repeat className="h-4 w-4" />, links: [
    { to: "/admin/subscriptions", label: "الاشتراكات" }, { to: "/admin/renewals", label: "التجديدات" }, { to: "/admin/customers", label: "العملاء" }, { to: "/admin/plans", label: "الخطط والأسعار" }, { to: "/owner/hn-pay/catalog", label: "الكتالوج المركزي" },
  ] },
  { title: "المواقع والمشاريع", icon: <Globe2 className="h-4 w-4" />, links: [
    { to: "/admin", label: "مركز القيادة (المواقع)" }, { to: "/owner/sites", label: "إدارة المواقع ومفاتيح API" }, { to: "/admin/projects", label: "المشاريع والنطاقات" }, { to: "/owner/portfolios", label: "المحافظ (Portfolios)" }, { to: "/owner/hn-pay/integrate", label: "ربط SDK" },
  ] },
  { title: "البوابات والتوجيه", icon: <Zap className="h-4 w-4" />, links: [
    { to: "/admin/providers", label: "مزودو الدفع والتوجيه الذكي" }, { to: "/admin/webhooks", label: "Webhooks" }, { to: "/admin/api-keys", label: "مفاتيح API" }, { to: "/owner/hn-pay/monitor", label: "المراقبة الحية" },
  ] },
  { title: "التقارير والإيرادات", icon: <Activity className="h-4 w-4" />, links: [
    { to: "/admin/revenue", label: "الإيرادات و AdSense" }, { to: "/admin/reports", label: "التقارير والتحليلات" }, { to: "/admin/financial-projects", label: "المشاريع المالية" }, { to: "/admin/activity", label: "سجل النشاط" },
  ] },
  { title: "Google والتكاملات", icon: <Globe2 className="h-4 w-4" />, links: [
    { to: "/admin/google-cloud", label: "Google Cloud و GA4 والمحفظة" }, { to: "/admin/integration", label: "التكاملات" }, { to: "/admin/notifications", label: "الإشعارات" },
  ] },
  { title: "الفريق والأمان", icon: <ShieldCheck className="h-4 w-4" />, links: [
    { to: "/owner/users", label: "المستخدمون" }, { to: "/owner/roles", label: "مصفوفة الصلاحيات" }, { to: "/admin/team", label: "الفريق" }, { to: "/admin/security", label: "الأمان" },
  ] },
  { title: "الإعدادات والدعم", icon: <Boxes className="h-4 w-4" />, links: [
    { to: "/admin/settings", label: "إعدادات المنصة" }, { to: "/owner/apps", label: "التطبيقات" }, { to: "/admin/support", label: "الدعم" }, { to: "/user/dashboard", label: "عرض كعميل" },
  ] },
];

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="glass rounded-2xl p-5"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="text-fx-cyan">{icon}</span>{title}</div>{children}</div>;
}
function Row({ a, b }: { a: string; b: string }) {
  return <div className="flex justify-between border-b border-fx-line/60 py-1.5 text-sm"><span className="text-fx-muted">{a}</span><span className="font-fx-mono" dir="ltr">{b}</span></div>;
}
function Empty({ text }: { text: string }) { return <div className="py-4 text-center text-xs text-fx-muted">{text}</div>; }
function StatusPill({ s }: { s: string }) {
  const tone = s === "succeeded" || s === "completed" || s === "paid" ? "bg-fx-green/15 text-fx-green" : s === "failed" || s === "canceled" ? "bg-fx-red/15 text-fx-red" : "bg-fx-blue/15 text-fx-cyan";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] ${tone}`}>{s}</span>;
}

export function OwnerShell({
  profile, signOut, children,
}: { profile: { full_name: string | null; email: string } | null; signOut: () => Promise<void>; children: React.ReactNode }) {
  return (
    <div className="fx" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-fx-line bg-fx-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Logo subtitle="Owner Console" />
            <nav className="hidden gap-1 lg:flex">
              <NavLink to="/owner/dashboard">نظرة عامة</NavLink>
              <NavLink to="/admin">مركز القيادة</NavLink>
              <NavLink to="/owner/sites">المواقع</NavLink>
              <NavLink to="/owner/tvcc">ربط TVCC</NavLink>
              <NavLink to="/owner/hn-pay/catalog">الكتالوج</NavLink>
              <NavLink to="/admin/providers">البوابات</NavLink>
              <NavLink to="/owner/hn-pay/monitor">المراقبة</NavLink>
              <NavLink to="/owner/users">المستخدمون</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-end sm:block">
              <div className="text-xs">{profile?.full_name ?? profile?.email ?? "Owner"}</div>
              <div className="text-[10px] uppercase tracking-wider text-fx-cyan">Owner</div>
            </div>
            <button onClick={async () => { await signOut(); window.location.href = "/auth"; }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-fx-line px-3 py-1.5 text-xs hover:bg-fx-text/5">
              <LogOut className="h-3.5 w-3.5" /> خروج
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to as "/"} activeOptions={{ exact: true }} activeProps={{ className: "bg-fx-blue/20 text-fx-text" }}
      className="rounded-lg px-3 py-1.5 text-xs text-fx-muted hover:text-fx-text">{children}</Link>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between text-fx-cyan">{icon}</div>
      <div className="mt-3 font-fx-mono text-2xl font-semibold" dir="ltr">{value}</div>
      <div className="text-xs text-fx-muted">{label}</div>
      {sub && <div className="text-[10px] text-fx-muted">{sub}</div>}
    </div>
  );
}
