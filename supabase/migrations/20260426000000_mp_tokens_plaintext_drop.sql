-- =====================================================================
-- Drop MercadoPago plaintext token columns + remove plaintext fallback.
--
-- Handles pre-existing DB objects that depended on the plaintext columns:
--   * view  public.my_mp_account         (exposed tokens via decrypt_sensitive)
--   * trigger encrypt_mp_tokens_before_upsert + function trigger_encrypt_mp_tokens
--     (legacy base64 encryption under platform_settings.encryption_key,
--      replaced by vault+pgcrypto via set_provider_mp_tokens RPC)
--
-- Safety-gate aborts if any row still has plaintext data without an
-- encrypted counterpart. Empty-string plaintext is treated as "no
-- plaintext present" because the old edge function wrote '' to satisfy
-- NOT NULL.
-- =====================================================================

DO $$
DECLARE
  v_unmigrated int;
BEGIN
  SELECT count(*) INTO v_unmigrated
  FROM public.provider_mp_accounts
  WHERE mp_access_token_enc IS NULL
    AND mp_access_token IS NOT NULL
    AND mp_access_token <> '';

  IF v_unmigrated > 0 THEN
    RAISE EXCEPTION
      'Refusing to drop plaintext columns: % row(s) still unencrypted.',
      v_unmigrated;
  END IF;
END $$;

-- ---------------------------------------------------------------
-- Drop dependents first.
-- ---------------------------------------------------------------
DROP VIEW IF EXISTS public.my_mp_account;

DROP TRIGGER IF EXISTS encrypt_mp_tokens_before_upsert ON public.provider_mp_accounts;
DROP FUNCTION IF EXISTS public.trigger_encrypt_mp_tokens();

-- ---------------------------------------------------------------
-- Recreate read accessor without plaintext fallback.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_provider_mp_access_token(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_key text;
  v_enc bytea;
BEGIN
  SELECT mp_access_token_enc INTO v_enc
  FROM public.provider_mp_accounts
  WHERE user_id = p_user_id;

  IF v_enc IS NULL THEN
    RETURN NULL;
  END IF;

  v_key := public._mp_token_key();
  RETURN extensions.pgp_sym_decrypt(v_enc, v_key);
END;
$$;
REVOKE ALL ON FUNCTION public.get_provider_mp_access_token(uuid) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_provider_mp_access_token(uuid) TO service_role;

COMMENT ON FUNCTION public.get_provider_mp_access_token(uuid) IS
  'Service-role only. Returns decrypted MP access token or NULL if none on file.';

-- ---------------------------------------------------------------
-- Drop the plaintext columns.
-- ---------------------------------------------------------------
ALTER TABLE public.provider_mp_accounts
  DROP COLUMN IF EXISTS mp_access_token,
  DROP COLUMN IF EXISTS mp_refresh_token;
