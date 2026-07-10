import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Globe, Copy, Check, Power, ArrowRight, Key, Shield, Upload, FolderTree } from "lucide-react";
import {
  listSites,
  createSite,
  toggleSite,
  getSiteWebhookSecret,
} from "@/lib/hn-pay/sites.functions";
import {
  listPortfolios,
  bulkImportSites,
  assignSiteToPortfolio,
} from "@/lib/hn-pay/portfolios.functions";
import { OwnerShell } from "@/routes/_authenticated/owner/dashboard";
import { useHnSession } from "@/lib/auth/use-session";

export const Route = createFileRoute("/_authenticated/owner/sites")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sites · HN-Pay" }] }),
  component: SitesPage,
});

function SitesPage() {
  const { profile, signOut } = useHnSession();
  const qc = useQueryClient();
  const listFn = useServerFn(listSites);
  const createFn = useServerFn(createSite);
  const toggleFn = useServerFn(toggleSite);

  const listPortfoliosFn = useServerFn(listPortfolios);
  const bulkFn = useServerFn(bulkImportSites);
  const assignFn = useServerFn(assignSiteToPortfolio);

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["hn-pay", "sites"],
    queryFn: () => listFn(),
  });
  const { data: portfolios = [] } = useQuery({
    queryKey: ["hn-pay", "portfolios"],
    queryFn: () => listPortfoliosFn(),
  });

  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    domain: "",
    webhook_url: "",
    brand_color: "#f59e0b",
  });

  const create = useMutation({
    mutationFn: (input: typeof form) => createFn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hn-pay", "sites"] });
      setCreating(false);
      setForm({ slug: "", name: "", domain: "", webhook_url: "", brand_color: "#f59e0b" });
    },
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hn-pay", "sites"] }),
  });

  const assign = useMutation({
    mutationFn: (v: { siteId: string; portfolioId: string | null }) => assignFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hn-pay", "sites"] }),
  });

  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">
            Payment Hub
          </div>
          <h1 className="text-3xl font-bold">Sites</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Every site you connect to HN-Pay gets its own API key, webhook secret, and plans.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/owner/portfolios" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-300 hover:bg-white/10">
            <FolderTree className="h-4 w-4" /> Portfolios
          </Link>
          <button
            onClick={() => setImporting((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
          >
            <Upload className="h-4 w-4" /> Bulk import
          </button>
          <button
            onClick={() => setCreating((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
          >
            <Plus className="h-4 w-4" /> New site
          </button>
        </div>
      </div>

      {importing && (
        <BulkImportPanel
          onDone={() => { setImporting(false); qc.invalidateQueries({ queryKey: ["hn-pay", "sites"] }); }}
          runImport={(rows) => bulkFn({ data: { rows } })}
        />
      )}

      {creating && (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-black/40 p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Slug (URL-safe)">
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                placeholder="hn-chat"
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Display name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="HN Chat"
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Domain">
              <input
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                placeholder="hnchat.net"
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Webhook URL (where we send events)">
              <input
                value={form.webhook_url}
                onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
                placeholder="https://hnchat.net/api/hn-pay/webhook"
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Brand color">
              <input
                type="color"
                value={form.brand_color}
                onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                className="h-10 w-24 rounded-lg border border-white/10 bg-black/60"
              />
            </Field>
          </div>
          {create.isError && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
              {String(create.error)}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => create.mutate(form)}
              disabled={create.isPending || !form.slug || !form.name || !form.domain}
              className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:brightness-110 disabled:opacity-50"
            >
              {create.isPending ? "Creating…" : "Create site"}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-neutral-300 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-neutral-500">Loading sites…</div>
      ) : sites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <Globe className="mx-auto h-8 w-8 text-neutral-500" />
          <div className="mt-3 text-sm font-semibold">No sites yet</div>
          <div className="mt-1 text-xs text-neutral-500">
            Register your first site to receive payments through HN-Pay.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {sites.map((s) => (
            <SiteRow
              key={s.id}
              site={s}
              onToggle={(active) => toggle.mutate({ id: s.id, active })}
            />
          ))}
        </div>
      )}
    </OwnerShell>
  );
}

function SiteRow({
  site,
  onToggle,
}: {
  site: {
    id: string;
    slug: string;
    name: string;
    domain: string;
    webhook_url: string | null;
    is_active: boolean;
    brand_color: string | null;
  };
  onToggle: (active: boolean) => void;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const secretFn = useServerFn(getSiteWebhookSecret);

  const reveal = async () => {
    if (!secret) {
      const res = await secretFn({ data: { id: site.id } });
      setSecret(res.webhook_secret);
    }
    setShowSecret(true);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-bold"
            style={{
              borderColor: `${site.brand_color ?? "#f59e0b"}55`,
              background: `${site.brand_color ?? "#f59e0b"}15`,
              color: site.brand_color ?? "#f59e0b",
            }}
          >
            {site.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold">{site.name}</div>
            <div className="text-xs text-neutral-500">
              {site.domain} · <span className="font-mono">{site.slug}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(!site.is_active)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${
              site.is_active
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                : "border-neutral-600/50 bg-neutral-800/50 text-neutral-400"
            }`}
          >
            <Power className="h-3 w-3" /> {site.is_active ? "Active" : "Disabled"}
          </button>
          <Link
            to="/owner/sites/$siteId"
            params={{ siteId: site.id }}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20"
          >
            <Key className="h-3 w-3" /> Keys & plans <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
        <Shield className="h-3 w-3 text-amber-300" />
        Webhook: <span className="font-mono text-neutral-300">{site.webhook_url ?? "not set"}</span>
        {site.webhook_url && (
          <button
            onClick={reveal}
            className="ml-2 rounded border border-white/10 px-2 py-0.5 hover:bg-white/5"
          >
            {showSecret ? "hide" : "reveal"} signing secret
          </button>
        )}
      </div>
      {showSecret && secret && (
        <CopyRow label="webhook_secret" value={secret} />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      {children}
    </label>
  );
}

export function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
        {label}
      </span>
      <code className="flex-1 truncate font-mono text-xs text-neutral-200">{value}</code>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="rounded border border-white/10 px-2 py-1 text-[10px] text-neutral-300 hover:bg-white/5"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}
