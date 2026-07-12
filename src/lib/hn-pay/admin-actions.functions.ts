import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ─────────── API keys ─────────── */

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { site_id: string; label: string; mode: "test" | "live" }) =>
    z.object({
      site_id: z.string().uuid(),
      label: z.string().trim().min(1).max(80),
      mode: z.enum(["test", "live"]),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const rand = new Uint8Array(24);
    crypto.getRandomValues(rand);
    const secret = `hnp_${data.mode === "test" ? "test" : "live"}_${b64url(rand)}`;
    const key_hash = await sha256Hex(secret);
    const key_prefix = secret.slice(0, 12);
    const { data: row, error } = await context.supabase
      .from("site_api_keys")
      .insert({ site_id: data.site_id, label: data.label, mode: data.mode, key_prefix, key_hash })
      .select("*").single();
    if (error) throw new Error(error.message);
    return { ...row, secret };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("site_api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─────────── Refunds (mark payment refunded) ─────────── */

export const refundPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; partial?: boolean; note?: string }) =>
    z.object({
      id: z.string().uuid(),
      partial: z.boolean().optional(),
      note: z.string().max(500).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: pay, error: e0 } = await context.supabase
      .from("payments").select("id, status, metadata").eq("id", data.id).single();
    if (e0) throw new Error(e0.message);
    const meta = (pay?.metadata as any) ?? {};
    const patch: any = {
      status: data.partial ? "partially_refunded" : "refunded",
      metadata: { ...meta, refund: { at: new Date().toISOString(), by: context.userId, note: data.note ?? null, partial: !!data.partial } },
    };
    if (data.note) patch.notes = data.note;
    const { error } = await context.supabase.from("payments").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─────────── Subscriptions ─────────── */

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; at_period_end?: boolean }) =>
    z.object({ id: z.string().uuid(), at_period_end: z.boolean().optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const patch: any = data.at_period_end
      ? { cancel_at_period_end: true }
      : { status: "canceled", canceled_at: new Date().toISOString(), cancel_at_period_end: false };
    const { error } = await context.supabase.from("subscriptions").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reactivateSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("subscriptions").update({ cancel_at_period_end: false, canceled_at: null, status: "active" }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─────────── Webhook resend (reset attempts, mark for retry) ─────────── */

export const retryWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("webhook_events")
      .update({ delivered: false, attempts: 0, last_attempt_at: null, last_response_status: null, last_response_body: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─────────── Customers ─────────── */

export const upsertCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    id?: string; site_id: string; email?: string; name?: string; external_id?: string; provider?: string;
  }) =>
    z.object({
      id: z.string().uuid().optional(),
      site_id: z.string().uuid(),
      email: z.string().email().max(255).optional().or(z.literal("")),
      name: z.string().max(200).optional().or(z.literal("")),
      external_id: z.string().max(120).optional().or(z.literal("")),
      provider: z.string().max(40).optional().or(z.literal("")),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const payload: any = {
      site_id: data.site_id,
      email: data.email || null,
      name: data.name || null,
      external_id: data.external_id || `manual_${crypto.randomUUID().slice(0, 8)}`,
      provider: data.provider || "manual",
    };
    if (data.id) {
      const { error } = await context.supabase.from("customers").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("customers").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row!.id };
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("customers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─────────── Team / roles ─────────── */

const ROLE = z.enum(["owner", "admin", "manager", "developer", "accountant", "subscriber", "viewer"]);

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { user_id: string; app_id: string; role: string }) =>
    z.object({ user_id: z.string().uuid(), app_id: z.string().min(1).max(64), role: ROLE }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_roles")
      .insert({ user_id: data.user_id, app_id: data.app_id, role: data.role as any });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { user_id: string; app_id: string; role: string }) =>
    z.object({ user_id: z.string().uuid(), app_id: z.string().min(1).max(64), role: ROLE }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_roles").delete()
      .eq("user_id", data.user_id).eq("app_id", data.app_id).eq("role", data.role as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string; app_id: string; role: string }) =>
    z.object({
      email: z.string().trim().toLowerCase().email().max(255),
      app_id: z.string().min(1).max(64),
      role: ROLE,
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    // Check caller is owner/admin (defense in depth on top of RLS)
    const { data: has } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).in("role", ["owner", "admin"]);
    if (!has || has.length === 0) throw new Error("Forbidden");
    // Match existing profile by email; if not present, tell caller.
    const { data: prof } = await context.supabase.from("profiles").select("id").eq("email", data.email).maybeSingle();
    if (!prof) return { ok: false, reason: "no_profile" as const };
    const { error } = await context.supabase
      .from("user_roles").insert({ user_id: prof.id, app_id: data.app_id, role: data.role as any });
    if (error) throw new Error(error.message);
    return { ok: true, user_id: prof.id };
  });
