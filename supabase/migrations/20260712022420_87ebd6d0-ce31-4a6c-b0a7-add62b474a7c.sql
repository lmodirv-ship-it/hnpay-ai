
INSERT INTO public.sites (
  slug, name, domain, webhook_secret, brand_color,
  is_active, enabled_providers, manual_bank_details,
  environment, project_id, is_internal, integration_mode,
  api_enabled, webhook_enabled, database_access, allowed_origins,
  integration_status, created_by
)
SELECT
  lower(p.code),
  p.name,
  COALESCE(NULLIF(p.primary_domain,''), lower(p.code) || '.hn.local'),
  encode(gen_random_bytes(24),'hex'),
  p.brand_color,
  (p.status = 'active'),
  ARRAY['manual']::text[],
  '{}'::jsonb,
  'live',
  p.id,
  true,
  'internal_database',
  true, true, true,
  ARRAY[]::text[],
  'connected',
  p.owner_id
FROM public.hn_projects p
WHERE NOT EXISTS (SELECT 1 FROM public.sites s WHERE s.project_id = p.id);

WITH src AS (
  SELECT ps.*, s.id AS mapped_site_id
  FROM public.products_services ps
  JOIN public.sites s ON s.project_id = ps.project_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.catalog_items ci
    WHERE ci.site_id = s.id
      AND (ci.metadata->>'legacy_id')::uuid = ps.id
  )
),
inserted_items AS (
  INSERT INTO public.catalog_items (
    site_id, item_code, item_type, name_ar, slug,
    description_ar, image_url, status, is_public,
    requires_approval, metadata, created_by
  )
  SELECT
    src.mapped_site_id,
    src.product_code,
    src.type,
    src.name,
    NULLIF(src.slug,''),
    NULLIF(src.description,''),
    NULLIF(src.image_url,''),
    CASE WHEN src.status IN ('active','draft','hidden','paused') THEN src.status ELSE 'draft' END,
    COALESCE(src.visible_in_store, true),
    COALESCE(src.requires_approval, false),
    COALESCE(src.metadata,'{}'::jsonb) || jsonb_build_object(
      'legacy_id', src.id,
      'legacy_tags', src.tags,
      'legacy_keywords', src.keywords,
      'legacy_sales_count', src.sales_count,
      'legacy_customers_count', src.customers_count,
      'legacy_total_revenue', src.total_revenue,
      'legacy_allowed_providers', src.allowed_providers,
      'legacy_display_order', src.display_order
    ),
    src.created_by
  FROM src
  RETURNING id, site_id, item_code, (metadata->>'legacy_id')::uuid AS legacy_id
)
INSERT INTO public.catalog_prices (
  catalog_item_id, site_id, price_code, name_ar,
  billing_type, amount, currency, billing_interval,
  trial_days, setup_fee, tax_rate, is_default, is_active
)
SELECT
  ii.id,
  ii.site_id,
  ii.item_code || '-default',
  'السعر الافتراضي',
  ps.billing_type,
  ps.price,
  UPPER(COALESCE(NULLIF(ps.currency,''),'MAD')),
  NULLIF(ps.subscription_interval,''),
  COALESCE(ps.trial_days, 0),
  COALESCE(ps.setup_fee, 0),
  COALESCE(ps.tax_rate, 0),
  true,
  (ps.status = 'active')
FROM inserted_items ii
JOIN public.products_services ps ON ps.id = ii.legacy_id;
