CREATE TABLE public.wallet_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE DEFAULT 'top_' || encode(extensions.gen_random_bytes(9), 'hex'),
  user_id uuid NOT NULL,
  email text,
  amount numeric(14,2) NOT NULL CHECK (amount > 0 AND amount <= 100000),
  currency text NOT NULL CHECK (currency IN ('EUR','USD','MAD')),
  method text NOT NULL CHECK (method IN ('paypal','youcan_pay','card','bank_transfer')),
  provider text NOT NULL,
  provider_ref text,
  checkout_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','canceled')),
  credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_topups TO authenticated;
GRANT ALL ON public.wallet_topups TO service_role;
ALTER TABLE public.wallet_topups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own topups" ON public.wallet_topups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX wallet_topups_user_idx ON public.wallet_topups(user_id, created_at DESC);