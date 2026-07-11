
CREATE OR REPLACE FUNCTION public.is_hnpay_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner','admin','manager')
  );
$$;

CREATE TABLE public.hn_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  category text,
  primary_domain text,
  status text NOT NULL DEFAULT 'active',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  default_currency text NOT NULL DEFAULT 'USD',
  default_provider_id uuid REFERENCES public.payment_providers(id) ON DELETE SET NULL,
  brand_color text DEFAULT '#f59e0b',
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hn_projects TO authenticated;
GRANT ALL ON public.hn_projects TO service_role;
ALTER TABLE public.hn_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hn_projects staff manage" ON public.hn_projects FOR ALL TO authenticated
  USING (public.is_hnpay_staff(auth.uid())) WITH CHECK (public.is_hnpay_staff(auth.uid()));
CREATE TRIGGER trg_hn_projects_updated BEFORE UPDATE ON public.hn_projects
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.project_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.hn_projects(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,
  domain_type text NOT NULL DEFAULT 'app',
  is_primary boolean NOT NULL DEFAULT false,
  payments_enabled boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'production',
  verification_status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_domains TO authenticated;
GRANT ALL ON public.project_domains TO service_role;
ALTER TABLE public.project_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_domains staff manage" ON public.project_domains FOR ALL TO authenticated
  USING (public.is_hnpay_staff(auth.uid())) WITH CHECK (public.is_hnpay_staff(auth.uid()));
CREATE INDEX idx_project_domains_project ON public.project_domains(project_id);
CREATE TRIGGER trg_project_domains_updated BEFORE UPDATE ON public.project_domains
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.project_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.hn_projects(id) ON DELETE CASCADE,
  public_key text NOT NULL UNIQUE,
  secret_key_hash text NOT NULL,
  environment text NOT NULL DEFAULT 'production',
  status text NOT NULL DEFAULT 'active',
  label text,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_api_keys TO authenticated;
GRANT ALL ON public.project_api_keys TO service_role;
ALTER TABLE public.project_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_api_keys staff manage" ON public.project_api_keys FOR ALL TO authenticated
  USING (public.is_hnpay_staff(auth.uid())) WITH CHECK (public.is_hnpay_staff(auth.uid()));
CREATE TRIGGER trg_project_api_keys_updated BEFORE UPDATE ON public.project_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.project_payment_settings (
  project_id uuid NOT NULL REFERENCES public.hn_projects(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.payment_providers(id) ON DELETE CASCADE,
  checkout_enabled boolean NOT NULL DEFAULT true,
  subscriptions_enabled boolean NOT NULL DEFAULT true,
  invoices_enabled boolean NOT NULL DEFAULT true,
  refunds_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, provider_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_payment_settings TO authenticated;
GRANT ALL ON public.project_payment_settings TO service_role;
ALTER TABLE public.project_payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_payment_settings staff manage" ON public.project_payment_settings FOR ALL TO authenticated
  USING (public.is_hnpay_staff(auth.uid())) WITH CHECK (public.is_hnpay_staff(auth.uid()));
CREATE TRIGGER trg_project_payment_settings_updated BEFORE UPDATE ON public.project_payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
