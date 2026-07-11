
-- Change product_code format to letter + 6 digits (H000001)
ALTER TABLE public.products_services
  ALTER COLUMN product_code SET DEFAULT ('H' || lpad(nextval('products_services_code_seq')::text, 6, '0'));

-- Add domain_id link so each domain can point to its own catalog product
ALTER TABLE public.products_services
  ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_services_domain_id_key
  ON public.products_services(domain_id) WHERE domain_id IS NOT NULL;
