-- Migration: 20260429000000_secure_negotiation_terms.sql
-- Description: Locks budget_amount and core service details after agreement to prevent tampering

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

  -- SECURITY GUARDRAILS: Immutability of agreed terms
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    -- Prevent changing the budget amount after it has been accepted
    IF OLD.status IN ('aceptado', 'en_progreso', 'finalizado_prestador', 'completado') THEN
      IF NEW.budget_amount IS DISTINCT FROM OLD.budget_amount THEN
        RAISE EXCEPTION 'Cannot change the budget amount once it has been accepted. Use extra charges instead.';
      END IF;
    END IF;

    -- Prevent changing core service details after a provider has budgeted or accepted
    IF OLD.status != 'nuevo' AND OLD.status != 'cancelado' THEN
      IF NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description OR NEW.category IS DISTINCT FROM OLD.category THEN
        RAISE EXCEPTION 'Cannot change core service details after a provider has budgeted. Please cancel and create a new request.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
