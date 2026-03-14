
-- Add document columns to profiles for provider verification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS provider_doc_urls text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS provider_verification_status text DEFAULT 'pending' CHECK (provider_verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS provider_verification_notes text DEFAULT NULL;

-- Create storage bucket for provider documents (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('provider-docs', 'provider-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Only authenticated users can upload their own docs
CREATE POLICY "Users can upload own docs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'provider-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view their own docs
CREATE POLICY "Users can view own docs" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'provider-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all docs
CREATE POLICY "Admins can view all docs" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'provider-docs' AND public.has_role(auth.uid(), 'admin'));
