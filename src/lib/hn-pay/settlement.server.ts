// Shared logic that turns a pending session into a succeeded payment
// + creates subscription (if recurring) + fires the site webhook.
// Called by both manual settlement (owner UI) and Stripe webhooks.

import type { supabaseAdmin as SupabaseAdmin } from "@/integrations/supabase/client.server";

type Admin = typeof SupabaseAdmin;

export type SettleArgs = {
  admin: Admin;
  sessionId: string; // internal uuid
  provider: string;
  providerRef: string;
  settledBy?: string | null;
  notes?: string | null;
};

export async function settleCheckoutSession({
  admin,
  sessionId,
  provider,
  providerRef,
  settledBy,
  notes,
}: SettleArgs) {
  const { enqueueAndDeliver } = await import("./webhooks.server");

  const { data: session, error: sErr } = await admin
    .from("checkout_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (sErr || !session) throw new Error("Session not found");
  if (session.status === "succeeded") {
    return { already: true, sessionPublicId: session.public_id };
  }

  // upsert customer
  let customerId: string | null = null;
  if (session.customer_external_id) {
    const { data: existing } = await admin
      .from("customers")
      .select("id")
      .eq("site_id", session.site_id)
      .eq("external_id", session.customer_external_id)
      .maybeSingle();
    if (existing) customerId = existing.id;
    else {
      const { data: created } = await admin
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

  const { data: payment } = await admin
    .from("payments")
    .insert({
      site_id: session.site_id,
      checkout_session_id: session.id,
      customer_id: customerId,
      plan_id: session.plan_id,
      amount: session.amount,
      currency: session.currency,
      status: "succeeded",
      provider,
      provider_ref: providerRef,
      settled_by: settledBy ?? null,
      settled_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .select("public_id")
    .single();

  // subscription if recurring
  let subscriptionPublicId: string | null = null;
  const { data: plan } = await admin
    .from("plans")
    .select("billing_interval")
    .eq("id", session.plan_id)
    .maybeSingle();

  if (plan?.billing_interval && customerId) {
    const periodEnd = new Date();
    if (plan.billing_interval === "month") periodEnd.setMonth(periodEnd.getMonth() + 1);
    else if (plan.billing_interval === "year") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    const { data: sub } = await admin
      .from("subscriptions")
      .insert({
        site_id: session.site_id,
        customer_id: customerId,
        plan_id: session.plan_id,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        provider,
      })
      .select("public_id")
      .single();
    subscriptionPublicId = sub?.public_id ?? null;
  }

  await admin
    .from("checkout_sessions")
    .update({ status: "succeeded", completed_at: new Date().toISOString() })
    .eq("id", session.id);

  // Load plan_code for the outbound webhook payload
  const { data: planRow } = await admin
    .from("plans")
    .select("code, billing_interval")
    .eq("id", session.plan_id)
    .maybeSingle();

  try {
    await enqueueAndDeliver({
      admin,
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
        plan_code: planRow?.code ?? null,
        provider,
        provider_ref: providerRef,
      },
    });

    // Fire subscription.activated too, so sites can flip the user's plan
    if (subscriptionPublicId) {
      const { data: subRow } = await admin
        .from("subscriptions")
        .select("current_period_end, status")
        .eq("public_id", subscriptionPublicId)
        .maybeSingle();
      await enqueueAndDeliver({
        admin,
        siteId: session.site_id,
        eventType: "subscription.activated",
        data: {
          subscription_id: subscriptionPublicId,
          site_id: session.site_id,
          customer_external_id: session.customer_external_id,
          plan_code: planRow?.code ?? null,
          status: subRow?.status ?? "active",
          current_period_end: subRow?.current_period_end ?? null,
          payment_id: payment?.public_id,
          checkout_id: session.public_id,
          provider,
        },
      });
    }
  } catch (err) {
    console.error("[hn-pay] webhook dispatch failed", err);
  }

  return { already: false, sessionPublicId: session.public_id, paymentId: payment?.public_id };
}
