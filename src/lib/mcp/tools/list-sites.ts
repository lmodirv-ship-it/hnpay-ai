import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_sites",
  title: "List sites",
  description:
    "List sites in the HN network that the signed-in user can access (RLS scoped). Optionally filter by project_id.",
  inputSchema: {
    project_id: z.string().uuid().optional().describe("Filter to sites of a specific project."),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("sites")
      .select(
        "id, slug, name, domain, project_id, environment, is_active, is_group_site, integration_status, enabled_providers",
      )
      .order("name")
      .limit(limit ?? 100);
    if (project_id) q = q.eq("project_id", project_id);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { sites: data ?? [] },
    };
  },
});
