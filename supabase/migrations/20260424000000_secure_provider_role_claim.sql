-- =====================================================================
-- Secure provider-role self-claim for OAuth signups.
--
-- Replaces the client-side upgrade (AuthContext.tsx ?oauth_role param)
-- which was silently failing due to RLS (by design) and also opened a
-- footgun if policies ever loosened.
--
-- Gate: user must have been created within the last 10 minutes AND
-- currently hold only the 'client' role. Outside that window the RPC
-- is a no-op and the user must request verification by an admin.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.claim_provider_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_created_at timestamptz;
  v_current_role text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT created_at INTO v_created_at
  FROM auth.users
  WHERE id = v_user_id;

  IF v_created_at IS NULL OR v_created_at < now() - interval '10 minutes' THEN
    -- Silent no-op for stale claims; prevents URL-param privilege escalation.
    RETURN false;
  END IF;

  SELECT role::text INTO v_current_role
  FROM public.user_roles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_current_role IS DISTINCT FROM 'client' THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET is_provider = true,
      provider_verified = false,
      provider_available = false,
      provider_verification_status = 'pending'
  WHERE id = v_user_id;

  UPDATE public.user_roles
  SET role = 'provider'
  WHERE user_id = v_user_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_provider_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_provider_role() TO authenticated;

COMMENT ON FUNCTION public.claim_provider_role() IS
  'Self-claim provider role during OAuth signup window (10 min). No-op otherwise.';
