
-- ============================================
-- SERVICIOS YA — SCHEMA COMPLETO
-- ============================================

-- 1. Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'client', 'provider');

-- 2. Enum para status de serviço
CREATE TYPE public.service_status AS ENUM ('nuevo', 'aceptado', 'en_progreso', 'completado', 'cancelado');

-- 3. Enum para urgência
CREATE TYPE public.urgency_level AS ENUM ('baja', 'media', 'alta');

-- 4. Enum para status de disputa
CREATE TYPE public.dispute_status AS ENUM ('abierta', 'en_revision', 'resuelta');

-- ============================================
-- TABELA: profiles
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  location TEXT DEFAULT 'La Rioja',
  bio TEXT,
  is_provider BOOLEAN NOT NULL DEFAULT false,
  provider_verified BOOLEAN NOT NULL DEFAULT false,
  provider_available BOOLEAN NOT NULL DEFAULT true,
  provider_category TEXT,
  provider_price_range TEXT,
  provider_coverage_area TEXT[],
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  rating_avg NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  response_time TEXT DEFAULT 'Sin datos',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: user_roles
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- ============================================
-- TABELA: service_requests
-- ============================================
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  urgency urgency_level NOT NULL DEFAULT 'media',
  budget NUMERIC(10,2),
  photos TEXT[],
  status service_status NOT NULL DEFAULT 'nuevo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: messages
-- ============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: reviews
-- ============================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: disputes
-- ============================================
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE NOT NULL,
  opened_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'abierta',
  resolution TEXT,
  amount NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: notifications
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- FUNÇÃO: has_role (security definer)
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- TRIGGER: auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  
  -- Assign default role based on user metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN (NEW.raw_user_meta_data->>'is_provider')::boolean = true THEN 'provider'::app_role
      ELSE 'client'::app_role
    END
  );
  
  -- If provider, update profile
  IF (NEW.raw_user_meta_data->>'is_provider')::boolean = true THEN
    UPDATE public.profiles 
    SET is_provider = true,
        provider_category = COALESCE(NEW.raw_user_meta_data->>'category', ''),
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', '')
    WHERE id = NEW.id;
  ELSE
    UPDATE public.profiles
    SET phone = COALESCE(NEW.raw_user_meta_data->>'phone', '')
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- RLS: Enable em todas as tabelas
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: profiles
-- ============================================
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- RLS POLICIES: user_roles
-- ============================================
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES: service_requests
-- ============================================
CREATE POLICY "Clients can view own requests" ON public.service_requests
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Providers can view assigned requests" ON public.service_requests
  FOR SELECT USING (auth.uid() = provider_id);

CREATE POLICY "Providers can view new requests in their category" ON public.service_requests
  FOR SELECT USING (
    status = 'nuevo' AND public.has_role(auth.uid(), 'provider')
  );

CREATE POLICY "Clients can create requests" ON public.service_requests
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Involved users can update requests" ON public.service_requests
  FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = provider_id);

CREATE POLICY "Admins can view all requests" ON public.service_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES: messages
-- ============================================
CREATE POLICY "Users can view messages of their service requests" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = service_request_id
      AND (sr.client_id = auth.uid() OR sr.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their service requests" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = service_request_id
      AND (sr.client_id = auth.uid() OR sr.provider_id = auth.uid())
    )
  );

-- ============================================
-- RLS POLICIES: reviews
-- ============================================
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for completed services" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = service_request_id
      AND sr.status = 'completado'
      AND (sr.client_id = auth.uid() OR sr.provider_id = auth.uid())
    )
  );

-- ============================================
-- RLS POLICIES: disputes
-- ============================================
CREATE POLICY "Users can view own disputes" ON public.disputes
  FOR SELECT USING (
    auth.uid() = opened_by OR
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = service_request_id
      AND (sr.client_id = auth.uid() OR sr.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can create disputes" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = opened_by);

CREATE POLICY "Admins can manage disputes" ON public.disputes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES: notifications
-- ============================================
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Habilitar Realtime para messages
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
