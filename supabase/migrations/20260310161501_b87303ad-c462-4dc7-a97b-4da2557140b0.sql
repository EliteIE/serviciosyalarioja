
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS budget_amount numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS budget_message text DEFAULT NULL;
