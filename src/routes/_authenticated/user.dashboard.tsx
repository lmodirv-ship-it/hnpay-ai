import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHnSession } from "@/lib/auth/use-session";
import { ConsumerHub } from "@/components/hn-pay/ConsumerHub";
import {
  Crown, LogOut, User as UserIcon, Wallet, Zap, CheckCircle2,
  CreditCard, ArrowRight, Sparkles, Boxes,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/user/dashboard")({
  head: () => ({ meta: [{ title: "My Wallet & Subscriptions · HN-Pay Live" }] }),
  component: UserDashboard,
});

interface Sub {
  app_id: string;
  plan: string;
  status: string;
  quota: number;
  used: number;
  renews_at: string | null;
}
interface App { app_id: string; name: string; description: string | null; category: string | null; }

function UserDashboard() {
  const { session, profile, roles, signOut } = useHnSession();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [payingApp, setPayingApp] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const [{ data: s }, { data: a }] = await Promise.all([
        supabase.from("hn_subscriptions").select("*").eq("user_id", session.user.id),
        supabase.from("hn_apps").select("app_id, name, description, category").eq("active", true),
      ]);
      setSubs((s as Sub[]) ?? []);
      setApps((a as App[]) ?? []);
    })();
  }, [session?.user?.id]);

  const totalUsed = subs.reduce((a, s) => a + s.used, 0);
  const totalQuota = subs.reduce((a, s) => a + s.quota, 0) || 1;

  return (
    <div className="relative min-h-screen overflow-hidden bg-fx-bg font-fx text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-fx-blue/10 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-fx-cyan/10 blur-[140px]" />
      </div>

      <header className="relative border-b border-fx-blue/10 bg-fx-bg/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-fx-blue/50 bg-fx-blue/15 shadow-[0_0_20px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]">
              <Crown className="h-4 w-4 text-fx-blue" />
            </div>
            <div>
              <div className="text-sm font-bold">HN-Pay Hub</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-fx-blue/70">My Space</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs text-white">{profile?.full_name ?? profile?.email}</div>
              <div className="text-[10px] text-fx-muted">{roles.length} app roles</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-fx-blue/40 bg-gradient-to-br from-fx-blue/25 to-transparent text-[11px] font-bold text-fx-blue">
              {(profile?.full_name ?? profile?.email ?? "U").slice(0, 2).toUpperCase()}
            </div>
            <button
              onClick={async () => { await signOut(); window.location.href = "/auth"; }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-fx-line px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-fx-blue/80">Welcome</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Hello, <span className="text-fx-blue">{profile?.full_name ?? "friend"}</span>
          </h1>
          <p className="mt-1 text-sm text-fx-muted">{profile?.email}</p>
        </div>

        <ConsumerHub />

        {/* KPIs */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiCard icon={<Boxes className="h-5 w-5" />} label="Active apps" value={subs.length} tone="amber" />
          <KpiCard
            icon={<Zap className="h-5 w-5" />}
            label="Total usage"
            value={`${Math.round((totalUsed / totalQuota) * 100)}%`}
            hint={`${totalUsed} / ${totalQuota} units`}
            tone="emerald"
          />
          <KpiCard icon={<Wallet className="h-5 w-5" />} label="Payment status" value="Current" tone="sky" />
        </div>

        {/* My subscriptions */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-fx-blue/80">Your Apps</div>
              <h2 className="text-xl font-bold">Subscriptions & Usage</h2>
            </div>
          </div>

          {subs.length === 0 ? (
            <EmptySubs apps={apps.slice(0, 3)} />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {subs.map((s) => {
                const app = apps.find((a) => a.app_id === s.app_id);
                const pct = Math.round((s.used / (s.quota || 1)) * 100);
                const low = pct >= 80;
                return (
                  <div
                    key={s.app_id}
                    className="relative overflow-hidden rounded-2xl border border-fx-blue/15 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-fx-muted">{app?.category ?? s.app_id}</div>
                        <div className="mt-1 text-lg font-bold text-white">{app?.name ?? s.app_id}</div>
                        <div className="mt-1 text-xs text-fx-muted">Plan · <span className="capitalize text-fx-blue">{s.plan}</span></div>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        s.status === "active"
                          ? "border-fx-green/30 bg-fx-green/10 text-fx-green"
                          : "border-rose-400/30 bg-rose-500/10 text-rose-200"
                      }`}>
                        <CheckCircle2 className="h-3 w-3" /> {s.status}
                      </span>
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-fx-muted">Usage</span>
                        <span className="font-mono text-fx-blue">{s.used} / {s.quota}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full ${low
                            ? "bg-gradient-to-r from-rose-400 to-fx-blue shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                            : "bg-gradient-to-r from-fx-blue to-fx-blue shadow-[0_0_10px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]"}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      {low && (
                        <div className="mt-2 text-[11px] text-rose-300">
                          Almost out of resources — upgrade to continue.
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setPayingApp(s.app_id)}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-fx-blue/50 bg-gradient-to-b from-fx-blue/30 to-fx-blue/10 py-2.5 text-sm font-semibold text-fx-blue shadow-[0_0_25px_-5px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]"
                    >
                      <CreditCard className="h-4 w-4" /> Upgrade / Renew
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {payingApp && <MiniCheckout appId={payingApp} onClose={() => setPayingApp(null)} />}
    </div>
  );
}

function KpiCard({
  icon, label, value, hint, tone = "amber",
}: { icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string; tone?: "amber" | "emerald" | "sky" }) {
  const tones: Record<string, string> = {
    amber: "border-fx-blue/40 bg-fx-blue/10 text-fx-blue shadow-[0_0_25px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]",
    emerald: "border-fx-green/40 bg-fx-green/10 text-fx-green shadow-[0_0_25px_rgba(16,185,129,0.3)]",
    sky: "border-sky-400/40 bg-sky-500/10 text-sky-300 shadow-[0_0_25px_rgba(14,165,233,0.3)]",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-fx-blue/15 bg-fx-card p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-fx-muted">{label}</div>
          <div className="mt-2 text-2xl font-bold text-white">{value}</div>
          {hint && <div className="mt-1 text-xs text-fx-muted">{hint}</div>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

function EmptySubs({ apps }: { apps: App[] }) {
  return (
    <div className="rounded-2xl border border-fx-blue/15 bg-fx-card p-8 text-center backdrop-blur-xl">
      <Sparkles className="mx-auto h-8 w-8 text-fx-blue" />
      <h3 className="mt-3 text-lg font-bold text-white">You don't have an active plan yet</h3>
      <p className="mt-1 text-sm text-fx-muted">Pick an HN app to activate your first subscription.</p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {apps.map((a) => (
          <div key={a.app_id} className="rounded-xl border border-fx-line bg-fx-bg/60 p-4 text-left">
            <div className="text-sm font-semibold text-white">{a.name}</div>
            <div className="mt-1 text-[11px] text-fx-muted">{a.description}</div>
            <button className="mt-3 inline-flex items-center gap-1 text-xs text-fx-blue hover:text-fx-blue">
              Activate <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniCheckout({ appId, onClose }: { appId: string; onClose: () => void }) {
  const [state, setState] = useState<"form" | "processing" | "done">("form");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-fx-blue/40 bg-gradient-to-b from-[#0a0d1c] to-black p-8 shadow-[0_0_80px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-fx-blue/50 bg-fx-blue/15 shadow-[0_0_25px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]">
            <CreditCard className="h-5 w-5 text-fx-blue" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-fx-blue/80">HN-Pay · Secure</div>
            <div className="text-lg font-bold">Renew {appId}</div>
          </div>
        </div>
        {state === "form" && (
          <>
            <div className="rounded-2xl border border-fx-line bg-fx-bg/60 p-4 text-sm">
              <div className="flex justify-between"><span className="text-fx-muted">Plan</span><span className="text-white">Pro · Monthly</span></div>
              <div className="mt-2 flex justify-between border-t border-fx-line pt-2"><span className="text-neutral-300">Total</span><span className="font-mono text-fx-blue">$49.00</span></div>
            </div>
            <button
              onClick={() => { setState("processing"); setTimeout(() => setState("done"), 1400); }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-fx-blue/50 bg-gradient-to-b from-fx-blue/30 to-fx-blue/10 py-3 text-sm font-semibold text-fx-blue"
            >Confirm Payment</button>
            <button onClick={onClose} className="mt-2 w-full py-2 text-xs text-fx-muted hover:text-white">Cancel</button>
          </>
        )}
        {state === "processing" && (
          <div className="py-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-fx-blue/30 border-t-fx-blue" />
            <div className="mt-4 text-sm text-fx-muted">Processing…</div>
          </div>
        )}
        {state === "done" && (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-fx-green" />
            <div className="mt-3 text-lg font-bold">Payment successful</div>
            <button onClick={onClose} className="mt-5 rounded-xl border border-fx-blue/40 bg-fx-blue/10 px-6 py-2 text-sm text-fx-blue">Return</button>
          </div>
        )}
      </div>
    </div>
  );
}
