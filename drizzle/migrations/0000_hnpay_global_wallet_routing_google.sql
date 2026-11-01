-- 1. Consumer wallets
CREATE TABLE IF NOT EXISTS public.consumer_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  balance_eur numeric(14,2) NOT NULL DEFAULT 0,
  balance_usd numeric(14,2) NOT NULL DEFAULT 0,
  balance_mad numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consumer_wallets_non_negative CHECK (balance_eur >= 0 AND balance_usd >= 0 AND balance_mad >= 0)
);
GRANT SELECT ON public.consumer_wallets TO authenticated;
GRANT ALL ON public.consumer_wallets TO service_role;
ALTER TABLE public.consumer_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallets_owner_read ON public.consumer_wallets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_hnpay_staff(auth.uid()));
CREATE TRIGGER trg_consumer_wallets_updated_at BEFORE UPDATE ON public.consumer_wallets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2. Wallet transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.consumer_wallets(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('topup','spend','refund','bonus')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL CHECK (currency IN ('EUR','USD','MAD')),
  source_site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON public.wallet_transactions(wallet_id, created_at DESC);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallet_tx_owner_read ON public.wallet_transactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.consumer_wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid())
         OR private.is_hnpay_staff(auth.uid()));

-- Atomic wallet movement (server-side only)
CREATE OR REPLACE FUNCTION public.wallet_apply(_user_id uuid, _email text, _type text, _amount numeric, _currency text, _site_id uuid, _reference text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.consumer_wallets; sign int; col text; tx uuid;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
  IF _currency NOT IN ('EUR','USD','MAD') THEN RAISE EXCEPTION 'unsupported currency'; END IF;
  sign := CASE WHEN _type = 'spend' THEN -1 ELSE 1 END;
  INSERT INTO public.consumer_wallets(user_id, email) VALUES (_user_id, _email)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO w FROM public.consumer_wallets WHERE user_id = _user_id FOR UPDATE;
  col := 'balance_' || lower(_currency);
  EXECUTE format('UPDATE public.consumer_wallets SET %I = %I + $1 WHERE id = $2', col, col) USING sign * _amount, w.id;
  INSERT INTO public.wallet_transactions(wallet_id, type, amount, currency, source_site_id, reference)
    VALUES (w.id, _type, _amount, _currency, _site_id, _reference) RETURNING id INTO tx;
  RETURN tx;
END $$;
REVOKE ALL ON FUNCTION public.wallet_apply(uuid,text,text,numeric,text,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_apply(uuid,text,text,numeric,text,uuid,text) TO service_role;

-- 3. Routing rules
CREATE TABLE IF NOT EXISTS public.routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  priority integer NOT NULL DEFAULT 100,
  name text,
  condition_country text,
  condition_currency text,
  condition_app_category text,
  primary_provider text NOT NULL,
  fallback_provider text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routing_rules TO authenticated;
GRANT ALL ON public.routing_rules TO service_role;
ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY routing_staff_all ON public.routing_rules FOR ALL TO authenticated
  USING (private.is_hnpay_staff(auth.uid())) WITH CHECK (private.is_hnpay_staff(auth.uid()));
CREATE TRIGGER trg_routing_rules_updated_at BEFORE UPDATE ON public.routing_rules
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.routing_rules(priority, name, condition_country, condition_currency, condition_app_category, primary_provider, fallback_provider) VALUES
 (10, 'Morocco by currency', NULL, 'MAD', NULL, 'youcan_pay', 'cmi'),
 (20, 'Morocco by country', 'MA', NULL, NULL, 'youcan_pay', 'manual'),
 (30, 'Global SaaS / AI', NULL, NULL, 'SaaS_AI', 'paypal', 'lemon_squeezy'),
 (40, 'International cards', NULL, NULL, NULL, 'stripe', 'paypal');

-- 4. Google sync events
CREATE TABLE IF NOT EXISTS public.google_sync_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  sync_status text NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','failed')),
  google_destination text NOT NULL CHECK (google_destination IN ('firestore','bigquery','ga4','sheets')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_google_sync_pending ON public.google_sync_events(sync_status, created_at);
GRANT SELECT ON public.google_sync_events TO authenticated;
GRANT ALL ON public.google_sync_events TO service_role;
ALTER TABLE public.google_sync_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY google_sync_staff_read ON public.google_sync_events FOR SELECT TO authenticated
  USING (private.is_hnpay_staff(auth.uid()));

-- 5. Site merchant fields
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS google_analytics_id text,
  ADD COLUMN IF NOT EXISTS adsense_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS adsense_publisher_id text DEFAULT 'pub-3443455318197857',
  ADD COLUMN IF NOT EXISTS allowed_providers text[] NOT NULL DEFAULT ARRAY['paypal','google_pay','stripe','youcan_pay','cmi','wallet','manual']::text[];