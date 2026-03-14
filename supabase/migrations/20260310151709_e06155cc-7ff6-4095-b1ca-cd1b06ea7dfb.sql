CREATE POLICY "Anon can view verified provider profiles"
ON public.profiles
FOR SELECT
TO anon
USING (is_provider = true AND provider_verified = true);