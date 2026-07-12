import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROVIDER_CODES = ["stripe", "paddle", "paypal", "cmi", "payzone", "naps", "manual", "mock"] as const;

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  site_id: z.string().uuid().optional(),
  code: z.enum(PROVIDER_CODES),
  display_name: z.string().min(1).max(120),
  api_key: z.string().max(400).optional().nullable(),
  secret_key: z.string().max(400).optional().nullable(),
  public_key: z.string().max(400).optional().nullable(),
  webhook_secret: z.string().max(400).optional().nullable(),
  merchant_id: z.string().max(200).optional().nullable(),
  environment: z.enum(["sandbox", "production"]),
  is_enabled: z.boolean().optional(),
  supported_countries: z.array(z.string().min(2).max(2)).optional().default([]),
  supported_currencies: z.array(z.string().min(3).max(3)).optional().default([]),
  fee_percent: z.number().min(0).max(100).optional().default(0),
  fee_fixed: z.number().min(0).optional().default(0),
  tax_mode: z.enum(["automatic", "manual", "none"]).optional().default("automatic"),
});

export const listPaymentProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { site_id?: string; include_global?: boolean }) =>
      z
        .object({
          site_id: z.string().uuid().optional(),
          include_global: z.boolean().optional().default(false),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase.from("payment_providers").select("*");
    if (data.site_id) {
      if (data.include_global) {
        query = query.or(`site_id.eq.${data.site_id},site_id.is.null`);
      } else {
        query = query.eq("site_id", data.site_id);
      }
    }
    const { data: rows, error } = await query
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertPaymentProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => UpsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const payload = {
      site_id: data.site_id ?? null,
      code: data.code,
      display_name: data.display_name,
      environment: data.environment,
      api_key: data.api_key ?? null,
      secret_key: data.secret_key ?? null,
      public_key: data.public_key ?? null,
      webhook_secret: data.webhook_secret ?? null,
      merchant_id: data.merchant_id ?? null,
      is_enabled: data.is_enabled ?? true,
      supported_countries: data.supported_countries,
      supported_currencies: data.supported_currencies,
      fee_percent: data.fee_percent,
      fee_fixed: data.fee_fixed,
      tax_mode: data.tax_mode,
    };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("payment_providers")
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("payment_providers")
      .insert({ ...payload, created_by: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const togglePaymentProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; enabled: boolean }) =>
    z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("payment_providers")
      .update({ is_enabled: data.enabled })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setDefaultPaymentProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; site_id?: string }) =>
    z.object({ id: z.string().uuid(), site_id: z.string().uuid().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // Clear default only for providers of the same site scope (or global if no site_id)
    const siteFilter = data.site_id ? `site_id.eq.${data.site_id}` : "site_id.is.null";
    const { error: e1 } = await context.supabase
      .from("payment_providers")
      .update({ is_default: false })
      .eq("is_default", true)
      .or(siteFilter);
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await context.supabase
      .from("payment_providers")
      .update({ is_default: true, is_enabled: true })
      .eq("id", data.id);
    if (e2) throw new Error(e2.message);

    // Optionally set the site default_provider_id reference
    if (data.site_id) {
      await context.supabase.from("sites").update({ default_provider_id: data.id }).eq("id", data.site_id);
    }
    return { ok: true };
  });

export const deletePaymentProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("payment_providers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const testPaymentProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("payment_providers")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error(error?.message ?? "Provider not found");

    let status: "ok" | "fail" = "fail";
    let message = "";
    try {
      if (row.code === "stripe") {
        if (!row.secret_key) throw new Error("Missing secret key");
        const res = await fetch("https://api.stripe.com/v1/balance", {
          headers: { authorization: `Bearer ${row.secret_key}` },
        });
        if (!res.ok) throw new Error(`Stripe responded ${res.status}`);
        message = "Stripe API reachable";
        status = "ok";
      } else if (row.code === "paddle") {
        if (!row.secret_key) throw new Error("Missing Paddle API key");
        // Paddle is Merchant of Record, so public key is not strictly needed for backend.
        // Probes the API key with a simple products list call.
        const host = row.environment === "production" ? "api.paddle.com" : "sandbox-api.paddle.com";
        const res = await fetch(`https://${host}/v2/products`, {
          headers: {
            authorization: `Bearer ${row.secret_key}`,
            "content-type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`Paddle responded ${res.status}`);
        message = "Paddle API reachable";
        status = "ok";
      } else if (row.code === "paypal") {
        if (!row.api_key || !row.secret_key) throw new Error("Missing client id / secret");
        const host = row.environment === "production" ? "api-m.paypal.com" : "api-m.sandbox.paypal.com";
        const auth = Buffer.from(`${row.api_key}:${row.secret_key}`).toString("base64");
        const res = await fetch(`https://${host}/v1/oauth2/token`, {
          method: "POST",
          headers: { authorization: `Basic ${auth}`, "content-type": "application/x-www-form-urlencoded" },
          body: "grant_type=client_credentials",
        });
        if (!res.ok) throw new Error(`PayPal responded ${res.status}`);
        message = "PayPal OAuth token issued";
        status = "ok";
      } else if (row.code === "manual" || row.code === "mock") {
        message = `${row.code} provider — always available`;
        status = "ok";
      } else {
        // Generic: just verify credentials are present
        if (!row.secret_key && !row.api_key) throw new Error("No credentials configured");
        message = "Credentials present (no live probe for this provider yet)";
        status = "ok";
      }
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
      status = "fail";
    }

    await context.supabase
      .from("payment_providers")
      .update({
        last_tested_at: new Date().toISOString(),
        last_test_status: status,
        last_test_message: message.slice(0, 400),
      })
      .eq("id", data.id);

    return { status, message };
  });
