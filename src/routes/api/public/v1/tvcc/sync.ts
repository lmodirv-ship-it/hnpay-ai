import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

/**
 * TVCC -> HN-Pay sync. TVCC (the site-linkage control system) pushes its full
 * site list with plans. Auth: Bearer <HN_CRON_SECRET>.
 */
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
function safeEq(a: string, b: string) {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export const Route = createFileRoute("/api/public/v1/tvcc/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.HN_CRON_SECRET;
        if (!secret) return json(503, { error: "not_configured" });
        const m = (request.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
        if (!m || !safeEq(m[1].trim(), secret)) return json(401, { error: "invalid_token" });

        const { tvccPayloadSchema, applyTvccSync } = await import("@/lib/hn-pay/tvcc-sync.server");
        let body: unknown;
        try { body = await request.json(); } catch { return json(400, { error: "invalid_json" }); }
        const parsed = tvccPayloadSchema.safeParse(body);
        if (!parsed.success) return json(400, { error: "invalid_payload", issues: parsed.error.issues.slice(0, 10) });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const result = await applyTvccSync(supabaseAdmin, parsed.data);
        return json(result.ok ? 200 : 500, result);
      },
    },
  },
});
