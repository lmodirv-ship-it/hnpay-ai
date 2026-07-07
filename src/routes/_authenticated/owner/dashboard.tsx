import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHnSession } from "@/lib/auth/use-session";
import { Crown, LogOut, Users, Boxes, Wallet, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/owner/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { next: "/owner/dashboard", app: "" } });
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const isOwner = (r ?? []).some((row: any) => row.role === "owner" || row.role === "admin");
    if (!isOwner) throw redirect({ to: "/user/dashboard" });
  },
  head: () => ({ meta: [{ title: "Owner Dashboard · HN-Pay Hub" }] }),
  component: OwnerDashboardPage,
});

function OwnerDashboardPage() {
  const { profile, signOut } = useHnSession();
  const [stats, setStats] = useState({ users: 0, apps: 0, subs: 0, roles: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: users }, { count: apps }, { count: subs }, { count: roles }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("hn_apps").select("*", { count: "exact", head: true }),
        supabase.from("hn_subscriptions").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }),
      ]);
      setStats({ users: users ?? 0, apps: apps ?? 0, subs: subs ?? 0, roles: roles ?? 0 });
    })();
  }, []);

  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <div className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">Command Deck</div>
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-400">Live control plane across the HN network.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat icon={<Users className="h-5 w-5" />} label="Users" value={stats.users} tone="amber" />
        <Stat icon={<Boxes className="h-5 w-5" />} label="Apps" value={stats.apps} tone="sky" />
        <Stat icon={<Wallet className="h-5 w-5" />} label="Subscriptions" value={stats.subs} tone="emerald" />
        <Stat icon={<Activity className="h-5 w-5" />} label="Role assignments" value={stats.roles} tone="violet" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <QuickLink to="/owner/users" title="Users & Roles" desc="Promote, demote, invite members." />
        <QuickLink to="/owner/apps" title="Apps Control" desc="Toggle apps and edit metadata." />
        <QuickLink to="/console" title="Mission Console" desc="Registry, keys, monitoring." />
      </div>
    </OwnerShell>
  );
}

export function OwnerShell({
  profile, signOut, children,
}: { profile: { full_name: string | null; email: string } | null; signOut: () => Promise<void>; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060d] font-[Inter,ui-sans-serif,system-ui] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute right-0 top-1/2 h-[520px] w-[520px] rounded-full bg-violet-600/10 blur-[140px]" />
      </div>
      <header className="relative border-b border-amber-500/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/owner/dashboard" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/50 bg-amber-500/15 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                <Crown className="h-4 w-4 text-amber-300" />
              </div>
              <div>
                <div className="text-sm font-bold">HN-Pay Hub</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-amber-300/70">Owner Console</div>
              </div>
            </Link>
            <nav className="ml-8 hidden gap-1 md:flex">
              <NavLink to="/owner/dashboard">Overview</NavLink>
              <NavLink to="/owner/users">Users</NavLink>
              <NavLink to="/owner/apps">Apps</NavLink>
              <NavLink to="/console">Mission</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs">{profile?.full_name ?? profile?.email ?? "Owner"}</div>
              <div className="text-[10px] uppercase tracking-wider text-amber-300">Owner</div>
            </div>
            <button
              onClick={async () => { await signOut(); window.location.href = "/auth"; }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="relative mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to as any}
      activeProps={{ className: "bg-amber-500/15 border-amber-400/30 text-amber-200" }}
      className="rounded-lg border border-transparent px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
    >
      {children}
    </Link>
  );
}

function Stat({
  icon, label, value, tone,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; tone: "amber" | "emerald" | "sky" | "violet" }) {
  const tones: Record<string, string> = {
    amber: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    emerald: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    sky: "border-sky-400/40 bg-sky-500/10 text-sky-300",
    violet: "border-violet-400/40 bg-violet-500/10 text-violet-300",
  };
  return (
    <div className="rounded-2xl border border-amber-500/15 bg-white/[0.02] p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">{label}</div>
          <div className="mt-2 text-3xl font-bold">{value}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to as any}
      className="group block rounded-2xl border border-amber-500/15 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-5 transition hover:border-amber-400/40 hover:shadow-[0_0_30px_-10px_rgba(251,191,36,0.5)]"
    >
      <div className="text-sm font-bold">{title}</div>
      <div className="mt-1 text-xs text-neutral-400">{desc}</div>
      <div className="mt-3 text-[11px] text-amber-300">Open →</div>
    </Link>
  );
}
