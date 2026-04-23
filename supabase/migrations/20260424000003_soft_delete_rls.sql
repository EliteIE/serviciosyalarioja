-- =====================================================================
-- Filter soft-deleted rows out of RLS policies.
--
-- Migration 20260422221051 added deleted_at columns but left policies
-- unchanged, meaning soft-deleted rows were still visible/mutable.
-- Admins can still see everything via their existing FOR ALL policies;
-- regular users now see only live rows.
-- =====================================================================

-- ---- profiles: public read of verified providers ----
DROP POLICY IF EXISTS "Anon can view verified provider profiles" ON public.profiles;
CREATE POLICY "Anon can view verified provider profiles"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (
    public.has_role(id, 'provider') = true
    AND provider_verified = true
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Anyone can view verified provider profiles" ON public.profiles;
CREATE POLICY "Anyone can view verified provider profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(id, 'provider') = true
    AND provider_verified = true
    AND deleted_at IS NULL
  );

-- ---- service_requests: involved parties ----
DROP POLICY IF EXISTS "Involved users can view requests" ON public.service_requests;
CREATE POLICY "Involved users can view requests"
  ON public.service_requests
  FOR SELECT
  USING (
    (auth.uid() = client_id OR auth.uid() = provider_id)
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Involved users can update requests" ON public.service_requests;
CREATE POLICY "Involved users can update requests"
  ON public.service_requests
  FOR UPDATE
  USING (
    (auth.uid() = client_id OR auth.uid() = provider_id)
    AND deleted_at IS NULL
  );

-- ---- reviews: public read + own read ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Reviews are viewable by everyone') THEN
    DROP POLICY "Reviews are viewable by everyone" ON public.reviews;
  END IF;
  CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews
    FOR SELECT
    USING (deleted_at IS NULL);
END $$;

-- ---- messages: own conversations only ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Users can view own messages') THEN
    DROP POLICY "Users can view own messages" ON public.messages;
    CREATE POLICY "Users can view own messages"
      ON public.messages
      FOR SELECT
      USING (
        (auth.uid() = sender_id OR auth.uid() = receiver_id)
        AND deleted_at IS NULL
      );
  END IF;
END $$;

-- ---- notifications: own only ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='Users can view own notifications') THEN
    DROP POLICY "Users can view own notifications" ON public.notifications;
    CREATE POLICY "Users can view own notifications"
      ON public.notifications
      FOR SELECT
      USING (auth.uid() = user_id AND deleted_at IS NULL);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='Users can update own notifications') THEN
    DROP POLICY "Users can update own notifications" ON public.notifications;
    CREATE POLICY "Users can update own notifications"
      ON public.notifications
      FOR UPDATE
      USING (auth.uid() = user_id AND deleted_at IS NULL);
  END IF;
END $$;

-- ---- disputes: involved parties + admin ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='disputes' AND policyname='Involved users can view disputes') THEN
    DROP POLICY "Involved users can view disputes" ON public.disputes;
    CREATE POLICY "Involved users can view disputes"
      ON public.disputes
      FOR SELECT
      USING (
        (auth.uid() = client_id OR auth.uid() = provider_id OR public.has_role(auth.uid(), 'admin'))
        AND deleted_at IS NULL
      );
  END IF;
END $$;

-- ---- portfolio_items / provider_services: public read of live rows ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portfolio_items') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='portfolio_items' AND policyname='Portfolio items are viewable by everyone') THEN
      DROP POLICY "Portfolio items are viewable by everyone" ON public.portfolio_items;
    END IF;
    CREATE POLICY "Portfolio items are viewable by everyone"
      ON public.portfolio_items
      FOR SELECT
      USING (deleted_at IS NULL);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='provider_services') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_services' AND policyname='Provider services are viewable by everyone') THEN
      DROP POLICY "Provider services are viewable by everyone" ON public.provider_services;
    END IF;
    CREATE POLICY "Provider services are viewable by everyone"
      ON public.provider_services
      FOR SELECT
      USING (deleted_at IS NULL);
  END IF;
END $$;

-- ---- review-stats trigger should ignore soft-deleted reviews ----
CREATE OR REPLACE FUNCTION public.fn_update_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id uuid := COALESCE(NEW.provider_id, OLD.provider_id);
  v_avg numeric;
  v_count integer;
BEGIN
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
    INTO v_avg, v_count
  FROM public.reviews
  WHERE provider_id = v_provider_id
    AND deleted_at IS NULL;

  UPDATE public.profiles
  SET rating_avg   = v_avg,
      review_count = v_count
  WHERE id = v_provider_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;
