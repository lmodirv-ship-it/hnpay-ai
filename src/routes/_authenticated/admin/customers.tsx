import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, EmptyState, Badge } from "@/components/admin/AdminShell";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { upsertCustomer, deleteCustomer } from "@/lib/hn-pay/admin-actions.functions";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({ meta: [{ title: "العملاء · HN-PAY" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const upsertFn = useServerFn(upsertCustomer);
  const delFn = useServerFn(deleteCustomer);

  const [rows, setRows] = useState<any[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmDel, setConfirmDel] = useState<any | null>(null);

  const [f, setF] = useState({ site_id: "", email: "", name: "", external_id: "", provider: "manual" });

  const load = async () => {
    const [{ data }, { data: s }] = await Promise.all([
      supabase.from("customers").select("id, external_id, email, name, provider, site_id, created_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("sites").select("id, name").order("name"),
    ]);
    setRows(data ?? []);
    setSites((s as any) ?? []);
    if (!f.site_id && s?.[0]) setF((v) => ({ ...v, site_id: (s[0] as any).id }));
  };
  useEffect(() => { void load(); }, []);

  const openNew = () => { setEditing(null); setF({ site_id: sites[0]?.id ?? "", email: "", name: "", external_id: "", provider: "manual" }); setShowForm(true); };
  const openEdit = (r: any) => { setEditing(r); setF({ site_id: r.site_id, email: r.email ?? "", name: r.name ?? "", external_id: r.external_id ?? "", provider: r.provider ?? "manual" }); setShowForm(true); };

  const mut = useMutation({
    mutationFn: () => upsertFn({ data: { id: editing?.id, ...f } }),
    onSuccess: () => { setShowForm(false); void load(); },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { setConfirmDel(null); void load(); },
  });

  const filtered = rows.filter((r) =>
    q === "" || (r.email ?? "").toLowerCase().includes(q.toLowerCase()) || (r.name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  return (
    <AdminShell title="العملاء" subtitle="قاعدة عملاء HN-PAY عبر جميع مواقع المجموعة."
      actions={<button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400"><Plus className="h-3.5 w-3.5" /> إضافة عميل</button>}>
      <div className="mb-4 flex justify-end">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالبريد أو الاسم…"
          className="w-72 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm outline-none focus:border-amber-400/50" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="لا يوجد عملاء" desc="أضف عميلاً يدوياً أو انتظر أول عملية دفع من الموقع." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3">العميل</th><th className="px-5 py-3">الموقع</th><th className="px-5 py-3">المعرف الخارجي</th>
                  <th className="px-5 py-3">المزود</th><th className="px-5 py-3">التاريخ</th><th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-5 py-3"><div className="text-white">{r.name ?? "—"}</div><div className="text-[10px] text-neutral-500">{r.email ?? "—"}</div></td>
                    <td className="px-5 py-3 text-[11px] text-neutral-400">{siteName(r.site_id)}</td>
                    <td className="px-5 py-3 font-mono text-[11px] text-neutral-400">{r.external_id}</td>
                    <td className="px-5 py-3"><Badge tone="sky">{r.provider}</Badge></td>
                    <td className="px-5 py-3 text-[11px] text-neutral-500">{new Date(r.created_at).toLocaleDateString("ar-MA")}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(r)} className="rounded-md border border-white/10 p-1.5 hover:bg-white/5"><Pencil className="h-3 w-3" /></button>
                        <button onClick={() => setConfirmDel(r)} className="rounded-md border border-rose-400/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowForm(false)}>
          <div dir="rtl" className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-[#0a0b16] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h3 className="font-bold">{editing ? "تعديل عميل" : "عميل جديد"}</h3><button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button></div>
            <div className="space-y-3">
              <Fld label="الموقع"><select value={f.site_id} onChange={(e) => setF({ ...f, site_id: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm">
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Fld>
              <Fld label="الاسم"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm" /></Fld>
              <Fld label="البريد"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm" /></Fld>
              <Fld label="المعرف الخارجي (اختياري)"><input value={f.external_id} onChange={(e) => setF({ ...f, external_id: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm font-mono" /></Fld>
              <Fld label="المزود"><input value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm" /></Fld>
              {mut.error && <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-xs text-rose-200">{(mut.error as Error).message}</div>}
              <button onClick={() => mut.mutate()} disabled={!f.site_id || mut.isPending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50">
                {mut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setConfirmDel(null)}>
          <div dir="rtl" className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-[#0a0b16] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-rose-300">حذف العميل؟</h3>
            <p className="mt-2 text-sm text-neutral-300">{confirmDel.name ?? confirmDel.email ?? confirmDel.external_id}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDel(null)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs">إلغاء</button>
              <button onClick={() => delMut.mutate(confirmDel.id)} disabled={delMut.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-400 disabled:opacity-50">
                {delMut.isPending && <Loader2 className="h-3 w-3 animate-spin" />} حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[10px] uppercase text-neutral-500">{label}</span>{children}</label>;
}
