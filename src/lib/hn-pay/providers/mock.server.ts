import { randomBytes } from "node:crypto";
import type { PaymentProvider } from "./types";

/**
 * Mock provider — simulates a full external gateway loop WITHOUT real money.
 * Used to prove the end-to-end embedded checkout flow works:
 *   embed iframe → user clicks pay → mock provider "webhook" fires →
 *   settlement writes payment/subscription → outbound webhook to site.
 *
 * The initiate() step returns an immediate redirect to an internal simulator
 * that then POSTs a signed webhook back to /api/public/v1/webhooks/mock.
 */
export const mockProvider: PaymentProvider = {
  code: "mock" as never,
  displayName: "HN-Pay Sandbox (test only)",
  async initiate({ session }) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const providerRef = `mock_${randomBytes(6).toString("hex")}`;

    await supabaseAdmin
      .from("checkout_sessions")
      .update({
        status: "processing",
        provider: "mock",
        provider_session_id: providerRef,
      })
      .eq("id", session.id);

    // The embedded iframe interprets this "redirect" URL and shows the
    // sandbox pay/decline buttons in place. The URL is same-origin.
    return {
      kind: "redirect",
      url: `/pay/sandbox/${session.public_id}?ref=${providerRef}`,
      providerSessionId: providerRef,
    };
  },
};
