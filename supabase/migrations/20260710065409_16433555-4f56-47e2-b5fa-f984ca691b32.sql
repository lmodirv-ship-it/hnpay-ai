
-- Add provider abstraction so HN-PAY can support Stripe / PayPal / CMI / Payzone
ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS provider_session_id text,
  ADD COLUMN IF NOT EXISTS provider_checkout_url text;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS provider_customer_id text;

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS provider_price_id text,
  ADD COLUMN IF NOT EXISTS provider_product_id text;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS provider_subscription_id text;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS provider_payment_id text,
  ADD COLUMN IF NOT EXISTS provider_invoice_id text;

-- Inbound provider event idempotency (Stripe/etc → HN-PAY)
CREATE TABLE IF NOT EXISTS public.provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);

GRANT SELECT ON public.provider_events TO authenticated;
GRANT ALL ON public.provider_events TO service_role;

ALTER TABLE public.provider_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read provider events"
  ON public.provider_events
  FOR SELECT
  TO authenticated
  USING (is_owner(auth.uid()));

-- Customer portal tokens (short-lived, for /portal/:token)
CREATE TABLE IF NOT EXISTS public.portal_tokens (
  token text PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.portal_tokens TO anon, authenticated;
GRANT ALL ON public.portal_tokens TO service_role;

ALTER TABLE public.portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read a portal token by id"
  ON public.portal_tokens
  FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS portal_tokens_customer_idx ON public.portal_tokens(customer_id);

-- Add unique constraint on customers(site_id, external_id) for upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_site_external_key'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_site_external_key UNIQUE (site_id, external_id);
  END IF;
END $$;
