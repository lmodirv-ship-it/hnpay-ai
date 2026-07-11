import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/team")({
  head: () => ({ meta: [{ title: "فريق العمل · HN-PAY" }] }),
  component: TeamPage,
});

function TeamPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: profs }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, avatar_url, origin_app, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, app_id, role"),
      ]);
      const g: Record<string, { app_id: string; role: string }[]> = {};
      (roles ?? []).forEach((r: any) => { g[r.user_id] ??= []; g[r.user_id].push({ app_id: r.app_id, role: r.role }); });
      setRows(((profs as any[]) ?? []).map((p) => ({ ...p, roles: g[p.id] ?? [] })));
    })();
  }, []);

  const staff = rows.filter((r) => r.roles.some((rr: any) => ["owner", "admin", "manager", "developer"].includes(rr.role)));

  return (
    <AdminShell
      title="فريق العمل"
      subtitle="الأعضاء الإداريون الذين لهم صلاحيات في HN-PAY."
      actions={
        <Link to="/owner/users" className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20">إدارة كاملة</Link>
      }
    >
      {staff.length === 0 ? (
        <EmptyState title="لا يوجد أعضاء فريق بعد" />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((u) => (
            <Card key={u.id}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/40 bg-gradient-to-br from-amber-500/25 to-transparent text-sm font-bold text-amber-200">
                  {(u.full_name ?? u.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{u.full_name ?? "—"}</div>
                  <div className="truncate text-[11px] text-neutral-500">{u.email}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {u.roles.map((rr: any, i: number) => (
                  <Badge key={i} tone={rr.role === "owner" ? "amber" : rr.role === "admin" ? "violet" : "sky"}>
                    {rr.app_id} · {rr.role}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
