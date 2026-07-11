import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PRODUCT_TYPES = [
  "product", "service", "subscription", "course", "hosting",
  "license", "api", "storage", "consulting", "booking",
] as const;
const BILLING_TYPES = ["one_time", "monthly", "yearly", "weekly", "usage", "free"] as const;
const STATUSES = ["active", "hidden", "paused", "draft"] as const;

export const listCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: items, error }, { data: projects }] = await Promise.all([
      context.supabase
        .from("products_services")
        .select("*")
        .order("created_at", { ascending: false }),
      context.supabase.from("hn_projects").select("id, name, code, brand_color, category"),
    ]);
    if (error) throw new Error(error.message);

    const pMap = new Map<string, { name: string; code: string; brand_color: string | null; category: string | null }>();
    (projects ?? []).forEach((p) => pMap.set(p.id, p));

    const rows = (items ?? []).map((it) => ({
      ...it,
      project_name: it.project_id ? pMap.get(it.project_id)?.name ?? null : null,
      project_code: it.project_id ? pMap.get(it.project_id)?.code ?? null : null,
      project_color: it.project_id ? pMap.get(it.project_id)?.brand_color ?? null : null,
    }));

    const stats = {
      total: rows.length,
      products: rows.filter((r) => r.type === "product").length,
      services: rows.filter((r) => r.type === "service" || r.type === "consulting" || r.type === "booking").length,
      subscriptions: rows.filter((r) => r.billing_type === "monthly" || r.billing_type === "yearly" || r.billing_type === "weekly").length,
      active: rows.filter((r) => r.status === "active").length,
      inactive: rows.filter((r) => r.status !== "active").length,
      totalRevenue: rows.reduce((s, r) => s + Number(r.total_revenue ?? 0), 0),
      totalSales: rows.reduce((s, r) => s + Number(r.sales_count ?? 0), 0),
    };

    return { rows, projects: projects ?? [], stats };
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  slug: z.string().max(120).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  image_url: z.string().url().optional().or(z.literal("")),
  project_id: z.string().uuid().nullable().optional(),
  site_id: z.string().uuid().nullable().optional(),
  type: z.enum(PRODUCT_TYPES),
  category: z.string().max(80).optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  billing_type: z.enum(BILLING_TYPES),
  price: z.number().min(0),
  currency: z.string().length(3),
  tax_rate: z.number().min(0).max(100).optional(),
  setup_fee: z.number().min(0).optional(),
  trial_days: z.number().int().min(0).optional(),
  subscription_interval: z.string().max(30).optional().or(z.literal("")),
  status: z.enum(STATUSES),
  allowed_providers: z.array(z.string()).optional(),
  is_taxable: z.boolean().optional(),
  is_renewable: z.boolean().optional(),
  requires_approval: z.boolean().optional(),
  visible_in_store: z.boolean().optional(),
  display_order: z.number().int().optional(),
  keywords: z.string().max(500).optional().or(z.literal("")),
});

export const upsertCatalogItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      slug: rest.slug || null,
      description: rest.description || null,
      image_url: rest.image_url || null,
      category: rest.category || null,
      subscription_interval: rest.subscription_interval || null,
      keywords: rest.keywords || null,
      currency: rest.currency.toUpperCase(),
      tags: rest.tags ?? [],
      allowed_providers: rest.allowed_providers ?? [],
    };
    if (id) {
      const { data: row, error } = await context.supabase
        .from("products_services").update(payload).eq("id", id).select("*").single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("products_services")
      .insert({ ...payload, created_by: context.userId })
      .select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCatalogItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products_services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkCatalogAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { ids: string[]; action: "activate" | "pause" | "hide" | "delete" | "archive" }) =>
    z.object({
      ids: z.array(z.string().uuid()).min(1).max(500),
      action: z.enum(["activate", "pause", "hide", "delete", "archive"]),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    if (data.action === "delete") {
      const { error } = await context.supabase.from("products_services").delete().in("id", data.ids);
      if (error) throw new Error(error.message);
      return { ok: true, affected: data.ids.length };
    }
    const statusMap = { activate: "active", pause: "paused", hide: "hidden", archive: "draft" } as const;
    const { error } = await context.supabase
      .from("products_services").update({ status: statusMap[data.action] }).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, affected: data.ids.length };
  });

export const CATALOG_META = { PRODUCT_TYPES, BILLING_TYPES, STATUSES };
