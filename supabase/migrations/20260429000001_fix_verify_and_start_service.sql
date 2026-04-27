-- Migration: 20260429000001_fix_verify_and_start_service.sql
-- Description: Robust RPC for service verification to prevent hanging queries and catch trigger exceptions

DROP FUNCTION IF EXISTS public.verify_and_start_service(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.verify_and_start_service(p_request_id UUID, p_code TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request record;
BEGIN
  -- 1. Find the service request
  SELECT * INTO v_request 
  FROM public.service_requests 
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Solicitud no encontrada');
  END IF;

  -- 2. Verify status
  IF v_request.status != 'aceptado' THEN
    RETURN json_build_object('success', false, 'error', 'El servicio no está en estado aceptado');
  END IF;

  -- 3. Verify provider
  -- PostgREST sets the JWT claims in the connection configuration.
  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM v_request.provider_id THEN
    RETURN json_build_object('success', false, 'error', 'Solo el prestador asignado puede iniciar este servicio');
  END IF;

  -- 4. Verify code (case insensitive, trimmed)
  IF UPPER(TRIM(v_request.verification_code)) != UPPER(TRIM(p_code)) THEN
    RETURN json_build_object('success', false, 'error', 'Código de verificación incorrecto');
  END IF;

  -- 5. Update status
  UPDATE public.service_requests 
  SET status = 'en_progreso' 
  WHERE id = p_request_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    -- Capture any trigger exceptions (e.g., from validate_service_status_transition)
    -- and return them cleanly to the frontend instead of causing a 500/hanging error.
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
