-- =====================================================================
-- handle_new_user — pick up CUIT and phone from signup metadata.
--
-- The provider signup form sends `cuit` and `phone` inside
-- raw_user_meta_data, but the previous trigger only copied
-- full_name / avatar_url / is_provider. When email confirmation is
-- enabled, the form's follow-up `profiles.update()` is skipped (no
-- session yet), so the CUIT was being lost.
--
-- This version copies the extra fields with defensive validation:
--   * cuit: only persisted if validate_cuit_format() passes — otherwise
--     stored as NULL so the row can still be inserted (the CHECK
--     constraint on profiles.cuit only allows NULL or a valid CUIT).
--   * phone: trimmed and lower-bounded to 4 chars; otherwise NULL.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_cuit  text := NEW.raw_user_meta_data->>'cuit';
  meta_phone text := NEW.raw_user_meta_data->>'phone';
  safe_cuit  text;
  safe_phone text;
BEGIN
  -- Defensive: only persist CUIT if it passes the AFIP checksum.
  IF meta_cuit IS NOT NULL AND public.validate_cuit_format(meta_cuit) THEN
    safe_cuit := meta_cuit;
  ELSE
    safe_cuit := NULL;
  END IF;

  IF meta_phone IS NOT NULL AND length(trim(meta_phone)) >= 4 THEN
    safe_phone := trim(meta_phone);
  ELSE
    safe_phone := NULL;
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url, is_provider, cuit, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_provider')::boolean, false),
    safe_cuit,
    safe_phone
  )
  ON CONFLICT (id) DO NOTHING;

  -- SECURITY: Always assign 'client' role regardless of is_provider metadata.
  -- Provider role must be granted through admin verification process.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Bootstraps profile + client role on auth.users insert. Captures cuit and phone from signup metadata when valid.';
