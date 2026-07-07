-- Auto-grant owner role to the platform owner email lmodirv@gmail.com on signup,
-- and promote if the account already exists.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _origin text := COALESCE(NEW.raw_user_meta_data->>'origin_app', 'HN-HUB');
  _role public.app_role := 'subscriber';
BEGIN
  IF lower(NEW.email) = 'lmodirv@gmail.com' THEN
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

  -- Also grant global owner scope for the platform owner
  IF _role = 'owner' THEN
    INSERT INTO public.user_roles (user_id, app_id, role)
    VALUES (NEW.id, 'HN-HUB', 'owner')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, app_id, role)
    VALUES (NEW.id, '*', 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Promote existing account if it already exists
INSERT INTO public.user_roles (user_id, app_id, role)
SELECT u.id, 'HN-HUB', 'owner'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'lmodirv@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, app_id, role)
SELECT u.id, '*', 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'lmodirv@gmail.com'
ON CONFLICT DO NOTHING;
