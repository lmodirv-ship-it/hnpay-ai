import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Owner: list checkout sessions awaiting manual confirmation for a site. */
export const listAwaitingSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { siteId: string }) => z.object({ siteId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("checkout_sessions")
      .select(
        "id, public_id, amount, currency, customer_email, customer_external_id, awaiting_reference, status, created_at",
      )
      .eq("site_id", data.siteId)
      .in("status", ["awaiting_confirmation", "pending"])
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Owner: mark a manual/offline payment as received → fires webhook to the site. */
export const settleManualPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string; providerRef: string; notes?: string }) =>
    z
      .object({
        sessionId: z.string().uuid(),
        providerRef: z.string().min(1).max(120),
        notes: z.string().max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { settleCheckoutSession } = await import("./settlement.server");
    return await settleCheckoutSession({
      admin: supabaseAdmin,
      sessionId: data.sessionId,
      provider: "manual",
      providerRef: data.providerRef,
      settledBy: context.userId,
      notes: data.notes ?? null,
    });
  });
