-- ============================================================
-- provider_intake_leads
--
-- Captação 1×1 de prestadores (pivô 27/04/2026 — Gabi Pedrali).
-- Substitui o auto-registro público. Form interno em
-- /quiero-ser-prestador → Edge Function pública → INSERT aqui.
-- Admin lê em /admin/leads-prestadores.
--
-- Padrão: igual a contact_messages (writes via service role,
-- reads via admin role).
-- ============================================================

-- enums
do $$ begin
  create type provider_lead_status as enum (
    'nuevo','contactado','aprobado','rechazado','onboarding','activo'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type provider_lead_source as enum (
    'redes_sociales','referido','ministerio','otro'
  );
exception when duplicate_object then null; end $$;

create table public.provider_intake_leads (
  id uuid primary key default gen_random_uuid(),

  -- Passo 1 (obrigatório)
  full_name text not null check (length(full_name) between 2 and 120),
  phone text not null check (length(phone) between 8 and 20),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  category text not null,
  source provider_lead_source not null,

  -- Passo 2 (opcional)
  step2_completed boolean not null default false,
  step2_payload jsonb,

  -- gestão interna
  status provider_lead_status not null default 'nuevo',
  contact_notes text,
  contacted_at timestamptz,
  contacted_by uuid references auth.users(id) on delete set null,

  -- meta de submissão
  ip_address inet,
  user_agent text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.provider_intake_leads is
  'Leads de captação 1×1 de prestadores. Writes via service role (submit-provider-intake edge function com rate limit por IP). Reads/updates via admin role.';

create index provider_intake_leads_status_idx
  on public.provider_intake_leads (status, created_at desc);
create index provider_intake_leads_category_idx
  on public.provider_intake_leads (category);
create index provider_intake_leads_email_idx
  on public.provider_intake_leads (lower(email));

-- updated_at trigger
create or replace function public.touch_provider_intake_leads_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger provider_intake_leads_updated_at
  before update on public.provider_intake_leads
  for each row execute function public.touch_provider_intake_leads_updated_at();

-- RLS
alter table public.provider_intake_leads enable row level security;

-- service role bypassa RLS automaticamente (é como o submit-contact funciona).
-- Policies abaixo cobrem usuários autenticados:

create policy "admins read provider intake leads"
  on public.provider_intake_leads
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "admins update provider intake leads"
  on public.provider_intake_leads
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- INSERT só via service role. Sem policy de insert = deny.
-- DELETE só via service role. Sem policy de delete = deny.
