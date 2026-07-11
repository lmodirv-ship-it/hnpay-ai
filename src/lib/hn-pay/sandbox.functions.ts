import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server-side sandbox settlement for the "mock" provider.
 *
 * Replaces the previous client-side call to /api/public/v1/webhooks/mock
 * with an internal server function so no shared secret ever ships to the
 * browser. Callable without auth (the embedded checkout iframe runs for
 * the customer), but only completes when the target site has the mock
 * provider explicitly enabled — real production sites never do.
 */
export const runMockSandboxPayment = createServerFn({ method: "POST" })
  .inputValidator((data: { publicId: string; outcome?: "succeeded" | "failed" }) =>
    z
      .object({
        publicId: z.string().min(4).max(128),
        outcome: z.enum(["succeeded", "failed"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: session } = await supabaseAdmin
      .from("checkout_sessions")
      .select("id, public_id, status, site_id")
      .eq("public_id", data.publicId)
      .maybeSingle();
    if (!session) throw new Error("session_not_found");

    const { data: site } = await supabaseAdmin
      .from("sites")
      .select("enabled_providers")
      .eq("id", session.site_id)
      .maybeSingle();
    const enabled = (site?.enabled_providers ?? []) as string[];
    if (!enabled.includes("mock")) {
      throw new Error("mock_not_enabled_for_site");
    }

    const providerRef = `mock_${Date.now().toString(36)}`;

    if (data.outcome === "failed") {
      await supabaseAdmin
        .from("checkout_sessions")
        .update({ status: "failed" })
        .eq("id", session.id);
      return { ok: true, status: "failed" as const };
    }

    const { settleCheckoutSession } = await import("./settlement.server");
    const result = await settleCheckoutSession({
      admin: supabaseAdmin,
      sessionId: session.id,
      provider: "mock",
      providerRef,
    });
    return { ok: true, status: "succeeded" as const, ...result };
  });
