import { randomBytes } from "node:crypto";
import type { PaymentProvider } from "./types";

/**
 * Manual / bank-transfer / mobile-money provider.
 * The customer is shown payment instructions and a reference code.
 * The owner then confirms the payment from the console → webhook fires to the site.
 */
export const manualProvider: PaymentProvider = {
  code: "manual",
  displayName: "Bank transfer · Cash · Manual confirmation",
  async initiate({ session, site }) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ref = `HNP-${randomBytes(3).toString("hex").toUpperCase()}`;

    await supabaseAdmin
      .from("checkout_sessions")
      .update({
        status: "awaiting_confirmation",
        awaiting_reference: ref,
        provider: "manual",
      })
      .eq("id", session.id);

    return {
      kind: "manual",
      instructions:
        site.manual_instructions ??
        "Please transfer the exact amount to the account details below, then include the reference code in your transfer memo. The merchant will confirm within 24h.",
      bankDetails: site.manual_bank_details ?? {},
      referenceHint: ref,
    };
  },
};
