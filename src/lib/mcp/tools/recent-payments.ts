import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "recent_payments",
  title: "Recent payments",
  description:
    "Return the most recent payments the signed-in user can see (RLS scoped). Optionally filter by site_id, project_id, or status.",
  inputSchema: {
    site_id: z.string().uuid().optional(),
    project_id: z.string().uuid().optional(),
    status: z.string().optional().describe("e.g. succeeded, pending, failed"),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ site_id, project_id, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("payments")
      .select("id, public_id, amount, currency, status, provider, site_id, project_id, customer_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (site_id) q = q.eq("site_id", site_id);
    if (project_id) q = q.eq("project_id", project_id);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { payments: data ?? [] },
    };
  },
});
