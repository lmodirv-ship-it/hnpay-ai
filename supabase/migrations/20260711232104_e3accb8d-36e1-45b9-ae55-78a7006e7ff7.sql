
CREATE SEQUENCE IF NOT EXISTS public.products_services_code_seq START 1;

CREATE TABLE IF NOT EXISTS public.products_services (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code          text NOT NULL UNIQUE DEFAULT ('HNP-' || lpad(nextval('public.products_services_code_seq')::text, 6, '0')),
  project_id            uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL,
  site_id               uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  name                  text NOT NULL,
  slug                  text,
  description           text,
  image_url             text,
  type                  text NOT NULL DEFAULT 'product',
  category              text,
  tags                  text[] NOT NULL DEFAULT '{}',
  billing_type          text NOT NULL DEFAULT 'one_time',
  price                 numeric(14,2) NOT NULL DEFAULT 0,
  currency              text NOT NULL DEFAULT 'MAD',
  tax_rate              numeric(5,2) NOT NULL DEFAULT 0,
  setup_fee             numeric(14,2) NOT NULL DEFAULT 0,
  trial_days            integer NOT NULL DEFAULT 0,
  subscription_interval text,
  status                text NOT NULL DEFAULT 'active',
  allowed_providers     text[] NOT NULL DEFAULT '{}',
  is_taxable            boolean NOT NULL DEFAULT false,
  is_renewable          boolean NOT NULL DEFAULT false,
  requires_approval     boolean NOT NULL DEFAULT false,
  visible_in_store      boolean NOT NULL DEFAULT true,
  display_order         integer NOT NULL DEFAULT 0,
  keywords              text,
  sales_count           integer NOT NULL DEFAULT 0,
  customers_count       integer NOT NULL DEFAULT 0,
  total_revenue         numeric(14,2) NOT NULL DEFAULT 0,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_services_project ON public.products_services(project_id);
CREATE INDEX IF NOT EXISTS idx_products_services_status  ON public.products_services(status);
CREATE INDEX IF NOT EXISTS idx_products_services_type    ON public.products_services(type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products_services TO authenticated;
GRANT ALL ON public.products_services TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.products_services_code_seq TO authenticated;
GRANT ALL ON SEQUENCE public.products_services_code_seq TO service_role;

ALTER TABLE public.products_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_services staff manage"
  ON public.products_services
  FOR ALL
  TO authenticated
  USING (private.is_hnpay_staff(auth.uid()))
  WITH CHECK (private.is_hnpay_staff(auth.uid()));

CREATE TRIGGER trg_products_services_updated_at
  BEFORE UPDATE ON public.products_services
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
