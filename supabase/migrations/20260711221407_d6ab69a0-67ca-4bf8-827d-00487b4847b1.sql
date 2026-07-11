
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_hnpay_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner','admin','manager')
  );
$$;

DROP POLICY IF EXISTS "hn_projects staff manage" ON public.hn_projects;
CREATE POLICY "hn_projects staff manage" ON public.hn_projects FOR ALL TO authenticated
  USING (private.is_hnpay_staff(auth.uid())) WITH CHECK (private.is_hnpay_staff(auth.uid()));

DROP POLICY IF EXISTS "project_domains staff manage" ON public.project_domains;
CREATE POLICY "project_domains staff manage" ON public.project_domains FOR ALL TO authenticated
  USING (private.is_hnpay_staff(auth.uid())) WITH CHECK (private.is_hnpay_staff(auth.uid()));

DROP POLICY IF EXISTS "project_api_keys staff manage" ON public.project_api_keys;
CREATE POLICY "project_api_keys staff manage" ON public.project_api_keys FOR ALL TO authenticated
  USING (private.is_hnpay_staff(auth.uid())) WITH CHECK (private.is_hnpay_staff(auth.uid()));

DROP POLICY IF EXISTS "project_payment_settings staff manage" ON public.project_payment_settings;
CREATE POLICY "project_payment_settings staff manage" ON public.project_payment_settings FOR ALL TO authenticated
  USING (private.is_hnpay_staff(auth.uid())) WITH CHECK (private.is_hnpay_staff(auth.uid()));

DROP FUNCTION IF EXISTS public.is_hnpay_staff(uuid);
