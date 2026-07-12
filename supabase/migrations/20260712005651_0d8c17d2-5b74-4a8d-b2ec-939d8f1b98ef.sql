
-- 1. Sites integration fields
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS integration_mode text NOT NULL DEFAULT 'internal_database',
  ADD COLUMN IF NOT EXISTS api_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS webhook_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS database_access boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allowed_origins text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_connection_at timestamptz,
  ADD COLUMN IF NOT EXISTS integration_status text NOT NULL DEFAULT 'pending';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sites_integration_mode_chk') THEN
    ALTER TABLE public.sites ADD CONSTRAINT sites_integration_mode_chk
      CHECK (integration_mode IN ('internal_database','external_api','hybrid'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sites_environment_chk') THEN
    ALTER TABLE public.sites ADD CONSTRAINT sites_environment_chk
      CHECK (environment IN ('test','live'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sites_integration_status_chk') THEN
    ALTER TABLE public.sites ADD CONSTRAINT sites_integration_status_chk
      CHECK (integration_status IN ('connected','disconnected','degraded','pending'));
  END IF;
END $$;

-- 2. Helper functions
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_group_owner(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role = 'owner' AND app_id IN ('*','HN-HUB')
  );
$$;

CREATE OR REPLACE FUNCTION private.is_hn_pay_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role IN ('owner','admin') AND app_id IN ('HN-PAY','*')
  );
$$;

CREATE OR REPLACE FUNCTION private.has_site_role(_uid uuid, _site_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sites s
    JOIN public.user_roles ur ON ur.user_id = _uid AND ur.app_id = s.slug
    WHERE s.id = _site_id AND ur.role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION private.site_can_read(_uid uuid, _site_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT _uid IS NOT NULL AND (
    private.is_group_owner(_uid)
    OR private.is_hn_pay_admin(_uid)
    OR private.has_site_role(_uid, _site_id,
        ARRAY['owner','admin','manager','developer','accountant','viewer','subscriber']::public.app_role[])
  );
$$;

CREATE OR REPLACE FUNCTION private.site_can_write(_uid uuid, _site_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT _uid IS NOT NULL AND (
    private.is_group_owner(_uid)
    OR private.is_hn_pay_admin(_uid)
    OR private.has_site_role(_uid, _site_id, ARRAY['owner','admin','manager']::public.app_role[])
  );
$$;

CREATE OR REPLACE FUNCTION private.site_can_manage(_uid uuid, _site_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT _uid IS NOT NULL AND (
    private.is_group_owner(_uid)
    OR private.is_hn_pay_admin(_uid)
    OR private.has_site_role(_uid, _site_id, ARRAY['owner','admin']::public.app_role[])
  );
$$;

CREATE OR REPLACE FUNCTION private.site_can_read_financial(_uid uuid, _site_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT _uid IS NOT NULL AND (
    private.is_group_owner(_uid)
    OR private.is_hn_pay_admin(_uid)
    OR private.has_site_role(_uid, _site_id,
        ARRAY['owner','admin','manager','accountant']::public.app_role[])
  );
$$;

-- 3. RLS policies

-- catalog_items
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalog_items_public_read ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_staff_all ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_read ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_insert ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_update ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_delete ON public.catalog_items;

CREATE POLICY catalog_items_public_read ON public.catalog_items
  FOR SELECT TO anon, authenticated
  USING (status='active' AND is_public=true);
CREATE POLICY catalog_items_read ON public.catalog_items
  FOR SELECT TO authenticated USING (private.site_can_read(auth.uid(), site_id));
CREATE POLICY catalog_items_insert ON public.catalog_items
  FOR INSERT TO authenticated WITH CHECK (private.site_can_write(auth.uid(), site_id));
CREATE POLICY catalog_items_update ON public.catalog_items
  FOR UPDATE TO authenticated USING (private.site_can_write(auth.uid(), site_id))
  WITH CHECK (private.site_can_write(auth.uid(), site_id));
CREATE POLICY catalog_items_delete ON public.catalog_items
  FOR DELETE TO authenticated USING (private.site_can_manage(auth.uid(), site_id));

-- catalog_categories
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalog_categories_public_read ON public.catalog_categories;
DROP POLICY IF EXISTS catalog_categories_staff_all ON public.catalog_categories;
DROP POLICY IF EXISTS catalog_categories_read ON public.catalog_categories;
DROP POLICY IF EXISTS catalog_categories_insert ON public.catalog_categories;
DROP POLICY IF EXISTS catalog_categories_update ON public.catalog_categories;
DROP POLICY IF EXISTS catalog_categories_delete ON public.catalog_categories;

CREATE POLICY catalog_categories_public_read ON public.catalog_categories
  FOR SELECT TO anon, authenticated USING (is_active=true);
CREATE POLICY catalog_categories_read ON public.catalog_categories
  FOR SELECT TO authenticated USING (private.site_can_read(auth.uid(), site_id));
CREATE POLICY catalog_categories_insert ON public.catalog_categories
  FOR INSERT TO authenticated WITH CHECK (private.site_can_write(auth.uid(), site_id));
CREATE POLICY catalog_categories_update ON public.catalog_categories
  FOR UPDATE TO authenticated USING (private.site_can_write(auth.uid(), site_id))
  WITH CHECK (private.site_can_write(auth.uid(), site_id));
CREATE POLICY catalog_categories_delete ON public.catalog_categories
  FOR DELETE TO authenticated USING (private.site_can_manage(auth.uid(), site_id));

-- catalog_prices
ALTER TABLE public.catalog_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalog_prices_public_read ON public.catalog_prices;
DROP POLICY IF EXISTS catalog_prices_staff_all ON public.catalog_prices;
DROP POLICY IF EXISTS catalog_prices_read ON public.catalog_prices;
DROP POLICY IF EXISTS catalog_prices_financial_read ON public.catalog_prices;
DROP POLICY IF EXISTS catalog_prices_insert ON public.catalog_prices;
DROP POLICY IF EXISTS catalog_prices_update ON public.catalog_prices;
DROP POLICY IF EXISTS catalog_prices_delete ON public.catalog_prices;

CREATE POLICY catalog_prices_public_read ON public.catalog_prices
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.catalog_items ci
                 WHERE ci.id=catalog_prices.catalog_item_id
                   AND ci.status='active' AND ci.is_public=true));
CREATE POLICY catalog_prices_read ON public.catalog_prices
  FOR SELECT TO authenticated
  USING (private.site_can_read_financial(auth.uid(), site_id));
CREATE POLICY catalog_prices_insert ON public.catalog_prices
  FOR INSERT TO authenticated WITH CHECK (private.site_can_write(auth.uid(), site_id));
CREATE POLICY catalog_prices_update ON public.catalog_prices
  FOR UPDATE TO authenticated USING (private.site_can_write(auth.uid(), site_id))
  WITH CHECK (private.site_can_write(auth.uid(), site_id));
CREATE POLICY catalog_prices_delete ON public.catalog_prices
  FOR DELETE TO authenticated USING (private.site_can_manage(auth.uid(), site_id));

-- catalog_features
ALTER TABLE public.catalog_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalog_features_public_read ON public.catalog_features;
DROP POLICY IF EXISTS catalog_features_staff_all ON public.catalog_features;
DROP POLICY IF EXISTS catalog_features_read ON public.catalog_features;
DROP POLICY IF EXISTS catalog_features_write ON public.catalog_features;

CREATE POLICY catalog_features_public_read ON public.catalog_features
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.catalog_items ci
                 WHERE ci.id=catalog_features.catalog_item_id
                   AND ci.status='active' AND ci.is_public=true));
CREATE POLICY catalog_features_read ON public.catalog_features
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.catalog_items ci
                 WHERE ci.id=catalog_features.catalog_item_id
                   AND private.site_can_read(auth.uid(), ci.site_id)));
CREATE POLICY catalog_features_write ON public.catalog_features
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.catalog_items ci
                 WHERE ci.id=catalog_features.catalog_item_id
                   AND private.site_can_write(auth.uid(), ci.site_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.catalog_items ci
                      WHERE ci.id=catalog_features.catalog_item_id
                        AND private.site_can_write(auth.uid(), ci.site_id)));

-- catalog_item_providers
ALTER TABLE public.catalog_item_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalog_item_providers_staff_all ON public.catalog_item_providers;
DROP POLICY IF EXISTS catalog_item_providers_read ON public.catalog_item_providers;
DROP POLICY IF EXISTS catalog_item_providers_write ON public.catalog_item_providers;

CREATE POLICY catalog_item_providers_read ON public.catalog_item_providers
  FOR SELECT TO authenticated USING (private.site_can_read(auth.uid(), site_id));
CREATE POLICY catalog_item_providers_write ON public.catalog_item_providers
  FOR ALL TO authenticated
  USING (private.site_can_write(auth.uid(), site_id))
  WITH CHECK (private.site_can_write(auth.uid(), site_id));

-- Grants
GRANT SELECT ON public.catalog_items, public.catalog_categories, public.catalog_prices, public.catalog_features TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items, public.catalog_categories,
  public.catalog_prices, public.catalog_features, public.catalog_item_providers TO authenticated;
GRANT ALL ON public.catalog_items, public.catalog_categories, public.catalog_prices,
  public.catalog_features, public.catalog_item_providers TO service_role;

-- 4. Lock site_id after creation
CREATE OR REPLACE FUNCTION public.tg_catalog_items_lock_site()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.site_id IS DISTINCT FROM OLD.site_id THEN
    IF auth.uid() IS NULL OR NOT private.is_group_owner(auth.uid()) THEN
      RAISE EXCEPTION 'Only group owners can move a catalog item between sites';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_catalog_items_lock_site ON public.catalog_items;
CREATE TRIGGER trg_catalog_items_lock_site
  BEFORE UPDATE ON public.catalog_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_catalog_items_lock_site();

-- 5. Block hard delete when payments/subscriptions exist
CREATE OR REPLACE FUNCTION public.tg_catalog_items_block_delete_when_used()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _has_activity boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.plans p
    LEFT JOIN public.subscriptions s ON s.plan_id = p.id
    LEFT JOIN public.payments pm ON pm.plan_id = p.id
    WHERE p.catalog_item_id = OLD.id
      AND (s.id IS NOT NULL OR pm.id IS NOT NULL)
  ) INTO _has_activity;
  IF _has_activity THEN
    RAISE EXCEPTION 'Catalog item has subscriptions or payments — archive it instead of deleting'
      USING HINT = 'Set status = ''archived'' rather than deleting.';
  END IF;
  RETURN OLD;
END; $$;

DROP TRIGGER IF EXISTS trg_catalog_items_block_delete ON public.catalog_items;
CREATE TRIGGER trg_catalog_items_block_delete
  BEFORE DELETE ON public.catalog_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_catalog_items_block_delete_when_used();
