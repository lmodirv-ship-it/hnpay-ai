
-- ============ 1) sites → project/domain ============
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS domain_id  uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sites_project_id ON public.sites(project_id);
CREATE INDEX IF NOT EXISTS idx_sites_domain_id  ON public.sites(domain_id);

UPDATE public.sites s
SET project_id = pd.project_id, domain_id = pd.id
FROM public.project_domains pd
WHERE s.project_id IS NULL AND lower(s.domain) = lower(pd.domain);

-- ============ 2) plans ============
ALTER TABLE public.plans
  ALTER COLUMN site_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;

ALTER TABLE public.plans ALTER COLUMN provider DROP NOT NULL;
ALTER TABLE public.plans ALTER COLUMN provider DROP DEFAULT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='plans_scope_present') THEN
    ALTER TABLE public.plans
      ADD CONSTRAINT plans_scope_present
      CHECK (site_id IS NOT NULL OR project_id IS NOT NULL OR domain_id IS NOT NULL) NOT VALID;
    ALTER TABLE public.plans VALIDATE CONSTRAINT plans_scope_present;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_plans_project_id ON public.plans(project_id);
CREATE INDEX IF NOT EXISTS idx_plans_domain_id  ON public.plans(domain_id);

-- ============ 3) checkout / customers / payments / subscriptions ============
ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS domain_id  uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS domain_id  uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS domain_id  uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS domain_id  uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ck_sessions_project ON public.checkout_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_ck_sessions_domain  ON public.checkout_sessions(domain_id);
CREATE INDEX IF NOT EXISTS idx_customers_project   ON public.customers(project_id);
CREATE INDEX IF NOT EXISTS idx_customers_domain    ON public.customers(domain_id);
CREATE INDEX IF NOT EXISTS idx_payments_project    ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_domain     ON public.payments(domain_id);
CREATE INDEX IF NOT EXISTS idx_subs_project        ON public.subscriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_subs_domain         ON public.subscriptions(domain_id);

-- ============ 4) products_services: فهارس + توثيق ============
CREATE INDEX IF NOT EXISTS idx_ps_site    ON public.products_services(site_id);
CREATE INDEX IF NOT EXISTS idx_ps_project ON public.products_services(project_id);
CREATE INDEX IF NOT EXISTS idx_ps_domain  ON public.products_services(domain_id);
COMMENT ON COLUMN public.products_services.site_id IS
  'legacy — الأولوية لـ project_id + domain_id. يُملأ فقط للربط مع SDK القديم';

-- ============ 5) دوال RLS المساعدة (تعتمد أدوار موجودة فقط) ============
CREATE OR REPLACE FUNCTION private.is_project_member(_uid uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.hn_projects p ON p.id = _project_id
    WHERE ur.user_id = _uid
      AND (ur.app_id = p.code OR ur.app_id = '*')
      AND ur.role IN ('owner','admin','manager','developer','viewer')
  );
$$;

CREATE OR REPLACE FUNCTION private.site_project(_site_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT project_id FROM public.sites WHERE id = _site_id;
$$;

-- ============ 6) سياسات RLS إضافية (لا نحذف القديمة) ============

-- plans
DROP POLICY IF EXISTS "plans project members read"  ON public.plans;
DROP POLICY IF EXISTS "plans project members write" ON public.plans;
CREATE POLICY "plans project members read" ON public.plans FOR SELECT TO authenticated
USING (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
  OR (site_id    IS NOT NULL AND private.is_project_member(auth.uid(), private.site_project(site_id)))
);
CREATE POLICY "plans project members write" ON public.plans FOR ALL TO authenticated
USING (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
)
WITH CHECK (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
);

-- customers
DROP POLICY IF EXISTS "customers project members read"  ON public.customers;
DROP POLICY IF EXISTS "customers project members write" ON public.customers;
CREATE POLICY "customers project members read" ON public.customers FOR SELECT TO authenticated
USING (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
  OR (site_id    IS NOT NULL AND private.is_project_member(auth.uid(), private.site_project(site_id)))
);
CREATE POLICY "customers project members write" ON public.customers FOR ALL TO authenticated
USING (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
)
WITH CHECK (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
);

-- checkout_sessions
DROP POLICY IF EXISTS "checkouts project members read"  ON public.checkout_sessions;
DROP POLICY IF EXISTS "checkouts project members write" ON public.checkout_sessions;
CREATE POLICY "checkouts project members read" ON public.checkout_sessions FOR SELECT TO authenticated
USING (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
  OR (site_id    IS NOT NULL AND private.is_project_member(auth.uid(), private.site_project(site_id)))
);
CREATE POLICY "checkouts project members write" ON public.checkout_sessions FOR ALL TO authenticated
USING (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
)
WITH CHECK (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
);

-- payments
DROP POLICY IF EXISTS "payments project members read"  ON public.payments;
DROP POLICY IF EXISTS "payments project members write" ON public.payments;
CREATE POLICY "payments project members read" ON public.payments FOR SELECT TO authenticated
USING (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
  OR (site_id    IS NOT NULL AND private.is_project_member(auth.uid(), private.site_project(site_id)))
);
CREATE POLICY "payments project members write" ON public.payments FOR ALL TO authenticated
USING (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
)
WITH CHECK (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
);

-- subscriptions
DROP POLICY IF EXISTS "subs project members read"  ON public.subscriptions;
DROP POLICY IF EXISTS "subs project members write" ON public.subscriptions;
CREATE POLICY "subs project members read" ON public.subscriptions FOR SELECT TO authenticated
USING (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
  OR (site_id    IS NOT NULL AND private.is_project_member(auth.uid(), private.site_project(site_id)))
);
CREATE POLICY "subs project members write" ON public.subscriptions FOR ALL TO authenticated
USING (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
)
WITH CHECK (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
);

-- sites: قراءة لأعضاء المشروع
DROP POLICY IF EXISTS "sites project members read" ON public.sites;
CREATE POLICY "sites project members read" ON public.sites FOR SELECT TO authenticated
USING (
  private.is_owner(auth.uid())
  OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
);
