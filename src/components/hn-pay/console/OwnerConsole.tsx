import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Boxes,
  KeyRound,
  Radar,
  Network,
  Activity,
  BookOpen,
  Map as MapIcon,
  Search,
  ShieldCheck,
  BarChart3,
  Sparkles,
  Users,
  CreditCard,
  Zap,
  Wallet,
  Server,
  Globe2,
  Copy,
  Trash2,
  Plus,
  RefreshCw,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Cpu,
  Fingerprint,
  GitBranch,
  Radio,
  Crown,
  Loader2,
  Filter,
  Eye,
  Settings2,
  Rocket,
} from "lucide-react";
import {
  HN_SERVICES,
  API_KEYS,
  USERS,
  ROLE_MATRIX,
  LIVE_REQUESTS,
  AI_SUGGESTIONS,
  KNOWLEDGE,
  NETWORK_KPIS,
  type HnService,
} from "./mock-data";
import { Panel, SectionHeader, StatCard, StatusDot, Chip, Button, Input } from "./ui";

type Tab =
  | "overview"
  | "registry"
  | "keys"
  | "discovery"
  | "orchestration"
  | "monitoring"
  | "knowledge"
  | "map"
  | "search"
  | "permissions"
  | "analytics"
  | "ai"
  | "users"
  | "checkout";

const NAV: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard; group: string }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Command" },
  { id: "registry", label: "Service Registry", icon: Boxes, group: "Command" },
  { id: "keys", label: "API Keys", icon: KeyRound, group: "Command" },
  { id: "discovery", label: "Discovery", icon: Radar, group: "Intelligence" },
  { id: "orchestration", label: "Orchestration", icon: Network, group: "Intelligence" },
  { id: "monitoring", label: "Monitoring", icon: Activity, group: "Intelligence" },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen, group: "Knowledge" },
  { id: "map", label: "Service Map", icon: MapIcon, group: "Knowledge" },
  { id: "search", label: "Search", icon: Search, group: "Knowledge" },
  { id: "permissions", label: "Permissions", icon: ShieldCheck, group: "Governance" },
  { id: "users", label: "Users & Roles", icon: Users, group: "Governance" },
  { id: "analytics", label: "Analytics", icon: BarChart3, group: "Insights" },
  { id: "ai", label: "AI Coordinator", icon: Sparkles, group: "Insights" },
  { id: "checkout", label: "Unified Checkout", icon: CreditCard, group: "Insights" },
];

export function OwnerConsole() {
  const [tab, setTab] = useState<Tab>("overview");

  const groups = useMemo(() => {
    const g: Record<string, typeof NAV> = {};
    NAV.forEach((n) => {
      if (!g[n.group]) g[n.group] = [];
      g[n.group].push(n);
    });
    return g;
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-fx-bg font-fx text-white">
      {/* Ambient cosmic backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-fx-blue/10 blur-[140px]" />
        <div className="absolute right-0 top-1/3 h-[620px] w-[620px] rounded-full bg-fx-cyan/10 blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-fx-green/[0.06] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in_oklab,var(--fx-blue)_40%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in_oklab,var(--fx-blue)_40%,transparent) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 lg:px-8">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col overflow-y-auto rounded-2xl border border-fx-blue/15 bg-fx-bg/60 p-4 backdrop-blur-xl lg:flex">
          <Link to="/" className="mb-6 flex items-center gap-3 rounded-xl border border-fx-blue/20 bg-gradient-to-br from-fx-blue/10 to-transparent p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-fx-blue/50 bg-fx-blue/15 shadow-[0_0_25px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]">
              <Crown className="h-5 w-5 text-fx-blue" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white">HN-Pay Hub</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-fx-blue/80">Owner Console</div>
            </div>
          </Link>

          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-4">
              <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-600">
                {group}
              </div>
              <nav className="space-y-1">
                {items.map((n) => {
                  const active = tab === n.id;
                  const Icon = n.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setTab(n.id)}
                      className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                        active
                          ? "border-fx-blue/40 bg-gradient-to-r from-fx-blue/15 to-transparent text-fx-blue shadow-[0_0_20px_-8px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]"
                          : "border-transparent text-fx-muted hover:border-fx-line hover:bg-white/[0.03] hover:text-white"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-fx-blue" : ""}`} />
                      <span>{n.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}

          <div className="mt-auto rounded-xl border border-fx-green/20 bg-fx-green/[0.06] p-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-fx-green">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              Mesh Online
            </div>
            <div className="mt-1 text-[11px] text-fx-green/70">
              {NETWORK_KPIS.online}/{NETWORK_KPIS.totalServices} nodes healthy
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 pb-16">
          <TopBar tab={tab} setTab={setTab} />
          <div className="mt-6">
            {tab === "overview" && <OverviewPage />}
            {tab === "registry" && <RegistryPage />}
            {tab === "keys" && <KeysPage />}
            {tab === "discovery" && <DiscoveryPage />}
            {tab === "orchestration" && <OrchestrationPage />}
            {tab === "monitoring" && <MonitoringPage />}
            {tab === "knowledge" && <KnowledgePage />}
            {tab === "map" && <ServiceMapPage />}
            {tab === "search" && <SearchPage />}
            {tab === "permissions" && <PermissionsPage />}
            {tab === "users" && <UsersPage />}
            {tab === "analytics" && <AnalyticsPage />}
            {tab === "ai" && <AiPage />}
            {tab === "checkout" && <UnifiedCheckoutPage />}
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────── Top Bar ─────────────────────────── */
function TopBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-fx-blue/15 bg-fx-bg/60 p-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="lg:hidden">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value as Tab)}
            className="rounded-xl border border-fx-line bg-black/60 px-3 py-2 text-sm text-white"
          >
            {NAV.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-fx-line bg-fx-bg/60 px-3 py-2 text-xs text-fx-muted lg:flex">
          <Search className="h-3.5 w-3.5" />
          Search services, keys, users…
          <kbd className="ml-2 rounded border border-fx-line bg-white/5 px-1.5 py-0.5 text-[10px] text-fx-muted">
            ⌘K
          </kbd>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Chip tone="emerald">
          <Radio className="h-3 w-3 animate-pulse" /> Mesh · Live
        </Chip>
        <Chip tone="amber">
          <Globe2 className="h-3 w-3" /> 152 Nodes
        </Chip>
        <Link to="/">
          <Button variant="ghost" size="sm">
            <Wallet className="h-3.5 w-3.5" /> Billing Hub
          </Button>
        </Link>
        <div className="flex items-center gap-2 rounded-xl border border-fx-blue/30 bg-gradient-to-br from-fx-blue/15 to-transparent py-1.5 pl-1.5 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fx-blue/20 text-[11px] font-bold text-fx-blue">
            MI
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-[11px] font-semibold text-white">Moulay Ismail</div>
            <div className="text-[9px] uppercase tracking-wider text-fx-blue">Owner</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Footer ─────────────────────────── */
function Footer() {
  return (
    <footer className="mt-16 border-t border-fx-blue/10 pt-8 text-center text-xs text-fx-muted">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Chip tone="amber">PCI-DSS L1</Chip>
        <Chip tone="emerald">SOC 2 · Type II</Chip>
        <Chip tone="sky">ISO/IEC 27001</Chip>
      </div>
      <div className="mt-4 text-fx-muted">
        © 2026 <span className="text-fx-blue">HN-Pay Hub</span> · All rights reserved to{" "}
        <span className="font-semibold text-white">Al-Hasani Moulay Ismail</span>
      </div>
      <div className="mt-1 text-[11px] text-fx-muted">
        HN Group · Design & Software · <span dir="rtl">مجموعة HN للتصميم والبرمجيات</span>
      </div>
    </footer>
  );
}

/* ─────────────────────────── OVERVIEW ─────────────────────────── */
function OverviewPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Command Deck"
        title="Network Command Overview"
        desc="Real-time treasury and mesh health across all 152 HN applications."
        right={
          <>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" /> Register Service
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Boxes className="h-5 w-5" />}
          label="Total Services"
          value={NETWORK_KPIS.totalServices}
          hint={`${NETWORK_KPIS.online} online · ${NETWORK_KPIS.degraded} degraded · ${NETWORK_KPIS.offline} offline`}
          tone="amber"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="24h Requests"
          value={fmt(NETWORK_KPIS.requests24h)}
          hint={`avg ${NETWORK_KPIS.avgLatency} ms · ${NETWORK_KPIS.avgUptime}% uptime`}
          tone="sky"
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="30d Revenue"
          value={`$${fmt(NETWORK_KPIS.revenue30d)}`}
          hint="Aggregated across the mesh"
          tone="emerald"
        />
        <StatCard
          icon={<KeyRound className="h-5 w-5" />}
          label="Active API Keys"
          value={NETWORK_KPIS.apiKeys}
          hint={`${NETWORK_KPIS.users} users · 6 roles`}
          tone="violet"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Mesh Traffic · Last 24h</h3>
              <p className="text-xs text-fx-muted">Requests per hour across the network.</p>
            </div>
            <Chip tone="emerald">
              <CheckCircle2 className="h-3 w-3" /> Healthy
            </Chip>
          </div>
          <SparkChart />
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Top Services by Traffic</h3>
            <Chip>Live</Chip>
          </div>
          <div className="space-y-3">
            {HN_SERVICES.slice()
              .sort((a, b) => b.requests24h - a.requests24h)
              .slice(0, 6)
              .map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <StatusDot status={s.status} />
                  <div className="flex-1 truncate">
                    <div className="truncate text-sm text-white">{s.name}</div>
                    <div className="text-[10px] text-fx-muted">{s.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-fx-blue">{fmt(s.requests24h)}</div>
                    <div className="text-[10px] text-fx-muted">{s.latency} ms</div>
                  </div>
                </div>
              ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <h3 className="mb-4 text-sm font-semibold text-white">Latest Requests</h3>
          <div className="space-y-1.5">
            {LIVE_REQUESTS.slice(0, 6).map((r) => (
              <RequestRow key={r.id} r={r} />
            ))}
          </div>
        </Panel>
        <Panel>
          <h3 className="mb-4 text-sm font-semibold text-white">AI Coordinator · Top Suggestions</h3>
          <div className="space-y-2.5">
            {AI_SUGGESTIONS.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-xl border border-fx-line bg-fx-card p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-fx-blue/30 bg-fx-blue/10 text-fx-blue">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{s.title}</div>
                  <div className="text-[11px] text-fx-muted">{s.detail}</div>
                </div>
                <Chip tone={s.impact === "high" ? "rose" : s.impact === "medium" ? "amber" : "sky"}>
                  {s.impact}
                </Chip>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function RequestRow({ r }: { r: (typeof LIVE_REQUESTS)[number] }) {
  const methodTone: Record<string, string> = {
    GET: "text-sky-300 bg-sky-500/10 border-sky-400/30",
    POST: "text-fx-green bg-fx-green/10 border-fx-green/30",
    PUT: "text-fx-blue bg-fx-blue/10 border-fx-blue/30",
    DELETE: "text-rose-300 bg-rose-500/10 border-rose-400/30",
  };
  return (
    <div className="flex items-center gap-3 rounded-lg border border-fx-line bg-fx-card px-3 py-2 text-xs">
      <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${methodTone[r.method]}`}>
        {r.method}
      </span>
      <span className="flex-1 truncate font-mono text-neutral-300">{r.path}</span>
      <span className="hidden text-fx-muted sm:inline">{r.from}</span>
      <ArrowRight className="hidden h-3 w-3 text-neutral-600 sm:inline" />
      <span className="hidden text-fx-blue sm:inline">{r.to}</span>
      <span className="font-mono text-fx-green">{r.status}</span>
      <span className="w-14 text-right font-mono text-fx-muted">{r.latency} ms</span>
    </div>
  );
}

function SparkChart() {
  const bars = Array.from({ length: 48 }, (_, i) => {
    const t = i / 48;
    const base = 40 + Math.sin(t * Math.PI * 2) * 22 + Math.sin(t * Math.PI * 6) * 10;
    const noise = ((i * 9301 + 49297) % 233280) / 233280;
    return Math.max(8, Math.min(100, base + noise * 30));
  });
  return (
    <div className="flex h-40 items-end gap-1">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-gradient-to-t from-fx-blue/70 via-fx-blue/50 to-fx-blue/90 shadow-[0_0_12px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────── SERVICE REGISTRY ─────────────────────────── */
function RegistryPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "online" | "degraded" | "offline">("all");
  const filtered = HN_SERVICES.filter(
    (s) =>
      (status === "all" || s.status === status) &&
      (q === "" ||
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.category.toLowerCase().includes(q.toLowerCase()) ||
        s.domain.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Registry"
        title="Service Registry"
        desc="Every micro-service in the HN mesh — register, classify and govern access."
        right={
          <>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-3.5 w-3.5" /> Sync
            </Button>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" /> Register Service
            </Button>
          </>
        }
      />

      <Panel className="!p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[240px] flex-1">
            <Input value={q} onChange={setQ} placeholder="Search by name, domain, category…" />
          </div>
          {(["all", "online", "degraded", "offline"] as const).map((s) => (
            <Button
              key={s}
              variant={status === s ? "primary" : "ghost"}
              size="sm"
              onClick={() => setStatus(s)}
            >
              {s !== "all" && <StatusDot status={s} />}
              <span className="capitalize">{s}</span>
            </Button>
          ))}
        </div>
      </Panel>

      <Panel className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fx-line text-left text-[10px] uppercase tracking-wider text-fx-muted">
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Domain</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Uptime</th>
                <th className="px-5 py-3 text-right">Latency</th>
                <th className="px-5 py-3 text-right">Requests 24h</th>
                <th className="px-5 py-3 text-right">Keys</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 40).map((s) => (
                <tr key={s.id} className="border-b border-fx-line transition hover:bg-fx-card">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-fx-blue/25 bg-fx-blue/10 text-[10px] font-bold text-fx-blue">
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{s.name}</div>
                        <div className="font-mono text-[10px] text-fx-muted">{s.id} · {s.version}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-neutral-300">{s.category}</td>
                  <td className="px-5 py-3 font-mono text-xs text-sky-300">{s.domain}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={s.status} />
                      <span className="capitalize text-neutral-300">{s.status}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-fx-green">
                    {s.uptime.toFixed(2)}%
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-fx-blue">{s.latency} ms</td>
                  <td className="px-5 py-3 text-right font-mono text-neutral-300">
                    {fmt(s.requests24h)}
                  </td>
                  <td className="px-5 py-3 text-right text-neutral-300">{s.apiKeys}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-lg border border-fx-line p-1.5 text-fx-muted hover:bg-white/5 hover:text-fx-blue">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded-lg border border-fx-line p-1.5 text-fx-muted hover:bg-white/5 hover:text-fx-blue">
                        <Settings2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-fx-line p-3 text-center text-xs text-fx-muted">
          Showing {Math.min(40, filtered.length)} of {filtered.length} services
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── API KEYS ─────────────────────────── */
function KeysPage() {
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Credentials"
        title="API Keys Vault"
        desc="Issue, rotate and revoke access keys per service. Keys are hashed at rest with AES-256-GCM."
        right={
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5" /> New API Key
          </Button>
        }
      />

      {showNew && (
        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fx-blue" />
              <h3 className="text-sm font-semibold text-white">New Key Generated</h3>
            </div>
            <button onClick={() => setShowNew(false)} className="text-xs text-fx-muted hover:text-white">
              Close
            </button>
          </div>
          <div className="rounded-xl border border-fx-blue/30 bg-black/60 p-4 font-mono text-sm text-fx-blue">
            hnp_live_a29f7Bx13Kq0LmZs847nQpVt_secret_stored_once
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-fx-muted">
            <AlertTriangle className="h-3.5 w-3.5 text-fx-blue" />
            Copy now — this value will never be shown again.
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button variant="ghost" size="sm">
              Download .env
            </Button>
          </div>
        </Panel>
      )}

      <Panel className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fx-line text-left text-[10px] uppercase tracking-wider text-fx-muted">
                <th className="px-5 py-3">Label</th>
                <th className="px-5 py-3">Key</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Scopes</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Last used</th>
                <th className="px-5 py-3 text-right">Requests</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {API_KEYS.map((k) => (
                <tr key={k.id} className="border-b border-fx-line hover:bg-fx-card">
                  <td className="px-5 py-3 text-white">{k.label}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <code className="rounded-md border border-fx-line bg-black/60 px-2 py-1 font-mono text-[11px] text-fx-blue">
                        {k.masked}
                      </code>
                      <button className="text-fx-muted hover:text-fx-blue">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-[11px] text-sky-300">{k.serviceSlug}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.slice(0, 2).map((s) => (
                        <Chip key={s}>{s}</Chip>
                      ))}
                      {k.scopes.length > 2 && <Chip>+{k.scopes.length - 2}</Chip>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-fx-muted">{k.createdAt}</td>
                  <td className="px-5 py-3 text-fx-muted">{k.lastUsed}</td>
                  <td className="px-5 py-3 text-right font-mono text-neutral-300">{fmt(k.requests)}</td>
                  <td className="px-5 py-3">
                    {k.status === "active" ? (
                      <Chip tone="emerald">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Chip>
                    ) : k.status === "revoked" ? (
                      <Chip tone="rose">
                        <XCircle className="h-3 w-3" /> Revoked
                      </Chip>
                    ) : (
                      <Chip tone="amber">
                        <AlertTriangle className="h-3 w-3" /> Expired
                      </Chip>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-lg border border-fx-line p-1.5 text-fx-muted hover:bg-white/5 hover:text-fx-blue">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded-lg border border-fx-line p-1.5 text-fx-muted hover:bg-white/5 hover:text-rose-300">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── DISCOVERY ─────────────────────────── */
function DiscoveryPage() {
  const [url, setUrl] = useState("https://hn-vision.hn.network");
  const [state, setState] = useState<"idle" | "scanning" | "done">("idle");

  const runScan = () => {
    setState("scanning");
    setTimeout(() => setState("done"), 1800);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Auto-Discovery"
        title="Discover a Service"
        desc="Paste any HN or third-party URL. The mesh crawls endpoints, capabilities and generates an identity card."
      />

      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input value={url} onChange={setUrl} placeholder="https://your-service.example.com" />
          </div>
          <Button onClick={runScan}>
            {state === "scanning" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Scanning…
              </>
            ) : (
              <>
                <Radar className="h-4 w-4" /> Run Discovery
              </>
            )}
          </Button>
        </div>

        {state === "scanning" && (
          <div className="mt-6 space-y-2">
            {["Resolving DNS…", "Probing /health & /openapi.json…", "Extracting endpoints…", "Classifying capabilities…", "Generating identity card…"].map(
              (s, i) => (
                <div key={s} className="flex items-center gap-2 text-xs text-fx-muted">
                  <Loader2 className="h-3 w-3 animate-spin text-fx-blue" style={{ animationDelay: `${i * 100}ms` }} />
                  {s}
                </div>
              ),
            )}
          </div>
        )}

        {state === "done" && (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-fx-blue/30 bg-gradient-to-br from-fx-blue/10 to-transparent p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-fx-blue/40 bg-fx-blue/15 text-fx-blue">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-white">HN-Vision</div>
                  <div className="text-[10px] text-fx-muted">svc_0016 · v2.4.7</div>
                </div>
              </div>
              <div className="text-xs text-fx-muted">
                Computer vision inference API. Detected 18 endpoints, 4 categories.
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <Chip tone="amber">AI / ML</Chip>
                <Chip tone="sky">gRPC + REST</Chip>
                <Chip tone="emerald">OpenAPI 3.1</Chip>
              </div>
            </div>
            <div className="lg:col-span-2 rounded-xl border border-fx-line bg-fx-card p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-fx-muted">
                Detected Endpoints
              </div>
              <div className="space-y-1.5">
                {[
                  { m: "POST", p: "/v1/inference/vision/classify" },
                  { m: "POST", p: "/v1/inference/vision/detect" },
                  { m: "GET", p: "/v1/models" },
                  { m: "POST", p: "/v1/embeddings" },
                  { m: "GET", p: "/health" },
                ].map((e) => (
                  <div key={e.p} className="flex items-center gap-2 rounded-lg border border-fx-line bg-fx-bg/60 px-3 py-1.5 text-xs">
                    <span className="rounded border border-fx-green/30 bg-fx-green/10 px-1.5 py-0.5 font-mono text-[10px] text-fx-green">
                      {e.m}
                    </span>
                    <code className="text-neutral-300">{e.p}</code>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" /> Add to Registry
                </Button>
              </div>
            </div>
          </div>
        )}
      </Panel>

      <Panel>
        <h3 className="mb-4 text-sm font-semibold text-white">Recent Discoveries</h3>
        <div className="space-y-2">
          {HN_SERVICES.slice(0, 5).map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-fx-line bg-fx-card px-3 py-2 text-sm">
              <Radar className="h-4 w-4 text-fx-blue" />
              <div className="flex-1">
                <div className="text-white">{s.name}</div>
                <div className="text-[10px] text-fx-muted">{s.domain} · {s.endpoints} endpoints</div>
              </div>
              <Chip tone="emerald">Registered</Chip>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── ORCHESTRATION ─────────────────────────── */
function OrchestrationPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Routing Fabric"
        title="Smart Orchestration"
        desc="Incoming requests are matched to the best service using capability, latency and cost weights."
        right={
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" /> New Rule
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-white">Live Routing Stream</h3>
          <div className="space-y-1.5">
            {LIVE_REQUESTS.map((r) => (
              <RequestRow key={r.id} r={r} />
            ))}
          </div>
        </Panel>
        <Panel>
          <h3 className="mb-4 text-sm font-semibold text-white">Active Routing Rules</h3>
          <div className="space-y-3">
            {[
              { name: "checkout.* → hn-pay", weight: "Latency 60% · Cost 40%" },
              { name: "vision.* → hn-vision", weight: "Region eu-west" },
              { name: "mail.* → hn-mailer", weight: "Fallback: hn-sms" },
              { name: "*.public → edge cache", weight: "TTL 900 s" },
            ].map((r) => (
              <div key={r.name} className="rounded-xl border border-fx-line bg-fx-card p-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-fx-blue" />
                  <div className="font-mono text-xs text-white">{r.name}</div>
                </div>
                <div className="mt-1 text-[10px] text-fx-muted">{r.weight}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ─────────────────────────── MONITORING ─────────────────────────── */
function MonitoringPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Observability"
        title="Mesh Monitoring"
        desc="Uptime, latency, throughput and error budgets across every registered service."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Online" value={NETWORK_KPIS.online} tone="emerald" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Degraded" value={NETWORK_KPIS.degraded} tone="amber" />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="Offline" value={NETWORK_KPIS.offline} tone="rose" />
        <StatCard icon={<Zap className="h-5 w-5" />} label="Avg Latency" value={`${NETWORK_KPIS.avgLatency} ms`} tone="sky" />
      </div>

      <Panel className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fx-line text-left text-[10px] uppercase tracking-wider text-fx-muted">
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Uptime</th>
                <th className="px-5 py-3">p50 Latency</th>
                <th className="px-5 py-3">Errors 24h</th>
                <th className="px-5 py-3">Trend</th>
              </tr>
            </thead>
            <tbody>
              {HN_SERVICES.slice(0, 24).map((s) => (
                <ServiceMonRow key={s.id} s={s} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ServiceMonRow({ s }: { s: HnService }) {
  const bars = Array.from({ length: 32 }, (_, i) => {
    const h = 20 + ((s.latency + i * 7) % 70);
    return h;
  });
  return (
    <tr className="border-b border-fx-line hover:bg-fx-card">
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <StatusDot status={s.status} />
          <div>
            <div className="text-white">{s.name}</div>
            <div className="text-[10px] text-fx-muted">{s.domain}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 capitalize">
        <Chip tone={s.status === "online" ? "emerald" : s.status === "degraded" ? "amber" : "rose"}>
          {s.status}
        </Chip>
      </td>
      <td className="px-5 py-3 font-mono text-fx-green">{s.uptime.toFixed(2)}%</td>
      <td className="px-5 py-3 font-mono text-fx-blue">{s.latency} ms</td>
      <td className="px-5 py-3 font-mono text-rose-300">{s.errors24h}</td>
      <td className="px-5 py-3">
        <div className="flex h-6 items-end gap-[2px]">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`w-[3px] rounded-t ${
                s.status === "offline" ? "bg-rose-400/60" : s.status === "degraded" ? "bg-fx-blue/70" : "bg-fx-green/70"
              }`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </td>
    </tr>
  );
}

/* ─────────────────────────── KNOWLEDGE ─────────────────────────── */
function KnowledgePage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Knowledge"
        title="Service Knowledge Base"
        desc="Living documentation, dependencies and capability profiles auto-refreshed from each service."
        right={
          <Button size="sm" variant="ghost">
            <RefreshCw className="h-3.5 w-3.5" /> Re-index All
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {KNOWLEDGE.map((k) => (
          <Panel key={k.slug} className="!p-5">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-fx-blue/30 bg-fx-blue/10 text-fx-blue">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">{k.title}</div>
                  <div className="text-[10px] text-fx-muted">Updated {k.updated}</div>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-fx-muted" />
            </div>
            <p className="text-xs text-fx-muted">{k.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {k.tags.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-fx-line pt-3 text-[11px] text-fx-muted">
              <span>{k.endpoints} endpoints</span>
              <span>{k.dependents} dependents</span>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── SERVICE MAP ─────────────────────────── */
function ServiceMapPage() {
  const nodes = HN_SERVICES.slice(0, 24);
  // Circular layout
  const positioned = nodes.map((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    const radius = 240;
    return {
      ...n,
      x: 300 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius,
    };
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Topology"
        title="Service Map"
        desc="Live topology of the HN mesh — nodes, capabilities and dependencies."
      />

      <Panel className="!p-0">
        <div className="relative mx-auto aspect-square w-full max-w-[720px]">
          <svg viewBox="0 0 600 600" className="h-full w-full">
            {/* connections to center */}
            {positioned.map((n) => (
              <line
                key={n.id + "l"}
                x1={300}
                y1={300}
                x2={n.x}
                y2={n.y}
                stroke="url(#glow)"
                strokeWidth={0.8}
                opacity={0.5}
              />
            ))}
            {/* cross links */}
            {positioned.map((n, i) => {
              const t = positioned[(i + 5) % positioned.length];
              return (
                <line
                  key={n.id + "c"}
                  x1={n.x}
                  y1={n.y}
                  x2={t.x}
                  y2={t.y}
                  stroke="color-mix(in_oklab,var(--fx-blue)_40%,transparent)"
                  strokeWidth={0.5}
                />
              );
            })}
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%">
                <stop offset="0%" stopColor="color-mix(in_oklab,var(--fx-blue)_40%,transparent)" />
                <stop offset="100%" stopColor="color-mix(in_oklab,var(--fx-blue)_40%,transparent)" />
              </radialGradient>
            </defs>

            {/* center */}
            <circle cx={300} cy={300} r={44} fill="color-mix(in_oklab,var(--fx-blue)_40%,transparent)" stroke="color-mix(in_oklab,var(--fx-blue)_40%,transparent)" strokeWidth={1.5} />
            <text x={300} y={296} textAnchor="middle" className="fill-fx-blue" fontSize={11} fontWeight="700">
              HN-PAY
            </text>
            <text x={300} y={312} textAnchor="middle" className="fill-fx-blue/70" fontSize={8}>
              HUB
            </text>

            {positioned.map((n) => {
              const color =
                n.status === "online" ? "#34d399" : n.status === "degraded" ? "#fbbf24" : "#f43f5e";
              return (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={16} fill="rgba(0,0,0,0.6)" stroke={color} strokeWidth={1.5} />
                  <circle cx={n.x} cy={n.y} r={4} fill={color} opacity={0.9} />
                  <text x={n.x} y={n.y + 30} textAnchor="middle" className="fill-neutral-300" fontSize={8}>
                    {n.name.length > 12 ? n.name.slice(0, 11) + "…" : n.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-fx-line p-4 text-xs text-fx-muted">
          <span className="flex items-center gap-1.5"><StatusDot status="online" /> Online</span>
          <span className="flex items-center gap-1.5"><StatusDot status="degraded" /> Degraded</span>
          <span className="flex items-center gap-1.5"><StatusDot status="offline" /> Offline</span>
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── SEARCH ─────────────────────────── */
function SearchPage() {
  const [q, setQ] = useState("payment");
  const results = HN_SERVICES.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.category.toLowerCase().includes(q.toLowerCase()) ||
      s.description.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Discover"
        title="Service Search"
        desc="Semantic search across the HN mesh — services, endpoints, docs and capabilities."
      />
      <Panel>
        <div className="flex items-center gap-3 rounded-xl border border-fx-blue/30 bg-black/50 px-4 py-3">
          <Search className="h-5 w-5 text-fx-blue" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search anything in the HN network…"
            className="flex-1 bg-transparent text-lg text-white placeholder:text-neutral-600 outline-none"
          />
          <Chip tone="amber">{results.length} results</Chip>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {results.slice(0, 12).map((s) => (
          <Panel key={s.id} className="!p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-fx-blue/30 bg-fx-blue/10 text-[11px] font-bold text-fx-blue">
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-white">{s.name}</div>
                  <div className="font-mono text-[10px] text-sky-300">{s.domain}</div>
                </div>
              </div>
              <StatusDot status={s.status} />
            </div>
            <p className="mt-3 text-xs text-fx-muted">{s.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Chip tone="amber">{s.category}</Chip>
              <Chip>{s.endpoints} endpoints</Chip>
              <Chip>v{s.version}</Chip>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── PERMISSIONS ─────────────────────────── */
function PermissionsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Governance"
        title="Permissions Matrix"
        desc="Fine-grained control over what each role can do inside the HN Hub."
      />

      <Panel className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fx-line text-left text-[10px] uppercase tracking-wider text-fx-muted">
                <th className="px-5 py-3">Capability</th>
                <th className="px-5 py-3 text-center">Owner</th>
                <th className="px-5 py-3 text-center">Admin</th>
                <th className="px-5 py-3 text-center">Operator</th>
                <th className="px-5 py-3 text-center">Developer</th>
                <th className="px-5 py-3 text-center">Auditor</th>
                <th className="px-5 py-3 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody>
              {ROLE_MATRIX.map((r) => (
                <tr key={r.capability} className="border-b border-fx-line hover:bg-fx-card">
                  <td className="px-5 py-3 text-white">{r.capability}</td>
                  {(["owner", "admin", "operator", "developer", "auditor", "viewer"] as const).map(
                    (role) => (
                      <td key={role} className="px-5 py-3 text-center">
                        {r[role] ? (
                          <CheckCircle2 className="mx-auto h-4 w-4 text-fx-green" />
                        ) : (
                          <XCircle className="mx-auto h-4 w-4 text-neutral-700" />
                        )}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── USERS ─────────────────────────── */
function UsersPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Team"
        title="Users & Roles"
        desc="Every human and service account with access to the HN Hub."
        right={
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" /> Invite Member
          </Button>
        }
      />

      <Panel className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fx-line text-left text-[10px] uppercase tracking-wider text-fx-muted">
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Services</th>
                <th className="px-5 py-3">Last active</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {USERS.map((u) => (
                <tr key={u.id} className="border-b border-fx-line hover:bg-fx-card">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-fx-blue/30 bg-gradient-to-br from-fx-blue/25 to-transparent text-[11px] font-bold text-fx-blue">
                        {u.avatar}
                      </div>
                      <div>
                        <div className="text-white">{u.name}</div>
                        <div className="text-[10px] text-fx-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Chip
                      tone={
                        u.role === "owner"
                          ? "amber"
                          : u.role === "admin"
                          ? "violet"
                          : u.role === "auditor"
                          ? "sky"
                          : "neutral"
                      }
                    >
                      {u.role === "owner" && <Crown className="h-3 w-3" />}
                      {u.role}
                    </Chip>
                  </td>
                  <td className="px-5 py-3 text-neutral-300">{u.services}</td>
                  <td className="px-5 py-3 text-fx-muted">{u.lastActive}</td>
                  <td className="px-5 py-3">
                    {u.status === "active" ? (
                      <Chip tone="emerald">Active</Chip>
                    ) : u.status === "invited" ? (
                      <Chip tone="amber">Invited</Chip>
                    ) : (
                      <Chip tone="rose">Suspended</Chip>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-lg border border-fx-line p-1.5 text-fx-muted hover:bg-white/5 hover:text-fx-blue">
                        <Settings2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── ANALYTICS ─────────────────────────── */
function AnalyticsPage() {
  const topServices = HN_SERVICES.slice().sort((a, b) => b.requests24h - a.requests24h).slice(0, 8);
  const topRevenue = HN_SERVICES.slice().sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 8);
  const maxR = topServices[0].requests24h;
  const maxRev = topRevenue[0].monthlyRevenue;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Insights"
        title="Network Analytics"
        desc="Traffic, revenue and performance breakdowns across the HN mesh."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={<Activity className="h-5 w-5" />} label="Requests 24h" value={fmt(NETWORK_KPIS.requests24h)} tone="sky" />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Revenue 30d" value={`$${fmt(NETWORK_KPIS.revenue30d)}`} tone="emerald" />
        <StatCard icon={<Zap className="h-5 w-5" />} label="Avg Latency" value={`${NETWORK_KPIS.avgLatency} ms`} tone="amber" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Team Members" value={NETWORK_KPIS.users} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <h3 className="mb-4 text-sm font-semibold text-white">Most-Called Services</h3>
          <div className="space-y-3">
            {topServices.map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-neutral-300">{s.name}</span>
                  <span className="font-mono text-fx-blue">{fmt(s.requests24h)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fx-blue to-fx-blue shadow-[0_0_12px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]"
                    style={{ width: `${(s.requests24h / maxR) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="mb-4 text-sm font-semibold text-white">Top Revenue Generators</h3>
          <div className="space-y-3">
            {topRevenue.map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-neutral-300">{s.name}</span>
                  <span className="font-mono text-fx-green">${fmt(s.monthlyRevenue)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fx-green to-fx-green shadow-[0_0_12px_rgba(16,185,129,0.55)]"
                    style={{ width: `${(s.monthlyRevenue / maxRev) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ─────────────────────────── AI COORDINATOR ─────────────────────────── */
function AiPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Autopilot"
        title="AI Coordinator"
        desc="The HN Coordinator observes the mesh 24/7 and proposes routing, merges and optimizations."
        right={
          <Chip tone="emerald">
            <Sparkles className="h-3 w-3" /> Learning
          </Chip>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {AI_SUGGESTIONS.map((s) => (
          <Panel key={s.id}>
            <div className="mb-3 flex items-center justify-between">
              <Chip
                tone={
                  s.type === "security" ? "rose" : s.type === "merge" ? "violet" : s.type === "route" ? "sky" : "amber"
                }
              >
                {s.type}
              </Chip>
              <div className="flex items-center gap-2 text-[11px] text-fx-muted">
                Confidence
                <span className="font-mono text-fx-blue">{Math.round(s.confidence * 100)}%</span>
              </div>
            </div>
            <h4 className="text-base font-semibold text-white">{s.title}</h4>
            <p className="mt-1 text-xs text-fx-muted">{s.detail}</p>
            <div className="mt-4 flex items-center justify-between">
              <Chip
                tone={s.impact === "high" ? "rose" : s.impact === "medium" ? "amber" : "sky"}
              >
                {s.impact} impact
              </Chip>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Dismiss</Button>
                <Button size="sm">
                  <Play className="h-3.5 w-3.5" /> Apply
                </Button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── UNIFIED CHECKOUT ─────────────────────────── */
function UnifiedCheckoutPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Embedded"
        title="Unified Cloud Checkout"
        desc="A single, brand-consistent payment window that pops up on any of the 152 HN sites when a customer clicks 'Pay'."
        right={
          <Button onClick={() => setOpen(true)}>
            <Rocket className="h-4 w-4" /> Preview Popup
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-white">How it works</h3>
          <ol className="space-y-3 text-sm text-neutral-300">
            {[
              "Customer clicks 'Pay' on any HN site (hn-shop, hn-menu, hn-lavage…).",
              "Site calls hn-pay/v1/checkout/session with its API key.",
              "HN-Pay resolves the merchant, tax profile and currency automatically.",
              "The unified checkout window pops up — same UX, same brand tokens.",
              "On success, HN-Pay emits a signed webhook back to the origin site.",
            ].map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-fx-blue/40 bg-fx-blue/10 text-[11px] font-bold text-fx-blue">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel>
          <h3 className="mb-3 text-sm font-semibold text-white">Embed snippet</h3>
          <pre className="overflow-x-auto rounded-xl border border-fx-line bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-fx-blue">
{`<script
  src="https://cdn.hn-pay.io/v1/checkout.js"
  data-key="hnp_live_..."
  data-app="hn-lavage">
</script>

<button onclick="HNPay.open({ plan: 'pro' })">
  Pay with HN
</button>`}
          </pre>
        </Panel>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-fx-blue/40 bg-gradient-to-b from-[#0a0d1c] to-black p-8 shadow-[0_0_80px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-lg border border-fx-line p-1.5 text-fx-muted hover:text-white"
            >
              <XCircle className="h-4 w-4" />
            </button>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-fx-blue/50 bg-fx-blue/15 shadow-[0_0_25px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]">
                <Crown className="h-5 w-5 text-fx-blue" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-fx-blue/80">HN-Pay · Secure</div>
                <div className="text-lg font-bold text-white">Unified Checkout</div>
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-fx-line bg-fx-bg/60 p-4">
              <div className="flex items-center justify-between text-xs text-fx-muted">
                <span>Merchant</span>
                <span className="text-white">HN-Lavage</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-fx-muted">
                <span>Plan</span>
                <span className="text-white">Pro · Monthly</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-fx-line pt-2 text-sm">
                <span className="text-neutral-300">Total due</span>
                <span className="font-mono text-fx-blue">$49.00</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-wider text-fx-muted">Card number</span>
                <input
                  className="w-full rounded-xl border border-fx-line bg-black/50 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-fx-blue/50"
                  defaultValue="4242 4242 4242 4242"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span className="mb-1 block text-[10px] uppercase tracking-wider text-fx-muted">MM/YY</span>
                  <input
                    className="w-full rounded-xl border border-fx-line bg-black/50 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-fx-blue/50"
                    defaultValue="12/28"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-[10px] uppercase tracking-wider text-fx-muted">CVV</span>
                  <input
                    className="w-full rounded-xl border border-fx-line bg-black/50 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-fx-blue/50"
                    defaultValue="123"
                  />
                </label>
              </div>
            </div>

            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-fx-blue/50 bg-gradient-to-b from-fx-blue/30 to-fx-blue/10 py-3 text-sm font-semibold text-fx-blue shadow-[0_0_30px_-5px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]">
              <Fingerprint className="h-4 w-4" /> Confirm Secure Payment
            </button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-fx-muted">
              <ShieldCheck className="h-3 w-3 text-fx-green" />
              Encrypted end-to-end · PCI-DSS L1
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── utils ─────────────────────────── */
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}
