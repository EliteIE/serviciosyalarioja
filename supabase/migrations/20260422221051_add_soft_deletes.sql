-- Add soft delete support to main entities
ALTER TABLE public.profiles ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE public.service_requests ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE public.reviews ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE public.disputes ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN deleted_at TIMESTAMPTZ;

DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'portfolio_items') THEN
        ALTER TABLE public.portfolio_items ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'provider_services') THEN
        ALTER TABLE public.provider_services ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'provider_mp_accounts') THEN
        ALTER TABLE public.provider_mp_accounts ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'oauth_states') THEN
        ALTER TABLE public.oauth_states ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;
