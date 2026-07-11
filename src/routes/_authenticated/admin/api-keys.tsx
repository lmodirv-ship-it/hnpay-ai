import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState, StatCard } from "@/components/admin/AdminShell";
import { KeyRound, ShieldCheck, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/api-keys")({
  head: () => ({ meta: [{ title: "مفاتيح API · HN-PAY" }] }),
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [sites, setSites] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [{ data: keys }, { data: s }] = await Promise.all([
        supabase.from("site_api_keys").select("*").order("created_at", { ascending: false }),
        supabase.from("sites").select("id, name"),
      ]);
      setRows(keys ?? []);
      const map: Record<string, string> = {};
      (s ?? []).forEach((x: any) => (map[x.id] = x.name));
      setSites(map);
    })();
  }, []);

  return (
    <AdminShell title="مفاتيح API" subtitle="مفاتيح الوصول العامة والسرية لكل موقع مرتبط."
      actions={<a href="/owner/hn-pay/integrate" className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/25">إدارة المفاتيح</a>}>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard icon={<KeyRound className="h-5 w-5" />} label="إجمالي المفاتيح" value={rows.length} tone="amber" />
        <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="نشط" value={rows.filter((r) => !r.revoked_at).length} tone="emerald" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="مُبطَل" value={rows.filter((r) => r.revoked_at).length} tone="rose" />
      </div>

      {rows.length === 0 ? <EmptyState title="لا مفاتيح API بعد" desc="أنشئ مفاتيح من صفحة التكامل للموقع." /> : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase text-neutral-500">
                  <th className="px-4 py-3">الاسم</th>
                  <th className="px-4 py-3">الموقع</th>
                  <th className="px-4 py-3">النوع</th>
                  <th className="px-4 py-3">آخر استخدام</th>
                  <th className="px-4 py-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-mono text-[11px]">{r.name ?? r.public_key?.slice(0, 12)}</td>
                    <td className="px-4 py-3 text-[11px] text-neutral-400">{sites[r.site_id] ?? r.site_id.slice(0, 8)}</td>
                    <td className="px-4 py-3"><Badge tone="sky">{r.key_type ?? "publishable"}</Badge></td>
                    <td className="px-4 py-3 text-[11px] text-neutral-500">{r.last_used_at ? new Date(r.last_used_at).toLocaleString("ar-MA") : "—"}</td>
                    <td className="px-4 py-3"><Badge tone={r.revoked_at ? "red" : "green"}>{r.revoked_at ? "مبطَل" : "نشط"}</Badge></td>
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
