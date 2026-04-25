-- =====================================================================
-- Restrict avatars bucket SELECT policy.
--
-- Public buckets serve files via CDN without consulting RLS — so
-- public read access for other users' avatars is preserved by the
-- public bucket flag itself. The previous broad SELECT policy was
-- only needed for `.list()` calls. We scope it to the user's own
-- folder so clients can only enumerate their own files.
-- =====================================================================

DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

CREATE POLICY "Users can list own avatar files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
