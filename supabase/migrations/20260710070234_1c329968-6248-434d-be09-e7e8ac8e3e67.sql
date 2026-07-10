
-- Multi-provider support per site
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS enabled_providers text[] NOT NULL DEFAULT ARRAY['manual']::text[],
  ADD COLUMN IF NOT EXISTS manual_instructions text,
  ADD COLUMN IF NOT EXISTS manual_bank_details jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS provider_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS awaiting_reference text;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS settled_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS settled_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;
