-- =====================================================================
-- Provider CUIT (Argentine tax ID).
--
-- Adds a `cuit` column to public.profiles, stored as 11 digits with no
-- separators. A SECURITY-INVOKER IMMUTABLE function validates the
-- official AFIP checksum so the database itself rejects malformed
-- values, regardless of where the INSERT/UPDATE comes from.
--
-- The column is nullable so existing rows (and clients, who do not
-- need a CUIT) remain valid. New providers enter their CUIT during
-- signup and the value is updated alongside the verification flow.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Validation function — AFIP CUIT/CUIL checksum.
--
-- Algorithm: take the first 10 digits, multiply each by the weight
-- vector (5,4,3,2,7,6,5,4,3,2), sum, compute (11 - sum mod 11) mod 11.
-- If result == 10 the CUIT is invalid (no checksum can be 10).
-- Otherwise the result must equal the 11th digit.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_cuit_format(p_cuit text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
SET search_path = public, pg_catalog
AS $$
DECLARE
  weights CONSTANT int[] := ARRAY[5,4,3,2,7,6,5,4,3,2];
  digits  int[];
  sum_val int := 0;
  expected int;
  given    int;
  i        int;
BEGIN
  IF p_cuit IS NULL THEN
    RETURN false;
  END IF;
  IF length(p_cuit) <> 11 OR p_cuit !~ '^[0-9]{11}$' THEN
    RETURN false;
  END IF;

  -- Convert to int array digit-by-digit
  FOR i IN 1..11 LOOP
    digits[i] := substring(p_cuit FROM i FOR 1)::int;
  END LOOP;

  -- Compute weighted sum of first 10 digits
  FOR i IN 1..10 LOOP
    sum_val := sum_val + (digits[i] * weights[i]);
  END LOOP;

  expected := (11 - (sum_val % 11)) % 11;
  IF expected = 10 THEN
    RETURN false;
  END IF;

  given := digits[11];
  RETURN expected = given;
END;
$$;

COMMENT ON FUNCTION public.validate_cuit_format(text) IS
  'Returns true iff the input is exactly 11 digits and the AFIP CUIT/CUIL checksum is valid.';

-- ---------------------------------------------------------------------
-- 2. Column + CHECK constraint
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cuit text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_cuit_valid
  CHECK (cuit IS NULL OR public.validate_cuit_format(cuit));

-- Partial unique index: a CUIT may only belong to one profile, but
-- multiple NULLs are allowed (clients).
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cuit_unique
  ON public.profiles (cuit)
  WHERE cuit IS NOT NULL;

COMMENT ON COLUMN public.profiles.cuit IS
  '11-digit AFIP CUIT/CUIL with no separators. Required for providers, optional for clients. Validated by validate_cuit_format().';
