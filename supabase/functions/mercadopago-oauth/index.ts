import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const PROD_ORIGINS = ["https://serviciosyslr.com", "https://www.serviciosyslr.com", "https://serviciosyalr.lovable.app"];
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:3000"];
const ALLOWED_ORIGINS = Deno.env.get("ENVIRONMENT") === "production"
  ? PROD_ORIGINS
  : [...PROD_ORIGINS, ...DEV_ORIGINS];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const MP_APP_ID = Deno.env.get("MERCADOPAGO_APP_ID");
  const MP_CLIENT_SECRET = Deno.env.get("MERCADOPAGO_CLIENT_SECRET");
  const appUrl = "https://serviciosyslr.com";

  if (!MP_APP_ID || !MP_CLIENT_SECRET) {
    return new Response(JSON.stringify({ error: "MP OAuth not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    // GET /mercadopago-oauth/callback - Handle OAuth callback from MercadoPago
    if (path === "callback") {
      const nonce = url.searchParams.get("state");

      if (!nonce) {
        return Response.redirect(`${appUrl}/prestador/perfil?mp_error=missing_params`, 302);
      }

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

      // Clean up used nonce
      await supabase.from("oauth_states").delete().eq("nonce", nonce);

      const code = url.searchParams.get("code");
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

      // Upsert provider MP account
      const { error: upsertError } = await supabase
        .from("provider_mp_accounts")
        .upsert({
          user_id: userId,
          mp_user_id: String(tokenData.user_id || mpUser.id),
          mp_access_token: tokenData.access_token,
          mp_refresh_token: tokenData.refresh_token || null,
          mp_email: mpUser.email || null,
          mp_public_key: tokenData.public_key || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
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
      
      // Clean up any existing states for this user
      await supabase.from("oauth_states").delete().eq("user_id", userData.user.id);
      
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

      await supabase
        .from("provider_mp_accounts")
        .delete()
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
