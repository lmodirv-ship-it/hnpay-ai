import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHnSession } from "@/lib/auth/use-session";
import { OwnerShell } from "./dashboard";
import { ShieldCheck, Check, X, Save } from "lucide-react";

type Role = "owner" | "admin" | "manager" | "developer" | "subscriber" | "viewer";
const ROLES: Role[] = ["owner", "admin", "manager", "developer", "subscriber", "viewer"];

const PERMISSIONS: { key: string; label: string; desc: string }[] = [
  { key: "manage_platform", label: "Manage Platform", desc: "Full control over the HN cluster" },
  { key: "manage_users", label: "Manage Users", desc: "Invite, edit, deactivate members" },
  { key: "manage_roles", label: "Manage Roles", desc: "Edit role permissions & assignments" },
  { key: "manage_apps", label: "Manage Apps", desc: "Register / toggle connected apps" },
  { key: "manage_billing", label: "Manage Billing", desc: "Plans, invoices, tokens" },
  { key: "view_analytics", label: "View Analytics", desc: "Dashboards & network telemetry" },
  { key: "use_ai", label: "Use AI Gateway", desc: "Call LLM / AI services" },
  { key: "access_api", label: "Access API", desc: "Use API keys & endpoints" },
];

export const Route = createFileRoute("/_authenticated/owner/roles")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { next: "/owner/roles", app: "" } });
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!(r ?? []).some((row: any) => row.role === "owner" || row.role === "admin")) {
      throw redirect({ to: "/user/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Roles & Permissions · HN-Pay Hub" }] }),
  component: RolesPage,
});

function RolesPage() {
  const { profile, isOwner, signOut } = useHnSession();
  const [matrix, setMatrix] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await (supabase as any).from("role_permissions").select("role, permission, enabled");
    const m: Record<string, boolean> = {};
    (data ?? []).forEach((row: any) => { m[`${row.role}:${row.permission}`] = row.enabled; });
    setMatrix(m);
    setDirty({});
  };
  useEffect(() => { load(); }, []);

  const dirtyCount = useMemo(() => Object.keys(dirty).length, [dirty]);

  const toggle = (role: Role, perm: string) => {
    if (!isOwner) return;
    const key = `${role}:${perm}`;
    setMatrix((m) => ({ ...m, [key]: !m[key] }));
    setDirty((d) => ({ ...d, [key]: true }));
  };

  const save = async () => {
    setSaving(true);
    setStatus("Saving…");
    const rows = Object.keys(dirty).map((k) => {
      const [role, permission] = k.split(":");
      return { role, permission, enabled: matrix[k] };
    });
    const { error } = await (supabase as any)
      .from("role_permissions")
      .upsert(rows, { onConflict: "role,permission" });
    setSaving(false);
    if (error) {
      setStatus(`Error: ${error.message}`);
    } else {
      setStatus("Saved ✓");
      await load();
      setTimeout(() => setStatus(""), 2000);
    }
  };

  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">Governance</div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-amber-300" /> Roles & Permissions
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {isOwner
              ? "Toggle any cell to grant or revoke a capability for a role."
              : "Read-only view. Only the Owner can edit the permission matrix."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <span className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
              {status}
            </span>
          )}
          <button
            disabled={!isOwner || dirtyCount === 0 || saving}
            onClick={save}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 shadow-[0_0_25px_-8px_rgba(251,191,36,0.6)] transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            Save changes {dirtyCount > 0 && <span className="rounded-full bg-black/40 px-1.5 text-[10px]">{dirtyCount}</span>}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-amber-500/15 bg-white/[0.02] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-neutral-500">
                <th className="px-5 py-4">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-3 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      r === "owner" ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                      : r === "admin" ? "border-violet-400/40 bg-violet-500/10 text-violet-200"
                      : r === "manager" ? "border-sky-400/40 bg-sky-500/10 text-sky-200"
                      : r === "developer" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-neutral-300"
                    }`}>{r}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p.key} className="border-b border-white/5 hover:bg-white/[0.015]">
                  <td className="px-5 py-3">
                    <div className="text-white">{p.label}</div>
                    <div className="text-[11px] text-neutral-500">{p.desc}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-neutral-600">{p.key}</div>
                  </td>
                  {ROLES.map((r) => {
                    const key = `${r}:${p.key}`;
                    const on = !!matrix[key];
                    const changed = !!dirty[key];
                    return (
                      <td key={r} className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggle(r, p.key)}
                          disabled={!isOwner}
                          title={`${r} · ${p.key}`}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                            on
                              ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                              : "border-white/10 bg-black/30 text-neutral-500 hover:bg-white/5"
                          } ${changed ? "ring-2 ring-amber-400/60" : ""} ${!isOwner ? "cursor-not-allowed opacity-70" : ""}`}
                        >
                          {on ? <Check className="h-4 w-4" /> : <X className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-neutral-500">
        Changes are enforced by row-level security. Only the Owner (<span className="text-amber-300">lmodirv@gmail.com</span>) can write; Admins have read-only access to this matrix.
      </p>
    </OwnerShell>
  );
}