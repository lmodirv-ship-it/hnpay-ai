import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { userId: string; claims: unknown };

/** Customer rows are per-site and owned by merchants; ownership = verified email match. */
async function myCustomerIds(ctx: Ctx) {
  const email = (ctx.claims as { email?: string }).email;
  if (!email) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("customers").select("id").ilike("email", email);
  return (data ?? []).map((c) => c.id);
}

async function loadOwnedSub(ctx: Ctx, id: string) {
  const ids = await myCustomerIds(ctx);
  if (!ids.length) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("subscriptions").select("id, site_id, plan_id, status, metadata, plans(amount)").eq("id", id).in("customer_id", ids).maybeSingle();
  return data;
}

const idSchema = z.object({ id: z.string().uuid() });

/** Allowed status transitions for customer self-service. */
export function nextStatus(current: string, action: "pause" | "resume"): string | null {
  if (action === "pause") return current === "active" || current === "trialing" ? "paused" : null;
  return current === "paused" ? "active" : null;
}

export const setSubscriptionPaused = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => idSchema.extend({ action: z.enum(["pause", "resume"]) }).parse(i))
  .handler(async ({ data, context }) => {
    const sub = await loadOwnedSub(context, data.id);
    if (!sub) return { ok: false, error: "الاشتراك غير موجود" };
    const status = nextStatus(sub.status, data.action);
    if (!status) return { ok: false, error: "لا يمكن تنفيذ هذا الإجراء على حالة الاشتراك الحالية" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const meta = { ...((sub.metadata as Record<string, string>) ?? {}), [`${data.action}d_at`]: new Date().toISOString() };
    const { error } = await supabaseAdmin.from("subscriptions").update({ status, metadata: meta, updated_at: new Date().toISOString() }).eq("id", sub.id);
    return error ? { ok: false, error: "تعذر التحديث" } : { ok: true, status };
  });

export const getUpgradeOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => idSchema.parse(i))
  .handler(async ({ data, context }) => {
    const sub = await loadOwnedSub(context, data.id);
    if (!sub) return [];
    const current = Number((sub.plans as { amount?: number } | null)?.amount ?? 0);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: plans } = await supabaseAdmin.from("plans").select("id, name, amount, currency, billing_interval").eq("site_id", sub.site_id).eq("is_active", true).gt("amount", current).order("amount");
    return plans ?? [];
  });

/** Upgrade: switches plan immediately; the price difference is billed on the next renewal by the merchant's provider. */
export const upgradeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => idSchema.extend({ planId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sub = await loadOwnedSub(context, data.id);
    if (!sub) return { ok: false, error: "الاشتراك غير موجود" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: plan } = await supabaseAdmin.from("plans").select("id, amount, site_id, is_active").eq("id", data.planId).maybeSingle();
    const current = Number((sub.plans as { amount?: number } | null)?.amount ?? 0);
    if (!plan || !plan.is_active || plan.site_id !== sub.site_id || Number(plan.amount) <= current) return { ok: false, error: "الخطة غير متاحة للترقية" };
    const meta = { ...((sub.metadata as Record<string, string>) ?? {}), upgraded_from: sub.plan_id, upgraded_at: new Date().toISOString() };
    const { error } = await supabaseAdmin.from("subscriptions").update({ plan_id: plan.id, metadata: meta, updated_at: new Date().toISOString() }).eq("id", sub.id);
    return error ? { ok: false, error: "تعذر الترقية" } : { ok: true };
  });

export const getMyInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ publicId: z.string().min(4).max(64) }).parse(i))
  .handler(async ({ data, context }) => {
    const ids = await myCustomerIds(context);
    if (!ids.length) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("payments")
      .select("public_id, amount, currency, status, provider, provider_ref, created_at, sites(name, domain), plans(name, billing_interval), customers(name, email)")
      .eq("public_id", data.publicId).in("customer_id", ids).maybeSingle();
    return p;
  });
