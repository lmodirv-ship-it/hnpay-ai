
ALTER TABLE public.hn_projects
  ADD COLUMN IF NOT EXISTS integration_mode text NOT NULL DEFAULT 'internal_database'
    CHECK (integration_mode IN ('internal_database','external_api','hybrid')),
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'live'
    CHECK (environment IN ('test','live')),
  ADD COLUMN IF NOT EXISTS project_type text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS payments_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS subscriptions_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS invoices_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS api_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS webhooks_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mrr_cached numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS arr_cached numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS connection_status text NOT NULL DEFAULT 'unknown'
    CHECK (connection_status IN ('unknown','connected','degraded','offline')),
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

ALTER TABLE public.catalog_categories      ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL;
ALTER TABLE public.catalog_items           ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL;
ALTER TABLE public.catalog_prices          ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL;
ALTER TABLE public.catalog_item_providers  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL;
ALTER TABLE public.payment_providers       ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL;
ALTER TABLE public.webhook_events          ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL;
ALTER TABLE public.site_api_keys           ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL;
ALTER TABLE public.portal_tokens           ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL;

UPDATE public.catalog_categories t     SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;
UPDATE public.catalog_items t          SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;
UPDATE public.catalog_prices t         SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;
UPDATE public.catalog_item_providers t SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;
UPDATE public.payment_providers t      SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;
UPDATE public.webhook_events t         SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;
UPDATE public.site_api_keys t          SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;
UPDATE public.portal_tokens t          SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;

UPDATE public.customers t         SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;
UPDATE public.checkout_sessions t SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;
UPDATE public.payments t          SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;
UPDATE public.subscriptions t     SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;
UPDATE public.plans t             SET project_id = s.project_id FROM public.sites s WHERE t.site_id = s.id AND t.project_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_items_project      ON public.catalog_items(project_id);
CREATE INDEX IF NOT EXISTS idx_catalog_prices_project     ON public.catalog_prices(project_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_project ON public.catalog_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_providers_project  ON public.payment_providers(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_project           ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_project  ON public.checkout_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_project      ON public.subscriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_customers_project          ON public.customers(project_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_project     ON public.webhook_events(project_id);
CREATE INDEX IF NOT EXISTS idx_site_api_keys_project      ON public.site_api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_plans_project              ON public.plans(project_id);

CREATE OR REPLACE FUNCTION public.user_can_access_project(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.hn_projects p
      WHERE p.id = _project_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text IN ('owner','admin','finance_manager','accountant','hn_pay_admin','group_owner','manager','project_owner','project_manager')
    );
$$;

REVOKE EXECUTE ON FUNCTION public.user_can_access_project(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_access_project(uuid) TO authenticated;
