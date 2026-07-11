import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FinancialProjectRow = {
  domain_id: string;
  domain: string;
  domain_type: string;
  is_primary: boolean;
  environment: string;
  payments_enabled: boolean;
  verification_status: string;
  project_id: string;
  project_name: string;
  project_code: string;
  project_category: string | null;
  brand_color: string | null;
  default_currency: string;
  default_provider_name: string | null;
  // product-derived
  site_id: string | null;
  product_id: string | null;
  product_code: string | null;
  service_type: string | null;        // type
  billing_type: string | null;
  is_taxable: boolean;
  is_renewable: boolean;
  allow_subscription: boolean;        // subscription_interval not null
  visible_in_store: boolean;
  requires_approval: boolean;
  display_order: number;
  keywords: string | null;
  sales_count: number;
  total_revenue: number;
  customers_count: number;
};

export const listFinancialProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FinancialProjectRow[]> => {
    const { supabase } = context;

    const [{ data: domains, error: dErr }, { data: projects, error: pErr }, { data: products, error: prErr }, { data: providers }] = await Promise.all([
      supabase.from("project_domains").select("*").order("created_at", { ascending: false }),
      supabase.from("hn_projects").select("id,name,code,category,brand_color,default_currency,default_provider_id"),
      supabase.from("products_services").select("id,project_id,site_id,product_code,type,billing_type,is_taxable,is_renewable,subscription_interval,visible_in_store,requires_approval,display_order,keywords,sales_count,total_revenue,customers_count"),
      supabase.from("payment_providers").select("id,name"),
    ]);

    if (dErr) throw dErr;
    if (pErr) throw pErr;
    if (prErr) throw prErr;

    const projMap = new Map((projects ?? []).map((p: any) => [p.id, p]));
    const provMap = new Map((providers ?? []).map((p: any) => [p.id, p.name]));

    // aggregate products by project_id (fallback when no site_id linkage)
    const prodByProject = new Map<string, any[]>();
    for (const pr of products ?? []) {
      if (!pr.project_id) continue;
      const arr = prodByProject.get(pr.project_id) ?? [];
      arr.push(pr);
      prodByProject.set(pr.project_id, arr);
    }

    return (domains ?? []).map((d: any): FinancialProjectRow => {
      const project = projMap.get(d.project_id) as any;
      const projProducts = prodByProject.get(d.project_id) ?? [];
      const primary = projProducts[0] ?? null;
      const agg = projProducts.reduce(
        (acc, p) => {
          acc.sales += Number(p.sales_count || 0);
          acc.revenue += Number(p.total_revenue || 0);
          acc.customers += Number(p.customers_count || 0);
          return acc;
        },
        { sales: 0, revenue: 0, customers: 0 },
      );

      return {
        domain_id: d.id,
        domain: d.domain,
        domain_type: d.domain_type,
        is_primary: d.is_primary,
        environment: d.environment,
        payments_enabled: d.payments_enabled,
        verification_status: d.verification_status,
        project_id: d.project_id,
        project_name: project?.name ?? "—",
        project_code: project?.code ?? "—",
        project_category: project?.category ?? null,
        brand_color: project?.brand_color ?? null,
        default_currency: project?.default_currency ?? "USD",
        default_provider_name: project?.default_provider_id ? (provMap.get(project.default_provider_id) ?? null) : null,
        site_id: primary?.site_id ?? null,
        product_id: primary?.id ?? null,
        product_code: primary?.product_code ?? null,
        service_type: primary?.type ?? null,
        billing_type: primary?.billing_type ?? null,
        is_taxable: !!primary?.is_taxable,
        is_renewable: !!primary?.is_renewable,
        allow_subscription: !!primary?.subscription_interval,
        visible_in_store: primary?.visible_in_store ?? true,
        requires_approval: !!primary?.requires_approval,
        display_order: primary?.display_order ?? 0,
        keywords: primary?.keywords ?? null,
        sales_count: agg.sales,
        total_revenue: agg.revenue,
        customers_count: agg.customers,
      };
    });
  });
