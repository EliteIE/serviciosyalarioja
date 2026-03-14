
-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a security definer function to get protected field values
CREATE OR REPLACE FUNCTION public.get_profile_protected_fields(_user_id uuid)
RETURNS TABLE(
  provider_verified boolean,
  rating_avg numeric,
  completed_jobs integer,
  review_count integer,
  is_provider boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.provider_verified, p.rating_avg, p.completed_jobs, p.review_count, p.is_provider
  FROM public.profiles p
  WHERE p.id = _user_id
$$;

-- Recreate the policy using the security definer function (no recursion)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND provider_verified = (SELECT pf.provider_verified FROM public.get_profile_protected_fields(auth.uid()) pf)
    AND rating_avg = (SELECT pf.rating_avg FROM public.get_profile_protected_fields(auth.uid()) pf)
    AND completed_jobs = (SELECT pf.completed_jobs FROM public.get_profile_protected_fields(auth.uid()) pf)
    AND review_count = (SELECT pf.review_count FROM public.get_profile_protected_fields(auth.uid()) pf)
    AND is_provider = (SELECT pf.is_provider FROM public.get_profile_protected_fields(auth.uid()) pf)
  );
