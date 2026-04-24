-- =====================================================================
-- Provider mandatory identity + background documents
--
-- Legal / trust-safety requirement: before a provider account can be
-- reviewed, the admin team must have three specific documents on file,
-- not just a free-form list of uploads:
--   1. DNI (front)          — argentinian national ID, photo side
--   2. DNI (back)            — argentinian national ID, reverse side
--   3. Certificado de antecedentes penales — criminal record certificate
--
-- We previously stored uploads in a typeless `provider_doc_urls text[]`,
-- which made it impossible for admins to tell which file was which and
-- for the app to block registrations missing a specific document.
--
-- This migration adds three explicit, nullable URL columns alongside
-- the legacy array. Legacy data is preserved (admins can migrate by hand
-- if needed) and new providers must fill the three specific fields
-- enforced at the app layer.
--
-- Also: persist the moment the user accepted the platform's Terms of
-- Service + Privacy Policy. Storing the timestamp (not just a boolean)
-- matches Ley 25.326 (AR Data Protection) best practice and gives us
-- proof of consent if disputed.
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_dni_front_url       text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS provider_dni_back_url        text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS provider_criminal_record_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS terms_accepted_at            timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.profiles.provider_dni_front_url IS
  'Storage path in provider-docs bucket: photo of DNI front. Required for provider verification.';
COMMENT ON COLUMN public.profiles.provider_dni_back_url IS
  'Storage path in provider-docs bucket: photo of DNI back. Required for provider verification.';
COMMENT ON COLUMN public.profiles.provider_criminal_record_url IS
  'Storage path in provider-docs bucket: certificado de antecedentes penales. Required for provider verification.';
COMMENT ON COLUMN public.profiles.terms_accepted_at IS
  'Timestamp when user explicitly accepted Terms of Service + Privacy Policy on sign-up. Null = legacy user with no recorded consent.';
