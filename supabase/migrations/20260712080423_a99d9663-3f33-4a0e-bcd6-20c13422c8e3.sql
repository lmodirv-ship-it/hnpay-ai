-- 1. Mark all existing sites as group sites
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS is_group_site boolean NOT NULL DEFAULT false;

UPDATE public.sites SET is_group_site = true;

COMMENT ON COLUMN public.sites.is_group_site IS
  'When true, this site participates in the HN group cross-benefit program: its users get free access to services from all other group sites.';

-- 2. Group members registry
CREATE TABLE IF NOT EXISTS public.hn_group_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  joined_via_site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hn_group_members_email ON public.hn_group_members (lower(email));

GRANT SELECT ON public.hn_group_members TO authenticated;
GRANT ALL ON public.hn_group_members TO service_role;

ALTER TABLE public.hn_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read their own membership"
  ON public.hn_group_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "staff can read all memberships"
  ON public.hn_group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text IN ('owner','admin','group_owner','manager','finance_manager','accountant')
    )
  );

CREATE TRIGGER trg_hn_group_members_updated_at
  BEFORE UPDATE ON public.hn_group_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3. Helpers
CREATE OR REPLACE FUNCTION public.is_hn_group_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hn_group_members m
    WHERE m.user_id = _user_id AND m.is_active
  );
$$;

CREATE OR REPLACE FUNCTION public.is_hn_group_email(_email text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.hn_group_members m
    WHERE lower(m.email) = lower(_email) AND m.is_active
  );
$$;

-- 4. Auto-enroll on new profile
CREATE OR REPLACE FUNCTION public.tg_profiles_enroll_group_member()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.hn_group_members (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, is_active = true;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_enroll_group_member ON public.profiles;
CREATE TRIGGER trg_profiles_enroll_group_member
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_enroll_group_member();

-- 5. Backfill existing users
INSERT INTO public.hn_group_members (user_id, email)
SELECT p.id, p.email FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

-- 6. Checkout session tracking
ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS group_free_applied boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_free_reason text;

-- 7. Sharing flags on offerings
ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS share_with_group boolean NOT NULL DEFAULT true;

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS share_with_group boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.catalog_items.share_with_group IS
  'When true, this catalog item is offered free to authenticated HN group members from any group site.';
COMMENT ON COLUMN public.plans.share_with_group IS
  'When true, this plan is offered free to authenticated HN group members from any group site.';

-- 8. Group-wide read policies (members can browse shared catalog/plans across all group sites)
DROP POLICY IF EXISTS "group members can read shared catalog items" ON public.catalog_items;
CREATE POLICY "group members can read shared catalog items"
  ON public.catalog_items FOR SELECT
  TO authenticated
  USING (
    share_with_group = true
    AND status = 'active'
    AND public.is_hn_group_member(auth.uid())
    AND EXISTS (SELECT 1 FROM public.sites s WHERE s.id = catalog_items.site_id AND s.is_group_site = true)
  );

DROP POLICY IF EXISTS "group members can read shared plans" ON public.plans;
CREATE POLICY "group members can read shared plans"
  ON public.plans FOR SELECT
  TO authenticated
  USING (
    share_with_group = true
    AND is_active = true
    AND public.is_hn_group_member(auth.uid())
    AND EXISTS (SELECT 1 FROM public.sites s WHERE s.id = plans.site_id AND s.is_group_site = true)
  );