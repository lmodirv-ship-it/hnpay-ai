
-- ============================================================
-- HN-PAY CORE: sites, plans, customers, checkout, payments, subs
-- ============================================================

-- 1) SITES: each of your 140+ apps registers here
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  webhook_url TEXT,
  webhook_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  logo_url TEXT,
  brand_color TEXT DEFAULT '#f59e0b',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO authenticated;
GRANT ALL ON public.sites TO service_role;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage sites" ON public.sites
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));
CREATE POLICY "Site creators read own" ON public.sites
  FOR SELECT TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER sites_updated_at BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2) SITE API KEYS: one or more keys per site (store hash only)
CREATE TABLE public.site_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'default',
  key_prefix TEXT NOT NULL,          -- first 12 chars for display
  key_hash TEXT NOT NULL UNIQUE,     -- sha256 hex of full key
  mode TEXT NOT NULL DEFAULT 'live', -- live | test
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_api_keys TO authenticated;
GRANT ALL ON public.site_api_keys TO service_role;
ALTER TABLE public.site_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage api keys" ON public.site_api_keys
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));
CREATE INDEX site_api_keys_site_idx ON public.site_api_keys(site_id);
CREATE INDEX site_api_keys_hash_idx ON public.site_api_keys(key_hash) WHERE revoked_at IS NULL;

-- 3) PLANS: subscription tiers per site
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_interval TEXT,             -- month | year | one_time | null
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT SELECT ON public.plans TO anon;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active plans" ON public.plans
  FOR SELECT USING (is_active = true);
CREATE POLICY "Owners manage plans" ON public.plans
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));
CREATE TRIGGER plans_updated_at BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4) CUSTOMERS: end-users per site (external_id = site's own user id)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,         -- the ID the site uses for this user
  email TEXT,
  name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage customers" ON public.customers
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));
CREATE INDEX customers_site_idx ON public.customers(site_id);
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5) CHECKOUT SESSIONS: short-lived payment intents
CREATE TABLE public.checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE NOT NULL DEFAULT ('chk_' || encode(gen_random_bytes(9), 'hex')),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  customer_external_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  amount NUMERIC(12,2) NOT NULL,     -- snapshotted from plan
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | succeeded | failed | expired | canceled
  success_url TEXT,
  cancel_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.checkout_sessions TO authenticated;
GRANT SELECT ON public.checkout_sessions TO anon;  -- checkout page reads by public_id
GRANT ALL ON public.checkout_sessions TO service_role;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads checkout by public id" ON public.checkout_sessions
  FOR SELECT USING (true);  -- safe: public_id is unguessable, no card data stored
CREATE POLICY "Owners manage checkouts" ON public.checkout_sessions
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));
CREATE INDEX checkout_sessions_site_idx ON public.checkout_sessions(site_id);
CREATE INDEX checkout_sessions_public_idx ON public.checkout_sessions(public_id);
CREATE TRIGGER checkout_sessions_updated_at BEFORE UPDATE ON public.checkout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 6) PAYMENTS: confirmed transactions
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE NOT NULL DEFAULT ('pay_' || encode(gen_random_bytes(9), 'hex')),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  checkout_session_id UUID REFERENCES public.checkout_sessions(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.plans(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'succeeded', -- succeeded | failed | refunded | pending
  provider TEXT,                     -- stripe | paddle | manual | test
  provider_ref TEXT,                 -- gateway transaction id
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));
CREATE INDEX payments_site_idx ON public.payments(site_id);
CREATE INDEX payments_created_idx ON public.payments(created_at DESC);

-- 7) SUBSCRIPTIONS: active recurring billing
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE NOT NULL DEFAULT ('sub_' || encode(gen_random_bytes(9), 'hex')),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active', -- active | past_due | canceled | expired | trialing
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));
CREATE INDEX subscriptions_site_idx ON public.subscriptions(site_id);
CREATE INDEX subscriptions_customer_idx ON public.subscriptions(customer_id);
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 8) WEBHOOK EVENTS: outgoing events queue to sites
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE NOT NULL DEFAULT ('evt_' || encode(gen_random_bytes(9), 'hex')),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- payment.succeeded, subscription.created, etc.
  payload JSONB NOT NULL,
  delivered BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  last_response_status INTEGER,
  last_response_body TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.webhook_events TO authenticated;
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage webhook events" ON public.webhook_events
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));
CREATE INDEX webhook_events_site_idx ON public.webhook_events(site_id);
CREATE INDEX webhook_events_pending_idx ON public.webhook_events(created_at) WHERE delivered = false;

-- 9) PROCESSED WEBHOOK EVENTS: idempotency for INBOUND events (from gateways)
CREATE TABLE public.processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,      -- 'stripe', 'paddle', ...
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.processed_webhook_events TO authenticated;
GRANT ALL ON public.processed_webhook_events TO service_role;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read processed events" ON public.processed_webhook_events
  FOR SELECT TO authenticated USING (public.is_owner(auth.uid()));
