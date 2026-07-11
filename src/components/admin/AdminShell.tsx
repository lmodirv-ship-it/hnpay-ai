import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useHnSession } from "@/lib/auth/use-session";
import {
  LayoutDashboard, Users, Package, Layers, ShoppingCart, RefreshCw,
  CreditCard, FileText, BarChart3, UserCog, Bell, Plug, Activity,
  Settings, LifeBuoy, LogOut, Crown, Search, Menu, ChevronRight,
  Globe, Wallet, Undo2, Landmark, Webhook, KeyRound, ShieldCheck, Code2, FolderKanban, FolderTree,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: ReactNode; group: string };

const NAV: NavItem[] = [
  { group: "نظرة عامة", to: "/admin",               label: "الرئيسية",              icon: <LayoutDashboard className="h-4 w-4" /> },

  { group: "الأعمال",    to: "/admin/projects",      label: "المشاريع المالية",       icon: <FolderKanban className="h-4 w-4" /> },
  { group: "الأعمال",    to: "/admin/categories",    label: "الفئات",                icon: <FolderTree className="h-4 w-4" /> },
  { group: "الأعمال",    to: "/admin/catalog",       label: "المنتجات والخدمات",      icon: <Package className="h-4 w-4" /> },
  { group: "الأعمال",    to: "/admin/products",      label: "المواقع والنطاقات",       icon: <Globe className="h-4 w-4" /> },
  { group: "الأعمال",    to: "/admin/customers",     label: "العملاء",               icon: <Users className="h-4 w-4" /> },
  { group: "الأعمال",    to: "/admin/plans",         label: "الخطط والأسعار",        icon: <Layers className="h-4 w-4" /> },

  { group: "المدفوعات",  to: "/admin/payments",      label: "المدفوعات",             icon: <CreditCard className="h-4 w-4" /> },
  { group: "المدفوعات",  to: "/admin/orders",        label: "جلسات الدفع",           icon: <ShoppingCart className="h-4 w-4" /> },
  { group: "المدفوعات",  to: "/admin/subscriptions", label: "الاشتراكات",            icon: <RefreshCw className="h-4 w-4" /> },
  { group: "المدفوعات",  to: "/admin/renewals",      label: "التجديدات",             icon: <RefreshCw className="h-4 w-4" /> },
  { group: "المدفوعات",  to: "/admin/invoices",      label: "الفواتير والإيصالات",   icon: <FileText className="h-4 w-4" /> },
  { group: "المدفوعات",  to: "/admin/refunds",       label: "الاسترجاعات والنزاعات", icon: <Undo2 className="h-4 w-4" /> },

  { group: "المالية",    to: "/admin/providers",     label: "مزودو الدفع",           icon: <Wallet className="h-4 w-4" /> },
  { group: "المالية",    to: "/admin/settlements",   label: "التسويات المالية",      icon: <Landmark className="h-4 w-4" /> },
  { group: "المالية",    to: "/admin/reports",       label: "التقارير والتحليلات",   icon: <BarChart3 className="h-4 w-4" /> },

  { group: "التقنية",    to: "/admin/webhooks",      label: "Webhooks",              icon: <Webhook className="h-4 w-4" /> },
  { group: "التقنية",    to: "/admin/api-keys",      label: "مفاتيح API",            icon: <KeyRound className="h-4 w-4" /> },
  { group: "التقنية",    to: "/admin/integration",   label: "المطورون والتوثيق",     icon: <Code2 className="h-4 w-4" /> },
  { group: "التقنية",    to: "/admin/activity",      label: "سجل النظام",            icon: <Activity className="h-4 w-4" /> },

  { group: "الإدارة",    to: "/admin/team",          label: "المستخدمون والصلاحيات", icon: <UserCog className="h-4 w-4" /> },
  { group: "الإدارة",    to: "/admin/security",      label: "الأمان",                icon: <ShieldCheck className="h-4 w-4" /> },
  { group: "الإدارة",    to: "/admin/notifications", label: "الإشعارات",             icon: <Bell className="h-4 w-4" /> },
  { group: "الإدارة",    to: "/admin/settings",      label: "الإعدادات",             icon: <Settings className="h-4 w-4" /> },
  { group: "الإدارة",    to: "/admin/support",       label: "الدعم",                 icon: <LifeBuoy className="h-4 w-4" /> },
];

export function AdminShell({
  title, subtitle, actions, children,
}: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const { profile, isOwner, signOut } = useHnSession();
  const [open, setOpen] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const groups = Array.from(new Set(NAV.map((n) => n.group)));

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-[#05060d] font-[Cairo,Inter,ui-sans-serif,system-ui] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 top-0 h-[520px] w-[520px] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute left-0 top-1/2 h-[520px] w-[520px] rounded-full bg-violet-600/10 blur-[140px]" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className={`${open ? "w-64" : "w-16"} sticky top-0 hidden h-screen shrink-0 border-l border-amber-500/10 bg-black/50 backdrop-blur-xl transition-all md:block`}>
          <div className="flex h-16 items-center justify-between border-b border-amber-500/10 px-4">
            <Link to="/admin" className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/50 bg-amber-500/15 shadow-[0_0_20px_rgba(251,191,36,0.35)]">
                <Crown className="h-4 w-4 text-amber-300" />
              </div>
              {open && (
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold leading-tight">HN-PAY</div>
                  <div className="text-[9px] uppercase tracking-[0.3em] text-amber-300/70">Admin Console</div>
                </div>
              )}
            </Link>
            <button onClick={() => setOpen((v) => !v)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5">
              <Menu className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex flex-col gap-4 overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 4rem)" }}>
            {groups.map((g) => (
              <div key={g}>
                {open && <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{g}</div>}
                <div className="flex flex-col gap-0.5">
                  {NAV.filter((n) => n.group === g).map((n) => {
                    const active = pathname === n.to || (n.to !== "/admin" && pathname.startsWith(n.to));
                    return (
                      <Link
                        key={n.to}
                        to={n.to as any}
                        className={`group flex items-center gap-3 rounded-lg px-2 py-2 text-xs transition ${
                          active
                            ? "border border-amber-400/30 bg-amber-500/10 text-amber-200"
                            : "border border-transparent text-neutral-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="shrink-0">{n.icon}</span>
                        {open && <span className="truncate">{n.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-20 border-b border-amber-500/10 bg-black/60 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Link to="/admin" className="text-xs text-neutral-500 hover:text-amber-300">HN-PAY</Link>
                <ChevronRight className="h-3 w-3 rotate-180 text-neutral-600" />
                <span className="truncate text-xs text-neutral-300">{title}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative hidden md:block">
                  <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
                  <input
                    placeholder="بحث سريع…"
                    className="w-64 rounded-xl border border-white/10 bg-black/40 px-4 py-2 pr-9 text-xs outline-none placeholder:text-neutral-600 focus:border-amber-400/50"
                  />
                </div>
                <button className="relative rounded-xl border border-white/10 bg-black/40 p-2 text-neutral-300 hover:text-white">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                </button>
                <div className="hidden text-right sm:block">
                  <div className="text-xs">{profile?.full_name ?? profile?.email ?? "Admin"}</div>
                  <div className="text-[10px] uppercase tracking-wider text-amber-300">
                    {isOwner ? "Owner" : "Admin"}
                  </div>
                </div>
                <button
                  onClick={async () => { await signOut(); window.location.href = "/auth"; }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5"
                >
                  <LogOut className="h-3.5 w-3.5" /> خروج
                </button>
              </div>
            </div>
          </header>

          {/* Page */}
          <main className="flex-1 px-4 py-8 md:px-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">HN-PAY Console</div>
                <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-amber-500/15 bg-white/[0.02] p-5 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  icon, label, value, hint, tone = "amber",
}: { icon: ReactNode; label: string; value: ReactNode; hint?: string; tone?: "amber" | "emerald" | "sky" | "violet" | "rose" }) {
  const tones: Record<string, string> = {
    amber: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    emerald: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    sky: "border-sky-400/40 bg-sky-500/10 text-sky-300",
    violet: "border-violet-400/40 bg-violet-500/10 text-violet-300",
    rose: "border-rose-400/40 bg-rose-500/10 text-rose-300",
  };
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">{label}</div>
          <div className="mt-2 text-2xl font-bold md:text-3xl">{value}</div>
          {hint && <div className="mt-1 text-[11px] text-neutral-400">{hint}</div>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
      <div className="text-sm font-semibold">{title}</div>
      {desc && <div className="mt-2 text-xs text-neutral-500">{desc}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "red" | "amber" | "sky" | "violet" }) {
  const tones: Record<string, string> = {
    neutral: "border-white/10 bg-white/5 text-neutral-300",
    green: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    red: "border-rose-400/30 bg-rose-500/10 text-rose-200",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    sky: "border-sky-400/30 bg-sky-500/10 text-sky-200",
    violet: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tones[tone]}`}>{children}</span>;
}
