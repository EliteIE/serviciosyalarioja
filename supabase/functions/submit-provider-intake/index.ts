// =====================================================================
// submit-provider-intake
//
// Endpoint público (CORS allowlist) para captação 1×1 de prestadores
// substituindo o auto-registro. Recebe Passo 1 (5 campos obrigatórios)
// e opcionalmente Passo 2 (~14 campos), faz INSERT em
// provider_intake_leads e notifica admins via tabela notifications.
//
// Padrão clonado de submit-contact: rate limit por IP + service role
// para bypass de RLS. Sem dependências externas (sem Tally, sem Telegram).
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const PROD_ORIGINS = [
  "https://servicios360.com.ar",
  "https://www.servicios360.com.ar",
  "https://serviciosyalarioja-git-main-servicios-ya-team.vercel.app",
];
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:8080"];
const ALLOWED_ORIGINS = Deno.env.get("ENVIRONMENT") === "production"
  ? PROD_ORIGINS
  : [...PROD_ORIGINS, ...DEV_ORIGINS];

const CATEGORY_SLUGS = [
  "plomeria", "electricidad", "limpieza", "pintura", "albanileria",
  "jardineria", "cerrajeria", "mudanzas", "aire-acondicionado",
  "gasista", "carpinteria", "tecnico-pc",
] as const;

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  return !!origin && ALLOWED_ORIGINS.includes(origin);
}

// ----- Validação do Passo 1 (obrigatório) -----
const Step1Schema = z.object({
  full_name: z.string().trim().min(2, "Nombre muy corto").max(120),
  // Tel AR: aceita 8-20 chars (frontend pode normalizar pra 10 dígitos)
  phone: z.string().trim().min(8, "Teléfono inválido").max(20),
  email: z.string().trim().email("Email inválido").max(255),
  category: z.enum(CATEGORY_SLUGS, {
    errorMap: () => ({ message: "Categoría inválida" }),
  }),
  source: z.enum(["redes_sociales", "referido", "ministerio", "otro"]),
});

// ----- Validação do Passo 2 (opcional, jsonb) -----
const Step2Schema = z.object({
  years_experience: z.enum(["<1", "1-3", "3-5", "5-10", "10+"]).optional(),
  description: z.string().trim().max(500).optional(),
  secondary_categories: z.array(z.enum(CATEGORY_SLUGS)).max(12).optional(),
  team_type: z.enum(["solo", "2-3", "equipo_formal"]).optional(),
  available_days: z.array(z.enum(["lunes_viernes", "sabado", "domingo"])).optional(),
  weekly_capacity: z.enum(["1-3", "4-7", "8-15", "15+"]).optional(),
  vehicle: z.enum(["si", "no", "moto"]).optional(),
  coverage_areas: z.array(z.string().max(80)).max(20).optional(),
  missing_tools: z.string().trim().max(500).optional(),
  reference_1: z.object({
    name: z.string().trim().max(120),
    phone: z.string().trim().max(20),
    relation: z.string().trim().max(120),
  }).partial().optional(),
  reference_2: z.object({
    name: z.string().trim().max(120),
    phone: z.string().trim().max(20),
    relation: z.string().trim().max(120),
  }).partial().optional(),
  has_cuit: z.enum(["si", "no", "no_se"]).optional(),
  extra_notes: z.string().trim().max(1000).optional(),
}).strict();

const SubmitSchema = z.object({
  step1: Step1Schema,
  step2: Step2Schema.optional(),
});

const CATEGORY_LABEL: Record<typeof CATEGORY_SLUGS[number], string> = {
  plomeria: "Plomería",
  electricidad: "Electricidad",
  limpieza: "Limpieza",
  pintura: "Pintura",
  albanileria: "Albañilería",
  jardineria: "Jardinería",
  cerrajeria: "Cerrajería",
  mudanzas: "Mudanzas",
  "aire-acondicionado": "Aire Acondicionado",
  gasista: "Gasista",
  carpinteria: "Carpintería",
  "tecnico-pc": "Técnico PC",
};

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin(req)) return new Response(null, { status: 403 });
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isAllowedOrigin(req)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) || null;

  // Rate limit: 3 submits/hora por IP (form de captação não precisa ser frequente)
  const { data: allowed } = await supabase.rpc("check_rate_limit", {
    p_key: `provider_intake:${clientIp}`,
    p_max_requests: 3,
    p_window_seconds: 3600,
  });
  if (allowed !== true) {
    return new Response(
      JSON.stringify({
        error: "Demasiadas solicitudes. Probá nuevamente en una hora.",
      }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation error",
        details: parsed.error.format(),
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { step1, step2 } = parsed.data;
  const ipForDb = clientIp === "unknown" ? null : clientIp;
  const step2Completed = !!step2 && Object.keys(step2).length > 0;

  const { data: inserted, error: insertError } = await supabase
    .from("provider_intake_leads")
    .insert({
      full_name: step1.full_name,
      phone: step1.phone,
      email: step1.email,
      category: step1.category,
      source: step1.source,
      step2_completed: step2Completed,
      step2_payload: step2Completed ? step2 : null,
      ip_address: ipForDb,
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error(
      "provider_intake_leads insert failed",
      insertError?.message,
    );
    return new Response(
      JSON.stringify({
        error: "No pudimos guardar tu solicitud. Probá nuevamente.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Notificação aos admins (não-fatal)
  try {
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const detailLine = step2Completed
        ? "Completó paso 2 (perfil profundo)."
        : "Solo paso 1.";
      const rows = admins.map((a: { user_id: string }) => ({
        user_id: a.user_id,
        type: "info",
        title: `Nuevo lead prestador: ${CATEGORY_LABEL[step1.category]}`,
        message:
          `${step1.full_name} (${step1.phone}) — ${step1.email}\n${detailLine}`,
      }));
      await supabase.from("notifications").insert(rows);
    }
  } catch (notifyErr) {
    console.error("admin notify failed (non-fatal)", notifyErr);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      id: inserted.id,
      step2_completed: step2Completed,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
