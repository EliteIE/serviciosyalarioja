
-- 1. Fix profiles UPDATE policy: prevent self-elevation
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND provider_verified = (SELECT p.provider_verified FROM public.profiles p WHERE p.id = auth.uid())
    AND rating_avg = (SELECT p.rating_avg FROM public.profiles p WHERE p.id = auth.uid())
    AND completed_jobs = (SELECT p.completed_jobs FROM public.profiles p WHERE p.id = auth.uid())
    AND review_count = (SELECT p.review_count FROM public.profiles p WHERE p.id = auth.uid())
    AND is_provider = (SELECT p.is_provider FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 2. Drop the public media read policy
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;

CREATE POLICY "Users can read own media" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow reading media for counterparts in service requests (e.g. photos)
CREATE POLICY "Users can read media of their service requests" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE (sr.client_id = auth.uid() OR sr.provider_id = auth.uid())
        AND sr.photos IS NOT NULL
    )
  );
