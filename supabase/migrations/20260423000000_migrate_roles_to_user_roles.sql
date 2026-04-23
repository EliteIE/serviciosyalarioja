-- Migración para invalidar is_provider y usar user_roles en las políticas
-- 1. Actualizar "Anon can view verified provider profiles"
DROP POLICY IF EXISTS "Anon can view verified provider profiles" ON public.profiles;
CREATE POLICY "Anon can view verified provider profiles"
ON public.profiles
FOR SELECT
TO anon
USING (public.has_role(id, 'provider') = true AND provider_verified = true);

-- 2. Actualizar "Anyone can view verified provider profiles"
DROP POLICY IF EXISTS "Anyone can view verified provider profiles" ON public.profiles;
CREATE POLICY "Anyone can view verified provider profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(id, 'provider') = true AND provider_verified = true);

-- 3. Limpiar is_provider en todos los perfiles de manera segura (No dropeamos para no romper vistas inmediatamente, pero igualamos a NULL/false preferiblemente)
UPDATE public.profiles SET is_provider = false;

-- 4. Modificar trigger para NUNCA asignar is_provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile WITHOUT is_provider
  INSERT INTO public.profiles (id, full_name, avatar_url, is_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;

  -- SECURITY: Always assign 'client' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
