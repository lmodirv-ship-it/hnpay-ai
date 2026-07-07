import { useMemo, useState, useEffect } from "react";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Cpu,
  Check,
  Crown,
  Lock,
  CreditCard,
  Loader2,
  CheckCircle2,
  X,
  Radio,
  Gauge,
  Receipt,
  Rocket,
  Infinity as InfinityIcon,
} from "lucide-react";

type AppId = "HN-BUILD" | "FILMFORGE" | "HN-LAVAGE";

interface AppContext {
  id: AppId;
  name: string;
  tagline: string;
  resourceLabel: string;
  unit: string;
  usage: number;
  quota: number;
  activePlan: string;
  features: {
    basic: string[];
    pro: string[];
    enterprise: string[];
  };
  invoices: {
    id: string;
    date: string;
    label: string;
    amount: number;
  }[];
}

const APPS: Record<AppId, AppContext> = {
  "HN-BUILD": {
    id: "HN-BUILD",
    name: "HN-BUILD",
    tagline: "No-Code Site Compiler",
    resourceLabel: "Sites Built",
    unit: "Premium Tokens",
    usage: 12,
    quota: 50,
    activePlan: "Pro Builder",
    features: {
      basic: ["3 Live Sites", "Community Templates", "Basic Analytics", "Standard CDN"],
      pro: ["50 Live Sites", "AI Layout Engine", "Priority Deploy Queue", "Custom Domains", "Advanced SEO"],
      enterprise: ["Unlimited Sites", "Dedicated Build Nodes", "White-Label Portal", "SSO & Audit Logs", "24/7 Sovereign Support"],
    },
    invoices: [
      { id: "HNB-8842", date: "2026-06-01", label: "Pro Builder — Monthly", amount: 49 },
      { id: "HNB-8721", date: "2026-05-01", label: "Pro Builder — Monthly", amount: 49 },
      { id: "HNB-8610", date: "2026-04-01", label: "Domain Pack Add-on", amount: 12 },
    ],
  },
  FILMFORGE: {
    id: "FILMFORGE",
    name: "FILMFORGE",
    tagline: "Cinematic Render Cloud",
    resourceLabel: "Videos Rendered",
    unit: "Render Credits",
    usage: 34,
    quota: 120,
    activePlan: "Director Suite",
    features: {
      basic: ["720p Renders", "10 Projects", "Standard Codecs", "Watermarked Exports"],
      pro: ["4K HDR Renders", "120 Projects / mo", "AI Color Grading", "No Watermark", "Timeline Collab"],
      enterprise: ["8K IMAX Pipeline", "Unlimited Render Farm", "Custom LUT Vault", "Studio SSO", "On-Set Support"],
    },
    invoices: [
      { id: "FFG-2201", date: "2026-06-04", label: "Director Suite — Monthly", amount: 129 },
      { id: "FFG-2140", date: "2026-05-04", label: "Extra Render Pack", amount: 39 },
      { id: "FFG-2088", date: "2026-04-04", label: "Director Suite — Monthly", amount: 129 },
    ],
  },
  "HN-LAVAGE": {
    id: "HN-LAVAGE",
    name: "HN-LAVAGE",
    tagline: "Fleet Wash Operations API",
    resourceLabel: "API Deliveries",
    unit: "API Calls (k)",
    usage: 87,
    quota: 250,
    activePlan: "Fleet Ops",
    features: {
      basic: ["1 Location", "5k API Calls / mo", "Email Alerts", "Basic Dashboard"],
      pro: ["10 Locations", "250k API Calls / mo", "SMS + Webhook Alerts", "Loyalty Engine", "Route Optimizer"],
      enterprise: ["Unlimited Locations", "Private API Cluster", "Custom SLA 99.99%", "Fleet Telemetry Vault", "Dedicated CSM"],
    },
    invoices: [
      { id: "HNL-5511", date: "2026-06-02", label: "Fleet Ops — Monthly", amount: 89 },
      { id: "HNL-5470", date: "2026-05-02", label: "Fleet Ops — Monthly", amount: 89 },
      { id: "HNL-5433", date: "2026-04-15", label: "Extra Call Pack 100k", amount: 25 },
    ],
  },
};

type PlanTier = "basic" | "pro" | "enterprise";
const PLAN_PRICES: Record<PlanTier, number> = { basic: 19, pro: 49, enterprise: 249 };
const PLAN_NAMES: Record<PlanTier, string> = {
  basic: "Basic Node",
  pro: "Pro Signal",
  enterprise: "Enterprise Nova",
};

export function HnPayHub() {
  const [appId, setAppId] = useState<AppId>("HN-BUILD");
  const [checkoutPlan, setCheckoutPlan] = useState<PlanTier | null>(null);
  const app = APPS[appId];

  // Simulate reading ?appId=... on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("appId");
    if (q && (q === "HN-BUILD" || q === "FILMFORGE" || q === "HN-LAVAGE")) {
      setAppId(q);
    }
  }, []);

  const usagePct = useMemo(
    () => Math.min(100, Math.round((app.usage / app.quota) * 100)),
    [app]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#04050a] via-[#080914] to-[#020205] text-slate-200 antialiased">
      {/* Cosmic ambient orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#f59e0b]/10 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[700px] w-[700px] rounded-full bg-[#06b6d4]/10 blur-[160px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/5 blur-[140px]" />

      {/* Star grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
          backgroundSize: "38px 38px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <CyberHeader />

        <ContextSelector appId={appId} setAppId={setAppId} />

        <ActivePlanBanner app={app} usagePct={usagePct} />

        <PricingGrid app={app} onChoose={setCheckoutPlan} />

        <InvoiceMatrix app={app} />

        <footer className="mt-16 flex flex-col items-center gap-2 border-t border-white/5 pt-8 text-center text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/70" />
            <span>PCI-DSS L1 · SOC2 Type II · ISO/IEC 27001</span>
          </div>
          <div>© 2026 HN-Pay Hub · Powering 149 distributed applications across the HN network.</div>
        </footer>
      </div>

      {checkoutPlan && (
        <CheckoutOverlay
          appId={appId}
          plan={checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
        />
      )}
    </div>
  );
}

/* ───────────────────────────── Header ───────────────────────────── */

function CyberHeader() {
  return (
    <header className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-yellow-500/5 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
          <ShieldCheck className="h-6 w-6 text-amber-300" strokeWidth={2.2} />
          <div className="absolute inset-0 rounded-xl bg-amber-400/10 blur-md" />
        </div>
        <div>
          <h1 className="text-2xl font-black leading-none tracking-tight bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
            HN-PAY
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Cloud Payment · Subscription Hub
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 shadow-[0_0_25px_rgba(16,185,129,0.08)] backdrop-blur-xl">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <Radio className="h-3.5 w-3.5 text-emerald-400" />
        <span className="font-mono text-[12px] text-emerald-300">
          Core Node: Connected to 192.168.100.233:8181
        </span>
      </div>
    </header>
  );
}

/* ───────────────────────── Context Selector ────────────────────── */

function ContextSelector({
  appId,
  setAppId,
}: {
  appId: AppId;
  setAppId: (a: AppId) => void;
}) {
  const apps: AppId[] = ["HN-BUILD", "FILMFORGE", "HN-LAVAGE"];
  return (
    <div className="mt-8 rounded-2xl border border-white/5 bg-[#0d0f1d]/40 p-4 shadow-[0_0_30px_rgba(6,182,212,0.03)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="h-4 w-4 text-cyan-400" />
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Microservice Context
            </div>
            <div className="font-mono text-xs text-slate-400">
              ?appId=<span className="text-amber-300">{appId}</span>&userId=
              <span className="text-cyan-300">hn_dev_99</span>&planId=
              <span className="text-emerald-300">pro</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {apps.map((a) => {
            const active = a === appId;
            return (
              <button
                key={a}
                onClick={() => setAppId(a)}
                className={[
                  "group relative rounded-lg border px-4 py-2 font-mono text-xs transition-all",
                  active
                    ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                    : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-slate-200",
                ].join(" ")}
              >
                {active && (
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}
                {a}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Active Plan Banner ──────────────────── */

function ActivePlanBanner({ app, usagePct }: { app: AppContext; usagePct: number }) {
  return (
    <section className="mt-6 rounded-2xl border border-white/5 bg-[#0d0f1d]/40 p-6 shadow-[0_0_30px_rgba(6,182,212,0.03)] backdrop-blur-xl md:p-8">
      <div className="grid gap-8 md:grid-cols-[1.1fr_1.6fr] md:items-center">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-slate-500">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Current Active Plan · {app.name}
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <h2 className="text-3xl font-bold text-white md:text-4xl">{app.activePlan}</h2>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              Active
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {app.tagline} — renewal locked · next cycle on{" "}
            <span className="text-slate-200">01 Aug 2026</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Chip icon={<Lock className="h-3 w-3" />} label="Auto-Renew ON" tone="cyan" />
            <Chip icon={<CreditCard className="h-3 w-3" />} label="Card •• 4429" tone="slate" />
            <Chip icon={<Zap className="h-3 w-3" />} label="Priority Queue" tone="amber" />
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-transparent p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
              <Gauge className="h-3.5 w-3.5 text-amber-400" />
              {app.resourceLabel} — Usage Threshold
            </div>
            <div className="font-mono text-xs text-amber-300">
              {app.usage} / {app.quota} {app.unit}
            </div>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.7)] transition-all duration-700"
              style={{ width: `${usagePct}%` }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)] bg-[length:200%_100%] animate-[shimmer_2.5s_linear_infinite]" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-[11px] text-slate-500">
            <UsageStat label="Consumed" value={`${usagePct}%`} tone="amber" />
            <UsageStat label="Remaining" value={`${app.quota - app.usage}`} tone="cyan" />
            <UsageStat label="Refresh" value="24d 06h" tone="emerald" />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </section>
  );
}

function Chip({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "cyan" | "amber" | "slate" | "emerald";
}) {
  const map = {
    cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-300",
    slate: "border-white/10 bg-white/[0.03] text-slate-300",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono ${map}`}>
      {icon}
      {label}
    </span>
  );
}

function UsageStat({ label, value, tone }: { label: string; value: string; tone: "amber" | "cyan" | "emerald" }) {
  const c = { amber: "text-amber-300", cyan: "text-cyan-300", emerald: "text-emerald-300" }[tone];
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="uppercase tracking-wider">{label}</div>
      <div className={`mt-0.5 font-mono text-sm ${c}`}>{value}</div>
    </div>
  );
}

/* ───────────────────────── Pricing Grid ────────────────────────── */

function PricingGrid({
  app,
  onChoose,
}: {
  app: AppContext;
  onChoose: (p: PlanTier) => void;
}) {
  return (
    <section className="mt-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Subscription Matrix</div>
          <h3 className="mt-1 text-2xl font-bold text-white">Choose Your Signal Tier</h3>
          <p className="mt-1 text-sm text-slate-400">
            Pricing dynamically scaled for <span className="text-amber-300">{app.name}</span> workloads.
          </p>
        </div>
        <div className="hidden font-mono text-xs text-slate-500 md:block">
          3 tiers · billed monthly · cancel any cycle
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PricingCard
          tier="basic"
          price={PLAN_PRICES.basic}
          title={PLAN_NAMES.basic}
          subtitle="Entry orbit access"
          icon={<Zap className="h-5 w-5" />}
          features={app.features.basic}
          onChoose={() => onChoose("basic")}
        />
        <PricingCard
          tier="pro"
          price={PLAN_PRICES.pro}
          title={PLAN_NAMES.pro}
          subtitle="Most chosen by the network"
          icon={<Crown className="h-5 w-5" />}
          features={app.features.pro}
          featured
          onChoose={() => onChoose("pro")}
        />
        <PricingCard
          tier="enterprise"
          price={PLAN_PRICES.enterprise}
          title={PLAN_NAMES.enterprise}
          subtitle="MAX processing · titanium"
          icon={<InfinityIcon className="h-5 w-5" />}
          features={app.features.enterprise}
          enterprise
          onChoose={() => onChoose("enterprise")}
        />
      </div>
    </section>
  );
}

function PricingCard({
  tier,
  price,
  title,
  subtitle,
  icon,
  features,
  featured,
  enterprise,
  onChoose,
}: {
  tier: PlanTier;
  price: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  features: string[];
  featured?: boolean;
  enterprise?: boolean;
  onChoose: () => void;
}) {
  const base =
    "group relative flex flex-col rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1";
  const style = featured
    ? "border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.06] to-[#0d0f1d]/60 shadow-[0_0_25px_rgba(245,158,11,0.2)] hover:shadow-[0_0_45px_rgba(245,158,11,0.35)]"
    : enterprise
      ? "border border-white/10 bg-gradient-to-b from-[#12141f]/80 to-[#0a0b13]/90 shadow-[0_0_25px_rgba(148,163,184,0.05)] hover:border-slate-300/20"
      : "border border-white/5 bg-[#0d0f1d]/40 shadow-[0_0_30px_rgba(6,182,212,0.03)] hover:border-cyan-400/20 hover:shadow-[0_0_35px_rgba(6,182,212,0.1)]";

  return (
    <div className={`${base} ${style}`}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a1200] shadow-[0_0_20px_rgba(245,158,11,0.6)]">
            ★ Most Popular
          </span>
        </div>
      )}
      {enterprise && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full border border-slate-400/30 bg-slate-800/90 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
            MAX Processing Mode
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-xl border",
            featured
              ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
              : enterprise
                ? "border-slate-500/30 bg-slate-800/60 text-slate-200"
                : "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
          ].join(" ")}
        >
          {icon}
        </div>
        <div>
          <div className="text-lg font-bold text-white">{title}</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{subtitle}</div>
        </div>
      </div>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-sm text-slate-500">$</span>
        <span
          className={[
            "text-5xl font-black tracking-tight",
            featured
              ? "bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent"
              : enterprise
                ? "text-slate-100"
                : "text-white",
          ].join(" ")}
        >
          {price}
        </span>
        <span className="ml-1 text-sm text-slate-500">/ month</span>
      </div>

      <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <ul className="mt-5 space-y-3 text-sm text-slate-300">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span
              className={[
                "mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full",
                featured
                  ? "bg-amber-500/20 text-amber-300"
                  : enterprise
                    ? "bg-slate-600/30 text-slate-200"
                    : "bg-cyan-500/15 text-cyan-300",
              ].join(" ")}
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onChoose}
        className={[
          "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
          featured
            ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-[#1a1200] shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:shadow-[0_0_35px_rgba(245,158,11,0.7)]"
            : enterprise
              ? "border border-slate-400/30 bg-slate-100/5 text-slate-100 hover:bg-slate-100/10"
              : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]",
        ].join(" ")}
      >
        <Rocket className="h-4 w-4" />
        {tier === "enterprise" ? "Deploy Nova Node" : "Activate Plan"}
      </button>
    </div>
  );
}

/* ───────────────────────── Invoice Matrix ─────────────────────── */

function InvoiceMatrix({ app }: { app: AppContext }) {
  return (
    <section className="mt-12 rounded-2xl border border-white/5 bg-[#0d0f1d]/40 shadow-[0_0_30px_rgba(6,182,212,0.03)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
            Historical Ledger — Invoice Matrix
          </h3>
        </div>
        <span className="font-mono text-[11px] text-slate-500">
          {app.invoices.length} entries · {app.name}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <th className="px-6 py-3 font-medium">Invoice ID</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Description</th>
              <th className="px-6 py-3 text-right font-medium">Amount</th>
              <th className="px-6 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {app.invoices.map((inv) => (
              <tr key={inv.id} className="transition-colors hover:bg-white/[0.015]">
                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-semibold text-amber-300">#{inv.id}</span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400">{inv.date}</td>
                <td className="px-6 py-4 text-slate-200">{inv.label}</td>
                <td className="px-6 py-4 text-right font-mono font-semibold text-white">
                  ${inv.amount.toFixed(2)} <span className="text-xs text-slate-500">USD</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                    Paid / مدفوعة
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ───────────────────────── Checkout Overlay ───────────────────── */

function CheckoutOverlay({
  appId,
  plan,
  onClose,
}: {
  appId: AppId;
  plan: PlanTier;
  onClose: () => void;
}) {
  const [state, setState] = useState<"form" | "processing" | "success">("form");
  const [cardName, setCardName] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const price = PLAN_PRICES[plan];
  const planName = PLAN_NAMES[plan];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setState("processing");
    setTimeout(() => {
      setState("success");
      if (typeof window !== "undefined") {
        window.parent.postMessage(
          { status: "PAYMENT_SUCCESS", appId, planId: plan },
          "*"
        );
      }
    }, 2100);
  };

  const fmtCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d0f1d]/95 to-[#04050a]/95 shadow-[0_0_60px_rgba(6,182,212,0.25)] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-amber-500/15 blur-[100px]" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-8">
          {state === "form" && (
            <>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-slate-500">
                <Lock className="h-3 w-3 text-cyan-400" />
                Secure Gateway · TLS 1.3
              </div>
              <h3 className="mt-2 text-2xl font-bold text-white">Confirm Transaction</h3>
              <p className="mt-1 text-sm text-slate-400">
                {planName} for <span className="text-amber-300">{appId}</span>
              </p>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <span className="text-sm text-slate-300">Total due today</span>
                <span className="font-mono text-2xl font-black text-amber-300">
                  ${price}.00
                </span>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <Field label="Cardholder Name">
                  <input
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="H. Nova"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  />
                </Field>
                <Field label="Card Number">
                  <div className="relative">
                    <input
                      required
                      value={cardNum}
                      onChange={(e) => setCardNum(fmtCard(e.target.value))}
                      placeholder="•••• •••• •••• ••••"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 font-mono text-sm tracking-widest text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    />
                    <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiry (MM/YY)">
                    <input
                      required
                      value={expiry}
                      onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
                      placeholder="09/28"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </Field>
                  <Field label="CVV">
                    <input
                      required
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="•••"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </Field>
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-3.5 text-sm font-bold text-[#1a1200] shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all hover:shadow-[0_0_45px_rgba(245,158,11,0.75)]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Confirm Secure Transaction
                </button>
                <p className="text-center font-mono text-[10px] uppercase tracking-widest text-slate-600">
                  Encrypted end-to-end via HN-Pay Vault
                </p>
              </form>
            </>
          )}

          {state === "processing" && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-2xl" />
                <Loader2 className="relative h-16 w-16 animate-spin text-cyan-400" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">Processing Transaction…</h3>
              <p className="mt-2 font-mono text-xs text-slate-500">
                Contacting node 192.168.100.233:8181
              </p>
              <div className="mt-4 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {state === "success" && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/40 blur-xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                  <CheckCircle2 className="h-10 w-10 text-emerald-300" strokeWidth={2.2} />
                </div>
              </div>
              <h3 className="mt-6 text-2xl font-bold text-white">Payment Successful</h3>
              <p className="mt-2 text-sm text-slate-400">
                {planName} activated for{" "}
                <span className="text-amber-300">{appId}</span>
              </p>
              <div className="mt-5 w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-left font-mono text-[11px] text-emerald-300">
                <div>▸ status: PAYMENT_SUCCESS</div>
                <div>▸ appId: {appId}</div>
                <div>▸ planId: {plan}</div>
                <div>▸ postMessage → window.parent ✓</div>
              </div>
              <button
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm text-slate-200 hover:bg-white/10"
              >
                Return to Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}