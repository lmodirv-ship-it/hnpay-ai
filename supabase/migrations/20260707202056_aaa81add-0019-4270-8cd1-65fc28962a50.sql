
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.app_role NOT NULL,
  permission text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);

GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Owners manage permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

-- We need authenticated to UPDATE too (RLS gate above still checks is_owner)
GRANT INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;

CREATE TRIGGER role_permissions_set_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed default permission matrix
INSERT INTO public.role_permissions (role, permission, enabled) VALUES
  ('owner','manage_platform',true),
  ('owner','manage_users',true),
  ('owner','manage_roles',true),
  ('owner','manage_apps',true),
  ('owner','manage_billing',true),
  ('owner','view_analytics',true),
  ('owner','use_ai',true),
  ('owner','access_api',true),

  ('admin','manage_platform',false),
  ('admin','manage_users',true),
  ('admin','manage_roles',true),
  ('admin','manage_apps',true),
  ('admin','manage_billing',true),
  ('admin','view_analytics',true),
  ('admin','use_ai',true),
  ('admin','access_api',true),

  ('manager','manage_platform',false),
  ('manager','manage_users',true),
  ('manager','manage_roles',false),
  ('manager','manage_apps',true),
  ('manager','manage_billing',true),
  ('manager','view_analytics',true),
  ('manager','use_ai',true),
  ('manager','access_api',true),

  ('developer','manage_platform',false),
  ('developer','manage_users',false),
  ('developer','manage_roles',false),
  ('developer','manage_apps',false),
  ('developer','manage_billing',false),
  ('developer','view_analytics',true),
  ('developer','use_ai',true),
  ('developer','access_api',true),

  ('subscriber','manage_platform',false),
  ('subscriber','manage_users',false),
  ('subscriber','manage_roles',false),
  ('subscriber','manage_apps',false),
  ('subscriber','manage_billing',false),
  ('subscriber','view_analytics',false),
  ('subscriber','use_ai',true),
  ('subscriber','access_api',true),

  ('viewer','manage_platform',false),
  ('viewer','manage_users',false),
  ('viewer','manage_roles',false),
  ('viewer','manage_apps',false),
  ('viewer','manage_billing',false),
  ('viewer','view_analytics',true),
  ('viewer','use_ai',false),
  ('viewer','access_api',false);
