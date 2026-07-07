
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'developer', 'subscriber', 'viewer');

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  origin_app TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- HN apps registry
CREATE TABLE public.hn_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  category TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hn_apps TO anon, authenticated;
GRANT ALL ON public.hn_apps TO service_role;
ALTER TABLE public.hn_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active apps" ON public.hn_apps
  FOR SELECT USING (true);

-- User roles per app (RBAC)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'subscriber',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer helper (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _app_id TEXT, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND app_id = _app_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  );
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_owner(auth.uid()));
CREATE POLICY "Owners manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

-- Subscriptions / usage per (user, app)
CREATE TABLE public.hn_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  quota INTEGER NOT NULL DEFAULT 50,
  used INTEGER NOT NULL DEFAULT 0,
  renews_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_id)
);
GRANT SELECT, INSERT, UPDATE ON public.hn_subscriptions TO authenticated;
GRANT ALL ON public.hn_subscriptions TO service_role;
ALTER TABLE public.hn_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subs" ON public.hn_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners read all subs" ON public.hn_subscriptions
  FOR SELECT TO authenticated USING (public.is_owner(auth.uid()));
CREATE POLICY "Owners manage subs" ON public.hn_subscriptions
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));

-- Trigger: on new user, create profile + default subscriber role for HN-HUB
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, origin_app)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'origin_app', 'HN-HUB')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, app_id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'origin_app', 'HN-HUB'), 'subscriber')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed a few apps
INSERT INTO public.hn_apps (app_id, name, description, domain, category) VALUES
  ('HN-HUB', 'HN Hub', 'Central control plane', 'hub.hn.network', 'Platform'),
  ('HN-PAY', 'HN Pay', 'Unified billing & payments', 'pay.hn.network', 'Payments'),
  ('HN-BUILD', 'HN Build', 'Site & landing builder', 'build.hn.network', 'Design Tools'),
  ('FILMFORGE', 'FilmForge', 'AI video generation', 'films.hn.network', 'Media'),
  ('HN-LAVAGE', 'HN Lavage', 'Car wash booking', 'lavage.hn.network', 'Logistics'),
  ('HN-AUTOMATION', 'HN Automation', 'Workflow orchestrator', 'automation.hn.network', 'Automation')
ON CONFLICT (app_id) DO NOTHING;
