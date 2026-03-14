
-- Fix 1: Correlate media storage read policy with actual photos
DROP POLICY IF EXISTS "Users can read media of their service requests" ON storage.objects;

CREATE POLICY "Users can read media of their service requests" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE (sr.client_id = auth.uid() OR sr.provider_id = auth.uid())
        AND name = ANY(sr.photos)
    )
  );

-- Fix 3: Create oauth_states table for nonce-based OAuth state verification
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - only accessed by service role key in edge functions
