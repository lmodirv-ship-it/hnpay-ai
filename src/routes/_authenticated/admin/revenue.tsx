import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getRevenueOverview } from "@/lib/hn-pay/google-ecosystem.functions";
import { AdminShell, Card, Badge, StatCard } from "@/components/admin/AdminShell";
import { DollarSign, Users, Megaphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/revenue")({
  head: () => ({ meta: [{ title: "الإيرادات و AdSense · HN-Pay Live" }] }),
  component: RevenuePage,
});

function RevenuePage() {
  const load = useServerFn(getRevenueOverview);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof getRevenueOverview>>>([]);
  useEffect(() => { load().then(setRows).catch(() => setRows([])); }, []);
  const total = rows.reduce((a, r) => a + r.revenue, 0);
  return (
    <AdminShell title="الإيرادات: الاشتراكات المباشرة + Google AdSense" subtitle="الإعلانات تُخفى تلقائيًا عن كل مشترك نشط في HN-Pay.">
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="إيرادات الاشتراكات" value={total.toFixed(2)} tone="emerald" />
        <StatCard icon={<Users className="h-5 w-5" />} label="اشتراكات نشطة" value={rows.reduce((a, r) => a + r.active_subscriptions, 0)} tone="amber" />
        <StatCard icon={<Megaphone className="h-5 w-5" />} label="مواقع AdSense" value={rows.filter((r) => r.adsense_enabled).length} tone="sky" />
      </div>
      <Card>
        <table className="w-full text-xs">
          <thead className="text-neutral-500"><tr><th className="p-2 text-start">الموقع</th><th className="p-2">اشتراكات نشطة</th><th className="p-2">مدفوعات</th><th className="p-2">الإيراد</th><th className="p-2">AdSense</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="p-2"><div className="font-semibold">{r.name}</div><div className="text-[10px] text-neutral-500">{r.domain}</div></td>
                <td className="p-2 text-center">{r.active_subscriptions}</td>
                <td className="p-2 text-center">{r.payments}</td>
                <td className="p-2 text-center font-mono">{r.revenue.toFixed(2)}</td>
                <td className="p-2 text-center"><Badge tone={r.adsense_enabled ? "green" : "neutral"}>{r.adsense_enabled ? "مفعّل" : "متوقف"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
