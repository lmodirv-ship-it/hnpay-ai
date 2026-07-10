import { manualProvider } from "./manual.server";
import { stripeProvider } from "./stripe.server";
import { mockProvider } from "./mock.server";
import type { PaymentProvider, ProviderCode } from "./types";

const REGISTRY: Record<string, PaymentProvider> = {
  manual: manualProvider,
  stripe: stripeProvider,
  mock: mockProvider,
};

export function getProvider(code: string): PaymentProvider {
  const p = REGISTRY[code];
  if (!p) throw new Error(`Unknown payment provider: ${code}`);
  return p;
}

export function listAllProviders(): PaymentProvider[] {
  return Object.values(REGISTRY);
}

/**
 * Resolves provider credentials from the payment_providers table (owner-managed).
 * Falls back to env vars for backwards compatibility.
 */
export async function loadProviderConfig(code: string): Promise<{
  api_key: string | null;
  secret_key: string | null;
  webhook_secret: string | null;
  merchant_id: string | null;
  environment: "sandbox" | "production";
} | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("payment_providers")
    .select("api_key, secret_key, webhook_secret, merchant_id, environment, is_enabled")
    .eq("code", code)
    .eq("is_enabled", true)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    api_key: data.api_key,
    secret_key: data.secret_key,
    webhook_secret: data.webhook_secret,
    merchant_id: data.merchant_id,
    environment: (data.environment as "sandbox" | "production") ?? "sandbox",
  };
}

export async function resolveDefaultProviderCode(): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("payment_providers")
    .select("code")
    .eq("is_default", true)
    .eq("is_enabled", true)
    .maybeSingle();
  return data?.code ?? "mock";
}

export async function isProviderConfigured(code: ProviderCode): Promise<boolean> {
  if (code === "manual") return true;
  const cfg = await loadProviderConfig(code);
  if (cfg?.secret_key || cfg?.api_key) return true;
  if (code === "stripe") return Boolean(process.env.STRIPE_SECRET_KEY);
  return false;
}
