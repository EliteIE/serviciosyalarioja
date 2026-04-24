-- =====================================================================
-- Drop MercadoPago plaintext token columns + remove plaintext fallback.
--
-- Precondition: the previous migration (20260424000002_encrypt_mp_tokens)
-- must have backfilled every row's *_enc columns and the OAuth edge
-- function must be deployed writing via set_provider_mp_tokens RPC.
--
-- This migration fails LOUDLY if any row still has plaintext data that
-- has not been encrypted — we refuse to silently drop secrets. If it
-- fires, set the vault key, rerun the backfill in 20260424000002, and
-- re-apply this migration.
-- =====================================================================

-- -----------------------------------------------------------------
-- Safety gate: abort if any provider row holds a plaintext token
-- that was never encrypted. An empty string is considered "no
-- plaintext present" because the edge function writes '' to satisfy
-- the old NOT NULL constraint (see mercadopago-oauth/index.ts).
-- -----------------------------------------------------------------
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
      'Refusing to drop plaintext columns: % row(s) still have unencrypted tokens. '
      'Set vault secret mp_token_key and rerun the backfill in 20260424000002.',
      v_unmigrated;
  END IF;
END $$;

-- -----------------------------------------------------------------
-- Recreate the read accessor without the plaintext fallback. Any row
-- without an *_enc value now returns NULL — the caller (edge fn) must
-- surface this as a configuration error instead of silently failing.
-- -----------------------------------------------------------------
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
  'Service-role only. Returns decrypted MP access token. Returns NULL if the provider has no encrypted token on file (caller must treat as misconfigured).';

-- -----------------------------------------------------------------
-- Drop the plaintext columns. After this, at-rest storage of MP OAuth
-- tokens is encrypted-only.
-- -----------------------------------------------------------------
ALTER TABLE public.provider_mp_accounts
  DROP COLUMN IF EXISTS mp_access_token,
  DROP COLUMN IF EXISTS mp_refresh_token;
