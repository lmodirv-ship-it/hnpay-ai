import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

/**
 * Secrets distribution endpoint for HN group orchestrators (hn-tvcc).
 *
 * Auth: Bearer <HN_CRON_SECRET>
 * Returns the two shared secrets + full list of active sites so an
 * external orchestrator (hn-tvcc.lovable.app) can inject them into
 * every downstream site.
 */

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export const Route = createFileRoute("/api/public/v1/group/secrets-distribution")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cronSecret = process.env.HN_CRON_SECRET;
        const webhookSecret = process.env.HN_PAY_WEBHOOK_SECRET;
        if (!cronSecret || !webhookSecret) {
          return json(503, { error: "secrets_not_configured" });
        }

        const auth = request.headers.get("authorization") ?? "";
        const m = auth.match(/^Bearer\s+(.+)$/i);
        if (!m || !safeEq(m[1].trim(), cronSecret)) {
          return json(401, { error: "invalid_token" });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: sites, error } = await supabaseAdmin
          .from("sites")
          .select("id, slug, name, domain, project_id, is_active, is_group_site")
          .eq("is_active", true)
          .order("slug", { ascending: true });

        if (error) return json(500, { error: "db_error", detail: error.message });

        const { data: domains } = await supabaseAdmin
          .from("project_domains")
          .select("project_id, domain");

        const domainsByProject = new Map<string, string[]>();
        for (const d of domains ?? []) {
          const arr = domainsByProject.get(d.project_id) ?? [];
          arr.push(d.domain);
          domainsByProject.set(d.project_id, arr);
        }

        return json(200, {
          issued_at: new Date().toISOString(),
          secrets: {
            HN_PAY_WEBHOOK_SECRET: webhookSecret,
            HN_CRON_SECRET: cronSecret,
          },
          sites: (sites ?? []).map((s) => ({
            id: s.id,
            slug: s.slug,
            name: s.name,
            domain: s.domain,
            project_id: s.project_id,
            is_group_site: s.is_group_site,
            aliases: s.project_id ? domainsByProject.get(s.project_id) ?? [] : [],
          })),
          total: sites?.length ?? 0,
        });
      },
    },
  },
});
