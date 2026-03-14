-- Grant SELECT on profiles_public view to anon and authenticated roles
GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;