-- =====================================================================
-- At-rest encryption for MercadoPago OAuth tokens.
--
-- PREREQUISITE (ops step, once per environment):
--   select vault.create_secret('<base64-32B-key>', 'mp_token_key',
--                              'MercadoPago token encryption key');
--
-- Design:
--   * pgcrypto AES via pgp_sym_encrypt/decrypt.
--   * Key fetched at call-time from vault.decrypted_secrets. Functions
--     raise if the secret is missing so misconfiguration is loud.
--   * Plaintext columns kept during rollout; a follow-up migration
--     drops them once edge functions exclusively use the RPC path.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.provider_mp_accounts
  ADD COLUMN IF NOT EXISTS mp_access_token_enc  bytea,
  ADD COLUMN IF NOT EXISTS mp_refresh_token_enc bytea;

-- ---------------------------------------------------------------------
-- Key accessor: returns the symmetric key or raises.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._mp_token_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions, pg_catalog
AS $$
DECLARE
  v_key text;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'mp_token_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_key := NULL;
  END;

  IF v_key IS NULL OR length(v_key) < 16 THEN
    RAISE EXCEPTION 'mp_token_key not configured in vault';
  END IF;

  RETURN v_key;
END;
$$;
REVOKE ALL ON FUNCTION public._mp_token_key() FROM PUBLIC, authenticated, anon;

-- ---------------------------------------------------------------------
-- Encrypt + store (called from edge function via service role on
-- OAuth connect / refresh).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_provider_mp_tokens(
  p_user_id uuid,
  p_access_token text,
  p_refresh_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_key text := public._mp_token_key();
BEGIN
  UPDATE public.provider_mp_accounts
  SET mp_access_token_enc  = CASE WHEN p_access_token  IS NOT NULL
                                  THEN extensions.pgp_sym_encrypt(p_access_token,  v_key)
                                  ELSE mp_access_token_enc END,
      mp_refresh_token_enc = CASE WHEN p_refresh_token IS NOT NULL
                                  THEN extensions.pgp_sym_encrypt(p_refresh_token, v_key)
                                  ELSE mp_refresh_token_enc END,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.set_provider_mp_tokens(uuid, text, text) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_provider_mp_tokens(uuid, text, text) TO service_role;

-- ---------------------------------------------------------------------
-- Decrypt + return access token for a provider. Only service_role can
-- call this (webhook + create-preference paths).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_provider_mp_access_token(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_key text;
  v_enc bytea;
  v_plain text;
BEGIN
  SELECT mp_access_token_enc, mp_access_token
    INTO v_enc, v_plain
  FROM public.provider_mp_accounts
  WHERE user_id = p_user_id;

  IF v_enc IS NOT NULL THEN
    v_key := public._mp_token_key();
    RETURN extensions.pgp_sym_decrypt(v_enc, v_key);
  END IF;

  -- Fallback to plaintext during rollout. Remove once all rows migrated.
  RETURN v_plain;
END;
$$;
REVOKE ALL ON FUNCTION public.get_provider_mp_access_token(uuid) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_provider_mp_access_token(uuid) TO service_role;

-- ---------------------------------------------------------------------
-- Backfill existing rows (best-effort; if vault key isn't set yet this
-- migration still succeeds, just leaves *_enc NULL and plaintext path
-- keeps working).
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_key text;
BEGIN
  BEGIN
    v_key := public._mp_token_key();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'mp_token_key not set; skipping backfill. Set it via vault.create_secret and rerun.';
    RETURN;
  END;

  UPDATE public.provider_mp_accounts
  SET mp_access_token_enc  = CASE WHEN mp_access_token_enc  IS NULL AND mp_access_token  IS NOT NULL
                                  THEN extensions.pgp_sym_encrypt(mp_access_token,  v_key) END,
      mp_refresh_token_enc = CASE WHEN mp_refresh_token_enc IS NULL AND mp_refresh_token IS NOT NULL
                                  THEN extensions.pgp_sym_encrypt(mp_refresh_token, v_key) END
  WHERE (mp_access_token_enc IS NULL AND mp_access_token IS NOT NULL)
     OR (mp_refresh_token_enc IS NULL AND mp_refresh_token IS NOT NULL);
END $$;

-- ---------------------------------------------------------------------
-- Revoke column-level SELECT on the plaintext columns from non-service
-- roles as a defense-in-depth. RLS still blocks non-owners, but this
-- ensures even owner SELECTs don't return the plaintext via client.
-- ---------------------------------------------------------------------
REVOKE SELECT (mp_access_token, mp_refresh_token) ON public.provider_mp_accounts FROM authenticated, anon;

COMMENT ON FUNCTION public.set_provider_mp_tokens(uuid, text, text) IS
  'Service-role only. Stores MP OAuth tokens at rest using pgp_sym_encrypt with key from vault.';
COMMENT ON FUNCTION public.get_provider_mp_access_token(uuid) IS
  'Service-role only. Returns decrypted access token. Fallback to plaintext column during rollout.';
