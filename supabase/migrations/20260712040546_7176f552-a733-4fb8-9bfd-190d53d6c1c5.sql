
-- ============================================================
-- Phase 1B: Projects layer hardening — non-financial only
-- ============================================================

-- 1) financial_metrics_updated_at + cache comments
ALTER TABLE public.hn_projects
  ADD COLUMN IF NOT EXISTS financial_metrics_updated_at timestamptz;

COMMENT ON COLUMN public.hn_projects.mrr_cached IS
  'Cache only. Do not treat as source of truth. Recompute from subscriptions/payments; update financial_metrics_updated_at on refresh.';
COMMENT ON COLUMN public.hn_projects.arr_cached IS
  'Cache only. Do not treat as source of truth. Recompute from subscriptions/payments; update financial_metrics_updated_at on refresh.';
COMMENT ON COLUMN public.hn_projects.financial_metrics_updated_at IS
  'Timestamp of the last successful mrr_cached / arr_cached recomputation.';

-- 2) project_settings
CREATE TABLE IF NOT EXISTS public.project_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.hn_projects(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Africa/Casablanca',
  locale text NOT NULL DEFAULT 'ar',
  tax_id text,
  legal_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  invoice_prefix text,
  invoice_footer text,
  notification_emails text[] NOT NULL DEFAULT '{}',
  ai_support_enabled boolean NOT NULL DEFAULT false,
  default_webhook_url text,
  webhook_signing_algo text NOT NULL DEFAULT 'hmac_sha256'
    CHECK (webhook_signing_algo IN ('hmac_sha256','hmac_sha512','none')),
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_settings_project ON public.project_settings(project_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_settings TO authenticated;
GRANT ALL ON public.project_settings TO service_role;
ALTER TABLE public.project_settings ENABLE ROW LEVEL SECURITY;

-- Auto-seed one settings row per existing project
INSERT INTO public.project_settings (project_id)
SELECT p.id FROM public.hn_projects p
WHERE NOT EXISTS (SELECT 1 FROM public.project_settings ps WHERE ps.project_id = p.id);

CREATE TRIGGER trg_project_settings_updated_at
  BEFORE UPDATE ON public.project_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3) Refined RLS: hn_projects
DROP POLICY IF EXISTS "hn_projects staff manage" ON public.hn_projects;

CREATE POLICY "hn_projects read owner members staff"
  ON public.hn_projects FOR SELECT TO authenticated
  USING (
    private.is_hnpay_staff(auth.uid())
    OR owner_id = auth.uid()
    OR private.is_project_member(auth.uid(), id)
  );

CREATE POLICY "hn_projects write owner staff"
  ON public.hn_projects FOR INSERT TO authenticated
  WITH CHECK (private.is_hnpay_staff(auth.uid()));

CREATE POLICY "hn_projects update owner staff"
  ON public.hn_projects FOR UPDATE TO authenticated
  USING (private.is_hnpay_staff(auth.uid()) OR owner_id = auth.uid())
  WITH CHECK (private.is_hnpay_staff(auth.uid()) OR owner_id = auth.uid());

CREATE POLICY "hn_projects delete staff"
  ON public.hn_projects FOR DELETE TO authenticated
  USING (private.is_owner(auth.uid()));

-- 4) Refined RLS: project_domains
DROP POLICY IF EXISTS "project_domains staff manage" ON public.project_domains;

CREATE POLICY "project_domains read members"
  ON public.project_domains FOR SELECT TO authenticated
  USING (
    private.is_hnpay_staff(auth.uid())
    OR private.is_project_member(auth.uid(), project_id)
    OR EXISTS (SELECT 1 FROM public.hn_projects p WHERE p.id = project_domains.project_id AND p.owner_id = auth.uid())
  );

CREATE POLICY "project_domains write owner staff"
  ON public.project_domains FOR ALL TO authenticated
  USING (
    private.is_hnpay_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.hn_projects p WHERE p.id = project_domains.project_id AND p.owner_id = auth.uid())
  )
  WITH CHECK (
    private.is_hnpay_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.hn_projects p WHERE p.id = project_domains.project_id AND p.owner_id = auth.uid())
  );

-- 5) RLS: project_settings
CREATE POLICY "project_settings read members"
  ON public.project_settings FOR SELECT TO authenticated
  USING (
    private.is_hnpay_staff(auth.uid())
    OR private.is_project_member(auth.uid(), project_id)
    OR EXISTS (SELECT 1 FROM public.hn_projects p WHERE p.id = project_settings.project_id AND p.owner_id = auth.uid())
  );

CREATE POLICY "project_settings write owner staff"
  ON public.project_settings FOR ALL TO authenticated
  USING (
    private.is_hnpay_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.hn_projects p WHERE p.id = project_settings.project_id AND p.owner_id = auth.uid())
  )
  WITH CHECK (
    private.is_hnpay_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.hn_projects p WHERE p.id = project_settings.project_id AND p.owner_id = auth.uid())
  );
