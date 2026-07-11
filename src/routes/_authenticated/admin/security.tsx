import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, StatCard, EmptyState } from "@/components/admin/AdminShell";
import { ShieldCheck, AlertTriangle, KeyRound, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/security")({
  head: () => ({ meta: [{ title: "الأمان · HN-PAY" }] }),
  component: SecurityPage,
});

function SecurityPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [failedWebhooks, setFailedWebhooks] = useState(0);
  const [revokedKeys, setRevokedKeys] = useState(0);
  const [ownerCount, setOwnerCount] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: ev }, { data: wh }, { data: keys }, { data: roles }] = await Promise.all([
        supabase.from("provider_events").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("webhook_events").select("id").eq("delivered", false).gt("attempts", 2),
        supabase.from("site_api_keys").select("id").not("revoked_at", "is", null),
        supabase.from("user_roles").select("user_id").in("role", ["owner", "admin"]),
      ]);
      setEvents(ev ?? []);
      setFailedWebhooks((wh ?? []).length);
      setRevokedKeys((keys ?? []).length);
      setOwnerCount(new Set((roles ?? []).map((r: any) => r.user_id)).size);
    })();
  }, []);

  return (
    <AdminShell title="الأمان" subtitle="مراقبة النشاطات الحساسة، المفاتيح، والوصول الإداري.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="مسؤولون نشطون" value={ownerCount} tone="emerald" />
        <StatCard icon={<KeyRound className="h-5 w-5" />} label="مفاتيح API مُبطلة" value={revokedKeys} tone="amber" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Webhooks فاشلة" value={failedWebhooks} tone="rose" />
        <StatCard icon={<Activity className="h-5 w-5" />} label="أحداث حديثة" value={events.length} tone="sky" />
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-neutral-200">آخر أحداث المزودين</h3>
        {events.length === 0 ? <EmptyState title="لا أحداث حديثة" /> : (
          <div className="space-y-2">
            {events.slice(0, 20).map((e: any) => (
              <div key={e.id} className="flex items-start justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold">{e.event_type ?? "event"}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-neutral-500">{e.provider ?? "—"} · {e.id.slice(0, 8)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{e.provider ?? "system"}</Badge>
                  <span className="text-[10px] text-neutral-500">{new Date(e.created_at).toLocaleString("ar-MA")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
