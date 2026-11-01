import { z } from "zod";

export const tvccPayloadSchema = z.object({
  sites: z
    .array(
      z.object({
        external_id: z.string().min(1).max(200),
        domain: z.string().min(3).max(255),
        name: z.string().min(1).max(200).optional(),
        is_active: z.boolean().optional(),
        plans: z
          .array(
            z.object({
              code: z.string().min(1).max(100),
              name: z.string().min(1).max(200),
              amount: z.number().min(0),
              currency: z.string().length(3).optional(),
              billing_interval: z.enum(["month", "year", "week", "day", "one_time"]).optional(),
              is_active: z.boolean().optional(),
            }),
          )
          .max(200)
          .optional(),
      }),
    )
    .max(2000),
});
export type TvccPayload = z.infer<typeof tvccPayloadSchema>;

/** Normalise a domain/URL to a bare lowercase host. */
export function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
}

/** Deterministic slug from a domain, e.g. "shop.hn-db.com" -> "shop-hn-db-com". */
export function slugFromDomain(domain: string): string {
  return normalizeDomain(domain).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "site";
}

/** Upsert sites (+ their plans) pushed by TVCC. TVCC is the source of truth for site linkage. */
export async function applyTvccSync(db: any, payload: TvccPayload) {
  const { data: run } = await db.from("tvcc_sync_runs").insert({ sites_received: payload.sites.length }).select("id").single();
  let created = 0, updated = 0, plansUpserted = 0;
  try {
    const now = new Date().toISOString();
    for (const s of payload.sites) {
      const domain = normalizeDomain(s.domain);
      const isActive = s.is_active ?? true;
      let { data: existing } = await db.from("sites").select("id, project_id")
        .or(`tvcc_external_id.eq.${s.external_id},domain.eq.${domain}`).limit(1).maybeSingle();
      let siteId: string;
      if (existing) {
        await db.from("sites").update({ tvcc_external_id: s.external_id, tvcc_synced_at: now, source: "tvcc", is_active: isActive, ...(s.name ? { name: s.name } : {}) }).eq("id", existing.id);
        siteId = existing.id; updated++;
      } else {
        const slug = slugFromDomain(domain);
        const { data: proj } = await db.from("hn_projects")
          .upsert({ name: s.name ?? domain, code: slug, primary_domain: domain, status: "active" }, { onConflict: "code" })
          .select("id").single();
        const { data: site, error } = await db.from("sites").insert({
          slug, name: s.name ?? domain, domain, is_active: isActive, project_id: proj?.id ?? null,
          source: "tvcc", tvcc_external_id: s.external_id, tvcc_synced_at: now, is_group_site: true,
        }).select("id").single();
        if (error) throw new Error(`site ${domain}: ${error.message}`);
        siteId = site.id; existing = { id: site.id, project_id: proj?.id ?? null }; created++;
      }
      for (const p of s.plans ?? []) {
        const { error } = await db.from("plans").upsert({
          site_id: siteId, project_id: existing?.project_id ?? null, code: p.code, name: p.name, amount: p.amount,
          currency: (p.currency ?? "EUR").toUpperCase(),
          billing_interval: p.billing_interval === "one_time" ? null : (p.billing_interval ?? "month"),
          is_active: p.is_active ?? true,
        }, { onConflict: "site_id,code" });
        if (error) throw new Error(`plan ${p.code}: ${error.message}`);
        plansUpserted++;
      }
    }
    await db.from("tvcc_sync_runs").update({ status: "ok", finished_at: new Date().toISOString(), sites_created: created, sites_updated: updated, plans_upserted: plansUpserted }).eq("id", run?.id);
    return { ok: true, created, updated, plans: plansUpserted };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.from("tvcc_sync_runs").update({ status: "failed", finished_at: new Date().toISOString(), error: msg, sites_created: created, sites_updated: updated, plans_upserted: plansUpserted }).eq("id", run?.id);
    return { ok: false, error: msg, created, updated, plans: plansUpserted };
  }
}

/** Map the TVCC hn-service catalog response into our sync payload. */
export function mapTvccCatalog(raw: any): TvccPayload {
  const sites = (Array.isArray(raw?.sites) ? raw.sites : [])
    .filter((s: any) => s?.domain && (s.id || s.site_id))
    .map((s: any) => ({
      external_id: String(s.id ?? s.site_id),
      domain: normalizeDomain(String(s.frontend_domain || s.domain)),
      name: s.name ? String(s.name).slice(0, 200) : undefined,
      is_active: s.is_active !== false,
      plans: Array.isArray(s.plans) ? s.plans : undefined,
    }));
  return tvccPayloadSchema.parse({ sites });
}
