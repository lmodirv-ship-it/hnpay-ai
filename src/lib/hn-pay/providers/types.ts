// Payment provider abstraction for HN-PAY.
// Add new providers (paypal, cmi, payzone, naps) by implementing this interface.

export type ProviderCode = "manual" | "stripe" | "paddle" | "paypal" | "cmi" | "payzone" | "naps" | "apple_pay" | "google_pay" | "usdt";

export type CheckoutSessionRow = {
  id: string;
  public_id: string;
  site_id: string;
  plan_id: string;
  amount: number;
  currency: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_external_id: string | null;
  success_url: string | null;
  cancel_url: string | null;
  metadata: Record<string, unknown>;
  provider: ProviderCode | string;
};

export type SiteRow = {
  id: string;
  name: string;
  domain: string;
  enabled_providers: string[];
  manual_instructions: string | null;
  manual_bank_details: Record<string, string>;
  brand_color: string | null;
};

/** Result returned when a checkout is initiated. */
export type InitiateResult =
  | { kind: "redirect"; url: string; providerSessionId?: string }
  | { kind: "manual"; instructions: string; bankDetails: Record<string, string>; referenceHint: string }
  | { kind: "immediate_success" };

export interface PaymentProvider {
  code: ProviderCode;
  displayName: string;
  /** Called when the customer picks this provider on the checkout page. */
  initiate(args: { session: CheckoutSessionRow; site: SiteRow }): Promise<InitiateResult>;
}
