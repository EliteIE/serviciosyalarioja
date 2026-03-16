-- Secure function to get provider bank details only for the client of the service
CREATE OR REPLACE FUNCTION public.get_provider_bank_details(
  p_service_request_id uuid
)
RETURNS TABLE (
  full_name text,
  bank_alias text,
  bank_cvu text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_provider_id uuid;
BEGIN
  -- Verify the caller is the client of this service request
  SELECT sr.client_id, sr.provider_id
  INTO v_client_id, v_provider_id
  FROM service_requests sr
  WHERE sr.id = p_service_request_id;

  IF NOT FOUND THEN
    RETURN;  -- Service request not found
  END IF;

  -- SECURITY: Only the client of this service can view provider bank details
  IF v_client_id != auth.uid() THEN
    RETURN;  -- Not authorized
  END IF;

  IF v_provider_id IS NULL THEN
    RETURN;  -- No provider assigned
  END IF;

  -- Return provider bank details
  RETURN QUERY
  SELECT p.full_name, p.bank_alias, p.bank_cvu
  FROM profiles p
  WHERE p.id = v_provider_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_provider_bank_details TO authenticated;
