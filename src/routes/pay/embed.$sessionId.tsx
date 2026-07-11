import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, CreditCard, Landmark } from "lucide-react";

/**
 * EMBEDDED checkout iframe.
 *
 * This route is intentionally minimal (no site chrome, no nav bar). The
 * merchant site loads it inside an iframe via the hn-pay.js SDK.
 * Communication with the parent window is via postMessage:
 *   { type: "hnpay:ready" }
 *   { type: "hnpay:status", status: "processing" | "succeeded" | "failed" }
 *   { type: "hnpay:close" }
 */

export const getEmbedSession = createServerFn({ method: "GET" })
  .inputValidator((data: { publicId: string; ct: string }) =>
    z.object({ publicId: z.string().min(3).max(64), ct: z.string().min(4).max(128) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: s } = await supabaseAdmin
      .from("checkout_sessions")
      .select(
        "id, public_id, status, amount, currency, customer_email, customer_name, expires_at, client_token, client_token_expires_at, site_id, plan_id, provider",
      )
      .eq("public_id", data.publicId)
      .maybeSingle();

    if (!s) return null;

    if (s.client_token !== data.ct) return null;
    if (
      s.client_token_expires_at &&
      new Date(s.client_token_expires_at) < new Date()
    ) {
      return { expired: true as const, session: null, site: null, plan: null };
    }

    const [{ data: site }, { data: plan }] = await Promise.all([
      supabaseAdmin
        .from("sites")
        .select("id, name, domain, brand_color, enabled_providers")
        .eq("id", s.site_id)
        .maybeSingle(),
      supabaseAdmin
        .from("plans")
        .select("code, name, description, billing_interval")
        .eq("id", s.plan_id)
        .maybeSingle(),
    ]);

    return { expired: false as const, session: s, site, plan };
  });

export const Route = createFileRoute("/pay/embed/$sessionId")({
  ssr: false,
  validateSearch: (search) => ({ ct: String((search as Record<string, unknown>).ct ?? "") }),
  loaderDeps: ({ search }) => ({ ct: search.ct }),
  loader: async ({ params, deps }) => {
    if (!deps.ct) throw notFound();
    const data = await getEmbedSession({ data: { publicId: params.sessionId, ct: deps.ct } });
    if (!data) throw notFound();
    return data;
  },
  head: () => ({ meta: [{ title: "HN-Pay · Secure Checkout" }] }),
  component: EmbedPage,
  notFoundComponent: () => (
    <EmbedShell>
      <ErrorBlock title="Invalid session" hint="The checkout link is invalid or already used." />
    </EmbedShell>
  ),
  errorComponent: ({ error }) => (
    <EmbedShell>
      <ErrorBlock title="Checkout error" hint={String(error)} />
    </EmbedShell>
  ),
});

type Status = "idle" | "processing" | "succeeded" | "failed";

function post(msg: Record<string, unknown>) {
  try {
    window.parent?.postMessage({ source: "hn-pay", ...msg }, "*");
  } catch {
    /* noop */
  }
}

function EmbedPage() {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const search = Route.useSearch();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const brand = data?.site?.brand_color ?? "#f59e0b";
  const providers = useMemo(
    () => (data?.site?.enabled_providers ?? ["mock"]) as string[],
    [data?.site?.enabled_providers],
  );

  useEffect(() => {
    post({ type: "hnpay:ready", checkout_id: params.sessionId });
  }, [params.sessionId]);

  // Poll status once processing starts
  useEffect(() => {
    if (status !== "processing") return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/public/v1/checkout-sessions/${params.sessionId}?ct=${encodeURIComponent(search.ct)}`,
        );
        if (!res.ok) return;
        const j = await res.json();
        if (j.status === "succeeded") {
          setStatus("succeeded");
          post({ type: "hnpay:status", status: "succeeded", checkout_id: params.sessionId });
          clearInterval(iv);
        } else if (j.status === "failed" || j.status === "expired") {
          setStatus("failed");
          post({ type: "hnpay:status", status: "failed", checkout_id: params.sessionId });
          clearInterval(iv);
        }
      } catch {
        /* keep polling */
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [status, params.sessionId, search.ct]);

  if (data?.expired || !data?.session) {
    return (
      <EmbedShell>
        <ErrorBlock title="Session expired" hint="Please restart the checkout from your site." />
      </EmbedShell>
    );
  }

  const { session, site, plan } = data;

  const handlePay = async (provider: string) => {
    setStatus("processing");
    setErrorMsg(null);
    post({ type: "hnpay:status", status: "processing", checkout_id: params.sessionId });

    if (provider === "mock") {
      // Server-side sandbox settlement — no shared secret in the browser.
      try {
        const { runMockSandboxPayment } = await import("@/lib/hn-pay/sandbox.functions");
        await runMockSandboxPayment({
          data: { publicId: params.sessionId, outcome: "succeeded" },
        });
        // status effect above will detect succeeded on next poll
      } catch (err) {
        setStatus("failed");
        setErrorMsg(String(err));
        post({ type: "hnpay:status", status: "failed", checkout_id: params.sessionId });
      }
      return;
    }

    // Real providers: delegate to existing initiate flow (redirect out)
    try {
      const { initiateCheckout } = await import("@/routes/checkout.$sessionId");
      const res = await initiateCheckout({ data: { publicId: params.sessionId, provider } });
      if (res.kind === "redirect") {
        window.top?.location.assign(res.url);
      }
    } catch (err) {
      setStatus("failed");
      setErrorMsg(String(err));
    }
  };

  return (
    <EmbedShell>
      <div className="flex items-center gap-3 pb-4">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-bold"
          style={{ borderColor: `${brand}66`, color: brand, background: `${brand}15` }}
        >
          {(site?.name ?? "?").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{site?.name ?? "Merchant"}</div>
          <div className="truncate text-[11px] text-neutral-500">{site?.domain}</div>
        </div>
        <div className="ms-auto flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
          <ShieldCheck className="h-3 w-3" /> HN-Pay
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">You are paying</div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <div className="text-3xl font-black text-white">
            {Number(session.amount).toFixed(2)}
          </div>
          <div className="text-sm font-semibold text-neutral-300">{session.currency}</div>
          {plan?.billing_interval && (
            <div className="text-xs text-neutral-500">/ {plan.billing_interval}</div>
          )}
        </div>
        <div className="mt-1 text-xs text-neutral-300">
          {plan?.name}
          {plan?.code ? <span className="text-neutral-500"> · {plan.code}</span> : null}
        </div>
        {session.customer_email && (
          <div className="mt-3 truncate rounded-lg border border-white/5 bg-black/40 px-2.5 py-1.5 text-[11px] text-neutral-400">
            <span className="text-neutral-200">{session.customer_email}</span>
          </div>
        )}
      </div>

      {status === "succeeded" ? (
        <div className="mt-5 flex flex-col items-center py-6">
          <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          <div className="mt-3 text-base font-bold text-white">Payment confirmed</div>
          <div className="mt-1 text-[11px] text-neutral-400">Activating your plan…</div>
          <button
            onClick={() => post({ type: "hnpay:close", checkout_id: params.sessionId })}
            className="mt-5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-100 hover:bg-white/10"
          >
            Close
          </button>
        </div>
      ) : status === "failed" ? (
        <div className="mt-5 flex flex-col items-center py-6">
          <XCircle className="h-12 w-12 text-red-400" />
          <div className="mt-3 text-base font-bold text-white">Payment failed</div>
          <div className="mt-1 text-[11px] text-neutral-400">
            {errorMsg ?? "Please try another method."}
          </div>
          <button
            onClick={() => setStatus("idle")}
            className="mt-5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-100 hover:bg-white/10"
          >
            Try again
          </button>
        </div>
      ) : status === "processing" ? (
        <div className="mt-5 flex flex-col items-center py-8">
          <Loader2 className="h-10 w-10 animate-spin text-amber-300" />
          <div className="mt-3 text-sm font-semibold text-white">Processing securely…</div>
          <div className="mt-1 text-[11px] text-neutral-500">Waiting for the payment gateway.</div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {providers.map((code) => {
            const meta = PROVIDER_META[code] ?? PROVIDER_META.mock;
            return (
              <button
                key={code}
                onClick={() => handlePay(code)}
                className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-amber-400/40 hover:bg-white/[0.06]"
              >
                <meta.Icon className="h-5 w-5 text-amber-300" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{meta.label}</div>
                  <div className="truncate text-[11px] text-neutral-500">{meta.sub}</div>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 opacity-0 transition group-hover:opacity-100">
                  Pay →
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-neutral-500">
        <ShieldCheck className="h-3 w-3" />
        Encrypted & PCI-safe · powered by HN-Pay
      </div>
    </EmbedShell>
  );
}

const PROVIDER_META: Record<string, { label: string; sub: string; Icon: typeof CreditCard }> = {
  mock: { label: "HN-Pay Sandbox", sub: "Test mode · no real charge", Icon: ShieldCheck },
  stripe: { label: "Card · Visa · Mastercard", sub: "Stripe secure fields", Icon: CreditCard },
  manual: { label: "Bank transfer", sub: "RIB · Wire · Cash", Icon: Landmark },
  paypal: { label: "PayPal", sub: "Coming soon", Icon: CreditCard },
  cmi: { label: "CMI (Maroc)", sub: "Coming soon", Icon: CreditCard },
  payzone: { label: "Payzone", sub: "Coming soon", Icon: CreditCard },
  naps: { label: "NAPS", sub: "Coming soon", Icon: CreditCard },
};

function EmbedShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-black p-4 text-neutral-100">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}

function ErrorBlock({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
      <XCircle className="mx-auto h-10 w-10 text-red-400" />
      <div className="mt-3 text-base font-bold text-white">{title}</div>
      <div className="mt-1 text-xs text-neutral-400">{hint}</div>
    </div>
  );
}
