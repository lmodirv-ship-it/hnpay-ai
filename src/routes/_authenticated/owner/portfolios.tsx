import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FolderTree, Plus, Trash2 } from "lucide-react";
import {
  listPortfolios,
  createPortfolio,
  deletePortfolio,
} from "@/lib/hn-pay/portfolios.functions";
import { OwnerShell } from "@/routes/_authenticated/owner/dashboard";
import { useHnSession } from "@/lib/auth/use-session";

export const Route = createFileRoute("/_authenticated/owner/portfolios")({
  ssr: false,
  head: () => ({ meta: [{ title: "Portfolios · HN-Pay" }] }),
  component: PortfoliosPage,
});

function PortfoliosPage() {
  const { profile, signOut } = useHnSession();
  const qc = useQueryClient();
  const listFn = useServerFn(listPortfolios);
  const createFn = useServerFn(createPortfolio);
  const delFn = useServerFn(deletePortfolio);

  const { data: portfolios = [], isLoading } = useQuery({
    queryKey: ["hn-pay", "portfolios"],
    queryFn: () => listFn(),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    default_currency: "USD",
    default_provider: "",
    brand_color: "#f59e0b",
  });

  const create = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hn-pay", "portfolios"] });
      setOpen(false);
      setForm({ slug: "", name: "", description: "", default_currency: "USD", default_provider: "", brand_color: "#f59e0b" });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hn-pay", "portfolios"] }),
  });

  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">Groups</div>
          <h1 className="text-3xl font-bold">Portfolios</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Group related sites (HN AI, HN Commerce, HN Media…) with shared defaults for currency and provider.
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
        >
          <Plus className="h-4 w-4" /> New portfolio
        </button>
      </div>

      {open && (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-black/40 p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Slug">
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} placeholder="hn-ai" className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm" />
            </Field>
            <Field label="Name">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="HN AI Sites" className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm" />
            </Field>
            <Field label="Currency">
              <input value={form.default_currency} onChange={(e) => setForm({ ...form, default_currency: e.target.value.toUpperCase() })} className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm uppercase" />
            </Field>
            <Field label="Default provider (optional)">
              <input value={form.default_provider} onChange={(e) => setForm({ ...form, default_provider: e.target.value })} placeholder="stripe / manual / cmi" className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm" />
            </Field>
            <Field label="Brand color">
              <input type="color" value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} className="h-10 w-24 rounded-lg border border-white/10 bg-black/60" />
            </Field>
            <Field label="Description">
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm" />
            </Field>
          </div>
          {create.isError && <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">{String(create.error)}</div>}
          <div className="mt-4 flex gap-2">
            <button onClick={() => create.mutate()} disabled={create.isPending || !form.slug || !form.name} className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:brightness-110 disabled:opacity-50">
              {create.isPending ? "Creating…" : "Create portfolio"}
            </button>
            <button onClick={() => setOpen(false)} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-neutral-300 hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : portfolios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <FolderTree className="mx-auto h-8 w-8 text-neutral-500" />
          <div className="mt-3 text-sm font-semibold">No portfolios yet</div>
          <div className="mt-1 text-xs text-neutral-500">Create one to group your sites.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {portfolios.map((p) => (
            <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-bold" style={{ borderColor: `${p.brand_color ?? "#f59e0b"}55`, background: `${p.brand_color ?? "#f59e0b"}15`, color: p.brand_color ?? "#f59e0b" }}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{p.name}</div>
                    <div className="text-xs text-neutral-500 font-mono">{p.slug}</div>
                  </div>
                </div>
                <button onClick={() => { if (confirm(`Delete portfolio ${p.name}? Sites will be unassigned.`)) del.mutate(p.id); }} className="rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-300 hover:bg-red-500/20">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {p.description && <div className="mt-3 text-xs text-neutral-400">{p.description}</div>}
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-neutral-500">
                <span className="rounded border border-white/10 px-2 py-0.5">{p.site_count} sites</span>
                <span className="rounded border border-white/10 px-2 py-0.5">{p.default_currency}</span>
                {p.default_provider && <span className="rounded border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-amber-200">{p.default_provider}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </OwnerShell>
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
