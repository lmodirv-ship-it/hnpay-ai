import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  CreditCard,
  Plus,
  Power,
  Star,
  Trash2,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  Pencil,
  ShieldCheck,
  Lock,
  Globe,
  Building2,
} from "lucide-react";
import {
  listPaymentProviders,
  upsertPaymentProvider,
  togglePaymentProvider,
  setDefaultPaymentProvider,
  deletePaymentProvider,
  testPaymentProvider,
} from "@/lib/hn-pay/payment-providers.functions";
import { listSites } from "@/lib/hn-pay/sites.functions";
import { OwnerShell } from "@/routes/_authenticated/owner/dashboard";
import { useHnSession } from "@/lib/auth/use-session";

export const Route = createFileRoute("/_authenticated/owner/hn-pay/providers")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Payment Providers · HN-Pay" },
      { name: "description", content: "Manage per-site payment providers (Stripe, Paddle, PayPal, CMI, NAPS, manual, mock) for HN-Pay." },
    ],
  }),
  component: ProvidersPage,
});

type ProviderCode = "stripe" | "paddle" | "paypal" | "cmi" | "payzone" | "naps" | "manual" | "mock";

type ProviderRow = {
  id: string;
  site_id: string | null;
  code: ProviderCode;
  display_name: string;
  api_key: string | null;
  secret_key: string | null;
  public_key: string | null;
  webhook_secret: string | null;
  merchant_id: string | null;
  environment: "sandbox" | "production";
  is_enabled: boolean;
  is_default: boolean;
  supported_countries: string[];
  supported_currencies: string[];
  fee_percent: number;
  fee_fixed: number;
  tax_mode: string;
  last_tested_at: string | null;
  last_test_status: "ok" | "fail" | null;
  last_test_message: string | null;
};

const PROVIDER_META: Record<ProviderCode, { label: string; badge: string; gradient: string; hint: string }> = {
  stripe:  { label: "Stripe",      badge: "💳", gradient: "from-indigo-500/20 to-violet-500/10", hint: "Global cards, wallets, subscriptions" },
  paddle:  { label: "Paddle",      badge: "🧾", gradient: "from-sky-500/20 to-cyan-500/10",     hint: "Merchant of Record — global tax handled" },
  paypal:  { label: "PayPal",      badge: "🅿️", gradient: "from-blue-500/20 to-indigo-500/10",  hint: "PayPal balance, cards, Pay in 4" },
  cmi:     { label: "CMI",         badge: "🇲🇦", gradient: "from-amber-500/20 to-orange-500/10", hint: "Centre Monétique Interbancaire — Morocco" },
  payzone: { label: "Payzone",     badge: "🏦", gradient: "from-emerald-500/20 to-teal-500/10", hint: "Multi-market card acquirer" },
  naps:    { label: "NAPS",        badge: "🇲🇦", gradient: "from-rose-500/20 to-pink-500/10",   hint: "NAPS wallet & card — Morocco" },
  manual:  { label: "Manual / Bank transfer", badge: "🏧", gradient: "from-neutral-500/20 to-neutral-400/10", hint: "Bank transfer, cash, mobile money — owner confirms" },
  mock:    { label: "Sandbox (Mock)", badge: "🧪", gradient: "from-fuchsia-500/20 to-purple-500/10", hint: "Simulates full flow — for E2E tests only" },
};

const BLANK_FORM = {
  id: undefined as string | undefined,
  site_id: "" as string,
  code: "stripe" as ProviderCode,
  display_name: "",
  api_key: "",
  secret_key: "",
  public_key: "",
  webhook_secret: "",
  merchant_id: "",
  environment: "sandbox" as "sandbox" | "production",
  is_enabled: true,
  supported_countries: [] as string[],
  supported_currencies: [] as string[],
  fee_percent: 0,
  fee_fixed: 0,
  tax_mode: "automatic" as "automatic" | "manual" | "none",
};

function ProvidersPage() {
  const { profile, signOut } = useHnSession();
  const qc = useQueryClient();
  const listFn = useServerFn(listPaymentProviders);
  const upsertFn = useServerFn(upsertPaymentProvider);
  const toggleFn = useServerFn(togglePaymentProvider);
  const setDefaultFn = useServerFn(setDefaultPaymentProvider);
  const deleteFn = useServerFn(deletePaymentProvider);
  const testFn = useServerFn(testPaymentProvider);
  const listSitesFn = useServerFn(listSites);

  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<typeof BLANK_FORM>(BLANK_FORM);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testFlash, setTestFlash] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  const { data: sitesRaw = [] } = useQuery({
    queryKey: ["hn-pay", "sites"],
    queryFn: () => listSitesFn(),
  });
  const sites = sitesRaw as { id: string; slug: string; name: string; domain: string; default_provider_id?: string | null }[];

  const { data: providersRaw = [], isLoading } = useQuery({
    queryKey: ["hn-pay", "providers", selectedSiteId || "global"],
    queryFn: () => listFn({ data: { site_id: selectedSiteId || undefined, include_global: !selectedSiteId } }),
  });
  const providers = providersRaw as unknown as ProviderRow[];

  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["hn-pay", "providers"] });
    qc.invalidateQueries({ queryKey: ["hn-pay", "sites"] });
  };

  const upsert = useMutation({
    mutationFn: (payload: typeof BLANK_FORM) => upsertFn({ data: { ...payload, site_id: payload.site_id || undefined } }),
    onSuccess: () => {
      invalidate();
      setEditorOpen(false);
      setForm(BLANK_FORM);
    },
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; enabled: boolean }) => toggleFn({ data: v }),
    onSuccess: invalidate,
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => setDefaultFn({ data: { id, site_id: selectedSiteId || undefined } }),
    onSuccess: invalidate,
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: invalidate,
  });

  const runTest = async (id: string) => {
    setTestingId(id);
    setTestFlash(null);
    try {
      const res = await testFn({ data: { id } });
      setTestFlash({ id, ok: res.status === "ok", msg: res.message });
    } catch (err) {
      setTestFlash({ id, ok: false, msg: err instanceof Error ? err.message : String(err) });
    } finally {
      setTestingId(null);
      invalidate();
    }
  };

  const openNew = () => {
    setForm({ ...BLANK_FORM, site_id: selectedSiteId });
    setEditorOpen(true);
  };

  const openEdit = (p: ProviderRow) => {
    setForm({
      id: p.id,
      site_id: p.site_id ?? "",
      code: p.code,
      display_name: p.display_name,
      api_key: p.api_key ?? "",
      secret_key: p.secret_key ?? "",
      public_key: p.public_key ?? "",
      webhook_secret: p.webhook_secret ?? "",
      merchant_id: p.merchant_id ?? "",
      environment: p.environment,
      is_enabled: p.is_enabled,
      supported_countries: p.supported_countries ?? [],
      supported_currencies: p.supported_currencies ?? [],
      fee_percent: p.fee_percent ?? 0,
      fee_fixed: p.fee_fixed ?? 0,
      tax_mode: (p.tax_mode as "automatic" | "manual" | "none") ?? "automatic",
    });
    setEditorOpen(true);
  };

  const activeCount = providers.filter((p) => p.is_enabled).length;
  const defaultProvider = providers.find((p) => p.is_default);

  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">
            Payment Hub · Providers
          </div>
          <h1 className="text-3xl font-bold">Payment Providers</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Each HN site can have its own gateways. Select a site to manage its providers, or leave it blank to manage global/shared providers.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
        >
          <Plus className="h-4 w-4" /> {selectedSiteId ? "Add provider to site" : "Add shared provider"}
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Site</label>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSiteId("")}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${selectedSiteId === "" ? "border-amber-400/60 bg-amber-500/20 text-amber-200" : "border-white/10 bg-black/40 text-neutral-400 hover:bg-white/5"}`}
          >
            <Globe className="h-3.5 w-3.5" /> Global / shared
          </button>
          {sites.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSiteId(s.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${selectedSiteId === s.id ? "border-amber-400/60 bg-amber-500/20 text-amber-200" : "border-white/10 bg-black/40 text-neutral-400 hover:bg-white/5"}`}
            >
              <Building2 className="h-3.5 w-3.5" /> {s.name}
            </button>
          ))}
        </div>
        {selectedSite && (
          <div className="mt-2 text-[10px] text-neutral-500">
            Managing providers for <span className="text-amber-300">{selectedSite.name}</span> ({selectedSite.domain})
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard
          icon={<CreditCard className="h-4 w-4" />}
          label="Registered"
          value={String(providers.length)}
        />
        <SummaryCard
          icon={<Power className="h-4 w-4" />}
          label="Enabled"
          value={String(activeCount)}
          tone="emerald"
        />
        <SummaryCard
          icon={<Star className="h-4 w-4" />}
          label="Default"
          value={defaultProvider ? defaultProvider.display_name : "—"}
          tone="amber"
        />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-neutral-500">
          Loading providers…
        </div>
      ) : providers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-neutral-500" />
          <div className="mt-3 text-sm font-semibold">No providers configured</div>
          <div className="mt-1 text-xs text-neutral-500">
            Add your first provider to start accepting real payments.
          </div>
          <button
            onClick={openNew}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
          >
            <Plus className="h-4 w-4" /> Add provider
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {providers.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              testing={testingId === p.id}
              flash={testFlash?.id === p.id ? testFlash : null}
              onEdit={() => openEdit(p)}
              onToggle={() => toggle.mutate({ id: p.id, enabled: !p.is_enabled })}
              onSetDefault={() => setDefault.mutate(p.id)}
              onDelete={() => {
                if (confirm(`Delete provider "${p.display_name}"?`)) del.mutate(p.id);
              }}
              onTest={() => runTest(p.id)}
            />
          ))}
        </div>
      )}

      {editorOpen && (
        <ProviderEditor
          form={form}
          setForm={setForm}
          saving={upsert.isPending}
          error={upsert.error instanceof Error ? upsert.error.message : upsert.error ? String(upsert.error) : null}
          onSave={() => upsert.mutate(form)}
          onClose={() => setEditorOpen(false)}
        />
      )}

      <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
          <div>
            <div className="text-sm font-bold text-emerald-100">HN-Pay is ready to connect a real provider</div>
            <p className="mt-1 text-xs text-neutral-400">
              Backend infrastructure is complete: registry, sessions, HMAC webhooks, settlement engine,
              subscriptions, and monitoring. Add a real Stripe / CMI / NAPS key above, run <em>Test Connection</em>,
              then click <em>Set as Default</em> — checkout traffic switches immediately.
            </p>
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}

function SummaryCard({ icon, label, value, tone = "neutral" }: { icon: React.ReactNode; label: string; value: string; tone?: "neutral" | "emerald" | "amber" }) {
  const toneClass =
    tone === "emerald" ? "text-emerald-300" :
    tone === "amber" ? "text-amber-300" :
    "text-neutral-200";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-500">
        {icon} {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

function ProviderCard({
  provider,
  testing,
  flash,
  onEdit,
  onToggle,
  onSetDefault,
  onDelete,
  onTest,
}: {
  provider: ProviderRow;
  testing: boolean;
  flash: { ok: boolean; msg: string } | null;
  onEdit: () => void;
  onToggle: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  onTest: () => void;
}) {
  const meta = PROVIDER_META[provider.code];
  const status = flash ?? (provider.last_test_status ? { ok: provider.last_test_status === "ok", msg: provider.last_test_message ?? "" } : null);

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 ${provider.is_default ? "border-amber-400/60 bg-amber-500/[0.04]" : "border-white/10 bg-white/[0.02]"}`}>
      <div className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${meta.gradient} blur-3xl`} />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-2xl">
            {meta.badge}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-bold">{provider.display_name}</div>
              <span className="rounded border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[10px] uppercase text-neutral-400">
                {provider.code}
              </span>
              <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${provider.environment === "production" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" : "border-amber-400/40 bg-amber-500/10 text-amber-300"}`}>
                {provider.environment}
              </span>
              {provider.is_default && (
                <span className="inline-flex items-center gap-1 rounded border border-amber-400/50 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                  <Star className="h-3 w-3" /> Default
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-neutral-500">{meta.hint}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill enabled={provider.is_enabled} />
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <FieldPill label="API key" value={provider.api_key} />
        <FieldPill label="Secret" value={provider.secret_key} secret />
        <FieldPill label="Webhook secret" value={provider.webhook_secret} secret />
        <FieldPill label="Merchant ID" value={provider.merchant_id} />
      </div>

      {status && (
        <div className={`relative mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${status.ok ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-red-500/40 bg-red-500/10 text-red-200"}`}>
          {status.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <XCircle className="mt-0.5 h-4 w-4" />}
          <div className="flex-1">
            <div className="font-semibold">{status.ok ? "Connection OK" : "Connection failed"}</div>
            <div className="text-[11px] opacity-80">{status.msg}</div>
            {provider.last_tested_at && (
              <div className="mt-0.5 text-[10px] opacity-60">Tested {new Date(provider.last_tested_at).toLocaleString()}</div>
            )}
          </div>
        </div>
      )}

      <div className="relative mt-4 flex flex-wrap gap-2">
        <button
          onClick={onTest}
          disabled={testing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-500/20 disabled:opacity-60"
        >
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          Test connection
        </button>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-200 hover:bg-white/10"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          onClick={onToggle}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${provider.is_enabled ? "border-neutral-600/50 bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"}`}
        >
          <Power className="h-3.5 w-3.5" /> {provider.is_enabled ? "Disable" : "Enable"}
        </button>
        {!provider.is_default && (
          <button
            onClick={onSetDefault}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
          >
            <Star className="h-3.5 w-3.5" /> Set as default
          </button>
        )}
        <button
          onClick={onDelete}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${enabled ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" : "border-neutral-600/50 bg-neutral-800/50 text-neutral-400"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" : "bg-neutral-500"}`} />
      {enabled ? "Live" : "Disabled"}
    </span>
  );
}

function FieldPill({ label, value, secret = false }: { label: string; value: string | null; secret?: boolean }) {
  const has = Boolean(value);
  const shown = has ? (secret ? mask(value!) : value!) : "—";
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
      <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
        {secret && <Lock className="h-2.5 w-2.5" />}
        {label}
      </div>
      <div className={`mt-1 truncate font-mono text-[11px] ${has ? "text-neutral-200" : "text-neutral-600"}`}>{shown}</div>
    </div>
  );
}

function mask(v: string) {
  if (v.length <= 8) return "•".repeat(v.length);
  return `${v.slice(0, 4)}${"•".repeat(Math.max(4, v.length - 8))}${v.slice(-4)}`;
}

function ProviderEditor({
  form,
  setForm,
  saving,
  error,
  onSave,
  onClose,
}: {
  form: typeof BLANK_FORM;
  setForm: (f: typeof BLANK_FORM) => void;
  saving: boolean;
  error: string | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const meta = PROVIDER_META[form.code];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-400/30 bg-[#0b0c14] shadow-[0_0_60px_-15px_rgba(251,191,36,0.4)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-transparent px-6 py-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-300">
              {form.id ? "Edit provider" : "New provider"}
            </div>
            <div className="mt-0.5 text-lg font-bold">{meta.label}</div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-400 hover:bg-white/5">
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 p-6 md:grid-cols-2">
          <Field label="Provider">
            <select
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value as ProviderCode })}
              disabled={Boolean(form.id)}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm disabled:opacity-60"
            >
              {(Object.keys(PROVIDER_META) as ProviderCode[]).map((c) => (
                <option key={c} value={c}>
                  {PROVIDER_META[c].badge} {PROVIDER_META[c].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Display name">
            <input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder={meta.label}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Environment">
            <div className="flex gap-2">
              {(["sandbox", "production"] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setForm({ ...form, environment: env })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold uppercase ${form.environment === env ? (env === "production" ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200" : "border-amber-400/60 bg-amber-500/20 text-amber-200") : "border-white/10 bg-black/40 text-neutral-400 hover:bg-white/5"}`}
                >
                  {env}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Status">
            <button
              type="button"
              onClick={() => setForm({ ...form, is_enabled: !form.is_enabled })}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase ${form.is_enabled ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-neutral-600/50 bg-neutral-800/50 text-neutral-400"}`}
            >
              <Power className="h-3.5 w-3.5" /> {form.is_enabled ? "Enabled" : "Disabled"}
            </button>
          </Field>

          <Field label="API key / Client ID">
            <input
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              placeholder="pk_live_… or client_id"
              autoComplete="off"
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs"
            />
          </Field>
          <Field label="Secret key">
            <input
              type="password"
              value={form.secret_key}
              onChange={(e) => setForm({ ...form, secret_key: e.target.value })}
              placeholder="sk_live_… or client_secret"
              autoComplete="off"
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs"
            />
          </Field>
          <Field label="Webhook signing secret">
            <input
              type="password"
              value={form.webhook_secret}
              onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })}
              placeholder="whsec_…"
              autoComplete="off"
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs"
            />
          </Field>
          <Field label="Merchant ID">
            <input
              value={form.merchant_id}
              onChange={(e) => setForm({ ...form, merchant_id: e.target.value })}
              placeholder="Optional (CMI, NAPS, Payzone…)"
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs"
            />
          </Field>
          <Field label="Public key / Client token">
            <input
              value={form.public_key}
              onChange={(e) => setForm({ ...form, public_key: e.target.value })}
              placeholder="Paddle client-side key, publishable ID, etc."
              autoComplete="off"
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs"
            />
          </Field>
          <Field label="Supported countries (2-letter)" hint={form.supported_countries.join(", ") || "All countries"}>
            <input
              value={form.supported_countries.join(",")}
              onChange={(e) => setForm({ ...form, supported_countries: e.target.value.split(/[,\s]+/).filter(Boolean) })}
              placeholder="MA,FR,US,…"
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs"
            />
          </Field>
          <Field label="Supported currencies (3-letter)" hint={form.supported_currencies.join(", ") || "All currencies"}>
            <input
              value={form.supported_currencies.join(",")}
              onChange={(e) => setForm({ ...form, supported_currencies: e.target.value.split(/[,\s]+/).filter(Boolean) })}
              placeholder="MAD,EUR,USD,…"
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs"
            />
          </Field>
          <Field label="Fee %">
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={form.fee_percent}
              onChange={(e) => setForm({ ...form, fee_percent: Number(e.target.value) })}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs"
            />
          </Field>
          <Field label="Fixed fee">
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.fee_fixed}
              onChange={(e) => setForm({ ...form, fee_fixed: Number(e.target.value) })}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs"
            />
          </Field>
          <Field label="Tax mode">
            <select
              value={form.tax_mode}
              onChange={(e) => setForm({ ...form, tax_mode: e.target.value as "automatic" | "manual" | "none" })}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
            >
              <option value="automatic">Automatic tax</option>
              <option value="manual">Manual tax</option>
              <option value="none">No tax</option>
            </select>
          </Field>
        </div>

        {error && (
          <div className="mx-6 mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-black/40 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs text-neutral-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !form.display_name}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {form.id ? "Save changes" : "Create provider"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
        {hint && <span className="font-normal normal-case text-neutral-600">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
