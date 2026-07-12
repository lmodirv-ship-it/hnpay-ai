import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState } from "@/components/admin/AdminShell";
import { cancelSubscription, reactivateSubscription } from "@/lib/hn-pay/admin-actions.functions";

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({
  head: () => ({ meta: [{ title: "الاشتراكات · HN-PAY" }] }),
  component: SubsPage,
});

function SubsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const cancelFn = useServerFn(cancelSubscription);
  const reactFn = useServerFn(reactivateSubscription);

  const load = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("id, public_id, status, provider, current_period_start, current_period_end, cancel_at_period_end, plan_id, customer_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const cancelAtEnd = async (id: string) => {
    if (!confirm("إلغاء الاشتراك في نهاية الفترة؟")) return;
    await cancelFn({ data: { id, at_period_end: true } });
    load();
  };
  const cancelNow = async (id: string) => {
    if (!confirm("إلغاء فوري للاشتراك؟")) return;
    await cancelFn({ data: { id, at_period_end: false } });
    load();
  };
  const reactivate = async (id: string) => {
    await reactFn({ data: { id } });
    load();
  };

  return (
    <AdminShell title="الاشتراكات" subtitle="الاشتراكات النشطة، التجريبية، والملغاة عبر المواقع.">
      {rows.length === 0 ? (
        <EmptyState title="لا توجد اشتراكات" />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3">الاشتراك</th>
                  <th className="px-5 py-3">الحالة</th>
                  <th className="px-5 py-3">المزود</th>
                  <th className="px-5 py-3">الفترة الحالية</th>
                  <th className="px-5 py-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const endsSoon = s.current_period_end && new Date(s.current_period_end).getTime() - Date.now() < 7 * 86400_000;
                  return (
                    <tr key={s.id} className="border-b border-white/5">
                      <td className="px-5 py-3 font-mono text-[11px] text-neutral-400">{s.public_id}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Badge tone={s.status === "active" ? "green" : s.status === "trialing" ? "sky" : s.status === "canceled" ? "red" : "amber"}>{s.status}</Badge>
                          {s.cancel_at_period_end && <Badge tone="amber">سيلغى</Badge>}
                          {endsSoon && s.status === "active" && <Badge tone="amber">تنبيه انتهاء</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3"><Badge tone="sky">{s.provider}</Badge></td>
                      <td className="px-5 py-3 text-[11px] text-neutral-400">
                        {s.current_period_start ? new Date(s.current_period_start).toLocaleDateString("ar-MA") : "—"}
                        {" → "}
                        {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("ar-MA") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.status !== "canceled" && !s.cancel_at_period_end && (
                            <button onClick={() => cancelAtEnd(s.id)} className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200 hover:bg-amber-500/20">إلغاء نهاية الفترة</button>
                          )}
                          {s.status !== "canceled" && (
                            <button onClick={() => cancelNow(s.id)} className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-500/20">إلغاء فوري</button>
                          )}
                          {(s.status === "canceled" || s.cancel_at_period_end) && (
                            <button onClick={() => reactivate(s.id)} className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/20">تفعيل</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminShell>
  );
}
