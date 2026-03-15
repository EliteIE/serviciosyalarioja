-- Provider weekly schedule table
CREATE TABLE IF NOT EXISTS public.provider_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, day_of_week)
);

-- Provider services/specialties table
CREATE TABLE IF NOT EXISTS public.provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  estimated_duration TEXT,
  price_from NUMERIC(10,2),
  price_to NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

-- RLS for provider_schedule
CREATE POLICY "Providers can manage own schedule"
  ON public.provider_schedule FOR ALL TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Anyone can view provider schedules"
  ON public.provider_schedule FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anon can view provider schedules"
  ON public.provider_schedule FOR SELECT TO anon
  USING (true);

-- RLS for provider_services
CREATE POLICY "Providers can manage own services"
  ON public.provider_services FOR ALL TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Anyone can view provider services"
  ON public.provider_services FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anon can view provider services"
  ON public.provider_services FOR SELECT TO anon
  USING (true);

-- Update profiles_public view to include coverage area and price range
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT
  id, full_name, avatar_url, bio, location, is_provider,
  provider_available, provider_verified, provider_category,
  provider_price_range, provider_coverage_area,
  completed_jobs, rating_avg, review_count, response_time,
  created_at, updated_at
FROM public.profiles;
