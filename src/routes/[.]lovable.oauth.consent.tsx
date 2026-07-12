import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Crown, Check, X, Loader2 } from "lucide-react";

// Supabase Auth beta OAuth surface — narrow local typing until the SDK exposes it.
type ConsentClient = { name?: string; client_uri?: string; logo_uri?: string; scope?: string };
type ConsentDetails = {
  client?: ConsentClient;
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};
type SupabaseOAuth = {
  getAuthorizationDetails(id: string): Promise<{ data: ConsentDetails | null; error: Error | null }>;
  approveAuthorization(id: string): Promise<{ data: ConsentDetails | null; error: Error | null }>;
  denyAuthorization(id: string): Promise<{ data: ConsentDetails | null; error: Error | null }>;
};
const oauth = (supabase.auth as unknown as { oauth: SupabaseOAuth }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next, app: "" } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-[#05060d] p-6 text-white">
      <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <div className="mb-2 text-sm font-semibold text-red-200">تعذّر تحميل طلب التفويض</div>
        <div className="text-xs text-red-300/80">{String((error as Error)?.message ?? error)}</div>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData() as ConsentDetails | null;
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(approve ? "approve" : "deny");
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorization_id)
      : await oauth.denyAuthorization(authorization_id);
    if (error) { setBusy(null); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(null); setError("لم يُرجع خادم التفويض عنوان إعادة توجيه."); return; }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "تطبيق خارجي";
  const scopes = details?.scopes ?? [];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05060d] px-4 font-[Inter,ui-sans-serif,system-ui] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-[520px] w-[520px] rounded-full bg-violet-600/10 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/50 bg-amber-500/15 shadow-[0_0_30px_rgba(251,191,36,0.5)]">
            <Crown className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">HN-Pay Hub</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80">OAuth Consent</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 shadow-[0_20px_80px_-20px_rgba(251,191,36,0.35)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

          <h1 className="mb-2 text-lg font-bold">
            السماح لـ <span className="text-amber-300">{clientName}</span> بالوصول؟
          </h1>
          <p className="mb-5 text-xs leading-relaxed text-neutral-400">
            سيتصل هذا التطبيق بأدوات HN-Pay Hub نيابةً عنك، ويقرأ فقط البيانات التي تسمح بها صلاحياتك (RLS).
          </p>

          {scopes.length > 0 && (
            <div className="mb-5 rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-neutral-500">الصلاحيات المطلوبة</div>
              <ul className="space-y-1 text-xs text-neutral-300">
                {scopes.map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <code dir="ltr" className="font-mono">{s}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div role="alert" className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              disabled={busy !== null}
              onClick={() => decide(false)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.04] disabled:opacity-50"
            >
              {busy === "deny" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              رفض
            </button>
            <button
              disabled={busy !== null}
              onClick={() => decide(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-gradient-to-b from-amber-400/30 to-amber-500/10 py-2.5 text-sm font-semibold text-amber-100 shadow-[0_0_25px_-5px_rgba(251,191,36,0.7)] disabled:opacity-50"
            >
              {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              السماح
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-neutral-500">
          يمكنك سحب هذا التفويض في أي وقت من إعدادات حسابك.
        </div>
      </div>
    </main>
  );
}
