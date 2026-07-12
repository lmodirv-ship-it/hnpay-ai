
-- ============================================================
-- Phase 1 — Central Catalog (Catalog v1) for HN-PAY
-- Reuses public.sites as the master site table.
-- No existing table/column is dropped or renamed.
-- ============================================================

-- ---------- 1) catalog_categories ----------
CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  parent_id       uuid REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
  name_ar         text NOT NULL,
  name_en         text,
  code            text NOT NULL,
  description_ar  text,
  description_en  text,
  icon            text,
  display_order   integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_categories_site_code_key UNIQUE (site_id, code)
);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_site   ON public.catalog_categories(site_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_parent ON public.catalog_categories(parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_categories TO authenticated;
GRANT SELECT ON public.catalog_categories TO anon;
GRANT ALL ON public.catalog_categories TO service_role;

-- ---------- 2) catalog_items ----------
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id                uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  category_id            uuid REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
  item_code              text NOT NULL,
  item_type              text NOT NULL,
  name_ar                text NOT NULL,
  name_en                text,
  slug                   text,
  short_description_ar   text,
  short_description_en   text,
  description_ar         text,
  description_en         text,
  image_url              text,
  status                 text NOT NULL DEFAULT 'draft',
  is_public              boolean NOT NULL DEFAULT true,
  requires_approval      boolean NOT NULL DEFAULT false,
  metadata               jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_items_site_code_key UNIQUE (site_id, item_code),
  CONSTRAINT catalog_items_site_slug_key UNIQUE (site_id, slug),
  CONSTRAINT catalog_items_type_chk CHECK (item_type IN (
    'product','service','subscription','course','booking','storage',
    'hosting','maintenance','license','api_access','usage_based'
  )),
  CONSTRAINT catalog_items_status_chk CHECK (status IN ('draft','active','hidden','archived'))
);
CREATE INDEX IF NOT EXISTS idx_catalog_items_site      ON public.catalog_items(site_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_category  ON public.catalog_items(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_type      ON public.catalog_items(item_type);
CREATE INDEX IF NOT EXISTS idx_catalog_items_status    ON public.catalog_items(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;
GRANT SELECT ON public.catalog_items TO anon;
GRANT ALL ON public.catalog_items TO service_role;

-- ---------- 3) catalog_prices ----------
CREATE TABLE IF NOT EXISTS public.catalog_prices (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id  uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  site_id          uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  price_code       text NOT NULL,
  name_ar          text,
  name_en          text,
  billing_type     text NOT NULL,
  amount           numeric(14,2),
  currency         text NOT NULL DEFAULT 'MAD',
  billing_interval text,
  interval_count   integer NOT NULL DEFAULT 1,
  trial_days       integer NOT NULL DEFAULT 0,
  setup_fee        numeric(14,2) NOT NULL DEFAULT 0,
  tax_behavior     text NOT NULL DEFAULT 'exclusive',
  tax_rate         numeric(6,3) NOT NULL DEFAULT 0,
  minimum_quantity integer NOT NULL DEFAULT 1,
  maximum_quantity integer,
  is_default       boolean NOT NULL DEFAULT false,
  is_active        boolean NOT NULL DEFAULT true,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_prices_site_code_key UNIQUE (site_id, price_code),
  CONSTRAINT catalog_prices_billing_type_chk CHECK (billing_type IN ('one_time','recurring','usage_based','free','custom')),
  CONSTRAINT catalog_prices_interval_chk    CHECK (billing_interval IS NULL OR billing_interval IN ('day','week','month','quarter','year')),
  CONSTRAINT catalog_prices_tax_behavior_chk CHECK (tax_behavior IN ('inclusive','exclusive','exempt'))
);
CREATE INDEX IF NOT EXISTS idx_catalog_prices_item     ON public.catalog_prices(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_catalog_prices_site     ON public.catalog_prices(site_id);
CREATE INDEX IF NOT EXISTS idx_catalog_prices_billing  ON public.catalog_prices(billing_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_prices TO authenticated;
GRANT SELECT ON public.catalog_prices TO anon;
GRANT ALL ON public.catalog_prices TO service_role;

-- ---------- 4) catalog_features ----------
CREATE TABLE IF NOT EXISTS public.catalog_features (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id  uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  feature_key      text,
  name_ar          text NOT NULL,
  name_en          text,
  value_text       text,
  value_number     numeric,
  included         boolean NOT NULL DEFAULT true,
  display_order    integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_catalog_features_item ON public.catalog_features(catalog_item_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_features TO authenticated;
GRANT SELECT ON public.catalog_features TO anon;
GRANT ALL ON public.catalog_features TO service_role;

-- ---------- 5) catalog_item_providers ----------
CREATE TABLE IF NOT EXISTS public.catalog_item_providers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id  uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  provider_id      uuid NOT NULL REFERENCES public.payment_providers(id) ON DELETE CASCADE,
  site_id          uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  is_enabled       boolean NOT NULL DEFAULT true,
  is_default       boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_item_providers_uniq UNIQUE (catalog_item_id, provider_id)
);
CREATE INDEX IF NOT EXISTS idx_catalog_item_providers_item ON public.catalog_item_providers(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_catalog_item_providers_prov ON public.catalog_item_providers(provider_id);
CREATE INDEX IF NOT EXISTS idx_catalog_item_providers_site ON public.catalog_item_providers(site_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_item_providers TO authenticated;
GRANT ALL ON public.catalog_item_providers TO service_role;

-- ---------- 6) plans ← ربط اختياري بالكتالوج ----------
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS catalog_item_id  uuid REFERENCES public.catalog_items(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS catalog_price_id uuid REFERENCES public.catalog_prices(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_plans_catalog_item  ON public.plans(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_plans_catalog_price ON public.plans(catalog_price_id);

-- ---------- 7) updated_at triggers (تُعيد استخدام tg_set_updated_at الموجودة) ----------
DROP TRIGGER IF EXISTS trg_catalog_categories_updated_at    ON public.catalog_categories;
DROP TRIGGER IF EXISTS trg_catalog_items_updated_at         ON public.catalog_items;
DROP TRIGGER IF EXISTS trg_catalog_prices_updated_at        ON public.catalog_prices;
DROP TRIGGER IF EXISTS trg_catalog_features_updated_at      ON public.catalog_features;
DROP TRIGGER IF EXISTS trg_catalog_item_providers_updated_at ON public.catalog_item_providers;

CREATE TRIGGER trg_catalog_categories_updated_at
  BEFORE UPDATE ON public.catalog_categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_catalog_items_updated_at
  BEFORE UPDATE ON public.catalog_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_catalog_prices_updated_at
  BEFORE UPDATE ON public.catalog_prices
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_catalog_features_updated_at
  BEFORE UPDATE ON public.catalog_features
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_catalog_item_providers_updated_at
  BEFORE UPDATE ON public.catalog_item_providers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- 8) RLS ----------
ALTER TABLE public.catalog_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_prices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_features        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_item_providers  ENABLE ROW LEVEL SECURITY;

-- helper: does the current user belong to the project owning this site?
CREATE OR REPLACE FUNCTION private.site_is_project_member(_uid uuid, _site_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sites s
    LEFT JOIN public.hn_projects p ON p.id = s.project_id
    LEFT JOIN public.user_roles ur ON ur.user_id = _uid
    WHERE s.id = _site_id
      AND (
        (p.id IS NOT NULL AND (ur.app_id = p.code OR ur.app_id = '*')
                          AND ur.role IN ('owner','admin','manager','developer','viewer'))
      )
  );
$$;

-- catalog_categories
CREATE POLICY "cat_cats_public_read" ON public.catalog_categories
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "cat_cats_staff_all" ON public.catalog_categories
  FOR ALL TO authenticated
  USING (private.is_owner(auth.uid()) OR private.is_hnpay_staff(auth.uid())
         OR private.site_is_project_member(auth.uid(), site_id))
  WITH CHECK (private.is_owner(auth.uid()) OR private.is_hnpay_staff(auth.uid())
              OR private.site_is_project_member(auth.uid(), site_id));

-- catalog_items
CREATE POLICY "cat_items_public_read" ON public.catalog_items
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND is_public = true);
CREATE POLICY "cat_items_staff_all" ON public.catalog_items
  FOR ALL TO authenticated
  USING (private.is_owner(auth.uid()) OR private.is_hnpay_staff(auth.uid())
         OR private.site_is_project_member(auth.uid(), site_id))
  WITH CHECK (private.is_owner(auth.uid()) OR private.is_hnpay_staff(auth.uid())
              OR private.site_is_project_member(auth.uid(), site_id));

-- catalog_prices
CREATE POLICY "cat_prices_public_read" ON public.catalog_prices
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.catalog_items ci
    WHERE ci.id = catalog_prices.catalog_item_id
      AND ci.status = 'active' AND ci.is_public = true
  ));
CREATE POLICY "cat_prices_staff_all" ON public.catalog_prices
  FOR ALL TO authenticated
  USING (private.is_owner(auth.uid()) OR private.is_hnpay_staff(auth.uid())
         OR private.site_is_project_member(auth.uid(), site_id))
  WITH CHECK (private.is_owner(auth.uid()) OR private.is_hnpay_staff(auth.uid())
              OR private.site_is_project_member(auth.uid(), site_id));

-- catalog_features
CREATE POLICY "cat_features_public_read" ON public.catalog_features
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.catalog_items ci
    WHERE ci.id = catalog_features.catalog_item_id
      AND ci.status = 'active' AND ci.is_public = true
  ));
CREATE POLICY "cat_features_staff_all" ON public.catalog_features
  FOR ALL TO authenticated
  USING (private.is_owner(auth.uid()) OR private.is_hnpay_staff(auth.uid())
         OR EXISTS (SELECT 1 FROM public.catalog_items ci
                    WHERE ci.id = catalog_features.catalog_item_id
                      AND private.site_is_project_member(auth.uid(), ci.site_id)))
  WITH CHECK (private.is_owner(auth.uid()) OR private.is_hnpay_staff(auth.uid())
              OR EXISTS (SELECT 1 FROM public.catalog_items ci
                         WHERE ci.id = catalog_features.catalog_item_id
                           AND private.site_is_project_member(auth.uid(), ci.site_id)));

-- catalog_item_providers (خاص بالطاقم فقط، ليس عاماً)
CREATE POLICY "cat_item_providers_staff_all" ON public.catalog_item_providers
  FOR ALL TO authenticated
  USING (private.is_owner(auth.uid()) OR private.is_hnpay_staff(auth.uid())
         OR private.site_is_project_member(auth.uid(), site_id))
  WITH CHECK (private.is_owner(auth.uid()) OR private.is_hnpay_staff(auth.uid())
              OR private.site_is_project_member(auth.uid(), site_id));
