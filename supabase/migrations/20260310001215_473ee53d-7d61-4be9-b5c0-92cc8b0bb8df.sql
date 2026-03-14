-- Recreate the view as SECURITY INVOKER (default, not SECURITY DEFINER)
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT
  id, full_name, avatar_url, bio, location,
  is_provider, provider_available, provider_verified,
  provider_category, provider_price_range, provider_coverage_area,
  completed_jobs, rating_avg, review_count, response_time,
  created_at, updated_at
FROM public.profiles;

-- Re-grant access
GRANT SELECT ON public.profiles_public TO anon, authenticated;