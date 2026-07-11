import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState } from "@/components/admin/AdminShell";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({ meta: [{ title: "الإشعارات · HN-PAY" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [items, setItems] = useState<{ kind: "renew" | "failed" | "webhook"; title: string; desc: string; at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: subs }, { data: failed }, { data: hooks }] = await Promise.all([
        supabase.from("subscriptions").select("public_id, current_period_end, status").in("status", ["active", "trialing"]).order("current_period_end", { ascending: true }).limit(20),
        supabase.from("payments").select("public_id, amount, currency, created_at").eq("status", "failed").order("created_at", { ascending: false }).limit(20),
        supabase.from("webhook_events").select("id, provider, event_type, created_at, status").order("created_at", { ascending: false }).limit(20),
      ]);
      const list: typeof items = [];
      (subs ?? []).forEach((s: any) => {
        if (!s.current_period_end) return;
        const days = Math.round((new Date(s.current_period_end).getTime() - Date.now()) / 86400_000);
        if (days <= 7 && days >= 0) list.push({ kind: "renew", title: `اشتراك ${s.public_id} ينتهي بعد ${days} يومًا`, desc: "يوصى بالتنبيه قبل التجديد.", at: s.current_period_end });
      });
      (failed ?? []).forEach((p: any) => {
        list.push({ kind: "failed", title: `فشل دفع ${p.public_id}`, desc: `${Number(p.amount).toFixed(2)} ${p.currency}`, at: p.created_at });
      });
      (hooks ?? []).forEach((h: any) => {
        list.push({ kind: "webhook", title: `Webhook · ${h.provider}`, desc: `${h.event_type} — ${h.status}`, at: h.created_at });
      });
      list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setItems(list.slice(0, 50));
    })();
  }, []);

  return (
    <AdminShell title="الإشعارات" subtitle="تنبيهات التجديد، فشل الدفع، وأحداث Webhook.">
      {items.length === 0 ? (
        <EmptyState title="لا توجد إشعارات جديدة" desc="سيظهر هنا كل ما يستدعي الانتباه." />
      ) : (
        <div className="space-y-2">
          {items.map((n, i) => (
            <Card key={i}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border ${
                  n.kind === "renew" ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
                  : n.kind === "failed" ? "border-rose-400/40 bg-rose-500/10 text-rose-300"
                  : "border-sky-400/40 bg-sky-500/10 text-sky-300"
                }`}>
                  {n.kind === "renew" ? <Clock className="h-4 w-4" /> : n.kind === "failed" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{n.title}</div>
                    <Badge tone={n.kind === "failed" ? "red" : n.kind === "renew" ? "amber" : "sky"}>{n.kind}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">{n.desc}</div>
                  <div className="mt-1 text-[10px] text-neutral-500">{new Date(n.at).toLocaleString("ar-MA")}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
