ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS tvcc_external_id text;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS tvcc_synced_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS sites_tvcc_external_id_key ON public.sites(tvcc_external_id) WHERE tvcc_external_id IS NOT NULL;

CREATE TABLE public.tvcc_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  sites_received integer NOT NULL DEFAULT 0,
  sites_created integer NOT NULL DEFAULT 0,
  sites_updated integer NOT NULL DEFAULT 0,
  plans_upserted integer NOT NULL DEFAULT 0,
  error text
);
GRANT SELECT ON public.tvcc_sync_runs TO authenticated;
GRANT ALL ON public.tvcc_sync_runs TO service_role;
ALTER TABLE public.tvcc_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners read tvcc runs" ON public.tvcc_sync_runs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('owner','admin')));

CREATE TABLE public.user_site_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'site' CHECK (kind IN ('site','partner','tracking')),
  name text NOT NULL,
  url text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.user_site_requests TO authenticated;
GRANT ALL ON public.user_site_requests TO service_role;
ALTER TABLE public.user_site_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own requests read" ON public.user_site_requests FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('owner','admin')));
CREATE POLICY "own requests insert" ON public.user_site_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "own pending delete" ON public.user_site_requests FOR DELETE TO authenticated
USING (user_id = auth.uid() AND status = 'pending');