import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/activity")({
  head: () => ({ meta: [{ title: "سجل النشاط · HN-PAY" }] }),
  component: ActivityPage,
});

function ActivityPage() {
  const [rows, setRows] = useState<{ src: string; provider: string; type: string; status: string; at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: hooks }, { data: pe }] = await Promise.all([
        supabase.from("webhook_events").select("provider, event_type, status, created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("provider_events").select("provider, event_type, created_at").order("created_at", { ascending: false }).limit(100),
      ]);
      const merged: typeof rows = [];
      (hooks ?? []).forEach((h: any) => merged.push({ src: "webhook", provider: h.provider, type: h.event_type, status: h.status ?? "-", at: h.created_at }));
      (pe ?? []).forEach((h: any) => merged.push({ src: "provider", provider: h.provider, type: h.event_type, status: "-", at: h.created_at }));
      merged.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setRows(merged.slice(0, 150));
    })();
  }, []);

  return (
    <AdminShell title="سجل النشاط" subtitle="أحداث Webhooks ومزودي الدفع لتدقيق كامل.">
      {rows.length === 0 ? (
        <EmptyState title="لا يوجد نشاط بعد" />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3">المصدر</th>
                  <th className="px-5 py-3">المزود</th>
                  <th className="px-5 py-3">النوع</th>
                  <th className="px-5 py-3">الحالة</th>
                  <th className="px-5 py-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="px-5 py-3"><Badge tone={r.src === "webhook" ? "violet" : "sky"}>{r.src}</Badge></td>
                    <td className="px-5 py-3 text-[11px]">{r.provider}</td>
                    <td className="px-5 py-3 font-mono text-[11px] text-neutral-400">{r.type}</td>
                    <td className="px-5 py-3"><Badge tone={r.status === "processed" || r.status === "ok" ? "green" : r.status === "failed" ? "red" : "neutral"}>{r.status}</Badge></td>
                    <td className="px-5 py-3 text-[11px] text-neutral-500">{new Date(r.at).toLocaleString("ar-MA")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminShell>
  );
}
