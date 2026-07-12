ALTER TABLE public.payment_providers
  ADD COLUMN site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
  ADD COLUMN public_key text,
  ADD COLUMN supported_countries text[] NOT NULL DEFAULT '{}',
  ADD COLUMN supported_currencies text[] NOT NULL DEFAULT '{}',
  ADD COLUMN fee_percent numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN fee_fixed numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN tax_mode text NOT NULL DEFAULT 'automatic' CHECK (tax_mode IN ('automatic','manual','none'));

ALTER TABLE public.sites
  ADD COLUMN default_provider_id uuid REFERENCES public.payment_providers(id) ON DELETE SET NULL;

ALTER TABLE public.payment_providers DROP CONSTRAINT payment_providers_code_environment_key;
CREATE UNIQUE INDEX payment_providers_site_code_env_unique ON public.payment_providers(site_id, code, environment);

DROP POLICY IF EXISTS "owners_admins_read_payment_providers" ON public.payment_providers;
DROP POLICY IF EXISTS "owners_admins_write_payment_providers" ON public.payment_providers;

CREATE POLICY "payment_providers_read_for_owners_and_site_managers"
  ON public.payment_providers FOR SELECT
  TO authenticated
  USING (
    site_id IS NULL AND (private.is_owner(auth.uid()) OR private.has_role(auth.uid(), '*', 'admin'))
    OR site_id IS NOT NULL AND private.site_can_read(auth.uid(), site_id)
  );

CREATE POLICY "payment_providers_write_for_owners_and_site_managers"
  ON public.payment_providers FOR ALL
  TO authenticated
  USING (
    site_id IS NULL AND (private.is_owner(auth.uid()) OR private.has_role(auth.uid(), '*', 'admin'))
    OR site_id IS NOT NULL AND private.site_can_manage(auth.uid(), site_id)
  )
  WITH CHECK (
    site_id IS NULL AND (private.is_owner(auth.uid()) OR private.has_role(auth.uid(), '*', 'admin'))
    OR site_id IS NOT NULL AND private.site_can_manage(auth.uid(), site_id)
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_providers TO authenticated;
GRANT ALL ON public.payment_providers TO service_role;