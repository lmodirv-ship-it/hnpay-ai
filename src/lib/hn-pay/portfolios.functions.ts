import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listPortfolios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("portfolios")
      .select("id, slug, name, description, default_currency, default_provider, brand_color, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    // enrich with site counts
    const { data: siteCounts } = await context.supabase
      .from("sites")
      .select("portfolio_id");
    const counts = new Map<string, number>();
    (siteCounts ?? []).forEach((s: { portfolio_id: string | null }) => {
      if (s.portfolio_id) counts.set(s.portfolio_id, (counts.get(s.portfolio_id) ?? 0) + 1);
    });
    return (data ?? []).map((p) => ({ ...p, site_count: counts.get(p.id) ?? 0 }));
  });

export const createPortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      slug: string;
      name: string;
      description?: string;
      default_currency?: string;
      default_provider?: string;
      brand_color?: string;
    }) =>
      z
        .object({
          slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
          name: z.string().min(1).max(120),
          description: z.string().max(500).optional(),
          default_currency: z.string().length(3).optional(),
          default_provider: z.string().max(64).optional(),
          brand_color: z.string().max(20).optional(),
        })
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("portfolios")
      .insert({
        slug: data.slug,
        name: data.name,
        description: data.description ?? null,
        default_currency: (data.default_currency ?? "USD").toUpperCase(),
        default_provider: data.default_provider ?? null,
        brand_color: data.brand_color ?? "#f59e0b",
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("portfolios").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const assignSiteToPortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { siteId: string; portfolioId: string | null }) =>
    z.object({ siteId: z.string().uuid(), portfolioId: z.string().uuid().nullable() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sites")
      .update({ portfolio_id: data.portfolioId })
      .eq("id", data.siteId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─────────── bulk import ─────────── */

const bulkRow = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  domain: z.string().min(3),
  webhook_url: z.string().url().optional().or(z.literal("")),
  portfolio_slug: z.string().optional().or(z.literal("")),
  brand_color: z.string().optional().or(z.literal("")),
  environment: z.enum(["live", "test"]).optional(),
});

export const bulkImportSites = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { rows: unknown[] }) =>
    z.object({ rows: z.array(bulkRow).max(500) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    // Resolve portfolio slugs -> ids
    const { data: portfolios } = await context.supabase
      .from("portfolios")
      .select("id, slug");
    const pMap = new Map<string, string>();
    (portfolios ?? []).forEach((p: { id: string; slug: string }) => pMap.set(p.slug, p.id));

    const inserts = data.rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      domain: r.domain,
      webhook_url: r.webhook_url || null,
      brand_color: r.brand_color || "#f59e0b",
      environment: r.environment || "live",
      portfolio_id: r.portfolio_slug ? pMap.get(r.portfolio_slug) ?? null : null,
      created_by: context.userId,
    }));

    const results: { slug: string; ok: boolean; error?: string }[] = [];
    // insert one-by-one to capture per-row errors (duplicate slug etc.)
    for (const row of inserts) {
      const { error } = await context.supabase.from("sites").insert(row);
      results.push({ slug: row.slug, ok: !error, error: error?.message });
    }
    return {
      created: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  });

/* ─────────── monitoring ─────────── */

export const getHubMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [sitesR, paymentsR, subsR, eventsR] = await Promise.all([
      context.supabase.from("sites").select("id, is_active, portfolio_id"),
      context.supabase
        .from("payments")
        .select("amount, currency, status, created_at, site_id, provider")
        .order("created_at", { ascending: false })
        .limit(500),
      context.supabase.from("subscriptions").select("status, site_id"),
      context.supabase
        .from("webhook_events")
        .select("delivered, attempts, event_type, created_at, site_id")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const sites = sitesR.data ?? [];
    const payments = paymentsR.data ?? [];
    const subs = subsR.data ?? [];
    const events = eventsR.data ?? [];

    const totalRevenue = payments
      .filter((p: { status: string }) => p.status === "succeeded" || p.status === "paid")
      .reduce((s: number, p: { amount: number | null }) => s + Number(p.amount ?? 0), 0);
    const failedWebhooks = events.filter((e: { delivered: boolean }) => !e.delivered).length;

    return {
      sites: {
        total: sites.length,
        active: sites.filter((s: { is_active: boolean }) => s.is_active).length,
      },
      revenue: totalRevenue,
      payments: {
        total: payments.length,
        succeeded: payments.filter(
          (p: { status: string }) => p.status === "succeeded" || p.status === "paid",
        ).length,
        failed: payments.filter((p: { status: string }) => p.status === "failed").length,
        pending: payments.filter(
          (p: { status: string }) => p.status === "pending" || p.status === "awaiting_confirmation",
        ).length,
      },
      subscriptions: {
        active: subs.filter((s: { status: string }) => s.status === "active").length,
        canceled: subs.filter((s: { status: string }) => s.status === "canceled").length,
      },
      webhooks: {
        total: events.length,
        failed: failedWebhooks,
        deliveryRate: events.length ? 1 - failedWebhooks / events.length : 1,
      },
      recentPayments: payments.slice(0, 10),
      recentEvents: events.slice(0, 10),
    };
  });
