-- =====================================================================
-- Hardens payment idempotency and RLS surface.
--
-- 1) Unique index on completed payment by mp_payment_id (partial, so
--    retries from MP that carry the same id can't create a second row
--    marked as completed).
-- 2) Unique index preventing two "pending" payments for the same SR
--    (prevents race where user hits checkout twice).
-- 3) Service-role INSERT policy on payments (the webhook writes with
--    service role; making the intent explicit reduces drift if we
--    ever tighten service_role privileges at the DB level).
-- =====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS payments_mp_payment_id_completed_uidx
  ON public.payments (mp_payment_id)
  WHERE mp_payment_id IS NOT NULL AND status = 'completed';

CREATE UNIQUE INDEX IF NOT EXISTS payments_service_request_pending_uidx
  ON public.payments (service_request_id)
  WHERE status = 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'payments'
      AND policyname = 'Service role manages payments'
  ) THEN
    CREATE POLICY "Service role manages payments"
      ON public.payments
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
