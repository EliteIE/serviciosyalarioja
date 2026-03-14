
-- Add new statuses to service_status enum
ALTER TYPE public.service_status ADD VALUE IF NOT EXISTS 'presupuestado' AFTER 'nuevo';
ALTER TYPE public.service_status ADD VALUE IF NOT EXISTS 'finalizado_prestador' AFTER 'en_progreso';

-- Add verification_code column to service_requests
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- Create extra_charges table
CREATE TABLE IF NOT EXISTS public.extra_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.extra_charges ENABLE ROW LEVEL SECURITY;

-- RLS: involved users can view extra charges
CREATE POLICY "Involved users can view extra charges" ON public.extra_charges
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = extra_charges.service_request_id
      AND (sr.client_id = auth.uid() OR sr.provider_id = auth.uid())
    )
  );

-- RLS: provider can insert extra charges
CREATE POLICY "Provider can create extra charges" ON public.extra_charges
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = extra_charges.service_request_id
      AND sr.provider_id = auth.uid()
      AND sr.status = 'en_progreso'::service_status
    )
  );

-- RLS: client can update extra charges (approve/reject)
CREATE POLICY "Client can update extra charges" ON public.extra_charges
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = extra_charges.service_request_id
      AND sr.client_id = auth.uid()
    )
  );

-- RLS: admin can manage all
CREATE POLICY "Admins can manage extra charges" ON public.extra_charges
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update the UPDATE policy on service_requests to include new statuses
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

-- Update the trigger to handle new status transitions
CREATE OR REPLACE FUNCTION public.validate_service_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Provider sends budget: nuevo -> presupuestado
  IF NEW.status = 'presupuestado' AND OLD.status = 'nuevo' THEN
    IF auth.uid() IS DISTINCT FROM NEW.provider_id THEN
      RAISE EXCEPTION 'Only the provider can send a budget';
    END IF;
  END IF;

  -- Client accepts budget: presupuestado -> aceptado
  IF NEW.status = 'aceptado' AND OLD.status = 'presupuestado' THEN
    IF auth.uid() IS DISTINCT FROM NEW.client_id THEN
      RAISE EXCEPTION 'Only the client can accept a budget';
    END IF;
  END IF;

  -- Provider starts work: aceptado -> en_progreso (needs verification code)
  IF NEW.status = 'en_progreso' AND OLD.status = 'aceptado' THEN
    IF auth.uid() IS DISTINCT FROM NEW.provider_id THEN
      RAISE EXCEPTION 'Only the assigned provider can start work';
    END IF;
  END IF;

  -- Provider marks as done: en_progreso -> finalizado_prestador
  IF NEW.status = 'finalizado_prestador' AND OLD.status = 'en_progreso' THEN
    IF auth.uid() IS DISTINCT FROM NEW.provider_id THEN
      RAISE EXCEPTION 'Only the provider can mark work as finished';
    END IF;
  END IF;

  -- Client confirms completion: finalizado_prestador -> completado
  IF NEW.status = 'completado' AND OLD.status = 'finalizado_prestador' THEN
    IF auth.uid() IS DISTINCT FROM NEW.client_id THEN
      RAISE EXCEPTION 'Only the client can confirm completion';
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

-- Update SELECT policy for providers to also see presupuestado requests they sent
DROP POLICY IF EXISTS "Providers can view assigned requests" ON public.service_requests;
CREATE POLICY "Providers can view assigned requests" ON public.service_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = provider_id);
