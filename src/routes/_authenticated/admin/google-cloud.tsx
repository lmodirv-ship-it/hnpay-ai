import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getGoogleOverview, updateSiteGoogle, creditWallet } from "@/lib/hn-pay/google-ecosystem.functions";
import { AdminShell, Card, Badge, StatCard } from "@/components/admin/AdminShell";
import { Cloud, CheckCircle2, Clock, XCircle } from "lucide-react";
import { ADSENSE_PUBLISHER_ID } from "@/lib/google-ecosystem/adsense";

export const Route = createFileRoute("/_authenticated/admin/google-cloud")({
  head: () => ({ meta: [{ title: "Google Cloud · HN-Pay Live" }] }),
  component: GoogleCloudPage,
});

type Overview = Awaited<ReturnType<typeof getGoogleOverview>>;

function GoogleCloudPage() {
  const load = useServerFn(getGoogleOverview);
  const save = useServerFn(updateSiteGoogle);
  const credit = useServerFn(creditWallet);
  const [o, setO] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [w, setW] = useState({ email: "", amount: "", currency: "EUR" as "EUR" | "USD" | "MAD" });
  const [wMsg, setWMsg] = useState<string | null>(null);
  const refresh = () => load().then(setO).catch((e) => setErr(String(e.message ?? e)));
  useEffect(() => { void refresh(); }, []);

  return (
    <AdminShell title="حوكمة Google Ecosystem" subtitle="Google Identity · Google Pay · GA4 · AdSense · مزامنة Firestore/BigQuery/Sheets">
      {err && <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-200">{err}</div>}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Clock className="h-5 w-5" />} label="بانتظار المزامنة" value={o?.counts.pending ?? "—"} tone="amber" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="تمت مزامنتها" value={o?.counts.synced ?? "—"} tone="emerald" />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="فشلت" value={o?.counts.failed ?? "—"} tone="rose" />
        <StatCard icon={<Cloud className="h-5 w-5" />} label="ناشر AdSense" value={ADSENSE_PUBLISHER_ID.replace("pub-", "")} tone="sky" />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-2 text-sm font-bold">حالة الربط</div>
          <ul className="space-y-2 text-xs">
            <li className="flex justify-between"><span>Google Sign-In (OAuth 2.0)</span><Badge tone="green">مفعّل</Badge></li>
            <li className="flex justify-between"><span>جسر مزامنة Google Cloud</span><Badge tone={o?.env.syncWebhook ? "green" : "neutral"}>{o?.env.syncWebhook ? "متصل" : "بانتظار الرابط"}</Badge></li>
            <li className="flex justify-between"><span>GA4 (مركزي)</span><Badge tone={o?.env.ga4 ? "green" : "neutral"}>{o?.env.ga4 ? "متصل" : "حسب كل موقع"}</Badge></li>
            <li className="flex justify-between"><span>Google Pay™</span><Badge tone="neutral">يُضبط من مزودي الدفع</Badge></li>
          </ul>
        </Card>
        <Card>
          <div className="mb-2 text-sm font-bold">شحن / مكافأة محفظة عميل</div>
          <div className="grid grid-cols-3 gap-2">
            <input className="col-span-3 rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs" placeholder="email" value={w.email} onChange={(e) => setW({ ...w, email: e.target.value })} />
            <input className="col-span-2 rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs" placeholder="amount" inputMode="decimal" value={w.amount} onChange={(e) => setW({ ...w, amount: e.target.value })} />
            <select className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs" value={w.currency} onChange={(e) => setW({ ...w, currency: e.target.value as "EUR" })}>
              <option>EUR</option><option>USD</option><option>MAD</option>
            </select>
          </div>
          <button className="mt-3 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200"
            onClick={async () => {
              setWMsg(null);
              try { await credit({ data: { email: w.email, amount: Number(w.amount), currency: w.currency, type: "topup" } }); setWMsg("تم الشحن ✓"); void refresh(); }
              catch (e) { setWMsg(String((e as Error).message)); }
            }}>شحن الرصيد</button>
          {wMsg && <div className="mt-2 text-[11px] text-neutral-300">{wMsg}</div>}
        </Card>
      </div>

      <Card>
        <div className="mb-3 text-sm font-bold">GA4 و AdSense لكل موقع</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-neutral-500"><tr><th className="p-2 text-start">الموقع</th><th className="p-2 text-start">GA4 ID</th><th className="p-2">AdSense</th><th className="p-2" /></tr></thead>
            <tbody>
              {(o?.sites ?? []).map((s) => <SiteRow key={s.id} s={s} onSave={async (ga, ads) => { await save({ data: { id: s.id, google_analytics_id: ga || null, adsense_enabled: ads } }); void refresh(); }} />)}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="mb-3 mt-2 text-sm font-bold">آخر أحداث المزامنة</div>
        {(o?.recent ?? []).length === 0 ? <div className="text-xs text-neutral-500">لا توجد أحداث بعد.</div> : (
          <ul className="space-y-1 text-[11px]">
            {o!.recent.map((r) => (
              <li key={r.id} className="flex justify-between gap-2 border-b border-white/5 py-1">
                <span>{r.event_type} → {r.google_destination}</span>
                <Badge tone={r.sync_status === "synced" ? "green" : r.sync_status === "failed" ? "red" : "neutral"}>{r.sync_status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminShell>
  );
}

function SiteRow({ s, onSave }: { s: Overview["sites"][number]; onSave: (ga: string, ads: boolean) => Promise<void> }) {
  const [ga, setGa] = useState(s.google_analytics_id ?? "");
  const [ads, setAds] = useState(s.adsense_enabled);
  return (
    <tr className="border-t border-white/5">
      <td className="p-2"><div className="font-semibold">{s.name}</div><div className="text-[10px] text-neutral-500">{s.domain}</div></td>
      <td className="p-2"><input value={ga} onChange={(e) => setGa(e.target.value.toUpperCase())} placeholder="G-XXXXXXX" className="w-32 rounded border border-white/10 bg-black/40 px-2 py-1" /></td>
      <td className="p-2 text-center"><input type="checkbox" checked={ads} onChange={(e) => setAds(e.target.checked)} /></td>
      <td className="p-2"><button onClick={() => onSave(ga, ads)} className="rounded border border-white/10 px-2 py-1 hover:bg-white/5">حفظ</button></td>
    </tr>
  );
}
