import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ────────── constants ────────── */

export const ITEM_TYPES = [
  "product", "service", "subscription", "course", "hosting",
  "license", "api", "storage", "consulting", "booking", "digital",
] as const;
export const BILLING_TYPES = ["one_time", "recurring", "usage", "free"] as const;
export const BILLING_INTERVALS = ["day", "week", "month", "quarter", "year"] as const;
export const ITEM_STATUSES = ["active", "draft", "hidden", "archived"] as const;
export const TAX_BEHAVIORS = ["exclusive", "inclusive", "none"] as const;

/* ────────── list (paginated + filtered + sorted) ────────── */

const listSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["created_at", "updated_at", "name_ar", "item_code", "status", "item_type"]).default("updated_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  q: z.string().max(200).optional(),
  siteId: z.string().uuid().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  itemType: z.string().max(40).optional().or(z.literal("")),
  billingType: z.string().max(40).optional().or(z.literal("")),
  status: z.string().max(40).optional().or(z.literal("")),
  currency: z.string().max(10).optional().or(z.literal("")),
});

export const listCatalogCentral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    let query = supabase
      .from("catalog_items")
      .select("*", { count: "exact" })
      .order(data.sortBy, { ascending: data.sortDir === "asc" })
      .range(from, to);

    if (data.q) query = query.or(`name_ar.ilike.%${data.q}%,name_en.ilike.%${data.q}%,item_code.ilike.%${data.q}%,slug.ilike.%${data.q}%`);
    if (data.siteId) query = query.eq("site_id", data.siteId);
    if (data.categoryId) query = query.eq("category_id", data.categoryId);
    if (data.itemType) query = query.eq("item_type", data.itemType);
    if (data.status) query = query.eq("status", data.status);

    const { data: items, error, count } = await query;
    if (error) throw new Error(error.message);

    const itemIds = (items ?? []).map((i) => i.id);
    const [{ data: prices }, { data: sites }, { data: cats }] = await Promise.all([
      itemIds.length
        ? supabase.from("catalog_prices").select("*").in("catalog_item_id", itemIds)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("sites").select("id, name, domain, brand_color"),
      supabase.from("catalog_categories").select("id, name_ar, name_en, icon"),
    ]);

    const sMap = new Map((sites ?? []).map((s: any) => [s.id, s]));
    const cMap = new Map((cats ?? []).map((c: any) => [c.id, c]));
    const priceMap = new Map<string, any[]>();
    (prices ?? []).forEach((p: any) => {
      const arr = priceMap.get(p.catalog_item_id) ?? [];
      arr.push(p);
      priceMap.set(p.catalog_item_id, arr);
    });

    let rows = (items ?? []).map((it: any) => {
      const iPrices = priceMap.get(it.id) ?? [];
      const def = iPrices.find((p) => p.is_default) ?? iPrices[0];
      return {
        ...it,
        site_name: sMap.get(it.site_id)?.name ?? null,
        site_domain: sMap.get(it.site_id)?.domain ?? null,
        site_color: sMap.get(it.site_id)?.brand_color ?? null,
        category_name: it.category_id ? cMap.get(it.category_id)?.name_ar ?? null : null,
        category_icon: it.category_id ? cMap.get(it.category_id)?.icon ?? null : null,
        prices_count: iPrices.length,
        default_price_amount: def?.amount ?? null,
        default_price_currency: def?.currency ?? null,
        default_billing_type: def?.billing_type ?? null,
        default_billing_interval: def?.billing_interval ?? null,
      };
    });

    // Post-filters that need joined data
    if (data.billingType) rows = rows.filter((r) => r.default_billing_type === data.billingType);
    if (data.currency) rows = rows.filter((r) => r.default_price_currency === data.currency);

    return { rows, total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

/* ────────── metadata: sites, categories, providers, stats ────────── */

export const getCatalogMeta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: sites }, { data: cats }, { data: providers }, itemsAll, plans] = await Promise.all([
      context.supabase.from("sites").select("id, name, domain, brand_color, is_active").order("name"),
      context.supabase.from("catalog_categories").select("id, name_ar, name_en, site_id, icon").order("name_ar"),
      context.supabase.from("payment_providers").select("id, code, display_name, is_enabled, is_default"),
      context.supabase.from("catalog_items").select("id, item_type, status, site_id"),
      context.supabase.from("catalog_prices").select("catalog_item_id, currency, billing_type"),
    ]);

    const items = itemsAll.data ?? [];
    const pricesArr = plans.data ?? [];
    const siteSet = new Set(items.map((i: any) => i.site_id).filter(Boolean));
    const currencySet = new Set(pricesArr.map((p: any) => p.currency).filter(Boolean));

    const isSubscription = (id: string) =>
      pricesArr.some((p: any) => p.catalog_item_id === id && p.billing_type === "recurring");
    const isService = (t: string) => ["service", "consulting", "booking"].includes(t);

    const stats = {
      total: items.length,
      products: items.filter((i: any) => ["product", "digital", "license"].includes(i.item_type)).length,
      services: items.filter((i: any) => isService(i.item_type)).length,
      subscriptions: items.filter((i: any) => i.item_type === "subscription" || isSubscription(i.id)).length,
      active: items.filter((i: any) => i.status === "active").length,
      draft: items.filter((i: any) => i.status === "draft").length,
      sites_with_items: siteSet.size,
      linked_subscriptions: 0,
    };

    return {
      sites: sites ?? [],
      categories: cats ?? [],
      providers: providers ?? [],
      currencies: Array.from(currencySet),
      stats,
    };
  });

/* ────────── item detail with prices/features/providers ────────── */

export const getCatalogItemDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [item, prices, features, itemProviders, linkedPlans] = await Promise.all([
      context.supabase.from("catalog_items").select("*").eq("id", data.id).single(),
      context.supabase.from("catalog_prices").select("*").eq("catalog_item_id", data.id).order("is_default", { ascending: false }),
      context.supabase.from("catalog_features").select("*").eq("catalog_item_id", data.id).order("display_order"),
      context.supabase.from("catalog_item_providers").select("*, payment_providers(code, display_name)").eq("catalog_item_id", data.id),
      context.supabase.from("plans").select("id, name, code, amount, currency, billing_interval, is_active").eq("catalog_item_id", data.id),
    ]);
    if (item.error) throw new Error(item.error.message);

    const planIds = (linkedPlans.data ?? []).map((p: any) => p.id);
    const [subs, pays] = await Promise.all([
      planIds.length
        ? context.supabase.from("subscriptions").select("id, status, customer_id, created_at, plan_id").in("plan_id", planIds).order("created_at", { ascending: false }).limit(20)
        : Promise.resolve({ data: [] as any[] }),
      planIds.length
        ? context.supabase.from("payments").select("id, amount, currency, status, created_at, plan_id").in("plan_id", planIds).order("created_at", { ascending: false }).limit(20)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const revenue = (pays.data ?? [])
      .filter((p: any) => p.status === "succeeded" || p.status === "paid")
      .reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);

    return {
      item: item.data,
      prices: prices.data ?? [],
      features: features.data ?? [],
      providers: itemProviders.data ?? [],
      plans: linkedPlans.data ?? [],
      subscriptions: subs.data ?? [],
      payments: pays.data ?? [],
      revenue,
    };
  });

/* ────────── upsert item (with prices, features, providers) ────────── */

const priceSchema = z.object({
  id: z.string().uuid().optional(),
  price_code: z.string().min(1).max(80),
  name_ar: z.string().max(120).optional().or(z.literal("")),
  name_en: z.string().max(120).optional().or(z.literal("")),
  currency: z.string().length(3),
  amount: z.number().min(0),
  billing_type: z.enum(BILLING_TYPES),
  billing_interval: z.enum(BILLING_INTERVALS).optional().nullable(),
  interval_count: z.number().int().min(1).default(1),
  trial_days: z.number().int().min(0).default(0),
  setup_fee: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(0),
  tax_behavior: z.enum(TAX_BEHAVIORS).default("exclusive"),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

const featureSchema = z.object({
  id: z.string().uuid().optional(),
  name_ar: z.string().min(1).max(120),
  name_en: z.string().max(120).optional().or(z.literal("")),
  value_text: z.string().max(200).optional().or(z.literal("")),
  value_number: z.number().nullable().optional(),
  included: z.boolean().default(true),
  display_order: z.number().int().default(0),
});

const providerLinkSchema = z.object({
  provider_id: z.string().uuid(),
  is_enabled: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

const upsertItemSchema = z.object({
  id: z.string().uuid().optional(),
  site_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  item_code: z.string().min(2).max(80),
  item_type: z.enum(ITEM_TYPES),
  name_ar: z.string().min(1).max(200),
  name_en: z.string().max(200).optional().or(z.literal("")),
  slug: z.string().max(120).optional().or(z.literal("")),
  short_description_ar: z.string().max(300).optional().or(z.literal("")),
  short_description_en: z.string().max(300).optional().or(z.literal("")),
  description_ar: z.string().max(4000).optional().or(z.literal("")),
  description_en: z.string().max(4000).optional().or(z.literal("")),
  image_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(ITEM_STATUSES),
  is_public: z.boolean().default(true),
  requires_approval: z.boolean().default(false),
  metadata: z.record(z.any()).default({}),
  prices: z.array(priceSchema).default([]),
  features: z.array(featureSchema).default([]),
  providers: z.array(providerLinkSchema).default([]),
});

export const upsertCatalogItemCentral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertItemSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, prices, features, providers, ...rest } = data;

    const itemPayload = {
      ...rest,
      slug: rest.slug || null,
      name_en: rest.name_en || null,
      short_description_ar: rest.short_description_ar || null,
      short_description_en: rest.short_description_en || null,
      description_ar: rest.description_ar || null,
      description_en: rest.description_en || null,
      image_url: rest.image_url || null,
      category_id: rest.category_id || null,
    };

    let itemId = id;
    if (id) {
      const { error } = await supabase.from("catalog_items").update(itemPayload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await supabase
        .from("catalog_items")
        .insert({ ...itemPayload, created_by: userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      itemId = row.id;
    }

    // Replace prices
    await supabase.from("catalog_prices").delete().eq("catalog_item_id", itemId!);
    if (prices.length) {
      // ensure exactly one default
      const hasDefault = prices.some((p) => p.is_default);
      const pRows = prices.map((p, idx) => ({
        catalog_item_id: itemId!,
        site_id: rest.site_id,
        price_code: p.price_code,
        name_ar: p.name_ar || null,
        name_en: p.name_en || null,
        currency: p.currency.toUpperCase(),
        amount: p.amount,
        billing_type: p.billing_type,
        billing_interval: p.billing_type === "recurring" ? p.billing_interval ?? "month" : null,
        interval_count: p.interval_count,
        trial_days: p.trial_days,
        setup_fee: p.setup_fee,
        tax_rate: p.tax_rate,
        tax_behavior: p.tax_behavior,
        is_default: hasDefault ? p.is_default : idx === 0,
        is_active: p.is_active,
      }));
      const { error } = await supabase.from("catalog_prices").insert(pRows);
      if (error) throw new Error(error.message);
    }

    // Replace features
    await supabase.from("catalog_features").delete().eq("catalog_item_id", itemId!);
    if (features.length) {
      const fRows = features.map((f, idx) => ({
        catalog_item_id: itemId!,
        name_ar: f.name_ar,
        name_en: f.name_en || null,
        value_text: f.value_text || null,
        value_number: f.value_number ?? null,
        included: f.included,
        display_order: f.display_order ?? idx,
      }));
      const { error } = await supabase.from("catalog_features").insert(fRows);
      if (error) throw new Error(error.message);
    }

    // Replace provider links
    await supabase.from("catalog_item_providers").delete().eq("catalog_item_id", itemId!);
    if (providers.length) {
      const prRows = providers.map((p) => ({
        catalog_item_id: itemId!,
        site_id: rest.site_id,
        provider_id: p.provider_id,
        is_enabled: p.is_enabled,
        is_default: p.is_default,
      }));
      const { error } = await supabase.from("catalog_item_providers").insert(prRows);
      if (error) throw new Error(error.message);
    }

    return { id: itemId };
  });

/* ────────── row actions ────────── */

export const setCatalogItemStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string }) =>
    z.object({ id: z.string().uuid(), status: z.enum(ITEM_STATUSES) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("catalog_items").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCatalogItemCentral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("catalog_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateCatalogItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: it }, { data: prices }, { data: features }, { data: prov }] = await Promise.all([
      supabase.from("catalog_items").select("*").eq("id", data.id).single(),
      supabase.from("catalog_prices").select("*").eq("catalog_item_id", data.id),
      supabase.from("catalog_features").select("*").eq("catalog_item_id", data.id),
      supabase.from("catalog_item_providers").select("*").eq("catalog_item_id", data.id),
    ]);
    if (!it) throw new Error("Item not found");
    const suffix = Math.floor(100000 + Math.random() * 900000);
    const { id: _oldId, created_at, updated_at, ...rest } = it;
    const { data: newItem, error } = await supabase
      .from("catalog_items")
      .insert({
        ...rest,
        item_code: `${it.item_code}-${suffix}`.slice(0, 80),
        slug: it.slug ? `${it.slug}-copy-${suffix}` : null,
        name_ar: `${it.name_ar} (نسخة)`,
        status: "draft",
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (prices?.length) {
      await supabase.from("catalog_prices").insert(
        prices.map(({ id: _i, created_at: _c, updated_at: _u, ...p }: any) => ({
          ...p,
          catalog_item_id: newItem.id,
          price_code: `${p.price_code}-${suffix}`.slice(0, 80),
        })),
      );
    }
    if (features?.length) {
      await supabase.from("catalog_features").insert(
        features.map(({ id: _i, created_at: _c, updated_at: _u, ...f }: any) => ({ ...f, catalog_item_id: newItem.id })),
      );
    }
    if (prov?.length) {
      await supabase.from("catalog_item_providers").insert(
        prov.map(({ id: _i, created_at: _c, updated_at: _u, ...p }: any) => ({ ...p, catalog_item_id: newItem.id })),
      );
    }
    return { id: newItem.id };
  });

/* ────────── CSV import ────────── */

const csvRowSchema = z.object({
  site_id: z.string().uuid(),
  item_code: z.string().min(2).max(80),
  item_type: z.enum(ITEM_TYPES),
  name_ar: z.string().min(1).max(200),
  name_en: z.string().max(200).optional().or(z.literal("")),
  currency: z.string().length(3).default("MAD"),
  amount: z.number().min(0).default(0),
  billing_type: z.enum(BILLING_TYPES).default("one_time"),
  billing_interval: z.string().optional().or(z.literal("")),
  status: z.enum(ITEM_STATUSES).default("draft"),
});

export const importCatalogCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { rows: unknown[] }) => z.object({ rows: z.array(z.any()).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let ok = 0;
    const errors: { row: number; message: string }[] = [];
    for (let i = 0; i < data.rows.length; i++) {
      try {
        const parsed = csvRowSchema.parse(data.rows[i]);
        const { data: item, error } = await supabase
          .from("catalog_items")
          .insert({
            site_id: parsed.site_id,
            item_code: parsed.item_code,
            item_type: parsed.item_type,
            name_ar: parsed.name_ar,
            name_en: parsed.name_en || null,
            status: parsed.status,
            created_by: userId,
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        await supabase.from("catalog_prices").insert({
          catalog_item_id: item.id,
          site_id: parsed.site_id,
          price_code: `${parsed.item_code}-DEFAULT`.slice(0, 80),
          currency: parsed.currency.toUpperCase(),
          amount: parsed.amount,
          billing_type: parsed.billing_type,
          billing_interval: parsed.billing_type === "recurring" ? (parsed.billing_interval || "month") : null,
          is_default: true,
          is_active: true,
        });
        ok++;
      } catch (e) {
        errors.push({ row: i + 1, message: e instanceof Error ? e.message : String(e) });
      }
    }
    return { imported: ok, errors };
  });
