import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ShieldCheck, Lock, Loader2, CheckCircle2, CreditCard, Landmark, Copy } from "lucide-react";
import { useState } from "react";

/* ─────────── server functions ─────────── */

export const getCheckoutSession = createServerFn({ method: "GET" })
  .inputValidator((data: { publicId: string }) =>
    z.object({ publicId: z.string().min(3).max(64) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: s } = await supabaseAdmin
      .from("checkout_sessions")
      .select(
        "public_id, status, amount, currency, customer_email, customer_name, expires_at, success_url, cancel_url, site_id, plan_id, awaiting_reference, provider, provider_checkout_url",
      )
      .eq("public_id", data.publicId)
      .maybeSingle();

    if (!s) return null;

    const [{ data: site }, { data: plan }] = await Promise.all([
      supabaseAdmin
        .from("sites")
        .select("id, name, domain, logo_url, brand_color, enabled_providers, manual_instructions, manual_bank_details")
        .eq("id", s.site_id)
        .maybeSingle(),
      supabaseAdmin
        .from("plans")
        .select("code, name, description, billing_interval")
        .eq("id", s.plan_id)
        .maybeSingle(),
    ]);

    return { session: s, site, plan };
  });

export const initiateCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: { publicId: string; provider: string }) =>
    z
      .object({
        publicId: z.string().min(3).max(64),
        provider: z.enum(["manual", "stripe", "paypal", "cmi", "payzone", "naps"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getProvider } = await import("@/lib/hn-pay/providers/registry.server");

    const { data: session } = await supabaseAdmin
      .from("checkout_sessions")
      .select("*")
      .eq("public_id", data.publicId)
      .maybeSingle();
    if (!session) throw new Error("Session not found");
    if (session.status !== "pending" && session.status !== "awaiting_confirmation") {
      throw new Error(`Session is ${session.status}`);
    }
    if (new Date(session.expires_at) < new Date() && session.status === "pending") {
      await supabaseAdmin.from("checkout_sessions").update({ status: "expired" }).eq("id", session.id);
      throw new Error("Session expired");
    }

    const { data: site } = await supabaseAdmin
      .from("sites")
      .select("id, name, domain, brand_color, enabled_providers, manual_instructions, manual_bank_details")
      .eq("id", session.site_id)
      .maybeSingle();
    if (!site) throw new Error("Site not found");
    if (!(site.enabled_providers ?? []).includes(data.provider)) {
      throw new Error(`Provider '${data.provider}' is not enabled for this site`);
    }

    const provider = getProvider(data.provider);
    const sessionRow = {
      id: session.id,
      public_id: session.public_id,
      site_id: session.site_id,
      plan_id: session.plan_id,
      amount: Number(session.amount),
      currency: session.currency,
      customer_email: session.customer_email,
      customer_name: session.customer_name,
      customer_external_id: session.customer_external_id,
      success_url: session.success_url,
      cancel_url: session.cancel_url,
      metadata: (session.metadata as Record<string, unknown>) ?? {},
      provider: session.provider,
    };
    const siteRow = {
      id: site.id,
      name: site.name,
      domain: site.domain,
      enabled_providers: site.enabled_providers ?? [],
      manual_instructions: site.manual_instructions,
      manual_bank_details: (site.manual_bank_details as Record<string, unknown>) ?? {},
      brand_color: site.brand_color,
    };
    return await provider.initiate({ session: sessionRow, site: siteRow });
  });

/* ─────────── route ─────────── */

const sessionQuery = (publicId: string) =>
  queryOptions({
    queryKey: ["checkout", publicId],
    queryFn: () => getCheckoutSession({ data: { publicId } }),
  });

export const Route = createFileRoute("/checkout/$sessionId")({
  ssr: false,
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(sessionQuery(params.sessionId));
    if (!data) throw notFound();
    return data;
  },
  head: () => ({ meta: [{ title: "Secure Checkout · HN-Pay" }] }),
  component: CheckoutPage,
  notFoundComponent: () => (
    <Shell>
      <div className="text-center">
        <div className="text-lg font-bold">Checkout session not found</div>
        <div className="mt-2 text-sm text-neutral-400">The link is invalid, expired, or already used.</div>
      </div>
    </Shell>
  ),
  errorComponent: ({ error }) => (
    <Shell>
      <div className="text-center">
        <div className="text-lg font-bold text-red-400">Payment error</div>
        <div className="mt-2 text-sm text-neutral-400">{String(error)}</div>
      </div>
    </Shell>
  ),
});

const PROVIDER_META: Record<string, { label: string; sub: string; Icon: typeof CreditCard }> = {
  stripe: { label: "Card (Stripe)", sub: "Visa · Mastercard · Amex", Icon: CreditCard },
  manual: { label: "Bank Transfer", sub: "RIB · Wire · Cash", Icon: Landmark },
  paypal: { label: "PayPal", sub: "Coming soon", Icon: CreditCard },
  cmi: { label: "CMI (Maroc)", sub: "Coming soon", Icon: CreditCard },
  payzone: { label: "Payzone", sub: "Coming soon", Icon: CreditCard },
  naps: { label: "NAPS", sub: "Coming soon", Icon: CreditCard },
};

function CheckoutPage() {
  const params = Route.useParams();
  const { data } = useSuspenseQuery(sessionQuery(params.sessionId));
  const [manualResult, setManualResult] = useState<null | {
    instructions: string;
    bankDetails: Record<string, unknown>;
    referenceHint: string;
  }>(null);

  const initiate = useMutation({
    mutationFn: (provider: string) => initiateCheckout({ data: { publicId: params.sessionId, provider } }),
    onSuccess: (res) => {
      if (res.kind === "redirect") {
        window.location.href = res.url;
      } else if (res.kind === "manual") {
        setManualResult({
          instructions: res.instructions,
          bankDetails: res.bankDetails,
          referenceHint: res.referenceHint,
        });
      }
    },
  });

  if (!data) return null;
  const { session, site, plan } = data;
  const brand = site?.brand_color ?? "#f59e0b";
  const enabled = (site?.enabled_providers ?? ["manual"]) as string[];

  const succeeded = session.status === "succeeded";
  const awaiting = session.status === "awaiting_confirmation" || Boolean(manualResult);

  return (
    <Shell>
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold"
          style={{ borderColor: `${brand}66`, color: brand, background: `${brand}15` }}
        >
          {(site?.name ?? "?").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-semibold">{site?.name ?? "Site"}</div>
          <div className="text-xs text-neutral-500">{site?.domain}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6">
        <div className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">You are paying</div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="text-4xl font-black text-white">
            {Number(session.amount).toFixed(2)} <span className="text-lg font-semibold">{session.currency}</span>
          </div>
          {plan?.billing_interval && <div className="text-sm text-neutral-400">/ {plan.billing_interval}</div>}
        </div>
        <div className="mt-1 text-sm text-neutral-300">
          {plan?.name} <span className="text-neutral-500">· {plan?.code}</span>
        </div>
        {session.customer_email && (
          <div className="mt-4 rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-xs text-neutral-400">
            Billing to <span className="text-neutral-200">{session.customer_email}</span>
          </div>
        )}

        {succeeded ? (
          <div className="mt-6 flex flex-col items-center py-6">
            <CheckCircle2 className="h-14 w-14 text-emerald-400" />
            <div className="mt-3 text-lg font-bold text-white">Payment confirmed</div>
            <div className="mt-1 text-xs text-neutral-400">You can safely close this page.</div>
          </div>
        ) : awaiting ? (
          <ManualPending brand={brand} session={session} manualResult={manualResult} site={site} />
        ) : (
          <div className="mt-6 space-y-2">
            {enabled.map((code) => {
              const m = PROVIDER_META[code] ?? PROVIDER_META.manual;
              const isPrimary = code === enabled[0];
              return (
                <button
                  key={code}
                  onClick={() => initiate.mutate(code)}
                  disabled={initiate.isPending}
                  className="group flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left hover:border-white/25 hover:bg-white/[0.03] disabled:opacity-60"
                  style={isPrimary ? { boxShadow: `0 0 0 1px ${brand}55 inset` } : undefined}
                >
                  <div className="flex items-center gap-3">
                    <m.Icon className="h-5 w-5" style={{ color: brand }} />
                    <div>
                      <div className="text-sm font-semibold text-white">{m.label}</div>
                      <div className="text-[11px] text-neutral-500">{m.sub}</div>
                    </div>
                  </div>
                  {initiate.isPending && initiate.variables === code ? (
                    <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                  ) : (
                    <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 group-hover:text-neutral-300">
                      Pay →
                    </div>
                  )}
                </button>
              );
            })}
            {initiate.isError && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {String(initiate.error)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
        <Lock className="h-3 w-3" />
        Secured by HN-Pay · TLS 1.3 · No card data stored on our servers
      </div>
    </Shell>
  );
}

function ManualPending({
  brand,
  session,
  manualResult,
  site,
}: {
  brand: string;
  session: { awaiting_reference: string | null; amount: number | string; currency: string };
  manualResult: null | { instructions: string; bankDetails: Record<string, unknown>; referenceHint: string };
  site: { manual_instructions?: string | null; manual_bank_details?: Record<string, unknown> | null } | null;
}) {
  const ref = manualResult?.referenceHint ?? session.awaiting_reference ?? "—";
  const instructions =
    manualResult?.instructions ??
    site?.manual_instructions ??
    "Please transfer the exact amount and include the reference code in your transfer memo. The merchant will confirm within 24h.";
  const bank = (manualResult?.bankDetails ?? site?.manual_bank_details ?? {}) as Record<string, unknown>;

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: brand }}>
          Awaiting confirmation
        </div>
        <p className="mt-2 text-sm text-neutral-200">{instructions}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Reference code</div>
        <div className="mt-1 flex items-center justify-between">
          <div className="font-mono text-xl font-bold text-white">{ref}</div>
          <button
            onClick={() => navigator.clipboard.writeText(ref)}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-neutral-300 hover:bg-white/5"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
        </div>
      </div>

      {Object.keys(bank).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Payment details</div>
          <div className="mt-2 space-y-1.5 text-xs">
            {Object.entries(bank).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-white/5 py-1">
                <span className="text-neutral-500 uppercase">{k}</span>
                <span className="font-mono text-neutral-200">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-[11px] text-neutral-500">
        This page will update automatically once the merchant confirms your payment.
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#05060d] font-[Inter,system-ui] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-[420px] w-[420px] rounded-full bg-violet-600/10 blur-[140px]" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-lg items-center justify-center px-6 py-16">
        <div className="w-full">
          <div className="mb-6 flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-300" />
            <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-300">
              HN-Pay Secure Checkout
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
