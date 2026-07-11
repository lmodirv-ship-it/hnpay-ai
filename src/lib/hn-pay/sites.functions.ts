import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ─────────── sites ─────────── */

export const listSites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sites")
      .select("id, slug, name, domain, webhook_url, is_active, brand_color, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { slug: string; name: string; domain: string; webhook_url?: string; brand_color?: string }) =>
    z
      .object({
        slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/, "lowercase letters, digits, hyphens only"),
        name: z.string().min(1).max(120),
        domain: z.string().min(3).max(255),
        webhook_url: z.string().url().max(2048).optional().or(z.literal("")),
        brand_color: z.string().max(20).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("sites")
      .insert({
        slug: data.slug,
        name: data.name,
        domain: data.domain,
        webhook_url: data.webhook_url || null,
        brand_color: data.brand_color || "#f59e0b",
        created_by: context.userId,
      })
      .select("id, slug, name, domain, webhook_url, is_active, brand_color, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const toggleSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; active: boolean }) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sites")
      .update({ is_active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getSiteWebhookSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("sites")
      .select("webhook_secret")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { webhook_secret: row?.webhook_secret ?? null };
  });

/* ─────────── api keys ─────────── */

export const listApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { siteId: string }) => z.object({ siteId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("site_api_keys")
      .select("id, label, key_prefix, mode, last_used_at, revoked_at, created_at")
      .eq("site_id", data.siteId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { siteId: string; label: string; mode: "live" | "test" }) =>
    z
      .object({
        siteId: z.string().uuid(),
        label: z.string().min(1).max(64),
        mode: z.enum(["live", "test"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    // Authorize: caller must be able to see the target site via RLS
    // (owners see everything; site creators see rows they created).
    const { data: siteRow, error: siteErr } = await context.supabase
      .from("sites")
      .select("id")
      .eq("id", data.siteId)
      .maybeSingle();
    if (siteErr) throw new Error(siteErr.message);
    if (!siteRow) throw new Error("Not authorized for this site");

    const { generateApiKey } = await import("@/lib/hn-pay/crypto.server");
    const key = generateApiKey(data.mode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_api_keys").insert({
      site_id: data.siteId,
      label: data.label,
      key_prefix: key.prefix,
      key_hash: key.hash,
      mode: data.mode,
    });
    if (error) throw new Error(error.message);
    // return full key ONCE — never stored plaintext
    return { full_key: key.full, prefix: key.prefix, mode: data.mode };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("site_api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─────────── plans ─────────── */

export const listPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { siteId: string }) => z.object({ siteId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("plans")
      .select("id, code, name, description, amount, currency, billing_interval, is_active, created_at")
      .eq("site_id", data.siteId)
      .order("amount", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      siteId: string;
      code: string;
      name: string;
      description?: string;
      amount: number;
      currency: string;
      billing_interval?: string;
    }) =>
      z
        .object({
          siteId: z.string().uuid(),
          code: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/i),
          name: z.string().min(1).max(120),
          description: z.string().max(500).optional(),
          amount: z.number().nonnegative().max(1_000_000),
          currency: z.string().length(3),
          billing_interval: z.enum(["month", "year", "one_time"]).optional(),
        })
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("plans")
      .insert({
        site_id: data.siteId,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        amount: data.amount,
        currency: data.currency.toUpperCase(),
        billing_interval:
          data.billing_interval && data.billing_interval !== "one_time"
            ? data.billing_interval
            : null,
      })
      .select("id, code, name, amount, currency, billing_interval, is_active, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const togglePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; active: boolean }) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("plans")
      .update({ is_active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─────────── payments & events ─────────── */

export const listSitePayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { siteId: string }) => z.object({ siteId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("payments")
      .select("public_id, amount, currency, status, provider, created_at")
      .eq("site_id", data.siteId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listSiteWebhookEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { siteId: string }) => z.object({ siteId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("webhook_events")
      .select("public_id, event_type, delivered, attempts, last_response_status, created_at")
      .eq("site_id", data.siteId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
