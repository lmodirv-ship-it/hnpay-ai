import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Check, Link2, Search, Globe, Layers, Users, Inbox, RefreshCw, Server, KeyRound } from "lucide-react";
import { OwnerShell } from "@/routes/_authenticated/owner/dashboard";
import { useHnSession } from "@/lib/auth/use-session";
import { getTvccOverview, listSiteRequests, reviewSiteRequest, pullFromTvcc } from "@/lib/hn-pay/tvcc.functions";

export const Route = createFileRoute("/_authenticated/owner/tvcc")({
  ssr: false,
  head: () => ({ meta: [{ title: "ربط TVCC · HN-Pay Live" }, { name: "description", content: "مزامنة المواقع والباقات والاشتراكات من TVCC." }] }),
  component: TvccPage,
});

const KIND: Record<string, string> = { site: "موقع", partner: "شريك", tracking: "تتبع" };

function TvccPage() {
  const { profile, signOut } = useHnSession();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [source, setSource] = useState<"all" | "tvcc" | "manual">("all");
  const [copied, setCopied] = useState("");
  const fetchFn = useServerFn(getTvccOverview);
  const reqFn = useServerFn(listSiteRequests);
  const reviewFn = useServerFn(reviewSiteRequest);
  const { data, isFetching, refetch } = useQuery({ queryKey: ["tvcc", q, page, source], queryFn: () => fetchFn({ data: { q, page, source } }) });
  const { data: requests = [] } = useQuery({ queryKey: ["tvcc-req"], queryFn: () => reqFn() });
  const review = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected" }) => reviewFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tvcc-req"] }); qc.invalidateQueries({ queryKey: ["tvcc"] }); },
  });
  const pullFn = useServerFn(pullFromTvcc);
  const pull = useMutation({ mutationFn: () => pullFn(), onSuccess: () => qc.invalidateQueries({ queryKey: ["tvcc"] }) });
  const endpoint = typeof window !== "undefined" ? `${window.location.origin}/api/public/v1/tvcc/sync` : "/api/public/v1/tvcc/sync";
  const copy = (k: string, v: string) => { navigator.clipboard.writeText(v); setCopied(k); setTimeout(() => setCopied(""), 1500); };
  const sample = `POST ${endpoint}
Authorization: Bearer <HN_CRON_SECRET>
Content-Type: application/json

{ "sites": [ { "external_id": "tvcc-123", "domain": "example.com", "name": "Example",
  "is_active": true,
  "plans": [ { "code": "pro", "name": "Pro", "amount": 49, "currency": "EUR", "billing_interval": "month" } ] } ] }`;
  const t = data?.totals;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const last = data?.runs[0];

  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ربط TVCC</h1>
          <p className="text-sm text-fx-muted">TVCC هي من تتحكم في ربط المواقع. كل مزامنة منها تحدّث المواقع والباقات هنا تلقائياً.</p>
        </div>
        <div className="flex gap-2">
        <button onClick={() => pull.mutate()} disabled={pull.isPending} className="inline-flex items-center gap-2 rounded-lg bg-fx-blue px-3 py-2 text-xs text-primary-foreground disabled:opacity-50">
          <Link2 className="h-3.5 w-3.5" /> {pull.isPending ? "جارٍ السحب…" : "سحب المواقع من TVCC الآن"}
        </button>
        <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg border border-fx-line px-3 py-2 text-xs hover:bg-fx-text/5">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> تحديث
        </button>
        </div>
      </div>

      {pull.data && <p className={`mb-4 text-sm ${pull.data.ok ? "text-fx-emerald" : "text-destructive"}`}>{pull.data.ok ? `تمت المزامنة: ${pull.data.created} موقع جديد، ${pull.data.updated} محدَّث، ${pull.data.plans} باقة.` : `فشلت المزامنة: ${pull.data.error}`}</p>}
      {pull.error && <p className="mb-4 text-sm text-destructive">{(pull.error as Error).message}</p>}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={Globe} label="كل المواقع" value={t?.sites} />
        <Stat icon={Link2} label="مواقع من TVCC" value={t?.tvccSites} />
        <Stat icon={Layers} label="الباقات" value={t?.plans} />
        <Stat icon={Users} label="اشتراكات نشطة" value={t?.activeSubs} />
        <Stat icon={Inbox} label="طلبات المستخدمين" value={t?.pendingRequests} />
      </div>

      <section className="mb-6 rounded-2xl border border-fx-line bg-fx-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">طريقة الربط</h2>
          <span className={`rounded-full px-2.5 py-1 text-[11px] ${last?.status === "ok" ? "bg-fx-emerald/15 text-fx-emerald" : last ? "bg-destructive/15 text-destructive" : "bg-fx-text/10 text-fx-muted"}`}>
            {last ? `آخر مزامنة: ${new Date(last.started_at).toLocaleString("ar-MA")} — ${last.status === "ok" ? "ناجحة" : last.status === "failed" ? "فشلت" : "جارية"}` : "لم تصل أي مزامنة من TVCC بعد"}
          </span>
        </div>
        <ol className="mb-3 list-decimal space-y-1 pe-5 text-sm text-fx-muted">
          <li>في TVCC، أضف عنوان الاستقبال أدناه كوجهة مزامنة.</li>
          <li>استخدم نفس المفتاح السري المشترك <b className="text-fx-text">HN_CRON_SECRET</b> الذي أُرسل سابقاً إلى TVCC.</li>
          <li>كلما تغيّرت المواقع أو الباقات في TVCC تُرسل القائمة كاملة، وتظهر هنا فوراً.</li>
        </ol>
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-fx-line bg-fx-bg/60 px-3 py-2 font-mono text-xs" dir="ltr">
          <span className="flex-1 truncate">{endpoint}</span>
          <button onClick={() => copy("ep", endpoint)} aria-label="نسخ">{copied === "ep" ? <Check className="h-4 w-4 text-fx-emerald" /> : <Copy className="h-4 w-4" />}</button>
        </div>
        <pre dir="ltr" className="overflow-x-auto rounded-lg border border-fx-line bg-fx-bg/60 p-3 font-mono text-[11px] text-fx-muted">{sample}</pre>
        {last?.error && <p className="mt-2 text-xs text-destructive">{last.error}</p>}
      </section>

      <section className="mb-6 rounded-2xl border border-fx-line bg-fx-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-fx-cyan" />
          <h2 className="font-semibold">معلومات الربط مع HN-Pay Live</h2>
        </div>
        <p className="mb-4 text-sm text-fx-muted">هذه البيانات تُستخدم في نافذة «إضافة تكامل مخصص» في TVCC أو أي منصة خارجية تريد مزامنة مواقعها وباقاتها مع HN-Pay Live.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="اسم الخدمة" value="HN-Pay Live" k="name" copied={copied} copy={copy} />
          <Field label="طريقة الربط" value="رابط URL (Webhook Push)" k="method" copied={copied} copy={copy} />
          <Field label="رابط الخدمة (URL)" value={endpoint} k="url" copied={copied} copy={copy} mono full />
          <Field label="المفتاح السري" value="HN_CRON_SECRET — محفوظ ومفعّل" k="secret" copied={copied} copy={copy} icon={<KeyRound className="h-4 w-4 text-fx-emerald" />} note="لا يُعرض هنا لأسباب أمنية. يُدار من إعدادات الأسرار." />
        </div>
        <div className="mt-4 rounded-lg border border-fx-line bg-fx-bg/60 p-3 text-xs text-fx-muted">
          <b className="text-fx-text">ما الذي يحدث عند الربط؟</b> كل مزامنة من TVCC تُحدّث تلقائياً: لائحة المواقع، الباقات والأسعار، وحالة كل موقع (نشط/متوقف). تظهر النتائج في الجدول أدناه فوراً، وتسجَّل كل عملية في سجل المزامنة.
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-fx-line bg-fx-card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="me-auto font-semibold">المواقع والباقات والاشتراكات</h2>
          <div className="flex rounded-lg border border-fx-line text-xs">
            {(["all", "tvcc", "manual"] as const).map((s) => (
              <button key={s} onClick={() => { setSource(s); setPage(0); }} className={`px-3 py-1.5 ${source === s ? "bg-fx-blue text-primary-foreground" : "text-fx-muted"}`}>
                {s === "all" ? "الكل" : s === "tvcc" ? "TVCC" : "يدوي"}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-fx-line px-3 py-1.5">
            <Search className="h-4 w-4 text-fx-muted" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="ابحث بالاسم أو النطاق" className="w-48 bg-transparent text-sm outline-none" />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-fx-muted"><tr className="border-b border-fx-line">
              <th className="p-2 text-start">الموقع</th><th className="p-2 text-start">المصدر</th><th className="p-2 text-start">الحالة</th>
              <th className="p-2 text-start">الباقات</th><th className="p-2 text-start">الاشتراكات</th>
            </tr></thead>
            <tbody>
              {(data?.rows ?? []).map((s) => (
                <tr key={s.id} className="border-b border-fx-line/50 align-top">
                  <td className="p-2"><div className="font-medium">{s.name}</div><div className="font-mono text-[11px] text-fx-muted" dir="ltr">{s.domain}</div></td>
                  <td className="p-2 text-xs">{s.source === "tvcc" ? <span className="text-fx-cyan">TVCC</span> : "يدوي"}</td>
                  <td className="p-2 text-xs">{s.is_active ? <span className="text-fx-emerald">نشط</span> : <span className="text-fx-muted">متوقف</span>}</td>
                  <td className="p-2 text-xs">
                    {s.plans.length === 0 ? <span className="text-fx-muted">لا توجد باقات</span> : (
                      <div className="flex flex-wrap gap-1">{s.plans.map((p: any) => (
                        <span key={p.code} className="rounded-md border border-fx-line px-1.5 py-0.5">{p.name} · <span dir="ltr">{p.amount} {p.currency}</span></span>
                      ))}</div>
                    )}
                  </td>
                  <td className="p-2 text-xs">{s.activeSubs} نشط / {s.totalSubs}</td>
                </tr>
              ))}
              {data && data.rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-fx-muted">لا توجد نتائج</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-fx-muted">
          <span>{data?.total ?? 0} موقع</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded border border-fx-line px-2 py-1 disabled:opacity-40">السابق</button>
            <span>{page + 1} / {pages}</span>
            <button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} className="rounded border border-fx-line px-2 py-1 disabled:opacity-40">التالي</button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-fx-line bg-fx-card p-5">
        <h2 className="mb-3 font-semibold">طلبات المستخدمين (موقع / شريك / تتبع)</h2>
        {requests.length === 0 ? <p className="text-sm text-fx-muted">لا توجد طلبات بعد.</p> : (
          <table className="w-full text-sm"><tbody>
            {requests.map((r: any) => (
              <tr key={r.id} className="border-b border-fx-line/50">
                <td className="p-2 text-xs">{KIND[r.kind]}</td>
                <td className="p-2"><div>{r.name}</div><div className="font-mono text-[11px] text-fx-muted" dir="ltr">{r.url}</div></td>
                <td className="p-2 text-xs text-fx-muted">{r.notes}</td>
                <td className="p-2 text-xs">{r.status === "pending" ? (
                  <div className="flex gap-2">
                    <button onClick={() => review.mutate({ id: r.id, status: "approved" })} className="rounded bg-fx-emerald/20 px-2 py-1 text-fx-emerald">قبول</button>
                    <button onClick={() => review.mutate({ id: r.id, status: "rejected" })} className="rounded bg-destructive/15 px-2 py-1 text-destructive">رفض</button>
                  </div>) : r.status === "approved" ? "مقبول" : "مرفوض"}</td>
              </tr>
            ))}
          </tbody></table>
        )}
      </section>
    </OwnerShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-fx-line bg-fx-card p-4">
      <div className="flex items-center gap-2 text-xs text-fx-muted"><Icon className="h-4 w-4 text-fx-cyan" />{label}</div>
      <div className="mt-1 font-mono text-2xl">{value ?? "—"}</div>
    </div>
  );
}

function Field({ label, value, k, copied, copy, mono, full, icon, note }: {
  label: string; value: string; k: string; copied: string; copy: (k: string, v: string) => void;
  mono?: boolean; full?: boolean; icon?: React.ReactNode; note?: string;
}) {
  return (
    <div className={`rounded-lg border border-fx-line bg-fx-bg/60 p-3 ${full ? "md:col-span-2" : ""}`}>
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-fx-muted">{icon}{label}</div>
      <div className="flex items-center gap-2">
        <span className={`flex-1 truncate text-sm ${mono ? "font-mono text-xs" : ""}`} dir={mono ? "ltr" : undefined}>{value}</span>
        <button onClick={() => copy(k, value)} aria-label={`نسخ ${label}`} className="shrink-0 text-fx-muted hover:text-fx-text">
          {copied === k ? <Check className="h-4 w-4 text-fx-emerald" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      {note && <p className="mt-1 text-[11px] text-fx-muted">{note}</p>}
    </div>
  );
}
