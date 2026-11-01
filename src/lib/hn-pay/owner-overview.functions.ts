import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { from: (t: "user_roles") => any }; userId: string };

async function assertOwner(ctx: Ctx) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const ok = ((data ?? []) as { role: string }[]).some((r) => r.role === "owner" || r.role === "admin");
  if (!ok) throw new Error("Forbidden");
}

/** Whole-platform snapshot for the owner control center (real data only). */
export const getOwnerOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context as unknown as Ctx);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const count = async (t: string, f?: (q: any) => any) => {
      let q = (db.from as any)(t).select("*", { count: "exact", head: true });
      if (f) q = f(q);
      const { count: c } = await q;
      return c ?? 0;
    };
    const since30 = new Date(Date.now() - 30 * 864e5).toISOString();

    const [sites, activeSites, projects, domains, customers, users, activeSubs, pausedSubs, plans, providersEnabled, routingRules, groupMembers, syncPending, invoices, refunds, checkoutOpen] = await Promise.all([
      count("sites"), count("sites", (q) => q.eq("status", "active")), count("hn_projects"), count("project_domains"),
      count("customers"), count("profiles"),
      count("subscriptions", (q) => q.in("status", ["active", "trialing"])), count("subscriptions", (q) => q.eq("status", "paused")),
      count("plans", (q) => q.eq("is_active", true)), count("payment_providers", (q) => q.eq("is_enabled", true)),
      count("routing_rules", (q) => q.eq("is_active", true)), count("hn_group_members"),
      count("google_sync_events", (q) => q.eq("status", "pending")), count("billing_invoices"), count("refunds"),
      count("checkout_sessions", (q) => q.eq("status", "open")),
    ]);

    const [pays, recentPays, topups, wallets, providerRows] = await Promise.all([
      db.from("payments").select("amount, currency, status, created_at").gte("created_at", since30),
      db.from("payments").select("public_id, amount, currency, status, provider, created_at, sites(name)").order("created_at", { ascending: false }).limit(8),
      db.from("wallet_topups").select("public_id, email, amount, currency, method, status, created_at").order("created_at", { ascending: false }).limit(10),
      db.from("consumer_wallets").select("balance_eur, balance_usd, balance_mad"),
      db.from("payment_providers").select("code, is_enabled, environment"),
    ]);

    const revenue: Record<string, number> = {};
    let succeeded = 0, failed = 0;
    for (const p of pays.data ?? []) {
      if (p.status === "succeeded" || p.status === "paid") { revenue[p.currency] = (revenue[p.currency] ?? 0) + Number(p.amount); succeeded++; }
      else if (p.status === "failed") failed++;
    }
    const float = { EUR: 0, USD: 0, MAD: 0 };
    for (const w of wallets.data ?? []) { float.EUR += Number(w.balance_eur); float.USD += Number(w.balance_usd); float.MAD += Number(w.balance_mad); }

    const configured = new Set((providerRows.data ?? []).filter((p) => p.is_enabled).map((p) => p.code));
    const checks = [
      { key: "gateway", ok: configured.size > 0, label: "بوابة دفع حقيقية مفعّلة", hint: "أضف مفاتيح PayPal أو YouCan Pay أو CMI في مزودي الدفع" },
      { key: "paypal", ok: configured.has("paypal"), label: "PayPal", hint: "مطلوب كاحتياطي عالمي للتوجيه الذكي" },
      { key: "youcan", ok: configured.has("youcan_pay") || configured.has("cmi"), label: "YouCan Pay / CMI", hint: "مطلوب لمدفوعات الدرهم المغربي" },
      { key: "plans", ok: plans > 0, label: "خطط أسعار منشورة", hint: "أنشئ خطة واحدة على الأقل لكل موقع" },
      { key: "routing", ok: routingRules > 0, label: "قواعد التوجيه الذكي", hint: "" },
      { key: "sync", ok: syncPending === 0, label: "مزامنة Google", hint: `${syncPending} حدث بانتظار الإرسال` },
    ];

    return {
      kpis: { sites, activeSites, projects, domains, customers, users, activeSubs, pausedSubs, plans, providersEnabled, routingRules, groupMembers, invoices, refunds, checkoutOpen, succeeded, failed },
      revenue, float, checks,
      recentPayments: recentPays.data ?? [],
      topups: topups.data ?? [],
    };
  });

/** Owner confirms a received bank transfer → credits the customer's wallet exactly once. */
export const approveManualTopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ publicId: z.string().min(4).max(64), action: z.enum(["approve", "reject"]) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertOwner(context as unknown as Ctx);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    if (data.action === "reject") {
      await db.from("wallet_topups").update({ status: "canceled", updated_at: now }).eq("public_id", data.publicId).eq("status", "pending");
      return { ok: true };
    }
    const { data: t } = await db.from("wallet_topups")
      .update({ status: "completed", credited_at: now, updated_at: now })
      .eq("public_id", data.publicId).eq("status", "pending").eq("method", "bank_transfer")
      .select("*").maybeSingle();
    if (!t) return { ok: false, error: "العملية غير موجودة أو تمت معالجتها" };
    const { error } = await db.rpc("wallet_apply", {
      _user_id: t.user_id, _email: t.email ?? "", _type: "topup", _amount: Number(t.amount),
      _currency: t.currency, _site_id: null as unknown as string, _reference: t.public_id,
    });
    if (error) {
      await db.from("wallet_topups").update({ status: "pending", credited_at: null }).eq("id", t.id);
      return { ok: false, error: "تعذر إضافة الرصيد" };
    }
    return { ok: true };
  });
