import { manualProvider } from "./manual.server";
import { stripeProvider } from "./stripe.server";
import { paddleProvider } from "./paddle.server";
import { paypalProvider } from "./paypal.server";
import { cmiProvider } from "./cmi.server";
import { napsProvider } from "./naps.server";
import { payzoneProvider } from "./payzone.server";
import { applePayProvider } from "./apple_pay.server";
import { googlePayProvider } from "./google_pay.server";
import { usdtProvider } from "./usdt.server";
import { mockProvider } from "./mock.server";
import { youcanPayProvider } from "./youcanpay.server";
import { lemonSqueezyProvider } from "./lemonsqueezy.server";
import { walletProvider } from "./wallet.server";
import type { PaymentProvider, ProviderCode } from "./types";

const REGISTRY: Record<string, PaymentProvider> = {
  manual: manualProvider,
  stripe: stripeProvider,
  paddle: paddleProvider,
  paypal: paypalProvider,
  cmi: cmiProvider,
  naps: napsProvider,
  payzone: payzoneProvider,
  apple_pay: applePayProvider,
  google_pay: googlePayProvider,
  usdt: usdtProvider,
  mock: mockProvider,
  youcan_pay: youcanPayProvider,
  lemon_squeezy: lemonSqueezyProvider,
  wallet: walletProvider,
};

export function getProvider(code: string): PaymentProvider {
  const p = REGISTRY[code];
  if (!p) throw new Error(`Unknown payment provider: ${code}`);
  return p;
}

export function listAllProviders(): PaymentProvider[] {
  return Object.values(REGISTRY);
}

export type ProviderConfig = {
  api_key: string | null;
  public_key: string | null;
  secret_key: string | null;
  webhook_secret: string | null;
  merchant_id: string | null;
  environment: "sandbox" | "production";
  supported_countries: string[];
  supported_currencies: string[];
  fee_percent: number;
  fee_fixed: number;
  tax_mode: string;
};

/**
 * Resolves provider credentials for a site from the payment_providers table.
 * Falls back to a global/shared provider and then env vars for backwards compatibility.
 */
export async function loadProviderConfig(code: string, siteId?: string): Promise<ProviderConfig | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let row: {
    api_key: string | null;
    public_key: string | null;
    secret_key: string | null;
    webhook_secret: string | null;
    merchant_id: string | null;
    environment: string;
    is_enabled: boolean;
    supported_countries: string[];
    supported_currencies: string[];
    fee_percent: number;
    fee_fixed: number;
    tax_mode: string;
  } | null = null;

  if (siteId) {
    const { data } = await supabaseAdmin
      .from("payment_providers")
      .select("api_key, public_key, secret_key, webhook_secret, merchant_id, environment, is_enabled, supported_countries, supported_currencies, fee_percent, fee_fixed, tax_mode")
      .eq("site_id", siteId)
      .eq("code", code)
      .eq("is_enabled", true)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();
    row = data ?? null;
  }

  if (!row) {
    const { data } = await supabaseAdmin
      .from("payment_providers")
      .select("api_key, public_key, secret_key, webhook_secret, merchant_id, environment, is_enabled, supported_countries, supported_currencies, fee_percent, fee_fixed, tax_mode")
      .is("site_id", null)
      .eq("code", code)
      .eq("is_enabled", true)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();
    row = data ?? null;
  }

  if (!row) return null;
  return {
    api_key: row.api_key,
    public_key: row.public_key,
    secret_key: row.secret_key,
    webhook_secret: row.webhook_secret,
    merchant_id: row.merchant_id,
    environment: (row.environment as "sandbox" | "production") ?? "sandbox",
    supported_countries: row.supported_countries ?? [],
    supported_currencies: row.supported_currencies ?? [],
    fee_percent: Number(row.fee_percent) || 0,
    fee_fixed: Number(row.fee_fixed) || 0,
    tax_mode: row.tax_mode ?? "automatic",
  };
}

export async function resolveDefaultProviderCode(siteId?: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (siteId) {
    const { data } = await supabaseAdmin
      .from("payment_providers")
      .select("code")
      .eq("site_id", siteId)
      .eq("is_default", true)
      .eq("is_enabled", true)
      .maybeSingle();
    if (data?.code) return data.code;
  }

  const { data } = await supabaseAdmin
    .from("payment_providers")
    .select("code")
    .is("site_id", null)
    .eq("is_default", true)
    .eq("is_enabled", true)
    .maybeSingle();
  return data?.code ?? "mock";
}

export async function isProviderConfigured(code: ProviderCode, siteId?: string): Promise<boolean> {
  if (code === "manual" || code === "wallet") return true;
  const cfg = await loadProviderConfig(code, siteId);
  if (cfg?.secret_key || cfg?.api_key) return true;
  if (code === "stripe") return Boolean(process.env.STRIPE_SECRET_KEY);
  if (code === "paddle") return Boolean(process.env.PADDLE_API_KEY);
  return false;
}
