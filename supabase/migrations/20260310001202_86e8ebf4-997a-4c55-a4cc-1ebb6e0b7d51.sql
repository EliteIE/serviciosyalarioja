-- Drop the blanket public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a security-barrier view for public profile data (no sensitive fields)
CREATE OR REPLACE VIEW public.profiles_public WITH (security_barrier = true) AS
SELECT
  id, full_name, avatar_url, bio, location,
  is_provider, provider_available, provider_verified,
  provider_category, provider_price_range, provider_coverage_area,
  completed_jobs, rating_avg, review_count, response_time,
  created_at, updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Policy: users can read their own full profile (including phone, docs, notes)
CREATE POLICY "Users can view own full profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: admins can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));