// =====================================================================
// submit-contact
//
// Public-facing edge function for the /contacto form. Persists the
// submission in public.contact_messages and notifies all admin users
// via the in-app notifications table (which fans out to email).
//
// Auth: anon JWT (verify_jwt=true). The form is public, but the JWT
// requirement gates against trivial scripted abuse.
// Rate limit: 5 requests / 60s per client IP via check_rate_limit RPC.
//
// Env required:
//   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto)
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const PROD_ORIGINS = [
  "https://servicios360.com.ar",
  "https://www.servicios360.com.ar",
];
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:8080"];
const ALLOWED_ORIGINS = Deno.env.get("ENVIRONMENT") === "production"
  ? PROD_ORIGINS
  : [...PROD_ORIGINS, ...DEV_ORIGINS];

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

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Nombre demasiado corto").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  subject: z.enum([
    "consulta_general",
    "problema_tecnico",
    "reclamo",
    "sugerencia",
  ]),
  message: z.string().trim().min(10, "Mensaje muy corto").max(4000),
});

const SUBJECT_LABEL: Record<z.infer<typeof ContactSchema>["subject"], string> = {
  consulta_general: "Consulta general",
  problema_tecnico: "Problema técnico",
  reclamo: "Reclamo",
  sugerencia: "Sugerencia",
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

  // --- Rate limit (5/min per IP) ---
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) || null;

  const { data: allowed } = await supabase.rpc("check_rate_limit", {
    p_key: `contact:${clientIp}`,
    p_max_requests: 5,
    p_window_seconds: 60,
  });
  if (allowed !== true) {
    return new Response(
      JSON.stringify({
        error: "Demasiadas solicitudes. Intentá nuevamente en un minuto.",
      }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // --- Parse + validate ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = ContactSchema.safeParse(body);
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

  const { name, email, subject, message } = parsed.data;

  // --- Persist ---
  const ipForDb = clientIp === "unknown" ? null : clientIp;
  const { data: inserted, error: insertError } = await supabase
    .from("contact_messages")
    .insert({
      name,
      email,
      subject,
      message,
      ip_address: ipForDb,
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("contact_messages insert failed", insertError?.message);
    return new Response(JSON.stringify({ error: "No pudimos guardar tu mensaje. Probá nuevamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Notify admins (fans out to email via send-notification-email) ---
  // Best-effort: a notification failure must NOT fail the user's request.
  try {
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const rows = admins.map((a: { user_id: string }) => ({
        user_id: a.user_id,
        type: "info",
        title: `Nuevo mensaje de contacto: ${SUBJECT_LABEL[subject]}`,
        message: `De ${name} <${email}>:\n\n${message.slice(0, 280)}${message.length > 280 ? "…" : ""}`,
      }));
      await supabase.from("notifications").insert(rows);
    }
  } catch (notifyErr) {
    console.error("admin notify failed (non-fatal)", notifyErr);
  }

  return new Response(JSON.stringify({ ok: true, id: inserted.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
