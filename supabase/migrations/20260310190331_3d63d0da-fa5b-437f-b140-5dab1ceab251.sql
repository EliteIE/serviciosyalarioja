
-- Create security definer function to get provider_category without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_provider_category()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT provider_category FROM public.profiles WHERE id = auth.uid()
$$;

-- Fix profiles SELECT policy that has recursive subquery
DROP POLICY IF EXISTS "Users can view counterpart profiles in service requests" ON public.profiles;

CREATE POLICY "Users can view counterpart profiles in service requests" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE (
        (sr.client_id = auth.uid() AND sr.provider_id = profiles.id)
        OR (sr.provider_id = auth.uid() AND sr.client_id = profiles.id)
        OR (sr.client_id = profiles.id AND sr.status = 'nuevo'::service_status AND sr.category = public.get_my_provider_category())
      )
    )
  );

-- Fix service_requests SELECT policy that queries profiles
DROP POLICY IF EXISTS "Providers can view new requests in their category" ON public.service_requests;

CREATE POLICY "Providers can view new requests in their category" ON public.service_requests
  FOR SELECT TO authenticated
  USING (
    status = 'nuevo'::service_status
    AND has_role(auth.uid(), 'provider'::app_role)
    AND category = public.get_my_provider_category()
  );
