
-- Fix: Allow providers to claim new requests in their category (send budget)
DROP POLICY IF EXISTS "Involved users can update requests" ON public.service_requests;

CREATE POLICY "Involved users can update requests" ON public.service_requests
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = client_id 
    OR auth.uid() = provider_id
    OR (
      status = 'nuevo'::service_status 
      AND provider_id IS NULL 
      AND has_role(auth.uid(), 'provider'::app_role)
      AND category = public.get_my_provider_category()
    )
  );
