-- Create rate_limits table for edge function rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  identifier text NOT NULL,
  window_seconds int NOT NULL,
  max_requests int NOT NULL DEFAULT 10,
  request_count int NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (identifier, window_seconds)
);

-- Enable RLS but allow function access
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create the check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_window_seconds int DEFAULT 60,
  p_max_requests int DEFAULT 10
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_window_start timestamptz;
BEGIN
  -- Try to get existing rate limit entry
  SELECT request_count, window_start
  INTO v_count, v_window_start
  FROM rate_limits
  WHERE identifier = p_key AND window_seconds = p_window_seconds;

  IF NOT FOUND THEN
    -- First request: create entry
    INSERT INTO rate_limits (identifier, window_seconds, max_requests, request_count, window_start)
    VALUES (p_key, p_window_seconds, p_max_requests, 1, now())
    ON CONFLICT (identifier, window_seconds) DO UPDATE
    SET request_count = 1, window_start = now(), max_requests = p_max_requests;
    RETURN true;
  END IF;

  -- Check if window has expired
  IF v_window_start + (p_window_seconds || ' seconds')::interval < now() THEN
    -- Reset window
    UPDATE rate_limits
    SET request_count = 1, window_start = now(), max_requests = p_max_requests
    WHERE identifier = p_key AND window_seconds = p_window_seconds;
    RETURN true;
  END IF;

  -- Window still active: check count
  IF v_count >= p_max_requests THEN
    RETURN false;  -- Rate limited
  END IF;

  -- Increment counter
  UPDATE rate_limits
  SET request_count = request_count + 1
  WHERE identifier = p_key AND window_seconds = p_window_seconds;

  RETURN true;
END;
$$;

-- Grant execute to all roles that need it
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO service_role;

-- Cleanup old entries periodically (optional: run via pg_cron)
-- DELETE FROM rate_limits WHERE window_start + (window_seconds || ' seconds')::interval < now() - interval '1 hour';
