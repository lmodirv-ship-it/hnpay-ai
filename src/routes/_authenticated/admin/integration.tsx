import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell, Card } from "@/components/admin/AdminShell";
import {
  ArrowLeft, Code2, KeyRound, Webhook, Send, CheckCircle2, XCircle,
  Loader2, Clock, Copy, Check, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import { listSites } from "@/lib/hn-pay/sites.functions";
import { sendTestWebhook, WEBHOOK_TEST_EVENT_TYPES } from "@/lib/hn-pay/webhook-tester.functions";

export const Route = createFileRoute("/_authenticated/admin/integration")({
  head: () => ({ meta: [{ title: "التكامل و API · HN-PAY" }] }),
  component: IntegrationPage,
});

type TestResult = Awaited<ReturnType<typeof sendTestWebhook>>;
type HistoryItem = {
  id: string;
  at: number;
  siteName: string;
  eventType: string;
  result?: TestResult;
  error?: string;
};

function IntegrationPage() {
  return (
    <AdminShell title="التكامل و API" subtitle="اربط جميع مواقع مجموعة HN بنفس بوابة الدفع.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <IntCard icon={<KeyRound className="h-5 w-5" />} title="مفاتيح API" desc="إنشاء وإدارة مفاتيح لكل موقع مسجّل." to="/owner/sites" />
        <IntCard icon={<Webhook className="h-5 w-5" />} title="Webhooks" desc="إعداد نقاط استقبال أحداث الدفع." to="/owner/hn-pay/integrate" />
        <IntCard icon={<Code2 className="h-5 w-5" />} title="مقتطفات SDK" desc="زرّ دفع جاهز + قالب استقبال." to="/owner/hn-pay/integrate" />
      </div>

      <WebhookTester />

      <Card className="mt-6">
        <h3 className="mb-3 text-sm font-semibold">نقطة نهاية الـ Checkout</h3>
        <pre dir="ltr" className="overflow-x-auto rounded-lg border border-white/10 bg-black/60 p-4 font-mono text-xs text-emerald-200">
{`POST /api/public/v1/checkout-sessions
Authorization: Bearer <SITE_API_KEY>
Content-Type: application/json

{
  "plan_id": "…",
  "customer": { "email": "user@example.com", "name": "User" },
  "success_url": "https://example.com/thanks",
  "cancel_url":  "https://example.com/cancel"
}`}
        </pre>
      </Card>
    </AdminShell>
  );
}

function WebhookTester() {
  const listSitesFn = useServerFn(listSites);
  const sendTest = useServerFn(sendTestWebhook);

  const sitesQuery = useQuery({
    queryKey: ["admin", "integration", "sites"],
    queryFn: () => listSitesFn(),
  });

  const [siteId, setSiteId] = useState<string>("");
  const [eventType, setEventType] = useState<(typeof WEBHOOK_TEST_EVENT_TYPES)[number]>("charge.succeeded");
  const [overrideUrl, setOverrideUrl] = useState("");
  const [payloadText, setPayloadText] = useState<string>(() =>
    JSON.stringify({ amount: 4900, currency: "USD", customer: { email: "test@example.com" } }, null, 2),
  );
  const [persist, setPersist] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  const selectedSite = useMemo(
    () => sitesQuery.data?.find((s) => s.id === siteId),
    [sitesQuery.data, siteId],
  );

  useEffect(() => {
    if (!siteId && sitesQuery.data && sitesQuery.data.length > 0) {
      const withHook = sitesQuery.data.find((s) => s.webhook_url) ?? sitesQuery.data[0];
      setSiteId(withHook.id);
    }
  }, [siteId, sitesQuery.data]);

  const mutation = useMutation({
    mutationFn: async (input: {
      siteId: string;
      eventType: (typeof WEBHOOK_TEST_EVENT_TYPES)[number];
      overrideUrl?: string;
      payload?: Record<string, unknown>;
      persist: boolean;
    }) => sendTest({ data: input }),
    onSuccess: (result, vars) => {
      const site = sitesQuery.data?.find((s) => s.id === vars.siteId);
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          at: Date.now(),
          siteName: site?.name ?? "—",
          eventType: vars.eventType,
          result,
        },
        ...prev,
      ].slice(0, 10));
    },
    onError: (err, vars) => {
      const site = sitesQuery.data?.find((s) => s.id === vars.siteId);
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          at: Date.now(),
          siteName: site?.name ?? "—",
          eventType: vars.eventType,
          error: err instanceof Error ? err.message : String(err),
        },
        ...prev,
      ].slice(0, 10));
    },
  });

  const onSend = () => {
    setPayloadError(null);
    let payload: Record<string, unknown> | undefined;
    if (payloadText.trim()) {
      try {
        payload = JSON.parse(payloadText);
      } catch (e) {
        setPayloadError("JSON غير صالح: " + (e instanceof Error ? e.message : String(e)));
        return;
      }
    }
    if (!siteId) {
      setPayloadError("اختر موقعًا أولاً");
      return;
    }
    mutation.mutate({
      siteId,
      eventType,
      overrideUrl: overrideUrl || undefined,
      payload,
      persist,
    });
  };

  const latest = mutation.data;
  const latestError = mutation.error instanceof Error ? mutation.error.message : mutation.error ? String(mutation.error) : null;

  return (
    <Card className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Webhook className="h-4 w-4 text-amber-300" /> اختبار Webhook مباشر
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            أرسل حدثًا موقّعًا إلى نقطة استقبال الموقع وشاهد الرد لحظيًا (الحالة، الترويسات، الجسم، الزمن).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="الموقع">
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-amber-400/50"
          >
            {sitesQuery.isLoading && <option>جاري التحميل…</option>}
            {sitesQuery.data?.length === 0 && <option value="">لا توجد مواقع</option>}
            {sitesQuery.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.webhook_url ? "" : "(بدون webhook)"}
              </option>
            ))}
          </select>
          {selectedSite && (
            <div dir="ltr" className="mt-1 truncate text-[10px] text-neutral-500">
              {selectedSite.webhook_url ?? "no webhook_url configured"}
            </div>
          )}
        </Field>

        <Field label="نوع الحدث">
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as typeof eventType)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-amber-400/50"
          >
            {WEBHOOK_TEST_EVENT_TYPES.map((ev) => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
        </Field>

        <Field label="URL بديل (اختياري)">
          <input
            dir="ltr"
            type="url"
            value={overrideUrl}
            onChange={(e) => setOverrideUrl(e.target.value)}
            placeholder="https://webhook.site/…"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-left text-sm outline-none focus:border-amber-400/50"
          />
        </Field>

        <Field label="خيارات">
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-neutral-300">
            <input
              type="checkbox"
              checked={persist}
              onChange={(e) => setPersist(e.target.checked)}
              className="h-3.5 w-3.5 accent-amber-400"
            />
            حفظ في سجل webhook_events
          </label>
        </Field>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-300">حمولة الحدث (JSON) — الحقل <code>data</code></span>
          <button
            onClick={() => setPayloadText(JSON.stringify({ amount: 4900, currency: "USD", customer: { email: "test@example.com" } }, null, 2))}
            className="text-[10px] text-amber-300 hover:underline"
          >
            إعادة تعيين
          </button>
        </div>
        <textarea
          dir="ltr"
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-emerald-200 outline-none focus:border-amber-400/50"
        />
        {payloadError && <div className="mt-1 text-[11px] text-red-400">{payloadError}</div>}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={onSend}
          disabled={mutation.isPending || !siteId}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-200 shadow-[0_0_25px_-8px_rgba(251,191,36,0.6)] transition hover:bg-amber-500/25 disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          إرسال الحدث
        </button>
        {mutation.isPending && <span className="text-xs text-neutral-400">جارٍ الإرسال…</span>}
      </div>

      {(latest || latestError) && (
        <div className="mt-6">
          {latestError && !latest && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              <XCircle className="h-4 w-4" /> {latestError}
            </div>
          )}
          {latest && <ResultView result={latest} />}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">سجل الجلسة</div>
            <button
              onClick={() => setHistory([])}
              className="inline-flex items-center gap-1 text-[10px] text-neutral-400 hover:text-red-300"
            >
              <Trash2 className="h-3 w-3" /> مسح
            </button>
          </div>
          <div className="space-y-1.5">
            {history.map((h) => <HistoryRow key={h.id} item={h} />)}
          </div>
        </div>
      )}
    </Card>
  );
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const [open, setOpen] = useState(false);
  const status = item.result?.response.status ?? 0;
  const ok = item.result?.response.ok ?? false;
  const err = item.error ?? item.result?.response.network_error;
  return (
    <div className="rounded-lg border border-white/10 bg-black/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2 text-xs">
          {err ? (
            <XCircle className="h-3.5 w-3.5 text-red-400" />
          ) : ok ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-amber-400" />
          )}
          <span className="font-mono text-[11px] text-neutral-300">{item.eventType}</span>
          <span className="text-neutral-500">·</span>
          <span className="text-neutral-400">{item.siteName}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
          {item.result && (
            <span className={`rounded px-1.5 py-0.5 font-mono ${ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
              {status || "ERR"}
            </span>
          )}
          {item.result && <span>{item.result.response.duration_ms}ms</span>}
          <span>{new Date(item.at).toLocaleTimeString()}</span>
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </div>
      </button>
      {open && item.result && (
        <div className="border-t border-white/10 p-3">
          <ResultView result={item.result} compact />
        </div>
      )}
      {open && err && !item.result && (
        <div className="border-t border-white/10 p-3 text-xs text-red-300">{err}</div>
      )}
    </div>
  );
}

function ResultView({ result, compact }: { result: TestResult; compact?: boolean }) {
  const ok = result.response.ok;
  const netErr = result.response.network_error;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill ok={ok} status={result.response.status} networkError={netErr} />
        <Pill icon={<Clock className="h-3 w-3" />}>{result.response.duration_ms} ms</Pill>
        <Pill>event_id: <code className="font-mono">{result.request.event_id}</code></Pill>
      </div>

      <div dir="ltr" className="truncate rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-neutral-400">
        POST {result.target_url}
      </div>

      {netErr && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">
          Network error: {netErr}
        </div>
      )}

      <div className={compact ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 gap-3 md:grid-cols-2"}>
        <Panel title="Request headers">
          <HeaderList headers={result.request.headers} />
        </Panel>
        <Panel title="Response headers">
          {Object.keys(result.response.headers).length === 0
            ? <div className="text-[11px] text-neutral-500">—</div>
            : <HeaderList headers={result.response.headers} />}
        </Panel>
        <Panel title="Request body">
          <CodeBlock code={result.request.body} />
        </Panel>
        <Panel title="Response body">
          <CodeBlock code={result.response.body || "(empty)"} />
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30">
      <div className="border-b border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{title}</div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function HeaderList({ headers }: { headers: Record<string, string> }) {
  return (
    <div dir="ltr" className="space-y-0.5 font-mono text-[10.5px]">
      {Object.entries(headers).map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <span className="shrink-0 text-amber-300/80">{k}:</span>
          <span className="break-all text-neutral-300">{v}</span>
        </div>
      ))}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre dir="ltr" className="max-h-56 overflow-auto rounded-md bg-black/60 p-2 font-mono text-[10.5px] leading-relaxed text-emerald-200"><code>{code}</code></pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
        className="absolute right-1.5 top-1.5 rounded border border-white/10 bg-black/70 p-1 text-neutral-400 hover:bg-white/5"
        aria-label="نسخ"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

function Pill({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-neutral-300">
      {icon}{children}
    </span>
  );
}

function StatusPill({ ok, status, networkError }: { ok: boolean; status: number; networkError: string | null }) {
  if (networkError) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
        <XCircle className="h-3 w-3" /> Network error
      </span>
    );
  }
  const cls = ok
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
    : "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono ${cls}`}>
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      HTTP {status}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-semibold text-neutral-300">{label}</div>
      {children}
    </label>
  );
}

function IntCard({ icon, title, desc, to }: { icon: React.ReactNode; title: string; desc: string; to: string }) {
  return (
    <Link to={to as any} className="group">
      <Card className="transition hover:border-amber-400/40 hover:shadow-[0_0_30px_-10px_rgba(251,191,36,0.5)]">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-300">{icon}</div>
        <div className="text-sm font-bold">{title}</div>
        <div className="mt-1 text-xs text-neutral-400">{desc}</div>
        <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-amber-300">
          <ArrowLeft className="h-3 w-3" /> فتح
        </div>
      </Card>
    </Link>
  );
}
