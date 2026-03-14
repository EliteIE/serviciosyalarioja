-- Allow all authenticated users to see verified provider profiles (needed for search/profiles_public view)
CREATE POLICY "Anyone can view verified provider profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_provider = true AND provider_verified = true);
