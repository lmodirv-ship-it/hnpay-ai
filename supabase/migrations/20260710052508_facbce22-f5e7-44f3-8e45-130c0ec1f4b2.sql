
-- Second protected owner + delete protection

-- Update trigger to grant owner to both protected emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _origin text := COALESCE(NEW.raw_user_meta_data->>'origin_app', 'HN-HUB');
  _role public.app_role := 'subscriber';
  _is_owner boolean := lower(NEW.email) IN ('lmodirv@gmail.com', 'info@hnchat.net');
BEGIN
  IF _is_owner THEN
    _role := 'owner';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, origin_app)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    _origin
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, app_id, role)
  VALUES (NEW.id, _origin, _role)
  ON CONFLICT DO NOTHING;

  IF _is_owner THEN
    INSERT INTO public.user_roles (user_id, app_id, role) VALUES (NEW.id, 'HN-HUB', 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, app_id, role) VALUES (NEW.id, '*', 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, app_id, role) VALUES (NEW.id, '*', 'owner') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger installed on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper to check protected owner emails
CREATE OR REPLACE FUNCTION public.is_protected_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id
      AND lower(email) IN ('lmodirv@gmail.com', 'info@hnchat.net')
  );
$$;

-- Prevent deletion/modification of protected owner roles
CREATE OR REPLACE FUNCTION public.protect_owner_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF public.is_protected_owner(OLD.user_id) THEN
      RAISE EXCEPTION 'Protected owner roles cannot be removed';
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF public.is_protected_owner(OLD.user_id) AND OLD.role = 'owner' AND NEW.role <> 'owner' THEN
      RAISE EXCEPTION 'Protected owner role cannot be downgraded';
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_owner_roles_trg ON public.user_roles;
CREATE TRIGGER protect_owner_roles_trg
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_owner_roles();

-- Prevent deletion of protected owner profiles
CREATE OR REPLACE FUNCTION public.protect_owner_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF lower(OLD.email) IN ('lmodirv@gmail.com', 'info@hnchat.net') THEN
    RAISE EXCEPTION 'Protected owner profile cannot be removed';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS protect_owner_profiles_trg ON public.profiles;
CREATE TRIGGER protect_owner_profiles_trg
BEFORE DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_owner_profiles();

-- Backfill: if the protected owners already signed up, grant them owner roles
INSERT INTO public.user_roles (user_id, app_id, role)
SELECT u.id, 'HN-HUB', 'owner'::public.app_role
FROM auth.users u
WHERE lower(u.email) IN ('lmodirv@gmail.com', 'info@hnchat.net')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, app_id, role)
SELECT u.id, '*', 'owner'::public.app_role
FROM auth.users u
WHERE lower(u.email) IN ('lmodirv@gmail.com', 'info@hnchat.net')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, app_id, role)
SELECT u.id, '*', 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) IN ('lmodirv@gmail.com', 'info@hnchat.net')
ON CONFLICT DO NOTHING;
