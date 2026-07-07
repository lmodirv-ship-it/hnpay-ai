import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHnSession } from "@/lib/auth/use-session";
import { OwnerShell } from "./dashboard";
import { Users } from "lucide-react";

type Role = "owner" | "admin" | "manager" | "developer" | "subscriber" | "viewer";
const ALL_ROLES: Role[] = ["owner", "admin", "manager", "developer", "subscriber", "viewer"];

export const Route = createFileRoute("/_authenticated/owner/users")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { next: "/owner/users", app: "" } });
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!(r ?? []).some((row: any) => row.role === "owner" || row.role === "admin")) {
      throw redirect({ to: "/user/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Users & Roles · HN-Pay Hub" }] }),
  component: UsersManagementPage,
});

interface Row {
  id: string;
  email: string;
  full_name: string | null;
  origin_app: string | null;
  created_at: string;
  roles: { app_id: string; role: Role }[];
}

function UsersManagementPage() {
  const { profile, signOut } = useHnSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [apps, setApps] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    const [{ data: profs }, { data: allRoles }, { data: allApps }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, origin_app, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, app_id, role"),
      supabase.from("hn_apps").select("app_id"),
    ]);
    const grouped: Record<string, { app_id: string; role: Role }[]> = {};
    (allRoles ?? []).forEach((r: any) => {
      grouped[r.user_id] ??= [];
      grouped[r.user_id].push({ app_id: r.app_id, role: r.role });
    });
    setRows(
      ((profs as any[]) ?? []).map((p) => ({ ...p, roles: grouped[p.id] ?? [] })),
    );
    setApps(((allApps as any[]) ?? []).map((a) => a.app_id));
  };
  useEffect(() => { load(); }, []);

  const assignRole = async (userId: string, appId: string, role: Role) => {
    setStatus("Saving…");
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, app_id: appId, role });
    setStatus(error ? `Error: ${error.message}` : "Role assigned.");
    await load();
    setTimeout(() => setStatus(""), 2500);
  };
  const removeRole = async (userId: string, appId: string, role: Role) => {
    setStatus("Removing…");
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId).eq("app_id", appId).eq("role", role);
    setStatus(error ? `Error: ${error.message}` : "Role removed.");
    await load();
    setTimeout(() => setStatus(""), 2500);
  };

  const filtered = rows.filter(
    (r) => q === "" || r.email.toLowerCase().includes(q.toLowerCase()) || (r.full_name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">Governance</div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Users className="h-7 w-7 text-amber-300" /> Users & Roles</h1>
          <p className="mt-1 text-sm text-neutral-400">Assign or revoke per-app roles for anyone in the HN network.</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email or name…"
          className="w-72 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none focus:border-amber-400/50"
        />
      </div>

      {status && <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">{status}</div>}

      <div className="overflow-hidden rounded-2xl border border-amber-500/15 bg-white/[0.02] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-neutral-500">
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Origin</th>
                <th className="px-5 py-3">Roles</th>
                <th className="px-5 py-3">Assign</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <UserRow key={r.id} row={r} apps={apps} onAssign={assignRole} onRemove={removeRole} />
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-neutral-500">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </OwnerShell>
  );
}

function UserRow({
  row, apps, onAssign, onRemove,
}: { row: Row; apps: string[]; onAssign: (u: string, a: string, r: Role) => void; onRemove: (u: string, a: string, r: Role) => void }) {
  const [pickApp, setPickApp] = useState(apps[0] ?? "HN-HUB");
  const [pickRole, setPickRole] = useState<Role>("subscriber");
  useEffect(() => { if (!pickApp && apps[0]) setPickApp(apps[0]); }, [apps, pickApp]);
  return (
    <tr className="border-b border-white/5">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-400/30 bg-gradient-to-br from-amber-500/25 to-transparent text-[11px] font-bold text-amber-200">
            {(row.full_name ?? row.email).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-white">{row.full_name ?? "—"}</div>
            <div className="text-[10px] text-neutral-500">{row.email}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 font-mono text-[11px] text-sky-300">{row.origin_app ?? "—"}</td>
      <td className="px-5 py-3">
        <div className="flex flex-wrap gap-1">
          {row.roles.length === 0 ? <span className="text-[11px] text-neutral-500">none</span> : row.roles.map((rr, i) => (
            <button
              key={i}
              onClick={() => onRemove(row.id, rr.app_id, rr.role)}
              title="Click to remove"
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium hover:opacity-70 ${
                rr.role === "owner"
                  ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                  : rr.role === "admin"
                  ? "border-violet-400/40 bg-violet-500/10 text-violet-200"
                  : "border-white/10 bg-white/5 text-neutral-300"
              }`}
            >
              {rr.app_id} · {rr.role}
            </button>
          ))}
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <select value={pickApp} onChange={(e) => setPickApp(e.target.value)} className="rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-xs">
            {apps.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={pickRole} onChange={(e) => setPickRole(e.target.value as Role)} className="rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-xs">
            {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={() => onAssign(row.id, pickApp, pickRole)}
            className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200 hover:bg-amber-500/20"
          >
            Assign
          </button>
        </div>
      </td>
    </tr>
  );
}
