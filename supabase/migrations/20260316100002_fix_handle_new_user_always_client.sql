-- SECURITY FIX: handle_new_user must ALWAYS assign 'client' role
-- The is_provider metadata from signUp is client-controlled and cannot be trusted for role assignment.
-- Provider role promotion should be done through a separate admin-controlled flow.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with is_provider flag (for UI purposes only)
  INSERT INTO public.profiles (id, full_name, avatar_url, is_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_provider')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;

  -- SECURITY: Always assign 'client' role regardless of is_provider metadata
  -- Provider role must be granted through admin verification process
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If user requested provider access, also add client role but NOT provider role
  -- Provider role will be added after admin verification
  RETURN NEW;
END;
$$;
