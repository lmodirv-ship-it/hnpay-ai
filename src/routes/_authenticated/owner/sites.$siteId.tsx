import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Plus, Copy, Check, Trash2 } from "lucide-react";
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  listPlans,
  createPlan,
  togglePlan,
  listSites,
  listSitePayments,
  listSiteWebhookEvents,
} from "@/lib/hn-pay/sites.functions";
import { OwnerShell } from "@/routes/_authenticated/owner/dashboard";
import { CopyRow } from "@/routes/_authenticated/owner/sites";
import { useHnSession } from "@/lib/auth/use-session";

export const Route = createFileRoute("/_authenticated/owner/sites/$siteId")({
  ssr: false,
  head: () => ({ meta: [{ title: "Site · HN-Pay" }] }),
  component: SiteDetail,
});

function SiteDetail() {
  const { profile, signOut } = useHnSession();
  const { siteId } = Route.useParams();
  const qc = useQueryClient();

  const sitesFn = useServerFn(listSites);
  const { data: sites = [] } = useQuery({ queryKey: ["hn-pay", "sites"], queryFn: () => sitesFn() });
  const site = sites.find((s) => s.id === siteId);

  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <Link
        to="/owner/sites"
        className="mb-4 inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" /> All sites
      </Link>
      <div className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">
          Site
        </div>
        <h1 className="text-3xl font-bold">{site?.name ?? "Loading…"}</h1>
        <p className="mt-1 text-sm text-neutral-400">{site?.domain}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ApiKeysPanel siteId={siteId} qc={qc} />
        <PlansPanel siteId={siteId} qc={qc} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PaymentsPanel siteId={siteId} />
        <WebhookEventsPanel siteId={siteId} />
      </div>

      <IntegrationSnippet siteId={siteId} domain={site?.domain} />
    </OwnerShell>
  );
}

/* ────────── API Keys ────────── */

function ApiKeysPanel({ siteId, qc }: { siteId: string; qc: ReturnType<typeof useQueryClient> }) {
  const listFn = useServerFn(listApiKeys);
  const createFn = useServerFn(createApiKey);
  const revokeFn = useServerFn(revokeApiKey);

  const { data: keys = [] } = useQuery({
    queryKey: ["hn-pay", "keys", siteId],
    queryFn: () => listFn({ data: { siteId } }),
  });

  const [label, setLabel] = useState("Production");
  const [mode, setMode] = useState<"live" | "test">("live");
  const [freshKey, setFreshKey] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => createFn({ data: { siteId, label, mode } }),
    onSuccess: (res) => {
      setFreshKey(res.full_key);
      qc.invalidateQueries({ queryKey: ["hn-pay", "keys", siteId] });
    },
  });

  const revoke = useMutation({
    mutationFn: (id: string) => revokeFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hn-pay", "keys", siteId] }),
  });

  return (
    <Panel title="API Keys" desc="Server-only. Use in your site's backend to create checkout sessions.">
      {freshKey && (
        <div className="mb-3 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
            Copy this key now — it will not be shown again
          </div>
          <CopyRow label="api_key" value={freshKey} />
          <button
            onClick={() => setFreshKey(null)}
            className="mt-2 text-[10px] text-neutral-400 hover:text-white"
          >
            I've saved it
          </button>
        </div>
      )}
      <div className="mb-3 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          className="flex-1 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs"
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "live" | "test")}
          className="rounded-lg border border-white/10 bg-black/60 px-2 py-2 text-xs"
        >
          <option value="live">live</option>
          <option value="test">test</option>
        </select>
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-black hover:brightness-110 disabled:opacity-50"
        >
          <Plus className="h-3 w-3" /> Generate
        </button>
      </div>
      <div className="space-y-2">
        {keys.map((k) => (
          <div
            key={k.id}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-3"
          >
            <div>
              <div className="text-xs font-semibold">
                {k.label}{" "}
                <span
                  className={`ml-2 rounded px-1.5 py-0.5 text-[9px] uppercase ${
                    k.mode === "live"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-sky-500/20 text-sky-300"
                  }`}
                >
                  {k.mode}
                </span>
                {k.revoked_at && (
                  <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] uppercase text-red-300">
                    revoked
                  </span>
                )}
              </div>
              <div className="font-mono text-[11px] text-neutral-500">
                {k.key_prefix}••••••••
              </div>
            </div>
            {!k.revoked_at && (
              <button
                onClick={() => revoke.mutate(k.id)}
                className="rounded border border-red-500/30 p-1.5 text-red-300 hover:bg-red-500/10"
                title="Revoke"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {keys.length === 0 && (
          <div className="text-xs text-neutral-500">No keys yet.</div>
        )}
      </div>
    </Panel>
  );
}

/* ────────── Plans ────────── */

function PlansPanel({ siteId, qc }: { siteId: string; qc: ReturnType<typeof useQueryClient> }) {
  const listFn = useServerFn(listPlans);
  const createFn = useServerFn(createPlan);
  const toggleFn = useServerFn(togglePlan);

  const { data: plans = [] } = useQuery({
    queryKey: ["hn-pay", "plans", siteId],
    queryFn: () => listFn({ data: { siteId } }),
  });

  const [form, setForm] = useState({
    code: "",
    name: "",
    amount: 0,
    currency: "USD",
    billing_interval: "month" as "month" | "year" | "one_time",
  });

  const create = useMutation({
    mutationFn: () => createFn({ data: { siteId, ...form } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hn-pay", "plans", siteId] });
      setForm({ code: "", name: "", amount: 0, currency: "USD", billing_interval: "month" });
    },
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hn-pay", "plans", siteId] }),
  });

  return (
    <Panel title="Plans" desc="Prices your site can charge. Reference by `code` from your backend.">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="pro_monthly"
          className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs"
        />
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Pro Monthly"
          className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs"
        />
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          placeholder="9.99"
          className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs"
        />
        <input
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
          placeholder="USD"
          maxLength={3}
          className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs uppercase"
        />
        <select
          value={form.billing_interval}
          onChange={(e) =>
            setForm({ ...form, billing_interval: e.target.value as typeof form.billing_interval })
          }
          className="col-span-2 rounded-lg border border-white/10 bg-black/60 px-2 py-2 text-xs"
        >
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
          <option value="one_time">One-time</option>
        </select>
      </div>
      <button
        onClick={() => create.mutate()}
        disabled={create.isPending || !form.code || !form.name || form.amount <= 0}
        className="mb-3 w-full rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-black hover:brightness-110 disabled:opacity-50"
      >
        {create.isPending ? "Adding…" : "Add plan"}
      </button>
      <div className="space-y-2">
        {plans.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-3"
          >
            <div>
              <div className="text-xs font-semibold">
                {p.name}{" "}
                <span className="font-mono text-[10px] text-neutral-500">{p.code}</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                {Number(p.amount).toFixed(2)} {p.currency}
                {p.billing_interval ? ` / ${p.billing_interval}` : " · one-time"}
              </div>
            </div>
            <button
              onClick={() => toggle.mutate({ id: p.id, active: !p.is_active })}
              className={`rounded border px-2 py-1 text-[10px] ${
                p.is_active
                  ? "border-emerald-400/30 text-emerald-300"
                  : "border-neutral-500/40 text-neutral-400"
              }`}
            >
              {p.is_active ? "Active" : "Inactive"}
            </button>
          </div>
        ))}
        {plans.length === 0 && <div className="text-xs text-neutral-500">No plans yet.</div>}
      </div>
    </Panel>
  );
}

/* ────────── Payments & Events ────────── */

function PaymentsPanel({ siteId }: { siteId: string }) {
  const fn = useServerFn(listSitePayments);
  const { data: rows = [] } = useQuery({
    queryKey: ["hn-pay", "payments", siteId],
    queryFn: () => fn({ data: { siteId } }),
  });
  return (
    <Panel title="Recent payments" desc="Latest 50 transactions.">
      <div className="space-y-1 text-xs">
        {rows.map((r) => (
          <div key={r.public_id} className="flex justify-between rounded border border-white/5 bg-black/30 p-2">
            <div>
              <div className="font-mono text-[11px] text-neutral-400">{r.public_id}</div>
              <div className="text-[10px] text-neutral-500">
                {new Date(r.created_at).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-white">
                {Number(r.amount).toFixed(2)} {r.currency}
              </div>
              <div
                className={`text-[10px] ${
                  r.status === "succeeded" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {r.status}
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-neutral-500">No payments yet.</div>}
      </div>
    </Panel>
  );
}

function WebhookEventsPanel({ siteId }: { siteId: string }) {
  const fn = useServerFn(listSiteWebhookEvents);
  const { data: rows = [] } = useQuery({
    queryKey: ["hn-pay", "events", siteId],
    queryFn: () => fn({ data: { siteId } }),
  });
  return (
    <Panel title="Webhook deliveries" desc="Events sent to your site's webhook URL.">
      <div className="space-y-1 text-xs">
        {rows.map((r) => (
          <div key={r.public_id} className="flex justify-between rounded border border-white/5 bg-black/30 p-2">
            <div>
              <div className="font-mono text-[11px] text-amber-200">{r.event_type}</div>
              <div className="text-[10px] text-neutral-500">
                {new Date(r.created_at).toLocaleString()} · attempts: {r.attempts}
              </div>
            </div>
            <div
              className={`self-center rounded px-2 py-0.5 text-[10px] ${
                r.delivered
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {r.delivered ? `OK (${r.last_response_status ?? ""})` : "failed"}
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-neutral-500">No events yet.</div>}
      </div>
    </Panel>
  );
}

/* ────────── Integration snippet ────────── */

function IntegrationSnippet({ siteId: _siteId, domain }: { siteId: string; domain?: string }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-hnpay-hub";
  const [tab, setTab] = useState<"node" | "curl">("node");
  const nodeSnippet = `// On your site's SERVER (never in the browser)
const res = await fetch("${origin}/api/v1/checkout-sessions", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "authorization": \`Bearer \${process.env.HN_PAY_API_KEY}\`,
  },
  body: JSON.stringify({
    plan_code: "pro_monthly",
    customer: { external_id: user.id, email: user.email },
    success_url: "https://${domain ?? "your-site"}/payment/success",
    cancel_url:  "https://${domain ?? "your-site"}/payment/cancel",
    metadata: { user_id: user.id },
  }),
});
const { checkout_url } = await res.json();
// then redirect the user to checkout_url`;

  const curlSnippet = `curl -X POST ${origin}/api/v1/checkout-sessions \\
  -H "authorization: Bearer sk_live_..." \\
  -H "content-type: application/json" \\
  -d '{"plan_code":"pro_monthly","customer":{"external_id":"user_123","email":"a@b.com"}}'`;

  return (
    <div className="mt-8 rounded-2xl border border-amber-500/20 bg-black/40 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">
            Integration
          </div>
          <h2 className="text-lg font-bold">How your site calls HN-Pay</h2>
        </div>
        <div className="flex gap-1 rounded-lg border border-white/10 p-1 text-xs">
          <button
            onClick={() => setTab("node")}
            className={`rounded px-2 py-1 ${tab === "node" ? "bg-amber-500/20 text-amber-200" : "text-neutral-400"}`}
          >
            Node.js
          </button>
          <button
            onClick={() => setTab("curl")}
            className={`rounded px-2 py-1 ${tab === "curl" ? "bg-amber-500/20 text-amber-200" : "text-neutral-400"}`}
          >
            cURL
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black p-4 text-[11px] leading-relaxed text-neutral-200">
        <code>{tab === "node" ? nodeSnippet : curlSnippet}</code>
      </pre>
      <div className="mt-3 text-[11px] text-neutral-400">
        HN-Pay will POST <code className="font-mono text-amber-300">payment.succeeded</code> to your
        webhook URL when the customer pays. Verify the{" "}
        <code className="font-mono text-amber-300">x-hnpay-signature</code> header (HMAC-SHA256 over{" "}
        <code>timestamp.body</code> using your webhook secret) before activating the subscription.
      </div>
    </div>
  );
}

function Panel({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4">
        <div className="text-sm font-bold">{title}</div>
        <div className="text-[11px] text-neutral-500">{desc}</div>
      </div>
      {children}
    </div>
  );
}
