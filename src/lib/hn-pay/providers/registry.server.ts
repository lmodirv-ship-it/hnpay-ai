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

export function isProviderConfigured(code: ProviderCode): boolean {
  if (code === "manual") return true;
  if (code === "stripe") return Boolean(process.env.STRIPE_SECRET_KEY);
  return false;
}
