
-- ============================================================
-- Security hardening migration
-- ============================================================

-- 1) Drop overly permissive public/authenticated SELECT policies
DROP POLICY IF EXISTS "Anyone reads checkout by public id" ON public.checkout_sessions;
DROP POLICY IF EXISTS "Anyone can read a portal token by id" ON public.portal_tokens;
DROP POLICY IF EXISTS "Anyone signed in reads permissions" ON public.role_permissions;

-- 2) Restore a scoped read policy for role_permissions
CREATE POLICY "Owners and admins read permissions" ON public.role_permissions
FOR SELECT TO authenticated
USING (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), '*'::text, 'admin'::app_role));

-- 3) Move SECURITY DEFINER helper functions out of the exposed public API schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _app_id text, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND app_id = _app_id AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION private.is_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(uuid, text, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_owner(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, text, app_role) TO authenticated, anon, service_role;

-- 4) Recreate every policy that referenced the public. helpers to use private.
-- checkout_sessions
DROP POLICY IF EXISTS "Owners manage checkouts" ON public.checkout_sessions;
CREATE POLICY "Owners manage checkouts" ON public.checkout_sessions
FOR ALL TO authenticated
USING (private.is_owner(auth.uid())) WITH CHECK (private.is_owner(auth.uid()));

-- customers
DROP POLICY IF EXISTS "Owners manage customers" ON public.customers;
CREATE POLICY "Owners manage customers" ON public.customers
FOR ALL TO authenticated
USING (private.is_owner(auth.uid())) WITH CHECK (private.is_owner(auth.uid()));

-- hn_subscriptions
DROP POLICY IF EXISTS "Owners manage subs" ON public.hn_subscriptions;
CREATE POLICY "Owners manage subs" ON public.hn_subscriptions
FOR ALL TO authenticated
USING (private.is_owner(auth.uid())) WITH CHECK (private.is_owner(auth.uid()));

DROP POLICY IF EXISTS "Owners read all subs" ON public.hn_subscriptions;
CREATE POLICY "Owners read all subs" ON public.hn_subscriptions
FOR SELECT TO authenticated
USING (private.is_owner(auth.uid()));

-- payment_providers
DROP POLICY IF EXISTS "owners_admins_read_payment_providers" ON public.payment_providers;
CREATE POLICY "owners_admins_read_payment_providers" ON public.payment_providers
FOR SELECT TO authenticated
USING (private.is_owner(auth.uid()) OR private.has_role(auth.uid(), '*'::text, 'admin'::app_role));

DROP POLICY IF EXISTS "owners_admins_write_payment_providers" ON public.payment_providers;
CREATE POLICY "owners_admins_write_payment_providers" ON public.payment_providers
FOR ALL TO authenticated
USING (private.is_owner(auth.uid()) OR private.has_role(auth.uid(), '*'::text, 'admin'::app_role))
WITH CHECK (private.is_owner(auth.uid()) OR private.has_role(auth.uid(), '*'::text, 'admin'::app_role));

-- payments
DROP POLICY IF EXISTS "Owners manage payments" ON public.payments;
CREATE POLICY "Owners manage payments" ON public.payments
FOR ALL TO authenticated
USING (private.is_owner(auth.uid())) WITH CHECK (private.is_owner(auth.uid()));

-- portfolios
DROP POLICY IF EXISTS "portfolios owner read" ON public.portfolios;
CREATE POLICY "portfolios owner read" ON public.portfolios
FOR SELECT TO authenticated
USING (private.is_owner(auth.uid()));

DROP POLICY IF EXISTS "portfolios owner write" ON public.portfolios;
CREATE POLICY "portfolios owner write" ON public.portfolios
FOR ALL TO authenticated
USING (private.is_owner(auth.uid())) WITH CHECK (private.is_owner(auth.uid()));

-- processed_webhook_events
DROP POLICY IF EXISTS "Owners read processed events" ON public.processed_webhook_events;
CREATE POLICY "Owners read processed events" ON public.processed_webhook_events
FOR SELECT TO authenticated USING (private.is_owner(auth.uid()));

-- plans
DROP POLICY IF EXISTS "Owners manage plans" ON public.plans;
CREATE POLICY "Owners manage plans" ON public.plans
FOR ALL TO authenticated
USING (private.is_owner(auth.uid())) WITH CHECK (private.is_owner(auth.uid()));

-- provider_events
DROP POLICY IF EXISTS "Owners read provider events" ON public.provider_events;
CREATE POLICY "Owners read provider events" ON public.provider_events
FOR SELECT TO authenticated USING (private.is_owner(auth.uid()));

-- role_permissions writes + refresh read policy to private helper
DROP POLICY IF EXISTS "Owners manage permissions" ON public.role_permissions;
CREATE POLICY "Owners manage permissions" ON public.role_permissions
FOR ALL TO authenticated
USING (private.is_owner(auth.uid())) WITH CHECK (private.is_owner(auth.uid()));

DROP POLICY IF EXISTS "Owners and admins read permissions" ON public.role_permissions;
CREATE POLICY "Owners and admins read permissions" ON public.role_permissions
FOR SELECT TO authenticated
USING (private.is_owner(auth.uid()) OR private.has_role(auth.uid(), '*'::text, 'admin'::app_role));

-- site_api_keys
DROP POLICY IF EXISTS "Owners manage api keys" ON public.site_api_keys;
CREATE POLICY "Owners manage api keys" ON public.site_api_keys
FOR ALL TO authenticated
USING (private.is_owner(auth.uid())) WITH CHECK (private.is_owner(auth.uid()));

-- sites
DROP POLICY IF EXISTS "Owners manage sites" ON public.sites;
CREATE POLICY "Owners manage sites" ON public.sites
FOR ALL TO authenticated
USING (private.is_owner(auth.uid())) WITH CHECK (private.is_owner(auth.uid()));

-- subscriptions
DROP POLICY IF EXISTS "Owners manage subscriptions" ON public.subscriptions;
CREATE POLICY "Owners manage subscriptions" ON public.subscriptions
FOR ALL TO authenticated
USING (private.is_owner(auth.uid())) WITH CHECK (private.is_owner(auth.uid()));

-- user_roles
DROP POLICY IF EXISTS "Owners manage roles" ON public.user_roles;
CREATE POLICY "Owners manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (private.is_owner(auth.uid())) WITH CHECK (private.is_owner(auth.uid()));

DROP POLICY IF EXISTS "Owners read all roles" ON public.user_roles;
CREATE POLICY "Owners read all roles" ON public.user_roles
FOR SELECT TO authenticated USING (private.is_owner(auth.uid()));

-- webhook_events
DROP POLICY IF EXISTS "Owners manage webhook events" ON public.webhook_events;
CREATE POLICY "Owners manage webhook events" ON public.webhook_events
FOR ALL TO authenticated
USING (private.is_owner(auth.uid())) WITH CHECK (private.is_owner(auth.uid()));

-- 5) Drop the now-unused public SECURITY DEFINER helpers
DROP FUNCTION IF EXISTS public.is_owner(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, text, app_role);

-- 6) Lock down the other SECURITY DEFINER helper functions in public.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_protected_owner(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_owner_profiles() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_owner_roles() FROM PUBLIC, anon, authenticated;

-- 7) Prevent privilege escalation on user_roles via defense-in-depth trigger.
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _is_protected_email boolean := false;
BEGIN
  -- System/trigger context (no auth.uid) — allow (handle_new_user path).
  IF _caller IS NULL THEN
    RETURN NEW;
  END IF;

  -- Existing owners may assign anything.
  IF private.is_owner(_caller) THEN
    RETURN NEW;
  END IF;

  -- Non-owners can never assign a role to themselves.
  IF NEW.user_id = _caller THEN
    RAISE EXCEPTION 'Users cannot assign roles to themselves';
  END IF;

  -- Non-owners can never grant the owner role, even to another user.
  IF NEW.role = 'owner' THEN
    SELECT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = NEW.user_id
        AND lower(email) IN ('lmodirv@gmail.com', 'info@hnchat.net')
    ) INTO _is_protected_email;
    IF NOT _is_protected_email THEN
      RAISE EXCEPTION 'Only owners can assign the owner role';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_role_self_escalation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prevent_role_self_escalation ON public.user_roles;
CREATE TRIGGER prevent_role_self_escalation
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();
