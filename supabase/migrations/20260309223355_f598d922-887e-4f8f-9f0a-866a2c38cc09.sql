
-- Payments table to track all transactions
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES public.service_requests(id),
  client_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  amount numeric NOT NULL,
  platform_fee numeric NOT NULL DEFAULT 0,
  provider_amount numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'refunded', 'failed')),
  mp_payment_id text,
  mp_preference_id text,
  payment_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Platform settings table for commission config
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Insert default commission rate
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('commission_rate', '10', 'Porcentaje de comisión de la plataforma'),
  ('min_payment_amount', '500', 'Monto mínimo de pago en ARS'),
  ('payment_enabled', 'true', 'Sistema de pagos activo');

-- RLS for payments
CREATE POLICY "Clients can view own payments" ON public.payments
FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Providers can view own payments" ON public.payments
FOR SELECT USING (auth.uid() = provider_id);

CREATE POLICY "Admins can manage payments" ON public.payments
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for platform_settings
CREATE POLICY "Anyone can read settings" ON public.platform_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.platform_settings
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
