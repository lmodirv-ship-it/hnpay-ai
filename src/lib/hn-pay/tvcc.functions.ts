import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertOwner(ctx: any) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  if (!((data ?? []) as { role: string }[]).some((r) => r.role === "owner" || r.role === "admin")) throw new Error("Forbidden");
}

/** Owner view: every site with its plans + subscription counts, searchable & paginated. */
export const getTvccOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().max(100).default(""), page: z.number().int().min(0).default(0), source: z.enum(["all", "tvcc", "manual"]).default("all") }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const size = 25;
    let q = db.from("sites").select("id, name, slug, domain, is_active, source, tvcc_synced_at", { count: "exact" }).order("name");
    if (data.q) q = q.or(`name.ilike.%${data.q.replace(/[%,()]/g, "")}%,domain.ilike.%${data.q.replace(/[%,()]/g, "")}%`);
    if (data.source !== "all") q = q.eq("source", data.source);
    const { data: sites, count } = await q.range(data.page * size, data.page * size + size - 1);
    const ids = (sites ?? []).map((s) => s.id);
    const [plans, subs, runs, totals] = await Promise.all([
      ids.length ? db.from("plans").select("site_id, code, name, amount, currency, billing_interval, is_active").in("site_id", ids) : { data: [] as any[] },
      ids.length ? db.from("subscriptions").select("site_id, status").in("site_id", ids) : { data: [] as any[] },
      db.from("tvcc_sync_runs").select("*").order("started_at", { ascending: false }).limit(5),
      Promise.all([
        db.from("sites").select("*", { count: "exact", head: true }),
        db.from("sites").select("*", { count: "exact", head: true }).eq("source", "tvcc"),
        db.from("plans").select("*", { count: "exact", head: true }),
        db.from("subscriptions").select("*", { count: "exact", head: true }).in("status", ["active", "trialing"]),
        db.from("user_site_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]),
    ]);
    const rows = (sites ?? []).map((s) => ({
      ...s,
      plans: (plans.data ?? []).filter((p: any) => p.site_id === s.id),
      activeSubs: (subs.data ?? []).filter((x: any) => x.site_id === s.id && ["active", "trialing"].includes(x.status)).length,
      totalSubs: (subs.data ?? []).filter((x: any) => x.site_id === s.id).length,
    }));
    const [t1, t2, t3, t4, t5] = totals;
    return {
      rows, total: count ?? 0, pageSize: size, runs: runs.data ?? [],
      totals: { sites: t1.count ?? 0, tvccSites: t2.count ?? 0, plans: t3.count ?? 0, activeSubs: t4.count ?? 0, pendingRequests: t5.count ?? 0 },
      configured: !!process.env.HN_CRON_SECRET,
    };
  });

export const listSiteRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data } = await db.from("user_site_requests").select("*").order("created_at", { ascending: false }).limit(50);
    return data ?? [];
  });

export const reviewSiteRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { error } = await db.from("user_site_requests").update({ status: data.status, updated_at: new Date().toISOString() }).eq("id", data.id).eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
