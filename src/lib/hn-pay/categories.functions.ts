import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [cats, projects, prods, plans] = await Promise.all([
      context.supabase
        .from("product_categories")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true }),
      context.supabase.from("hn_projects").select("id, name, code, brand_color"),
      context.supabase.from("products_services").select("id, category_id, type"),
      context.supabase.from("plans").select("id, category_id"),
    ]);
    if (cats.error) throw new Error(cats.error.message);

    const prodCount = new Map<string, number>();
    const svcCount = new Map<string, number>();
    (prods.data ?? []).forEach((p: any) => {
      if (!p.category_id) return;
      if (p.type === "service" || p.type === "consulting" || p.type === "booking") {
        svcCount.set(p.category_id, (svcCount.get(p.category_id) ?? 0) + 1);
      } else {
        prodCount.set(p.category_id, (prodCount.get(p.category_id) ?? 0) + 1);
      }
    });
    const planCount = new Map<string, number>();
    (plans.data ?? []).forEach((p: any) => {
      if (p.category_id) planCount.set(p.category_id, (planCount.get(p.category_id) ?? 0) + 1);
    });

    const rows = (cats.data ?? []).map((c) => ({
      ...c,
      products_count: prodCount.get(c.id) ?? 0,
      services_count: svcCount.get(c.id) ?? 0,
      plans_count: planCount.get(c.id) ?? 0,
    }));
    return { rows, projects: projects.data ?? [] };
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-_]+$/),
  description: z.string().max(500).optional().or(z.literal("")),
  icon: z.string().max(60).optional().or(z.literal("")),
  color: z.string().max(20).optional().or(z.literal("")),
  display_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      project_id: rest.project_id || null,
      parent_id: rest.parent_id || null,
      description: rest.description || null,
      icon: rest.icon || null,
      color: rest.color || "#f59e0b",
    };
    if (id) {
      const { data: row, error } = await context.supabase
        .from("product_categories").update(payload).eq("id", id).select("*").single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("product_categories")
      .insert({ ...payload, created_by: context.userId })
      .select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("product_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
