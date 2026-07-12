import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_catalog",
  title: "Search catalog",
  description:
    "Search catalog items across the HN group. Returns items visible to the signed-in user (RLS scoped), including shared group offerings.",
  inputSchema: {
    query: z.string().min(1).max(120).describe("Text to match against name/description."),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("catalog_items")
      .select("id, name, description, kind, status, site_id, share_with_group, created_at")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit ?? 25);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { items: data ?? [] },
    };
  },
});
