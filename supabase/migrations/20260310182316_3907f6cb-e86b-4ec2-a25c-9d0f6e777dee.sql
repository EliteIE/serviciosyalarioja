
-- Allow users to see profiles of their counterparts in service requests
CREATE POLICY "Users can view counterpart profiles in service requests"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_requests sr
    WHERE (
      (sr.client_id = auth.uid() AND sr.provider_id = profiles.id)
      OR (sr.provider_id = auth.uid() AND sr.client_id = profiles.id)
      OR (sr.client_id = profiles.id AND sr.status = 'nuevo' AND sr.category = (
        SELECT p.provider_category FROM public.profiles p WHERE p.id = auth.uid()
      ))
    )
  )
);
