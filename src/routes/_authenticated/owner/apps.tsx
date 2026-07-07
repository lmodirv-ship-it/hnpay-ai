import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHnSession } from "@/lib/auth/use-session";
import { OwnerShell } from "./dashboard";
import { Boxes, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/owner/apps")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { next: "/owner/apps", app: "" } });
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!(r ?? []).some((row: any) => row.role === "owner" || row.role === "admin")) {
      throw redirect({ to: "/user/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Apps Control · HN-Pay Hub" }] }),
  component: AppsControlPage,
});

interface AppRow { id: string; app_id: string; name: string; description: string | null; domain: string | null; category: string | null; active: boolean }

function AppsControlPage() {
  const { profile, signOut } = useHnSession();
  const [rows, setRows] = useState<AppRow[]>([]);
  const [msg, setMsg] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ app_id: "", name: "", description: "", domain: "", category: "" });

  const load = async () => {
    const { data } = await supabase.from("hn_apps").select("*").order("created_at", { ascending: false });
    setRows((data as AppRow[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (app: AppRow) => {
    setMsg("Updating…");
    const { error } = await supabase.from("hn_apps").update({ active: !app.active }).eq("id", app.id);
    setMsg(error ? `Error: ${error.message}` : `${app.name} ${!app.active ? "enabled" : "disabled"}.`);
    await load();
    setTimeout(() => setMsg(""), 2500);
  };

  const createApp = async () => {
    setMsg("Creating…");
    const { error } = await supabase.from("hn_apps").insert({
      app_id: form.app_id.toUpperCase(),
      name: form.name,
      description: form.description || null,
      domain: form.domain || null,
      category: form.category || null,
      active: true,
    });
    if (error) { setMsg(`Error: ${error.message}`); return; }
    setMsg("App registered.");
    setForm({ app_id: "", name: "", description: "", domain: "", category: "" });
    setCreating(false);
    await load();
    setTimeout(() => setMsg(""), 2500);
  };

  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">Control</div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Boxes className="h-7 w-7 text-amber-300" /> Apps Control</h1>
          <p className="mt-1 text-sm text-neutral-400">Enable, disable and register apps in the HN mesh.</p>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-400/50 bg-gradient-to-b from-amber-400/25 to-amber-500/10 px-4 py-2 text-sm font-medium text-amber-100"
        >
          <Plus className="h-4 w-4" /> {creating ? "Cancel" : "Register app"}
        </button>
      </div>

      {msg && <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">{msg}</div>}

      {creating && (
        <div className="mb-6 rounded-2xl border border-amber-400/30 bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(["app_id", "name", "domain", "category", "description"] as const).map((f) => (
              <input
                key={f}
                placeholder={f.replace("_", " ")}
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-amber-400/50"
              />
            ))}
          </div>
          <button onClick={createApp} className="mt-4 rounded-xl border border-amber-400/50 bg-amber-500/20 px-4 py-2 text-sm text-amber-100">
            Save
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-amber-500/15 bg-white/[0.02] backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-neutral-500">
              <th className="px-5 py-3">App</th>
              <th className="px-5 py-3">Domain</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-white/5">
                <td className="px-5 py-3">
                  <div className="text-white">{a.name}</div>
                  <div className="text-[10px] text-neutral-500 font-mono">{a.app_id}</div>
                </td>
                <td className="px-5 py-3 font-mono text-[11px] text-sky-300">{a.domain ?? "—"}</td>
                <td className="px-5 py-3 text-neutral-300">{a.category ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                    a.active ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-rose-400/30 bg-rose-500/10 text-rose-200"
                  }`}>
                    {a.active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => toggle(a)}
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs text-neutral-200 hover:bg-white/5"
                  >
                    {a.active ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OwnerShell>
  );
}
