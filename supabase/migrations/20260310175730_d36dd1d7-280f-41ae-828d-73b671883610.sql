-- Fix 1: RLS policy - add category filter for providers viewing new requests
DROP POLICY IF EXISTS "Providers can view new requests in their category" ON public.service_requests;
CREATE POLICY "Providers can view new requests in their category"
ON public.service_requests FOR SELECT
TO authenticated
USING (
  status = 'nuevo'
  AND public.has_role(auth.uid(), 'provider'::app_role)
  AND category = (
    SELECT provider_category FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Fix 2: Status transition validation trigger
CREATE OR REPLACE FUNCTION public.validate_service_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only provider can mark as completed
  IF NEW.status = 'completado' AND OLD.status != 'completado' THEN
    IF auth.uid() IS DISTINCT FROM NEW.provider_id THEN
      RAISE EXCEPTION 'Only the assigned provider can mark a request as completed';
    END IF;
  END IF;

  -- Only provider can accept (set to aceptado or en_progreso from nuevo)
  IF NEW.status IN ('aceptado', 'en_progreso') AND OLD.status = 'nuevo' THEN
    IF auth.uid() IS DISTINCT FROM NEW.provider_id THEN
      RAISE EXCEPTION 'Only the assigned provider can accept a request';
    END IF;
  END IF;

  -- Prevent client from changing provider_id to arbitrary value
  IF OLD.provider_id IS NOT NULL AND NEW.provider_id IS DISTINCT FROM OLD.provider_id THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Cannot change the assigned provider';
    END IF;
  END IF;

  -- Only client or admin can cancel
  IF NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
    IF auth.uid() IS DISTINCT FROM NEW.client_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only the client or admin can cancel a request';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_service_status ON public.service_requests;
CREATE TRIGGER validate_service_status
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_service_status_transition();