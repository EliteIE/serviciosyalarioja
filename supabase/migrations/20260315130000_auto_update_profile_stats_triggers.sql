-- Auto-update completed_jobs when service_request status changes to/from 'completado'
CREATE OR REPLACE FUNCTION public.fn_update_completed_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- New status is completado → increment provider's count
  IF NEW.status = 'completado' AND (OLD.status IS DISTINCT FROM 'completado') AND NEW.provider_id IS NOT NULL THEN
    UPDATE public.profiles
    SET completed_jobs = COALESCE(completed_jobs, 0) + 1
    WHERE id = NEW.provider_id;
  END IF;

  -- Was completado, no longer → decrement
  IF OLD.status = 'completado' AND NEW.status <> 'completado' AND OLD.provider_id IS NOT NULL THEN
    UPDATE public.profiles
    SET completed_jobs = GREATEST(COALESCE(completed_jobs, 0) - 1, 0)
    WHERE id = OLD.provider_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_completed_jobs ON public.service_requests;
CREATE TRIGGER trg_update_completed_jobs
  AFTER UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_completed_jobs();

-- Auto-update rating_avg and review_count when reviews are inserted or deleted
CREATE OR REPLACE FUNCTION public.fn_update_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
  avg_val NUMERIC;
  cnt_val INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.reviewed_id;
  ELSE
    target_id := NEW.reviewed_id;
  END IF;

  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO avg_val, cnt_val
  FROM public.reviews
  WHERE reviewed_id = target_id;

  UPDATE public.profiles
  SET rating_avg = ROUND(avg_val, 2),
      review_count = cnt_val
  WHERE id = target_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_review_stats ON public.reviews;
CREATE TRIGGER trg_update_review_stats
  AFTER INSERT OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_review_stats();

-- Backfill existing data
UPDATE public.profiles p
SET completed_jobs = sub.cnt
FROM (
  SELECT provider_id, COUNT(*) AS cnt
  FROM public.service_requests
  WHERE status = 'completado' AND provider_id IS NOT NULL
  GROUP BY provider_id
) sub
WHERE p.id = sub.provider_id;

UPDATE public.profiles p
SET rating_avg = sub.avg_val,
    review_count = sub.cnt
FROM (
  SELECT reviewed_id, ROUND(AVG(rating), 2) AS avg_val, COUNT(*) AS cnt
  FROM public.reviews
  GROUP BY reviewed_id
) sub
WHERE p.id = sub.reviewed_id;
