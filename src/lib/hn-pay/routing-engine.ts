// Smart Payment Routing (S-Pay Engine) — pure, isomorphic logic.

export type RoutingRule = {
  id?: string;
  priority: number;
  name?: string | null;
  condition_country: string | null;
  condition_currency: string | null;
  condition_app_category: string | null;
  primary_provider: string;
  fallback_provider: string | null;
  is_active: boolean;
};

export type RoutingContext = {
  country?: string | null;
  currency?: string | null;
  appCategory?: string | null;
  /** Providers allowed for this site; if empty, all are allowed. */
  allowed?: string[];
};

export type RoutingDecision = {
  primary: string;
  fallbacks: string[];
  ruleId: string | null;
  ruleName: string | null;
};

/** Final safety net required by spec: 1-click fallback to PayPal. */
export const UNIVERSAL_FALLBACK = "paypal";

export const DEFAULT_RULES: RoutingRule[] = [
  { priority: 10, name: "Morocco by currency", condition_country: null, condition_currency: "MAD", condition_app_category: null, primary_provider: "youcan_pay", fallback_provider: "cmi", is_active: true },
  { priority: 20, name: "Morocco by country", condition_country: "MA", condition_currency: null, condition_app_category: null, primary_provider: "youcan_pay", fallback_provider: "manual", is_active: true },
  { priority: 30, name: "Global SaaS / AI", condition_country: null, condition_currency: null, condition_app_category: "SaaS_AI", primary_provider: "paypal", fallback_provider: "lemon_squeezy", is_active: true },
  { priority: 40, name: "International cards", condition_country: null, condition_currency: null, condition_app_category: null, primary_provider: "stripe", fallback_provider: "paypal", is_active: true },
];

const eq = (a?: string | null, b?: string | null) => (a ?? "").toUpperCase() === (b ?? "").toUpperCase();

export function ruleMatches(rule: RoutingRule, ctx: RoutingContext): boolean {
  if (!rule.is_active) return false;
  if (rule.condition_country && !eq(rule.condition_country, ctx.country)) return false;
  if (rule.condition_currency && !eq(rule.condition_currency, ctx.currency)) return false;
  if (rule.condition_app_category && !eq(rule.condition_app_category, ctx.appCategory)) return false;
  return true;
}

export function routePayment(ctx: RoutingContext, rules: RoutingRule[] = DEFAULT_RULES): RoutingDecision {
  const allowed = ctx.allowed && ctx.allowed.length ? ctx.allowed : null;
  const ok = (p: string | null | undefined): p is string => !!p && (!allowed || allowed.includes(p));
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of sorted) {
    if (!ruleMatches(rule, ctx)) continue;
    const chain = [rule.primary_provider, rule.fallback_provider, UNIVERSAL_FALLBACK].filter(ok);
    const uniq = Array.from(new Set(chain));
    if (uniq.length === 0) continue;
    return { primary: uniq[0], fallbacks: uniq.slice(1), ruleId: rule.id ?? null, ruleName: rule.name ?? null };
  }
  const primary = ok(UNIVERSAL_FALLBACK) ? UNIVERSAL_FALLBACK : (allowed?.[0] ?? UNIVERSAL_FALLBACK);
  return { primary, fallbacks: [], ruleId: null, ruleName: null };
}
