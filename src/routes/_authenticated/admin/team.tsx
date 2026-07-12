import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState } from "@/components/admin/AdminShell";
import { UserPlus, X, Loader2, Trash2 } from "lucide-react";
import { assignRole, removeRole, inviteUser } from "@/lib/hn-pay/admin-actions.functions";

export const Route = createFileRoute("/_authenticated/admin/team")({
  head: () => ({ meta: [{ title: "فريق العمل · HN-PAY" }] }),
  component: TeamPage,
});

const ROLES = ["owner", "admin", "manager", "developer", "accountant", "subscriber", "viewer"] as const;

function TeamPage() {
  const inviteFn = useServerFn(inviteUser);
  const assignFn = useServerFn(assignRole);
  const removeFn = useServerFn(removeRole);

  const [rows, setRows] = useState<any[]>([]);
  const [apps, setApps] = useState<string[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inv, setInv] = useState({ email: "", app_id: "HN-HUB", role: "manager" as (typeof ROLES)[number] });

  const load = async () => {
    const [{ data: profs }, { data: roles }, { data: appsData }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, avatar_url, origin_app, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, app_id, role"),
      supabase.from("hn_apps").select("app_id"),
    ]);
    const g: Record<string, { app_id: string; role: string }[]> = {};
    (roles ?? []).forEach((r: any) => { g[r.user_id] ??= []; g[r.user_id].push({ app_id: r.app_id, role: r.role }); });
    setRows(((profs as any[]) ?? []).map((p) => ({ ...p, roles: g[p.id] ?? [] })));
    setApps(((appsData as any[]) ?? []).map((a) => a.app_id));
  };
  useEffect(() => { void load(); }, []);

  const inviteMut = useMutation({
    mutationFn: () => inviteFn({ data: inv }),
    onSuccess: (r: any) => {
      if (r?.ok) { setShowInvite(false); setInv({ email: "", app_id: "HN-HUB", role: "manager" }); void load(); }
    },
  });

  const staff = rows.filter((r) => r.roles.some((rr: any) => ["owner", "admin", "manager", "developer", "accountant"].includes(rr.role)));

  return (
    <AdminShell
      title="فريق العمل"
      subtitle="الأعضاء الإداريون الذين لهم صلاحيات في HN-PAY."
      actions={
        <div className="flex gap-2">
          <Link to="/owner/users" className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5">إدارة كاملة</Link>
          <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400">
            <UserPlus className="h-3.5 w-3.5" /> دعوة عضو
          </button>
        </div>
      }
    >
      {staff.length === 0 ? (
        <EmptyState title="لا يوجد أعضاء فريق بعد" desc="ادعُ أول عضو باستخدام زر «دعوة عضو»." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((u) => (
            <Card key={u.id}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/40 bg-gradient-to-br from-amber-500/25 to-transparent text-sm font-bold text-amber-200">
                  {(u.full_name ?? u.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{u.full_name ?? "—"}</div>
                  <div className="truncate text-[11px] text-neutral-500">{u.email}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {u.roles.map((rr: any, i: number) => (
                  <button key={i}
                    onClick={async () => {
                      if (!confirm(`إزالة الدور ${rr.role} من ${rr.app_id}؟`)) return;
                      await removeFn({ data: { user_id: u.id, app_id: rr.app_id, role: rr.role } });
                      void load();
                    }}
                    title="اضغط للإزالة"
                    className="inline-flex items-center gap-1 hover:opacity-70">
                    <Badge tone={rr.role === "owner" ? "amber" : rr.role === "admin" ? "violet" : "sky"}>
                      {rr.app_id} · {rr.role} <Trash2 className="ms-1 inline h-2.5 w-2.5" />
                    </Badge>
                  </button>
                ))}
              </div>
              <QuickAssign apps={apps} onAssign={async (app_id, role) => {
                await assignFn({ data: { user_id: u.id, app_id, role } });
                void load();
              }} />
            </Card>
          ))}
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowInvite(false)}>
          <div dir="rtl" className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-[#0a0b16] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h3 className="font-bold">دعوة عضو</h3><button onClick={() => setShowInvite(false)}><X className="h-4 w-4" /></button></div>
            <p className="mb-3 text-xs text-neutral-500">أدخل البريد الإلكتروني لعضو موجود مسبقاً في النظام. عليه التسجيل أولاً ثم تُمنح له الأدوار.</p>
            <div className="space-y-3">
              <label className="block"><span className="text-[10px] uppercase text-neutral-500">البريد</span>
                <input type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm" /></label>
              <label className="block"><span className="text-[10px] uppercase text-neutral-500">التطبيق</span>
                <select value={inv.app_id} onChange={(e) => setInv({ ...inv, app_id: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm">
                  {(apps.length ? apps : ["HN-HUB"]).map((a) => <option key={a} value={a}>{a}</option>)}
                </select></label>
              <label className="block"><span className="text-[10px] uppercase text-neutral-500">الدور</span>
                <select value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value as any })} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select></label>
              {inviteMut.data && (inviteMut.data as any).ok === false && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-200">لا يوجد حساب بهذا البريد بعد. اطلب منه التسجيل أولاً.</div>
              )}
              {inviteMut.error && <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-xs text-rose-200">{(inviteMut.error as Error).message}</div>}
              <button onClick={() => inviteMut.mutate()} disabled={!inv.email || inviteMut.isPending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50">
                {inviteMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} دعوة
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function QuickAssign({ apps, onAssign }: { apps: string[]; onAssign: (app_id: string, role: (typeof ROLES)[number]) => void }) {
  const [app, setApp] = useState(apps[0] ?? "HN-HUB");
  const [role, setRole] = useState<(typeof ROLES)[number]>("viewer");
  useEffect(() => { if (!app && apps[0]) setApp(apps[0]); }, [apps, app]);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-white/5 pt-3">
      <select value={app} onChange={(e) => setApp(e.target.value)} className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px]">
        {(apps.length ? apps : ["HN-HUB"]).map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
      <select value={role} onChange={(e) => setRole(e.target.value as any)} className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px]">
        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <button onClick={() => onAssign(app, role)} className="rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200 hover:bg-amber-500/20">إضافة دور</button>
    </div>
  );
}
