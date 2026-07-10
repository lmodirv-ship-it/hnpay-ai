
CREATE TABLE IF NOT EXISTS public.payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  display_name text NOT NULL,
  api_key text,
  secret_key text,
  webhook_secret text,
  merchant_id text,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  is_enabled boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  last_tested_at timestamptz,
  last_test_status text,
  last_test_message text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code, environment)
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_providers_one_default
  ON public.payment_providers ((true)) WHERE is_default = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_providers TO authenticated;
GRANT ALL ON public.payment_providers TO service_role;

ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_admins_read_payment_providers"
  ON public.payment_providers FOR SELECT TO authenticated
  USING (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), '*', 'admin'));

CREATE POLICY "owners_admins_write_payment_providers"
  ON public.payment_providers FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), '*', 'admin'))
  WITH CHECK (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), '*', 'admin'));

CREATE TRIGGER payment_providers_set_updated_at
  BEFORE UPDATE ON public.payment_providers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
