
-- Portfolios (site groups)
CREATE TABLE IF NOT EXISTS public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  default_currency text NOT NULL DEFAULT 'USD',
  default_provider text,
  brand_color text DEFAULT '#f59e0b',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolios TO authenticated;
GRANT ALL ON public.portfolios TO service_role;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolios owner read" ON public.portfolios FOR SELECT TO authenticated
  USING (public.is_owner(auth.uid()));
CREATE POLICY "portfolios owner write" ON public.portfolios FOR ALL TO authenticated
  USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));

CREATE TRIGGER portfolios_updated_at BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Attach sites to a portfolio
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS portfolio_id uuid REFERENCES public.portfolios(id) ON DELETE SET NULL;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'live';
CREATE INDEX IF NOT EXISTS idx_sites_portfolio ON public.sites(portfolio_id);
