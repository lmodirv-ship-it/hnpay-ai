
-- Client tokens for embedded checkout & subscription.activated tracking
ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS client_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS client_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS display_mode text NOT NULL DEFAULT 'embedded';

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_client_token
  ON public.checkout_sessions (client_token);

-- Ensure subscriptions has provider_ref for idempotency
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider_ref text;
