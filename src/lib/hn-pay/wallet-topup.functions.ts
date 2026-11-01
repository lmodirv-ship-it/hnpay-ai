import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** HN-PAY's own site: wallet top-ups use its provider configuration (Payment Providers page). */
const PLATFORM_SITE_ID = "73f0fa95-dd5f-4842-80df-f7b33f734c65";

const startSchema = z.object({
  amount: z.number().positive().max(100000),
  currency: z.enum(["EUR", "USD", "MAD"]),
  method: z.enum(["paypal", "youcan_pay", "card", "bank_transfer"]),
});

/** Card payments go to YouCan Pay for MAD (Moroccan + intl cards) and PayPal guest card checkout otherwise. */
export function resolveTopupProvider(method: string, currency: string): "paypal" | "youcan_pay" | "manual" {
  if (method === "bank_transfer") return "manual";
  if (method === "youcan_pay") return "youcan_pay";
  if (method === "paypal") return "paypal";
  return currency === "MAD" ? "youcan_pay" : "paypal";
}

function originOf() {
  try {
    return new URL(getRequest().url).origin;
  } catch {
    return "https://www.hnpay.live";
  }
}

export const startWalletTopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => startSchema.parse(i))
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string }).email ?? null;
    const provider = resolveTopupProvider(data.method, data.currency);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("wallet_topups")
      .insert({ user_id: context.userId, email, amount: data.amount, currency: data.currency, method: data.method, provider })
      .select("id, public_id")
      .single();
    if (error || !row) return { ok: false as const, error: "تعذر إنشاء عملية الشحن" };

    if (provider === "manual") {
      return { ok: true as const, kind: "manual" as const, reference: row.public_id.toUpperCase() };
    }

    const origin = originOf();
    const back = `${origin}/user/dashboard?topup=${row.public_id}`;
    try {
      const { getProvider } = await import("./providers/registry.server");
      const p = getProvider(provider);
      const result = await p.initiate({
        session: {
          id: row.id, public_id: row.public_id, site_id: PLATFORM_SITE_ID, plan_id: "",
          amount: data.amount, currency: data.currency, customer_email: email, customer_name: null,
          customer_external_id: context.userId, success_url: back, cancel_url: `${back}&status=cancel`,
          metadata: { kind: "wallet_topup" }, provider,
        },
        site: { id: PLATFORM_SITE_ID, name: "HN-Pay Live", domain: "hnpay.live", enabled_providers: [provider], manual_instructions: null, manual_bank_details: {}, brand_color: null },
      });
      if (result.kind !== "redirect") throw new Error("unexpected provider result");
      await supabaseAdmin.from("wallet_topups").update({ provider_ref: result.providerSessionId ?? null, checkout_url: result.url, updated_at: new Date().toISOString() }).eq("id", row.id);
      return { ok: true as const, kind: "redirect" as const, url: result.url };
    } catch (e) {
      console.error("[topup] provider error", e);
      await supabaseAdmin.from("wallet_topups").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", row.id);
      const notConfigured = /not configured/i.test(String((e as Error)?.message));
      return {
        ok: false as const,
        error: notConfigured
          ? `بوابة ${provider === "paypal" ? "PayPal" : "YouCan Pay"} غير مفعّلة بعد — أضف مفاتيحها في صفحة مزودي الدفع لموقع HN-Pay.`
          : "تعذر الاتصال ببوابة الدفع، حاول مرة أخرى.",
      };
    }
  });

/** Verifies the payment with the provider (never trusts the redirect) and credits the wallet exactly once. */
export const confirmWalletTopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ publicId: z.string().min(4).max(64), transactionId: z.string().max(128).optional() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: t } = await supabaseAdmin.from("wallet_topups").select("*").eq("public_id", data.publicId).eq("user_id", context.userId).maybeSingle();
    if (!t) return { status: "not_found" as const };
    if (t.status !== "pending") return { status: t.status as string };

    const { loadProviderConfig } = await import("./providers/registry.server");
    let verified = false;
    try {
      if (t.provider === "paypal" && t.provider_ref) {
        const cfg = await loadProviderConfig("paypal", PLATFORM_SITE_ID);
        const clientId = cfg?.public_key ?? process.env.PAYPAL_CLIENT_ID;
        const secret = cfg?.secret_key ?? process.env.PAYPAL_SECRET;
        if (clientId && secret) {
          const base = cfg?.environment === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
          const tok = await fetch(`${base}/v1/oauth2/token`, {
            method: "POST",
            headers: { authorization: `Basic ${btoa(`${clientId}:${secret}`)}`, "content-type": "application/x-www-form-urlencoded" },
            body: "grant_type=client_credentials",
          }).then((r) => r.json() as Promise<{ access_token?: string }>);
          const cap = await fetch(`${base}/v2/checkout/orders/${t.provider_ref}/capture`, {
            method: "POST", headers: { authorization: `Bearer ${tok.access_token}`, "content-type": "application/json" },
          });
          const j = (await cap.json().catch(() => ({}))) as { status?: string; details?: { issue?: string }[] };
          verified = j.status === "COMPLETED" || j.details?.[0]?.issue === "ORDER_ALREADY_CAPTURED";
        }
      } else if (t.provider === "youcan_pay" && data.transactionId) {
        const cfg = await loadProviderConfig("youcan_pay", PLATFORM_SITE_ID);
        if (cfg?.secret_key) {
          const base = cfg.environment !== "production" ? "https://youcanpay.com/sandbox" : "https://youcanpay.com";
          const r = await fetch(`${base}/api/transactions/${encodeURIComponent(data.transactionId)}`, {
            headers: { Authorization: cfg.secret_key, Accept: "application/json" },
          });
          const j = (await r.json().catch(() => ({}))) as { status?: number; order_id?: string; amount?: number; currency?: string };
          verified = r.ok && j.status === 1 && j.order_id === t.public_id;
        }
      }
    } catch (e) {
      console.error("[topup] verify failed", e);
    }
    if (!verified) return { status: "pending" as const };

    // Claim the row atomically so a double confirm never double-credits.
    const { data: claimed } = await supabaseAdmin.from("wallet_topups")
      .update({ status: "completed", credited_at: new Date().toISOString(), updated_at: new Date().toISOString(), provider_ref: t.provider_ref ?? data.transactionId ?? null })
      .eq("id", t.id).eq("status", "pending").select("id").maybeSingle();
    if (!claimed) return { status: "completed" as const };
    const { error } = await supabaseAdmin.rpc("wallet_apply", {
      _user_id: t.user_id, _email: t.email ?? "", _type: "topup", _amount: Number(t.amount),
      _currency: t.currency, _site_id: PLATFORM_SITE_ID, _reference: t.public_id,
    });
    if (error) {
      console.error("[topup] wallet_apply failed", error);
      await supabaseAdmin.from("wallet_topups").update({ status: "pending", credited_at: null }).eq("id", t.id);
      return { status: "pending" as const };
    }
    return { status: "completed" as const, amount: Number(t.amount), currency: t.currency };
  });

export const listMyTopups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("wallet_topups").select("public_id, amount, currency, method, status, created_at").order("created_at", { ascending: false }).limit(10);
    return data ?? [];
  });
