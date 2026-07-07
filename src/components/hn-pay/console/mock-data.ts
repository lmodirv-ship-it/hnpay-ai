export type ServiceStatus = "online" | "degraded" | "offline";
export type Role = "owner" | "admin" | "operator" | "auditor" | "developer" | "viewer";

export interface HnService {
  id: string;
  name: string;
  slug: string;
  domain: string;
  category: string;
  status: ServiceStatus;
  uptime: number; // %
  latency: number; // ms
  requests24h: number;
  errors24h: number;
  version: string;
  owner: string;
  createdAt: string;
  apiKeys: number;
  monthlyRevenue: number;
  description: string;
  dependencies: string[];
  endpoints: number;
}

const categories = [
  "Payments", "AI / ML", "Media", "Logistics", "Analytics",
  "Auth & Identity", "Storage", "Communication", "E-Commerce",
  "Design Tools", "Automation", "IoT", "CRM", "Publishing",
];

const seedServices: Array<Partial<HnService> & Pick<HnService, "name" | "slug" | "category">> = [
  { name: "HN-Build", slug: "hn-build", category: "Design Tools", description: "Landing page & site builder engine for HN network." },
  { name: "FilmForge", slug: "filmforge", category: "Media", description: "AI-driven cinematic video generation pipeline." },
  { name: "HN-Lavage", slug: "hn-lavage", category: "Logistics", description: "On-demand car wash booking & fleet ops." },
  { name: "HN-Pay", slug: "hn-pay", category: "Payments", description: "Unified billing, subscriptions & treasury vault." },
  { name: "HN-Auth", slug: "hn-auth", category: "Auth & Identity", description: "SSO, RBAC & session broker for the HN mesh." },
  { name: "HN-Vault", slug: "hn-vault", category: "Storage", description: "Encrypted object storage with signed URLs." },
  { name: "HN-Mailer", slug: "hn-mailer", category: "Communication", description: "Transactional & marketing email dispatcher." },
  { name: "HN-SMS", slug: "hn-sms", category: "Communication", description: "Multi-carrier SMS & OTP gateway." },
  { name: "HN-Insights", slug: "hn-insights", category: "Analytics", description: "Cross-app event pipeline & funnels." },
  { name: "HN-Shop", slug: "hn-shop", category: "E-Commerce", description: "Headless commerce nodes for micro-brands." },
  { name: "HN-Menu", slug: "hn-menu", category: "E-Commerce", description: "Restaurant menu & QR order engine." },
  { name: "HN-CRM", slug: "hn-crm", category: "CRM", description: "Client relationship & pipeline manager." },
  { name: "HN-Automate", slug: "hn-automate", category: "Automation", description: "Workflow orchestrator across HN services." },
  { name: "HN-Docs", slug: "hn-docs", category: "Publishing", description: "Docs & knowledge site generator." },
  { name: "HN-IoT", slug: "hn-iot", category: "IoT", description: "Device registry & telemetry hub." },
  { name: "HN-Vision", slug: "hn-vision", category: "AI / ML", description: "Computer vision inference API." },
  { name: "HN-Voice", slug: "hn-voice", category: "AI / ML", description: "Speech-to-text & voice cloning gateway." },
  { name: "HN-Translate", slug: "hn-translate", category: "AI / ML", description: "Neural translation across 42 languages." },
  { name: "HN-Ledger", slug: "hn-ledger", category: "Payments", description: "Immutable transaction ledger & reconciliation." },
  { name: "HN-Invoice", slug: "hn-invoice", category: "Payments", description: "Invoice PDF & tax compliance service." },
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pseudo(seed: string, min: number, max: number): number {
  const h = hash(seed);
  return min + (h % (max - min + 1));
}

export const HN_SERVICES: HnService[] = Array.from({ length: 152 }, (_, i) => {
  const seed = seedServices[i % seedServices.length];
  const idx = i + 1;
  const suffix = i >= seedServices.length ? `-${String(idx).padStart(3, "0")}` : "";
  const name = `${seed.name}${suffix}`;
  const slug = `${seed.slug}${suffix}`;
  const status: ServiceStatus =
    i % 37 === 0 ? "offline" : i % 13 === 0 ? "degraded" : "online";
  const cat = seed.category ?? categories[i % categories.length];
  return {
    id: `svc_${String(idx).padStart(4, "0")}`,
    name,
    slug,
    domain: `${slug}.hn.network`,
    category: cat,
    status,
    uptime: status === "online" ? 99 + (pseudo(slug + "u", 0, 99) / 100) : status === "degraded" ? 96 + (pseudo(slug + "u", 0, 350) / 100) : 87 + (pseudo(slug + "u", 0, 500) / 100),
    latency: status === "offline" ? 0 : pseudo(slug + "l", 34, 480),
    requests24h: pseudo(slug + "r", 1200, 480000),
    errors24h: status === "online" ? pseudo(slug + "e", 0, 40) : pseudo(slug + "e", 80, 900),
    version: `v${1 + (i % 4)}.${i % 12}.${pseudo(slug + "v", 0, 40)}`,
    owner: ["Ismail HN", "Mouad HN", "Yasmin HN", "Karim HN"][i % 4],
    createdAt: new Date(2024, i % 12, 1 + (i % 27)).toISOString().slice(0, 10),
    apiKeys: pseudo(slug + "k", 1, 12),
    monthlyRevenue: pseudo(slug + "m", 120, 48000),
    description: seed.description ?? "HN network micro-service node.",
    dependencies: [
      "hn-auth",
      i % 2 === 0 ? "hn-pay" : "hn-vault",
      i % 3 === 0 ? "hn-insights" : "hn-mailer",
    ].filter((d) => d !== slug),
    endpoints: pseudo(slug + "ep", 3, 42),
  };
});

export interface ApiKey {
  id: string;
  label: string;
  serviceSlug: string;
  prefix: string;
  masked: string;
  scopes: string[];
  createdAt: string;
  lastUsed: string;
  status: "active" | "revoked" | "expired";
  requests: number;
}

export const API_KEYS: ApiKey[] = HN_SERVICES.slice(0, 14).map((s, i) => ({
  id: `key_${String(i + 1).padStart(4, "0")}`,
  label: `${s.name} — ${["Prod", "Staging", "Edge", "Mobile"][i % 4]}`,
  serviceSlug: s.slug,
  prefix: `hnp_${["live", "test", "edge"][i % 3]}`,
  masked: `hnp_${["live", "test", "edge"][i % 3]}_${"•".repeat(20)}${(hash(s.slug) % 10000)
    .toString()
    .padStart(4, "0")}`,
  scopes: [
    ["read:services", "write:services"],
    ["read:payments", "write:payments", "read:invoices"],
    ["read:analytics"],
    ["read:services", "read:analytics", "write:webhooks"],
  ][i % 4],
  createdAt: new Date(2025, i % 12, 1 + (i % 27)).toISOString().slice(0, 10),
  lastUsed: `${pseudo(s.slug + "lu", 1, 59)} min ago`,
  status: i === 3 ? "revoked" : i === 7 ? "expired" : "active",
  requests: pseudo(s.slug + "kr", 4000, 380000),
}));

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  services: number;
  lastActive: string;
  status: "active" | "invited" | "suspended";
}

export const USERS: User[] = [
  { id: "u_001", name: "Moulay Ismail Al-Hasani", email: "ismail@hn.group", role: "owner", avatar: "MI", services: 152, lastActive: "now", status: "active" },
  { id: "u_002", name: "Mouad Bennani", email: "mouad@hn.group", role: "admin", avatar: "MB", services: 48, lastActive: "3 min ago", status: "active" },
  { id: "u_003", name: "Yasmin El Fassi", email: "yasmin@hn.group", role: "operator", avatar: "YF", services: 22, lastActive: "12 min ago", status: "active" },
  { id: "u_004", name: "Karim Idrissi", email: "karim@hn.group", role: "developer", avatar: "KI", services: 14, lastActive: "1 h ago", status: "active" },
  { id: "u_005", name: "Salma Ouazzani", email: "salma@hn.group", role: "auditor", avatar: "SO", services: 152, lastActive: "yesterday", status: "active" },
  { id: "u_006", name: "Rachid Alami", email: "rachid@hn.group", role: "developer", avatar: "RA", services: 8, lastActive: "2 days ago", status: "invited" },
  { id: "u_007", name: "Nadia Chraibi", email: "nadia@hn.group", role: "viewer", avatar: "NC", services: 152, lastActive: "1 week ago", status: "suspended" },
];

export const ROLE_MATRIX: Array<{ capability: string; owner: boolean; admin: boolean; operator: boolean; developer: boolean; auditor: boolean; viewer: boolean }> = [
  { capability: "Manage services & registry", owner: true, admin: true, operator: false, developer: false, auditor: false, viewer: false },
  { capability: "Issue / revoke API keys", owner: true, admin: true, operator: true, developer: false, auditor: false, viewer: false },
  { capability: "Deploy new endpoints", owner: true, admin: true, operator: false, developer: true, auditor: false, viewer: false },
  { capability: "View analytics & revenue", owner: true, admin: true, operator: true, developer: true, auditor: true, viewer: true },
  { capability: "Access billing vault", owner: true, admin: true, operator: false, developer: false, auditor: true, viewer: false },
  { capability: "Approve orchestration rules", owner: true, admin: true, operator: false, developer: false, auditor: false, viewer: false },
  { capability: "Read audit trail", owner: true, admin: true, operator: false, developer: false, auditor: true, viewer: false },
];

export interface LiveRequest {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  from: string;
  to: string;
  latency: number;
  status: number;
  time: string;
}

export const LIVE_REQUESTS: LiveRequest[] = [
  { id: "req_9f3a", method: "POST", path: "/v1/checkout/session", from: "hn-shop", to: "hn-pay", latency: 128, status: 200, time: "just now" },
  { id: "req_9f2c", method: "GET", path: "/v1/services/discover", from: "hn-build", to: "hn-registry", latency: 42, status: 200, time: "2 s ago" },
  { id: "req_9f1d", method: "POST", path: "/v1/inference/vision", from: "filmforge", to: "hn-vision", latency: 812, status: 200, time: "3 s ago" },
  { id: "req_9f0e", method: "GET", path: "/v1/user/session", from: "hn-lavage", to: "hn-auth", latency: 34, status: 200, time: "5 s ago" },
  { id: "req_9edf", method: "POST", path: "/v1/mail/dispatch", from: "hn-crm", to: "hn-mailer", latency: 210, status: 202, time: "7 s ago" },
  { id: "req_9ecf", method: "POST", path: "/v1/invoice/generate", from: "hn-pay", to: "hn-invoice", latency: 340, status: 200, time: "9 s ago" },
  { id: "req_9ebf", method: "GET", path: "/v1/analytics/funnel", from: "hn-insights", to: "hn-ledger", latency: 512, status: 200, time: "12 s ago" },
  { id: "req_9eaf", method: "POST", path: "/v1/translate", from: "hn-docs", to: "hn-translate", latency: 168, status: 200, time: "15 s ago" },
  { id: "req_9e9f", method: "DELETE", path: "/v1/keys/hnp_live_xxxx", from: "console", to: "hn-auth", latency: 28, status: 204, time: "22 s ago" },
  { id: "req_9e8f", method: "POST", path: "/v1/webhook/stripe", from: "hn-pay", to: "hn-ledger", latency: 96, status: 200, time: "28 s ago" },
];

export interface AiSuggestion {
  id: string;
  type: "merge" | "optimize" | "deprecate" | "route" | "security";
  title: string;
  detail: string;
  impact: "high" | "medium" | "low";
  confidence: number;
}

export const AI_SUGGESTIONS: AiSuggestion[] = [
  { id: "ai_1", type: "merge", title: "Merge HN-SMS with HN-Mailer", detail: "78% of hn-sms endpoints duplicate hn-mailer templates. Consolidating cuts 41% infra cost.", impact: "high", confidence: 0.92 },
  { id: "ai_2", type: "route", title: "Reroute hn-shop → hn-ledger via edge", detail: "Median latency drops from 340 ms to 92 ms with the eu-west edge node.", impact: "high", confidence: 0.88 },
  { id: "ai_3", type: "security", title: "Rotate 3 exposed keys on hn-vault", detail: "Detected keys older than 180 days with wide scopes. Auto-rotate recommended.", impact: "high", confidence: 0.97 },
  { id: "ai_4", type: "optimize", title: "Cache hn-translate responses", detail: "62% of translation calls are repeats. TTL 24 h saves ~$1.2k/mo.", impact: "medium", confidence: 0.81 },
  { id: "ai_5", type: "deprecate", title: "Deprecate legacy hn-menu-002", detail: "0 traffic for 47 days. Safe to archive.", impact: "low", confidence: 0.99 },
  { id: "ai_6", type: "merge", title: "Similar services detected: hn-invoice ↔ hn-ledger", detail: "72% API surface overlap. Consider unifying billing surface.", impact: "medium", confidence: 0.74 },
];

export interface KnowledgeEntry {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  updated: string;
  endpoints: number;
  dependents: number;
}

export const KNOWLEDGE: KnowledgeEntry[] = HN_SERVICES.slice(0, 24).map((s, i) => ({
  slug: s.slug,
  title: s.name,
  summary: s.description,
  tags: [s.category.toLowerCase(), "hn-network", i % 2 ? "public" : "internal", "v" + (1 + (i % 4))],
  updated: `${pseudo(s.slug + "kb", 1, 30)} days ago`,
  endpoints: s.endpoints,
  dependents: pseudo(s.slug + "dp", 2, 48),
}));

export const NETWORK_KPIS = {
  totalServices: HN_SERVICES.length,
  online: HN_SERVICES.filter((s) => s.status === "online").length,
  degraded: HN_SERVICES.filter((s) => s.status === "degraded").length,
  offline: HN_SERVICES.filter((s) => s.status === "offline").length,
  requests24h: HN_SERVICES.reduce((a, s) => a + s.requests24h, 0),
  revenue30d: HN_SERVICES.reduce((a, s) => a + s.monthlyRevenue, 0),
  users: USERS.length,
  apiKeys: API_KEYS.length,
  avgLatency: Math.round(
    HN_SERVICES.filter((s) => s.latency > 0).reduce((a, s) => a + s.latency, 0) /
      HN_SERVICES.filter((s) => s.latency > 0).length,
  ),
  avgUptime:
    Math.round(
      (HN_SERVICES.reduce((a, s) => a + s.uptime, 0) / HN_SERVICES.length) * 100,
    ) / 100,
};
