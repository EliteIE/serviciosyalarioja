import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const PROD_ORIGINS = ["https://servicios360.com.ar", "https://www.servicios360.com.ar", "https://serviciosyalr.com", "https://www.serviciosyalr.com", "https://serviciosyalarioja.vercel.app", "https://serviciosyalr.lovable.app"];
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:3000"];
const ALLOWED_ORIGINS = Deno.env.get("ENVIRONMENT") === "production"
  ? PROD_ORIGINS
  : [...PROD_ORIGINS, ...DEV_ORIGINS];

function getCorsHeaders(req: Request) {
  // HTTP headers are case-insensitive — use lowercase access.
  const origin = req.headers.get("origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function isAllowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();
  // /callback is a top-level redirect target from MP — no Origin header.
  const isCallback = path === "callback";

  if (!isCallback && req.method !== "OPTIONS" && !isAllowedOrigin(req)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin(req)) return new Response(null, { status: 403 });
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const MP_APP_ID = Deno.env.get("MERCADOPAGO_APP_ID");
  const MP_CLIENT_SECRET = Deno.env.get("MERCADOPAGO_CLIENT_SECRET");
  const appUrl = Deno.env.get("APP_URL") || PROD_ORIGINS[0];

  if (!MP_APP_ID || !MP_CLIENT_SECRET) {
    return new Response(JSON.stringify({ error: "MP OAuth not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      p_key: `oauth:${clientIp}`,
      p_max_requests: 10,
      p_window_seconds: 60,
    });
    if (allowed !== true) {
      return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intentá en un minuto." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /mercadopago-oauth/callback - Handle OAuth callback from MercadoPago
    if (path === "callback") {
      const callbackSchema = z.object({
        state: z.string().min(1, "Missing state"),
        code: z.string().min(1, "Missing code").optional(),
      });
      
      const parsedParams = callbackSchema.safeParse(Object.fromEntries(url.searchParams));
      if (!parsedParams.success) {
        return Response.redirect(`${appUrl}/prestador/perfil?mp_error=missing_params`, 302);
      }

      const nonce = parsedParams.data.state;

      // Verify nonce and get actual user_id from oauth_states table
      const { data: stateRow, error: stateError } = await supabase
        .from("oauth_states")
        .select("user_id")
        .eq("nonce", nonce)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (stateError || !stateRow) {
        console.error("OAuth state verification failed:", stateError);
        return Response.redirect(`${appUrl}/prestador/perfil?mp_error=invalid_state`, 302);
      }

      const userId = stateRow.user_id;

      // Clean up used nonce (soft delete)
      await supabase.from("oauth_states").update({ deleted_at: new Date().toISOString() }).eq("nonce", nonce);

      const code = parsedParams.data.code;
      if (!code) {
        return Response.redirect(`${appUrl}/prestador/perfil?mp_error=missing_code`, 302);
      }

      // Exchange code for access token
      const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_secret: MP_CLIENT_SECRET,
          client_id: MP_APP_ID,
          grant_type: "authorization_code",
          code,
          redirect_uri: `${supabaseUrl}/functions/v1/mercadopago-oauth/callback`,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("MP OAuth token error:", errText);
        return Response.redirect(`${appUrl}/prestador/perfil?mp_error=token_failed`, 302);
      }

      const tokenData = await tokenRes.json();

      // Get user info from MP
      const userRes = await fetch("https://api.mercadopago.com/users/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const mpUser = await userRes.json();

      // Upsert metadata (no tokens yet). Tokens are written via SECURITY
      // DEFINER RPC that encrypts at rest with a vault-managed key.
      const { error: upsertError } = await supabase
        .from("provider_mp_accounts")
        .upsert({
          user_id: userId,
          mp_user_id: String(tokenData.user_id || mpUser.id),
          mp_email: mpUser.email || null,
          mp_public_key: tokenData.public_key || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("Upsert metadata failed:", upsertError.code);
        return Response.redirect(`${appUrl}/prestador/perfil?mp_error=save_failed`, 302);
      }

      const { error: encErr } = await supabase.rpc("set_provider_mp_tokens", {
        p_user_id: userId,
        p_access_token: tokenData.access_token,
        p_refresh_token: tokenData.refresh_token || null,
      });
      if (encErr) {
        console.error("Token encryption failed:", encErr.code);
        return Response.redirect(`${appUrl}/prestador/perfil?mp_error=save_failed`, 302);
      }

      return Response.redirect(`${appUrl}/prestador/perfil?mp_connected=true`, 302);
    }

    // POST /mercadopago-oauth - Generate OAuth URL
    if (req.method === "POST") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userError } = await anonClient.auth.getUser();
      if (userError || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate cryptographic nonce and store in DB
      const nonce = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      
      // Clean up any existing states for this user (soft delete)
      await supabase.from("oauth_states").update({ deleted_at: new Date().toISOString() }).eq("user_id", userData.user.id);
      
      const { error: insertError } = await supabase.from("oauth_states").insert({
        nonce,
        user_id: userData.user.id,
        expires_at: expiresAt,
      });

      if (insertError) {
        console.error("Failed to store OAuth state:", insertError);
        return new Response(JSON.stringify({ error: "Internal error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const redirectUri = `${supabaseUrl}/functions/v1/mercadopago-oauth/callback`;
      const oauthUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${MP_APP_ID}&response_type=code&platform_id=mp&state=${nonce}&redirect_uri=${encodeURIComponent(redirectUri)}`;

      return new Response(JSON.stringify({ oauth_url: oauthUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /mercadopago-oauth - Disconnect MP account
    if (req.method === "DELETE") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userError } = await anonClient.auth.getUser();
      if (userError || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Soft delete provider MP account
      await supabase
        .from("provider_mp_accounts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("user_id", userData.user.id);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("MP OAuth error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
