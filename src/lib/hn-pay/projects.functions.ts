import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ────────── Projects ────────── */

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: projects, error } = await context.supabase
      .from("hn_projects")
      .select(
        "id, name, code, category, primary_domain, status, default_currency, brand_color, description, created_at",
      )
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: domains } = await context.supabase
      .from("project_domains")
      .select("id, project_id, domain, domain_type, is_primary, payments_enabled, environment, verification_status");

    const domainByProject = new Map<string, typeof domains>();
    (domains ?? []).forEach((d) => {
      const arr = domainByProject.get(d.project_id) ?? [];
      arr.push(d);
      domainByProject.set(d.project_id, arr);
    });

    return (projects ?? []).map((p) => ({
      ...p,
      domains: domainByProject.get(p.id) ?? [],
      domain_count: (domainByProject.get(p.id) ?? []).length,
    }));
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      name: string;
      code: string;
      category?: string;
      primary_domain?: string;
      default_currency?: string;
      brand_color?: string;
      description?: string;
    }) =>
      z
        .object({
          name: z.string().min(1).max(120),
          code: z.string().min(2).max(64).regex(/^[a-z0-9_]+$/),
          category: z.string().max(80).optional(),
          primary_domain: z.string().max(255).optional(),
          default_currency: z.string().length(3).optional(),
          brand_color: z.string().max(20).optional(),
          description: z.string().max(500).optional(),
        })
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("hn_projects")
      .insert({
        name: data.name,
        code: data.code,
        category: data.category ?? null,
        primary_domain: data.primary_domain ?? null,
        default_currency: (data.default_currency ?? "USD").toUpperCase(),
        brand_color: data.brand_color ?? "#f59e0b",
        description: data.description ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("hn_projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ────────── Domains ────────── */

export const addProjectDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      project_id: string;
      domain: string;
      domain_type?: string;
      is_primary?: boolean;
      payments_enabled?: boolean;
      environment?: "production" | "staging" | "test";
    }) =>
      z
        .object({
          project_id: z.string().uuid(),
          domain: z.string().min(3).max(255),
          domain_type: z.string().max(40).optional(),
          is_primary: z.boolean().optional(),
          payments_enabled: z.boolean().optional(),
          environment: z.enum(["production", "staging", "test"]).optional(),
        })
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("project_domains").insert({
      project_id: data.project_id,
      domain: data.domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
      domain_type: data.domain_type ?? "app",
      is_primary: data.is_primary ?? false,
      payments_enabled: data.payments_enabled ?? false,
      environment: data.environment ?? "production",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateProjectDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    id: string;
    payments_enabled?: boolean;
    domain_type?: string;
    is_primary?: boolean;
    verification_status?: string;
  }) =>
    z.object({
      id: z.string().uuid(),
      payments_enabled: z.boolean().optional(),
      domain_type: z.string().optional(),
      is_primary: z.boolean().optional(),
      verification_status: z.string().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("project_domains").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeProjectDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("project_domains").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ────────── Bulk Import ────────── */

const bulkRow = z.object({
  project_name: z.string().min(1),
  project_code: z.string().min(2).regex(/^[a-z0-9_]+$/),
  primary_domain: z.string().min(3).optional().or(z.literal("")),
  domain: z.string().min(3),
  type: z.string().optional().or(z.literal("")),
  environment: z.string().optional().or(z.literal("")),
  payments_enabled: z.union([z.boolean(), z.string()]).optional(),
  category: z.string().optional().or(z.literal("")),
});

type BulkResult = {
  projectsCreated: number;
  domainsCreated: number;
  domainsSkipped: number;
  errors: { row: number; domain?: string; error: string }[];
};

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["true", "1", "yes", "y"].includes(v.trim().toLowerCase());
  return false;
}

export const bulkImportProjects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { rows: unknown[] }) =>
    z.object({ rows: z.array(bulkRow).max(1000) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<BulkResult> => {
    const result: BulkResult = {
      projectsCreated: 0,
      domainsCreated: 0,
      domainsSkipped: 0,
      errors: [],
    };

    // load existing projects
    const { data: existingProjects } = await context.supabase
      .from("hn_projects")
      .select("id, code");
    const codeToId = new Map<string, string>();
    (existingProjects ?? []).forEach((p) => codeToId.set(p.code, p.id));

    // load existing domains
    const { data: existingDomains } = await context.supabase
      .from("project_domains")
      .select("domain");
    const domainSet = new Set<string>((existingDomains ?? []).map((d) => d.domain));

    for (let i = 0; i < data.rows.length; i++) {
      const r = data.rows[i];
      try {
        // upsert project
        let projectId = codeToId.get(r.project_code);
        if (!projectId) {
          const { data: p, error: pErr } = await context.supabase
            .from("hn_projects")
            .insert({
              name: r.project_name,
              code: r.project_code,
              category: r.category || null,
              primary_domain: (r.primary_domain || r.domain).toLowerCase(),
              created_by: context.userId,
            })
            .select("id")
            .single();
          if (pErr) throw pErr;
          projectId = p.id;
          codeToId.set(r.project_code, projectId);
          result.projectsCreated++;
        }

        const normDomain = r.domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
        if (domainSet.has(normDomain)) {
          result.domainsSkipped++;
          continue;
        }

        const { error: dErr } = await context.supabase.from("project_domains").insert({
          project_id: projectId,
          domain: normDomain,
          domain_type: r.type || "app",
          environment: r.environment || "production",
          payments_enabled: toBool(r.payments_enabled),
          is_primary: !!r.primary_domain && normDomain === r.primary_domain.toLowerCase(),
        });
        if (dErr) throw dErr;
        domainSet.add(normDomain);
        result.domainsCreated++;
      } catch (e) {
        result.errors.push({
          row: i + 1,
          domain: (r as { domain?: string }).domain,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    return result;
  });
