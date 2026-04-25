-- =====================================================================
-- Security hardening based on Supabase advisor findings.
--
--   1. Recreate views with security_invoker=on so RLS is enforced
--      against the *querying user*, not the view creator.
--   2. Pin search_path on all SECURITY DEFINER functions so a
--      hostile temp schema can't shadow public objects.
--   3. Restrict audit_log INSERT to the inserting user's own
--      user_id (was WITH CHECK true).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Views — switch to security_invoker
-- ---------------------------------------------------------------------
ALTER VIEW public.my_bank_details SET (security_invoker = on);
ALTER VIEW public.profiles_public SET (security_invoker = on);

-- ---------------------------------------------------------------------
-- 2. Pin search_path on SECURITY DEFINER functions
-- ---------------------------------------------------------------------
ALTER FUNCTION public.fn_update_completed_jobs()       SET search_path = public, pg_catalog;
ALTER FUNCTION public.cleanup_rate_limits()            SET search_path = public, pg_catalog;
ALTER FUNCTION public.log_payment_changes()            SET search_path = public, pg_catalog;
ALTER FUNCTION public.log_service_status_changes()     SET search_path = public, pg_catalog;
ALTER FUNCTION public.log_profile_changes()            SET search_path = public, pg_catalog;
ALTER FUNCTION public.delete_my_account()              SET search_path = public, pg_catalog;
ALTER FUNCTION public.notify_admin_new_dispute()       SET search_path = public, pg_catalog;
ALTER FUNCTION public.notify_admin_payment_failed()    SET search_path = public, pg_catalog;
ALTER FUNCTION public.notify_admin_new_provider()      SET search_path = public, pg_catalog;
ALTER FUNCTION public.notify_admin_bad_review()        SET search_path = public, pg_catalog;
ALTER FUNCTION public.notify_provider_verification()   SET search_path = public, pg_catalog;
ALTER FUNCTION public.notify_dispute_resolved()        SET search_path = public, pg_catalog;

-- ---------------------------------------------------------------------
-- 3. audit_log INSERT — drop permissive policy, replace with user-scoped
-- Triggers are SECURITY DEFINER so they bypass RLS regardless;
-- this only affects direct client inserts.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;
CREATE POLICY "Users can insert their own audit logs"
  ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
