import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// All reads/writes go through the caller's RLS (routing_rules / google_sync_events are staff-only).

export const listRoutingRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("routing_rules").select("*").order("priority");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const RuleInput = z.object({
  id: z.string().uuid().optional(),
  priority: z.number().int().min(0).max(10000),
  name: z.string().max(120).nullable().optional(),
  condition_country: z.string().max(2).nullable(),
  condition_currency: z.string().max(3).nullable(),
  condition_app_category: z.string().max(60).nullable(),
  primary_provider: z.string().min(2).max(40),
  fallback_provider: z.string().max(40).nullable(),
  is_active: z.boolean(),
});

export const upsertRoutingRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RuleInput.parse(i))
  .handler(async ({ data, context }) => {
    const clean = { ...data, condition_country: data.condition_country?.toUpperCase() || null, condition_currency: data.condition_currency?.toUpperCase() || null, condition_app_category: data.condition_app_category || null, fallback_provider: data.fallback_provider || null };
    const { error } = data.id
      ? await context.supabase.from("routing_rules").update(clean).eq("id", data.id)
      : await context.supabase.from("routing_rules").insert(clean);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteRoutingRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("routing_rules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getGoogleOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [pending, synced, failed, recent, sites] = await Promise.all([
      sb.from("google_sync_events").select("id", { count: "exact", head: true }).eq("sync_status", "pending"),
      sb.from("google_sync_events").select("id", { count: "exact", head: true }).eq("sync_status", "synced"),
      sb.from("google_sync_events").select("id", { count: "exact", head: true }).eq("sync_status", "failed"),
      sb.from("google_sync_events").select("id, event_type, google_destination, sync_status, attempts, last_error, created_at").order("created_at", { ascending: false }).limit(20),
      sb.from("sites").select("id, name, domain, google_analytics_id, adsense_enabled, adsense_publisher_id, allowed_providers").order("name"),
    ]);
    return {
      counts: { pending: pending.count ?? 0, synced: synced.count ?? 0, failed: failed.count ?? 0 },
      recent: recent.data ?? [],
      sites: sites.data ?? [],
      env: {
        syncWebhook: Boolean(process.env.GOOGLE_SYNC_WEBHOOK_URL),
        ga4: Boolean(process.env.GA4_MEASUREMENT_ID),
      },
    };
  });

export const updateSiteGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid(),
    google_analytics_id: z.string().regex(/^(G-[A-Z0-9]+)?$/).max(30).nullable(),
    adsense_enabled: z.boolean(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("sites")
      .update({ google_analytics_id: data.google_analytics_id || null, adsense_enabled: data.adsense_enabled }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getRevenueOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [sites, subs, pays] = await Promise.all([
      sb.from("sites").select("id, name, domain, adsense_enabled"),
      sb.from("subscriptions").select("site_id, status"),
      sb.from("payments").select("site_id, amount, currency, status"),
    ]);
    const rows = (sites.data ?? []).map((s) => {
      const ss = (subs.data ?? []).filter((x) => x.site_id === s.id);
      const pp = (pays.data ?? []).filter((x) => x.site_id === s.id && x.status === "succeeded");
      return {
        ...s,
        active_subscriptions: ss.filter((x) => x.status === "active" || x.status === "trialing").length,
        revenue: pp.reduce((a, p) => a + Number(p.amount), 0),
        payments: pp.length,
      };
    });
    return rows;
  });

/** Staff credit (bonus / manual top-up confirmation) to a consumer wallet. */
export const creditWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    email: z.string().email().max(255),
    amount: z.number().positive().max(100000),
    currency: z.enum(["EUR", "USD", "MAD"]),
    type: z.enum(["topup", "bonus", "refund"]),
    reference: z.string().max(120).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    // Staff check through RLS: only staff can read routing_rules.
    const { data: probe, error: pErr } = await context.supabase.from("routing_rules").select("id").limit(1);
    if (pErr || !probe || probe.length === 0) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin.from("profiles").select("id, email").ilike("email", data.email).maybeSingle();
    if (!profile) throw new Error("No account for this email");
    const { data: tx, error } = await supabaseAdmin.rpc("wallet_apply", {
      _user_id: profile.id, _email: profile.email, _type: data.type, _amount: data.amount,
      _currency: data.currency, _site_id: null as unknown as string, _reference: data.reference ?? `staff:${context.userId}`,
    });
    if (error) throw new Error(error.message);
    const { enqueueGoogleSync } = await import("@/lib/google-ecosystem/google-cloud-sync");
    await enqueueGoogleSync("wallet", { tx, user_id: profile.id, ...data });
    return { ok: true, tx };
  });
