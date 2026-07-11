import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, EmptyState, Badge } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({ meta: [{ title: "العملاء · HN-PAY" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, external_id, email, name, provider, site_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setRows(data ?? []);
    })();
  }, []);

  const filtered = rows.filter((r) =>
    q === "" || (r.email ?? "").toLowerCase().includes(q.toLowerCase()) || (r.name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AdminShell title="العملاء" subtitle="قاعدة عملاء HN-PAY عبر جميع مواقع المجموعة.">
      <div className="mb-4 flex justify-end">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث بالبريد أو الاسم…"
          className="w-72 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none focus:border-amber-400/50"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="لا يوجد عملاء" desc="سيتم إنشاء العملاء تلقائيًا عند أول عملية دفع من الموقع." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3">العميل</th>
                  <th className="px-5 py-3">المعرف الخارجي</th>
                  <th className="px-5 py-3">المزود</th>
                  <th className="px-5 py-3">تاريخ الإضافة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-5 py-3">
                      <div className="text-white">{r.name ?? "—"}</div>
                      <div className="text-[10px] text-neutral-500">{r.email ?? "—"}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-neutral-400">{r.external_id}</td>
                    <td className="px-5 py-3"><Badge tone="sky">{r.provider}</Badge></td>
                    <td className="px-5 py-3 text-[11px] text-neutral-500">{new Date(r.created_at).toLocaleDateString("ar-MA")}</td>
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
