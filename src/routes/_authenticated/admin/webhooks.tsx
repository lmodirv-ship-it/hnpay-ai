import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState, StatCard } from "@/components/admin/AdminShell";
import { Webhook, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/webhooks")({
  head: () => ({ meta: [{ title: "Webhooks · HN-PAY" }] }),
  component: WebhooksPage,
});

function WebhooksPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = async () => {
    const { data } = await supabase.from("webhook_events").select("*").order("created_at", { ascending: false }).limit(100);
    setRows(data ?? []);
  };
  useEffect(() => { void refresh(); }, []);

  const ok = rows.filter((r) => r.delivered).length;
  const fail = rows.filter((r) => !r.delivered && (r.attempts ?? 0) > 2).length;
  const retry = rows.filter((r) => !r.delivered && (r.attempts ?? 0) > 0 && (r.attempts ?? 0) <= 2).length;

  return (
    <AdminShell title="Webhooks" subtitle="سجل الأحداث الصادرة إلى المواقع مع تفاصيل الاستجابة."
      actions={<button onClick={refresh} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-neutral-200 hover:bg-white/5"><RefreshCw className="h-3 w-3" /> تحديث</button>}>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Webhook className="h-5 w-5" />} label="الإجمالي" value={rows.length} tone="sky" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="مُسلَّم" value={ok} tone="emerald" />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="فاشل" value={fail} tone="rose" />
        <StatCard icon={<RefreshCw className="h-5 w-5" />} label="بانتظار المحاولة" value={retry} tone="amber" />
      </div>

      {rows.length === 0 ? <EmptyState title="لا Webhooks بعد" /> : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase text-neutral-500">
                  <th className="px-4 py-3">الحدث</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">HTTP</th>
                  <th className="px-4 py-3">المحاولات</th>
                  <th className="px-4 py-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <>
                    <tr key={r.id} className="cursor-pointer border-b border-white/5 hover:bg-white/[0.02]" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{r.event_type}</div>
                        <div className="font-mono text-[10px] text-neutral-500">{r.public_id}</div>
                      </td>
                      <td className="px-4 py-3"><Badge tone={r.delivered ? "green" : (r.attempts ?? 0) > 2 ? "red" : "amber"}>{r.delivered ? "مُسلَّم" : (r.attempts ?? 0) > 2 ? "فاشل" : "معلق"}</Badge></td>
                      <td className="px-4 py-3 text-[11px]">{r.last_response_status ?? "—"}</td>
                      <td className="px-4 py-3 text-[11px]">{r.attempts ?? 0}</td>
                      <td className="px-4 py-3 text-[11px] text-neutral-500">{new Date(r.created_at).toLocaleString("ar-MA")}</td>
                    </tr>
                    {expanded === r.id && (
                      <tr key={r.id + "-x"}><td colSpan={5} className="border-b border-white/5 bg-black/40 p-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div>
                            <div className="mb-1 text-[10px] uppercase text-neutral-500">Payload</div>
                            <pre className="max-h-64 overflow-auto rounded-lg bg-black/60 p-3 text-[10px] text-neutral-300">{JSON.stringify(r.payload, null, 2)}</pre>
                          </div>
                          <div>
                            <div className="mb-1 text-[10px] uppercase text-neutral-500">Response</div>
                            <pre className="max-h-64 overflow-auto rounded-lg bg-black/60 p-3 text-[10px] text-neutral-300">{r.last_response_body ?? "—"}</pre>
                          </div>
                        </div>
                      </td></tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminShell>
  );
}
