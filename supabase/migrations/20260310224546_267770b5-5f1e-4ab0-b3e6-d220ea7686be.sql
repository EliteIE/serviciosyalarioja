
CREATE TABLE public.provider_mp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  mp_user_id text NOT NULL,
  mp_access_token text NOT NULL,
  mp_refresh_token text,
  mp_email text,
  mp_public_key text,
  connected_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_mp_accounts ENABLE ROW LEVEL SECURITY;

-- Provider can view own MP account
CREATE POLICY "Users can view own mp account"
  ON public.provider_mp_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Provider can delete own MP account (disconnect)
CREATE POLICY "Users can delete own mp account"
  ON public.provider_mp_accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins can manage mp accounts"
  ON public.provider_mp_accounts
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role inserts (from edge function)
-- No INSERT policy for regular users - only edge function with service role can insert
