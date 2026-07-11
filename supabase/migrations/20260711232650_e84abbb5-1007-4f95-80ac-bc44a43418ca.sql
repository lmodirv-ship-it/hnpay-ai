
CREATE TABLE IF NOT EXISTS public.product_categories (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid REFERENCES public.hn_projects(id) ON DELETE CASCADE,
  parent_id      uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name           text NOT NULL,
  slug           text NOT NULL,
  description    text,
  icon           text,
  color          text DEFAULT '#f59e0b',
  display_order  integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_project ON public.product_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent  ON public.product_categories(parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_categories staff manage"
  ON public.product_categories
  FOR ALL
  TO authenticated
  USING (private.is_hnpay_staff(auth.uid()))
  WITH CHECK (private.is_hnpay_staff(auth.uid()));

CREATE TRIGGER trg_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Link products/services and plans to categories
ALTER TABLE public.products_services
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_services_category ON public.products_services(category_id);

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id  uuid REFERENCES public.hn_projects(id)       ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_plans_category ON public.plans(category_id);
CREATE INDEX IF NOT EXISTS idx_plans_project  ON public.plans(project_id);
