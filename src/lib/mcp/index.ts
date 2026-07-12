import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoami from "./tools/whoami";
import listProjects from "./tools/list-projects";
import listSites from "./tools/list-sites";
import recentPayments from "./tools/recent-payments";
import searchCatalog from "./tools/search-catalog";

// Direct Supabase issuer — the .lovable.cloud proxy publishes the direct
// supabase.co form in its discovery document, so mcp-js needs the direct host.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "hn-pay-mcp",
  title: "HN-Pay Hub",
  version: "0.1.0",
  instructions:
    "Read-only tools for the HN-Pay Hub — inspect projects, sites, catalog, and payments across the HN group. All calls run as the signed-in user under Supabase RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoami, listProjects, listSites, recentPayments, searchCatalog],
});
