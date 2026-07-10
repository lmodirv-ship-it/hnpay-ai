import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ShieldCheck, Lock, Loader2, CheckCircle2, CreditCard } from "lucide-react";
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
        "public_id, status, amount, currency, customer_email, customer_name, expires_at, success_url, cancel_url, site_id, plan_id",
      )
      .eq("public_id", data.publicId)
      .maybeSingle();

    if (!s) return null;

    const [{ data: site }, { data: plan }] = await Promise.all([
      supabaseAdmin
        .from("sites")
        .select("name, domain, logo_url, brand_color")
        .eq("id", s.site_id)
        .maybeSingle(),
      supabaseAdmin
        .from("plans")
        .select("code, name, description, billing_interval")
        .eq("id", s.plan_id)
        .maybeSingle(),
    ]);

    return {
      public_id: s.public_id,
      status: s.status,
      amount: s.amount,
      currency: s.currency,
      customer_email: s.customer_email,
      customer_name: s.customer_name,
      expires_at: s.expires_at,
      success_url: s.success_url,
      cancel_url: s.cancel_url,
      site,
      plan,
    };
  });

export const confirmCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: { publicId: string }) =>
    z.object({ publicId: z.string().min(3).max(64) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { enqueueAndDeliver } = await import("@/lib/hn-pay/webhooks.server");

    const { data: session } = await supabaseAdmin
      .from("checkout_sessions")
      .select("*")
      .eq("public_id", data.publicId)
      .maybeSingle();

    if (!session) throw new Error("Session not found");
    if (session.status === "succeeded") {
      return { ok: true, already: true, redirect: session.success_url };
    }
    if (session.status !== "pending") {
      throw new Error(`Session is ${session.status}`);
    }
    if (new Date(session.expires_at) < new Date()) {
      await supabaseAdmin
        .from("checkout_sessions")
        .update({ status: "expired" })
        .eq("id", session.id);
      throw new Error("Session expired");
    }

    // upsert customer
    let customerId: string | null = null;
    if (session.customer_external_id) {
      const { data: existing } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("site_id", session.site_id)
        .eq("external_id", session.customer_external_id)
        .maybeSingle();
      if (existing) {
        customerId = existing.id;
      } else {
        const { data: created } = await supabaseAdmin
          .from("customers")
          .insert({
            site_id: session.site_id,
            external_id: session.customer_external_id,
            email: session.customer_email,
            name: session.customer_name,
          })
          .select("id")
          .single();
        customerId = created?.id ?? null;
      }
    }

    // insert payment
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .insert({
        site_id: session.site_id,
        checkout_session_id: session.id,
        customer_id: customerId,
        plan_id: session.plan_id,
        amount: session.amount,
        currency: session.currency,
        status: "succeeded",
        provider: "hn-pay-test",
        provider_ref: `test_${Date.now()}`,
      })
      .select("public_id")
      .single();

    // upsert subscription if plan is recurring
    let subscriptionPublicId: string | null = null;
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("billing_interval")
      .eq("id", session.plan_id)
      .maybeSingle();

    if (plan?.billing_interval && customerId) {
      const periodEnd = new Date();
      if (plan.billing_interval === "month") periodEnd.setMonth(periodEnd.getMonth() + 1);
      else if (plan.billing_interval === "year") periodEnd.setFullYear(periodEnd.getFullYear() + 1);

      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          site_id: session.site_id,
          customer_id: customerId,
          plan_id: session.plan_id,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select("public_id")
        .single();
      subscriptionPublicId = sub?.public_id ?? null;
    }

    await supabaseAdmin
      .from("checkout_sessions")
      .update({ status: "succeeded", completed_at: new Date().toISOString() })
      .eq("id", session.id);

    // dispatch webhook (best effort)
    try {
      await enqueueAndDeliver({
        admin: supabaseAdmin,
        siteId: session.site_id,
        eventType: "payment.succeeded",
        data: {
          payment_id: payment?.public_id,
          site_id: session.site_id,
          customer_external_id: session.customer_external_id,
          amount: session.amount,
          currency: session.currency,
          subscription_id: subscriptionPublicId,
          checkout_id: session.public_id,
        },
      });
    } catch (err) {
      console.error("[hn-pay] webhook dispatch failed", err);
    }

    return { ok: true, already: false, redirect: session.success_url };
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
        <div className="mt-2 text-sm text-neutral-400">
          The link is invalid, expired, or already used.
        </div>
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

function CheckoutPage() {
  const params = Route.useParams();
  const { data } = useSuspenseQuery(sessionQuery(params.sessionId));
  const navigate = useNavigate();
  const [succeeded, setSucceeded] = useState(false);

  const confirm = useMutation({
    mutationFn: () => confirmCheckoutSession({ data: { publicId: params.sessionId } }),
    onSuccess: (res) => {
      setSucceeded(true);
      setTimeout(() => {
        if (res.redirect) window.location.href = res.redirect;
      }, 1800);
    },
  });

  if (!data) return null;

  const brand = data.site?.brand_color ?? "#f59e0b";

  return (
    <Shell>
      <div className="mb-6 flex items-center gap-3">
        {data.site?.logo_url ? (
          <img src={data.site.logo_url} alt="" className="h-10 w-10 rounded-lg" />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold"
            style={{ borderColor: `${brand}66`, color: brand, background: `${brand}15` }}
          >
            {(data.site?.name ?? "?").slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-sm font-semibold">{data.site?.name ?? "Site"}</div>
          <div className="text-xs text-neutral-500">{data.site?.domain}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6">
        <div className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">You are paying</div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="text-4xl font-black text-white">
            {Number(data.amount).toFixed(2)} <span className="text-lg font-semibold">{data.currency}</span>
          </div>
          {data.plan?.billing_interval && (
            <div className="text-sm text-neutral-400">/ {data.plan.billing_interval}</div>
          )}
        </div>
        <div className="mt-1 text-sm text-neutral-300">
          {data.plan?.name} <span className="text-neutral-500">· {data.plan?.code}</span>
        </div>
        {data.customer_email && (
          <div className="mt-4 rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-xs text-neutral-400">
            Billing to <span className="text-neutral-200">{data.customer_email}</span>
          </div>
        )}

        {succeeded || data.status === "succeeded" ? (
          <div className="mt-6 flex flex-col items-center py-6">
            <CheckCircle2 className="h-14 w-14 text-emerald-400" />
            <div className="mt-3 text-lg font-bold text-white">Payment successful</div>
            <div className="mt-1 text-xs text-neutral-400">Redirecting back to {data.site?.name}…</div>
          </div>
        ) : (
          <>
            <button
              onClick={() => confirm.mutate()}
              disabled={confirm.isPending}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-black shadow-[0_0_30px_-5px_rgba(251,191,36,0.6)] transition hover:brightness-110 disabled:opacity-60"
              style={{ background: `linear-gradient(180deg, ${brand} 0%, #b45309 100%)` }}
            >
              {confirm.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" /> Pay {Number(data.amount).toFixed(2)} {data.currency}
                </>
              )}
            </button>
            {confirm.isError && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {String(confirm.error)}
              </div>
            )}
            {data.cancel_url && (
              <button
                onClick={() => (window.location.href = data.cancel_url!)}
                className="mt-2 w-full rounded-xl border border-white/10 px-4 py-2.5 text-xs text-neutral-400 hover:bg-white/5"
              >
                Cancel and return
              </button>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
        <Lock className="h-3 w-3" />
        Secured by HN-Pay · TLS 1.3 · No card data stored
      </div>
      <div className="mt-1 text-center text-[10px] text-neutral-600">
        Test mode — no real charge will occur until a payment provider is connected.
      </div>
    </Shell>
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
