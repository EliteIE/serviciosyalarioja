# Pivot v2 — Captação de Prestadores In-House (sem Tally)

**Data:** 2026-04-28
**Autor:** Guilherme + /dev
**Status:** Implementado, deployado em produção
**Substitui:** `2026-04-27-provider-intake-pivot-design.md` (Tally)
**Stack tocada:** Vite + React + Supabase Edge Functions + Postgres

---

## 1. Contexto e Motivação

A v1 do pivô (27/04/2026) propôs usar **Tally como form externo** com webhook
pro Telegram. Ao reavaliar em 28/04, o time viu que:

1. O repo já tem **toda a stack pronta** (multi-step wizard, Supabase Storage,
   Edge Functions, design system Apple-inspired, auth com roles).
2. **Custom domain do Tally exige Pro plan** — captação no plano free perderia
   o subdomínio `prestadores.servicios360.com.ar`.
3. **Notificação Telegram tem dependência humana** (adicionar bot ao grupo,
   capturar `chat_id`, gerenciar token) — atrita a operação.
4. O time prefere **leads visíveis no dashboard admin** (mesmo lugar onde já
   gerencia disputas, prestadores, auditoria) ao invés de outro canal.

**Decisão:** trocar Tally por wizard interno em `/quiero-ser-prestador` e
trocar Telegram por **página admin** `/admin/leads-prestadores`.

## 2. Objetivo

Substituir o auto-registro público de prestadores por um funil de captura
de **leads** (não accounts), totalmente in-house: form ⇒ Edge Function ⇒
Postgres ⇒ Dashboard admin. Sem dependências externas, sem credenciais
adicionais de terceiros, sem notificação fora-da-plataforma.

## 3. Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│  Plataforma Servicios 360 (Vite/React)                           │
│                                                                   │
│  CTAs em: ProviderCTA · Header · Footer · Login (cross-link) ·   │
│  ComoFunciona · Nosotros · RegisterClient (cross-link)           │
│                                                                   │
│  Todos apontam para: /quiero-ser-prestador (rota INTERNA)        │
│                                                                   │
│        ↓                                                          │
│   ProviderIntake.tsx (wizard 2 passos, sem auth)                 │
│        ↓ submit                                                   │
│  ┌─────────────────────────────────────┐                         │
│  │ Supabase Edge Function:             │                         │
│  │ submit-provider-intake              │                         │
│  │  · CORS allowlist                   │                         │
│  │  · Rate limit (3/h por IP)          │                         │
│  │  · Validação Zod (step1 + step2)    │                         │
│  │  · Service role bypass RLS          │                         │
│  └─────────┬───────────────────────────┘                         │
│            │                                                      │
│            ▼                                                      │
│  ┌─────────────────────────────────────┐                         │
│  │ Postgres                             │                         │
│  │  · provider_intake_leads (table)    │                         │
│  │  · notifications (alerta admins)    │                         │
│  └─────────┬───────────────────────────┘                         │
│            │                                                      │
│            ▼                                                      │
│  ┌─────────────────────────────────────┐                         │
│  │ /admin/leads-prestadores             │                         │
│  │  · Lista paginada com filtros        │                         │
│  │  · Status workflow (nuevo→onboarding)│                         │
│  │  · Notas internas + drawer detalhes  │                         │
│  └──────────────────────────────────────┘                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Por que essa arquitetura:**
- **Zero dependências externas:** sem Tally, sem Telegram, sem Zapier, sem
  custom domain DNS. Reduz superfície de risco operacional a zero.
- **Reuso de infra existente:** rate limit, CORS, Edge Function pattern
  e design system já em uso (clonado de `submit-contact`).
- **Source of truth única:** leads vivem no mesmo Postgres dos prestadores
  oficiais. Migração lead→prestador (após aprovação) é trivial.
- **Visibilidade:** time vê leads onde já trabalha (dashboard admin),
  sem precisar abrir Sheet ou Telegram.

## 4. Componentes implementados

### 4.1 Backend (Supabase)

**Tabela `provider_intake_leads`** (migration `20260430000000`):
- 5 campos obrigatórios (passo 1): `full_name`, `phone`, `email`, `category`, `source`
- Passo 2 opcional armazenado em `step2_payload jsonb`
- Status workflow: `nuevo → contactado → aprobado/rechazado → onboarding → activo`
- Campos internos: `contact_notes`, `contacted_at`, `contacted_by`, `ip_address`
- RLS: admins read+update; INSERT/DELETE só via service role
- Índices em `(status, created_at desc)`, `category`, `lower(email)`

**Edge Function `submit-provider-intake`**:
- CORS allowlist: `servicios360.com.ar`, `www.servicios360.com.ar`,
  Vercel preview, `localhost:5173/8080`
- Rate limit: 3 submits/hora por IP (form de captação não precisa ser frequente)
- Validação Zod estrita (12 categorias, 4 fontes, enums em todo lugar)
- INSERT bypass RLS via service role
- Notifica admins via `notifications` (não-fatal se falhar)

**Bug fix `check_rate_limit`** (migration `20260430000001`):
A função RPC tinha schema mismatch (referenciava colunas `identifier`,
`request_count`, `window_seconds`, `max_requests` que não existiam na
tabela `rate_limits` real, que tem `key`, `count`, `window_start`).
Corrigido — afetava também `submit-contact` (que retornava 429 silenciosamente).

### 4.2 Frontend público

**`/quiero-ser-prestador` (`pages/ProviderIntake.tsx`)**:
- Wizard com 4 fases (state machine): `step1 → transition → step2 → done`
- Passo 1: 5 campos obrigatórios (~45s)
- Tela de transição: "¡Listo, [nome]! Te llamaremos en 24-48hs..."
  com botões "Continuar (opcional)" e "Salir"
- Passo 2: ~10 campos opcionais nos blocos Experiencia/Capacidad/Referencias/Compromiso
- Tela final: agradecimento + "Volver al inicio"
- Submit acontece em UMA chamada (passo 1 sozinho ou passo 1+2)
- Layout single-column, sem auth, mobile-first

**`hooks/useProviderIntake.ts`**:
- `useSubmitProviderIntake()` — invoca Edge Function
- `useProviderLeads(filters)` — listagem admin
- `useUpdateProviderLeadStatus()` — workflow
- `useUpdateProviderLeadNotes()` — comentários internos

### 4.3 Frontend admin

**`/admin/leads-prestadores` (`pages/admin/ProviderLeads.tsx`)**:
- 4 KPI cards: total / nuevos / contactados / perfil completo
- Filtros: status, categoria, busca livre por nome/email/telefone
- Lista densa em rows clicáveis (avatar + dados + status badge)
- Dialog detalhe: dados, status quick-switch, payload do passo 2 expandido,
  notas internas editáveis
- Item adicionado no `AppSidebar` (entre Dashboard e Prestadores)

### 4.4 Mudanças nas rotas

**`App.tsx`**:
- ➕ `/quiero-ser-prestador` → `<ProviderIntake />` (público, sem auth)
- ➕ `/admin/leads-prestadores` → `<AdminProviderLeads />` (admin protected)
- 🔄 `/registro/prestador` → `<Navigate to="/quiero-ser-prestador" replace />`
  (preserva bookmarks antigos)
- 🗄️ `/_legacy/registro/prestador` → `<RegisterProvider />` (rollback safety,
  marcado `@deprecated`)

**Constante centralizada `src/constants/external.ts`**:
```ts
export const PROVIDER_INTAKE_PATH = "/quiero-ser-prestador";
```

**7 CTAs atualizados** (todos importam `PROVIDER_INTAKE_PATH`):
1. `components/home/ProviderCTA.tsx`
2. `components/layout/Header.tsx` (desktop + mobile)
3. `components/layout/Footer.tsx`
4. `pages/ComoFunciona.tsx`
5. `pages/Nosotros.tsx`
6. `pages/auth/RegisterClient.tsx`
7. (Login.tsx não tinha cross-link de prestador)

**FAQ.tsx INTOCADA** (decisão CEO mantida da spec v1).

## 5. Fluxo de dados

1. Usuário clica em qualquer CTA "Ofrecer Servicios" / "Quiero ofrecer..."
2. React Router navega para `/quiero-ser-prestador`
3. Preenche passo 1 (5 campos) e clica "Continuar"
4. Vê tela de transição agradecendo e oferecendo passo 2 opcional
5. Se "Salir" → submete só passo 1
6. Se "Continuar" → preenche passo 2 → submete passo 1+2
7. Edge Function valida, rate-limita, INSERT na tabela, notifica admins
8. Tela final de agradecimento
9. Admin vê o lead em `/admin/leads-prestadores` em <1s
10. Admin contata via WhatsApp manual, atualiza status, anota notas

## 6. Segurança

- **CORS allowlist** restrita a domínios Servicios 360 + dev local
- **Rate limit por IP** previne abuso (3/hora)
- **Validação Zod estrita** rejeita payloads malformados antes do INSERT
- **Service role isolation:** apenas Edge Function escreve (RLS bloqueia
  authenticated/anon de fazer INSERT direto)
- **Admin-only RLS read** garante leads sensíveis só visíveis ao time
- **PII (email, telefone) nunca aparece em logs** — só em notifications
  internas e no dashboard admin
- **Wizard antigo preservado** em `/_legacy/registro/prestador` para rollback

## 7. Critérios de Sucesso (validados)

- ✅ Click em qualquer dos 7 CTAs abre `/quiero-ser-prestador` na mesma aba
- ✅ Rota `/registro/prestador` redireciona em <100ms (Navigate replace)
- ✅ Submit do passo 1 cria lead em <2s (smoke test confirmou)
- ✅ Lead aparece imediatamente em `/admin/leads-prestadores`
- ✅ Notificação Postgres `notifications` é gerada para todos admins
- ✅ Rate limit funciona (testado com submits sequenciais)
- ✅ FAQ.tsx visualmente idêntica
- ✅ TypeScript build passa sem erros
- ✅ Backup branch `backup/tally-pivot-2026-04-28` preserva tentativa Tally

## 8. Out of Scope (explícito)

- ❌ Email automático de confirmação ao prestador (decisão CEO 28/04)
- ❌ Custom domain `prestadores.servicios360.com.ar`
- ❌ Tally como form externo
- ❌ Notificação Telegram
- ❌ Google Sheets
- ❌ Upload de fotos do passo 2 (adiado pra v3 se necessário)
- ❌ Assinatura de imagens via Supabase Storage (não há upload)

## 9. Rollback Plan

Se a estratégia precisar reverter ao auto-registro:
1. `git revert` do commit principal
2. Restaurar `RegisterProvider` na rota `/registro/prestador`
   (renomear de `/_legacy/...` de volta)
3. Tabela `provider_intake_leads` pode permanecer (canal complementar)

Estimativa: <30 min.

---

## Anexos

- `docs/superpowers/specs/2026-04-27-provider-intake-pivot-design.md` —
  spec v1 (Tally) preservada para histórico
- `docs/superpowers/plans/2026-04-27-provider-intake-pivot.md` —
  plan v1 com 12 tasks Tally (não foram aplicadas; preservadas em
  branch `backup/tally-pivot-2026-04-28`)
