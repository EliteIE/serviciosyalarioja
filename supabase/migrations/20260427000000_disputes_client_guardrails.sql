-- =====================================================================
-- Dispute guardrails — client-opened disputes.
--
-- Adds:
--   * validate_dispute_insert() BEFORE INSERT trigger — authorship,
--     service-request participation, status eligibility, min reason
--     length, non-negative amount.
--   * unique_active_dispute_per_service partial unique index —
--     prevents duplicate active disputes on the same service request.
--   * notify_on_dispute_opened() AFTER INSERT trigger — notifies the
--     counterpart user and every admin.
--
-- All error messages are in Spanish (surfaced verbatim by PostgREST
-- as SQLSTATE P0001 payloads).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Validation trigger
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_dispute_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_sr record;
BEGIN
  IF NEW.opened_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Solo podés abrir disputas en tu propio nombre.'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT client_id, provider_id, status
    INTO v_sr
  FROM public.service_requests
  WHERE id = NEW.service_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La solicitud de servicio no existe.'
      USING ERRCODE = 'P0001';
  END IF;

  IF auth.uid() NOT IN (v_sr.client_id, v_sr.provider_id) THEN
    RAISE EXCEPTION 'No tenés permiso para abrir una disputa sobre esta solicitud.'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_sr.status NOT IN ('en_progreso', 'finalizado_prestador', 'completado') THEN
    RAISE EXCEPTION 'Solo podés abrir disputas en servicios en progreso, finalizados por el prestador o completados.'
      USING ERRCODE = 'P0001';
  END IF;

  IF NEW.reason IS NULL OR length(trim(NEW.reason)) < 20 THEN
    RAISE EXCEPTION 'El motivo debe tener al menos 20 caracteres.'
      USING ERRCODE = 'P0001';
  END IF;

  IF NEW.amount IS NOT NULL AND NEW.amount < 0 THEN
    RAISE EXCEPTION 'El monto no puede ser negativo.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_dispute_insert_trigger ON public.disputes;
CREATE TRIGGER validate_dispute_insert_trigger
BEFORE INSERT ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.validate_dispute_insert();

-- ---------------------------------------------------------------------
-- One active dispute per service request
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_dispute_per_service
  ON public.disputes (service_request_id)
  WHERE status IN ('abierta', 'en_revision') AND deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- Fan-out notification trigger
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_dispute_opened()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_sr record;
  v_counterpart uuid;
  v_admin record;
BEGIN
  SELECT client_id, provider_id, titulo
    INTO v_sr
  FROM public.service_requests
  WHERE id = NEW.service_request_id;

  IF FOUND THEN
    v_counterpart := CASE
      WHEN NEW.opened_by = v_sr.client_id THEN v_sr.provider_id
      ELSE v_sr.client_id
    END;

    IF v_counterpart IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        v_counterpart,
        'dispute_opened',
        'Se abrió una disputa',
        format('Se abrió una disputa sobre "%s". Revisá los detalles.', coalesce(v_sr.titulo, 'tu servicio')),
        jsonb_build_object(
          'dispute_id', NEW.id,
          'service_request_id', NEW.service_request_id
        )
      );
    END IF;
  END IF;

  FOR v_admin IN
    SELECT id FROM public.profiles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      v_admin.id,
      'dispute_opened',
      'Nueva disputa',
      format('Se abrió una nueva disputa (ID: %s).', NEW.id::text),
      jsonb_build_object(
        'dispute_id', NEW.id,
        'service_request_id', NEW.service_request_id,
        'opened_by', NEW.opened_by
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_dispute_opened_trigger ON public.disputes;
CREATE TRIGGER notify_on_dispute_opened_trigger
AFTER INSERT ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_dispute_opened();

COMMENT ON FUNCTION public.validate_dispute_insert() IS
  'Guards dispute creation: authorship, participation, status, reason length, amount.';
COMMENT ON FUNCTION public.notify_on_dispute_opened() IS
  'Fans out a notification to the counterpart and every admin when a dispute is opened.';
