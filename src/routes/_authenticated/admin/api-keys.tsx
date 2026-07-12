import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, Card, Badge, EmptyState, StatCard } from "@/components/admin/AdminShell";
import { KeyRound, ShieldCheck, Clock, Plus, Copy, X, Loader2, Ban } from "lucide-react";
import { createApiKey, revokeApiKey } from "@/lib/hn-pay/admin-actions.functions";

export const Route = createFileRoute("/_authenticated/admin/api-keys")({
  head: () => ({ meta: [{ title: "مفاتيح API · HN-PAY" }] }),
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const qc = useQueryClient();
  const createFn = useServerFn(createApiKey);
  const revokeFn = useServerFn(revokeApiKey);

  const [rows, setRows] = useState<any[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [siteMap, setSiteMap] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [siteId, setSiteId] = useState("");
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<"test" | "live">("test");
  const [freshSecret, setFreshSecret] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<any | null>(null);

  const load = async () => {
    const [{ data: keys }, { data: s }] = await Promise.all([
      supabase.from("site_api_keys").select("*").order("created_at", { ascending: false }),
      supabase.from("sites").select("id, name").order("name"),
    ]);
    setRows(keys ?? []);
    setSites((s as any) ?? []);
    const map: Record<string, string> = {};
    (s ?? []).forEach((x: any) => (map[x.id] = x.name));
    setSiteMap(map);
    if (!siteId && s?.[0]) setSiteId((s[0] as any).id);
  };
  useEffect(() => { void load(); }, []);

  const createMut = useMutation({
    mutationFn: () => createFn({ data: { site_id: siteId, label, mode } }),
    onSuccess: (r: any) => { setFreshSecret(r.secret); setShowForm(false); setLabel(""); void load(); qc.invalidateQueries(); },
  });
  const revokeMut = useMutation({
    mutationFn: (id: string) => revokeFn({ data: { id } }),
    onSuccess: () => { setConfirmRevoke(null); void load(); },
  });

  return (
    <AdminShell title="مفاتيح API" subtitle="مفاتيح الوصول لكل موقع مرتبط."
      actions={
        <button onClick={() => { setShowForm(true); setFreshSecret(null); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400">
          <Plus className="h-3.5 w-3.5" /> مفتاح جديد
        </button>
      }>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard icon={<KeyRound className="h-5 w-5" />} label="إجمالي المفاتيح" value={rows.length} tone="amber" />
        <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="نشط" value={rows.filter((r) => !r.revoked_at).length} tone="emerald" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="مُبطَل" value={rows.filter((r) => r.revoked_at).length} tone="rose" />
      </div>

      {freshSecret && (
        <Card className="mb-4 border-emerald-400/30 bg-emerald-500/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-emerald-300">تم إنشاء المفتاح — احفظه الآن. لن يُعرض مرة أخرى.</div>
              <code className="mt-2 inline-block break-all rounded-lg bg-black/60 px-3 py-2 font-mono text-[11px] text-emerald-200">{freshSecret}</code>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigator.clipboard.writeText(freshSecret)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"><Copy className="h-3 w-3" /> نسخ</button>
              <button onClick={() => setFreshSecret(null)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </Card>
      )}

      {rows.length === 0 ? <EmptyState title="لا مفاتيح API بعد" desc="أنشئ مفتاحك الأول." /> : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right text-[10px] uppercase text-neutral-500">
                  <th className="px-4 py-3">الاسم</th>
                  <th className="px-4 py-3">الموقع</th>
                  <th className="px-4 py-3">البادئة</th>
                  <th className="px-4 py-3">الوضع</th>
                  <th className="px-4 py-3">آخر استخدام</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-medium">{r.label}</td>
                    <td className="px-4 py-3 text-[11px] text-neutral-400">{siteMap[r.site_id] ?? r.site_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-amber-300">{r.key_prefix}…</td>
                    <td className="px-4 py-3"><Badge tone={r.mode === "live" ? "amber" : "sky"}>{r.mode}</Badge></td>
                    <td className="px-4 py-3 text-[11px] text-neutral-500">{r.last_used_at ? new Date(r.last_used_at).toLocaleString("ar-MA") : "—"}</td>
                    <td className="px-4 py-3"><Badge tone={r.revoked_at ? "red" : "green"}>{r.revoked_at ? "مبطَل" : "نشط"}</Badge></td>
                    <td className="px-4 py-3">
                      {!r.revoked_at && (
                        <button onClick={() => setConfirmRevoke(r)}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/20">
                          <Ban className="h-3 w-3" /> إبطال
                        </button>
                      )}
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
            <div className="mb-4 flex items-center justify-between"><h3 className="font-bold">مفتاح API جديد</h3><button onClick={() => setShowForm(false)} className="text-neutral-400"><X className="h-4 w-4" /></button></div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] uppercase text-neutral-500">الموقع</span>
                <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm">
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase text-neutral-500">الاسم</span>
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="مثلاً: خادم الإنتاج" className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase text-neutral-500">الوضع</span>
                <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm">
                  <option value="test">test</option><option value="live">live</option>
                </select>
              </label>
              {createMut.error && <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-xs text-rose-200">{(createMut.error as Error).message}</div>}
              <button onClick={() => createMut.mutate()} disabled={!siteId || !label || createMut.isPending}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50">
                {createMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} إنشاء المفتاح
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setConfirmRevoke(null)}>
          <div dir="rtl" className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-[#0a0b16] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-rose-300">إبطال المفتاح؟</h3>
            <p className="mt-2 text-sm text-neutral-300">سيتوقف <span className="font-mono text-amber-300">{confirmRevoke.key_prefix}…</span> عن العمل فورًا.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmRevoke(null)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5">إلغاء</button>
              <button onClick={() => revokeMut.mutate(confirmRevoke.id)} disabled={revokeMut.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-400 disabled:opacity-50">
                {revokeMut.isPending && <Loader2 className="h-3 w-3 animate-spin" />} إبطال
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
