import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const PROD_ORIGINS = ["https://serviciosyalr.com", "https://www.serviciosyalr.com", "https://serviciosyalarioja.vercel.app", "https://serviciosyalr.lovable.app"];
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:8080"];
const ALLOWED_ORIGINS = Deno.env.get("ENVIRONMENT") === "production"
  ? PROD_ORIGINS
  : [...PROD_ORIGINS, ...DEV_ORIGINS];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const MP_API = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!MP_TOKEN) {
    return new Response(JSON.stringify({ error: "MERCADOPAGO_ACCESS_TOKEN not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  const appUrl = "https://serviciosyalr.com";

  try {
    // Rate limiting for non-webhook requests
    if (path !== "webhook") {
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const { data: allowed } = await supabase.rpc("check_rate_limit", {
        p_key: `mp:${clientIp}`,
        p_max_requests: 20,
        p_window_seconds: 60,
      });
      if (allowed === false) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intentá en un minuto." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // POST /mercadopago - Create preference (checkout)
    if (req.method === "POST" && path !== "webhook") {
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

      const { service_request_id, payer_email } = await req.json();

      // Validate payer_email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (payer_email && typeof payer_email === "string" && !emailRegex.test(payer_email)) {
        return new Response(JSON.stringify({ error: "Email inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch the service request
      const { data: sr, error: srError } = await supabase
        .from("service_requests")
        .select("budget_amount, budget, client_id, provider_id, title, category")
        .eq("id", service_request_id)
        .single();

      if (srError || !sr) {
        return new Response(JSON.stringify({ error: "Service request not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = userData.user.id;
      if (userId !== sr.client_id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const baseAmount = sr.budget_amount ?? sr.budget ?? 0;

      // Include approved extra charges
      const { data: extras } = await supabase
        .from("extra_charges")
        .select("amount")
        .eq("service_request_id", service_request_id)
        .eq("status", "aprobado");

      const extrasTotal = (extras || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      const amount = baseAmount + extrasTotal;

      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ error: "No valid amount found" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const title = sr.title || sr.category || "Servicio";

      // Get commission rate
      const { data: setting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "commission_rate")
        .single();

      const commissionRate = parseFloat(setting?.value || "10");
      const platformFee = Math.round(amount * (commissionRate / 100) * 100) / 100;

      // Check if provider has connected MP account (Marketplace mode)
      let collectorToken = MP_TOKEN;
      let useMarketplace = false;

      if (sr.provider_id) {
        const { data: mpAccount } = await supabase
          .from("provider_mp_accounts")
          .select("mp_access_token")
          .eq("user_id", sr.provider_id)
          .single();

        if (mpAccount?.mp_access_token) {
          collectorToken = mpAccount.mp_access_token;
          useMarketplace = true;
        }
      }

      // Build preference body
      const preferenceBody: any = {
        items: [
          {
            title: title,
            quantity: 1,
            unit_price: amount,
            currency_id: "ARS",
          },
        ],
        payer: { email: payer_email || "" },
        back_urls: {
          success: `${appUrl}/cliente?payment=success&sr=${service_request_id}`,
          failure: `${appUrl}/cliente?payment=failure`,
          pending: `${appUrl}/cliente?payment=pending`,
        },
        notification_url: `${supabaseUrl}/functions/v1/mercadopago/webhook`,
        external_reference: service_request_id,
        auto_return: "approved",
      };

      if (useMarketplace) {
        preferenceBody.marketplace_fee = platformFee;
      }

      const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${collectorToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferenceBody),
      });

      if (!mpRes.ok) {
        const errBody = await mpRes.text();
        console.error(`MercadoPago API error [${mpRes.status}]:`, errBody);
        if (useMarketplace) {
          console.error("Provider marketplace token may be expired for provider:", sr.provider_id);
        }
        throw new Error("Error al procesar el pago. Intente nuevamente.");
      }

      const preference = await mpRes.json();

      // Check if there's already a pending payment for this service request — reuse it
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("service_request_id", service_request_id)
        .eq("status", "pending")
        .maybeSingle();

      if (existingPayment) {
        // Update existing pending payment with new preference
        await supabase.from("payments").update({
          mp_preference_id: preference.id,
          amount,
          platform_fee: platformFee,
          provider_amount: amount - platformFee,
          commission_rate: commissionRate,
          payment_method: useMarketplace ? "marketplace" : "platform",
        }).eq("id", existingPayment.id);
      } else {
        await supabase.from("payments").insert({
          service_request_id,
          client_id: sr.client_id || "",
          provider_id: sr.provider_id || "",
          amount,
          platform_fee: platformFee,
          provider_amount: amount - platformFee,
          commission_rate: commissionRate,
          status: "pending",
          mp_preference_id: preference.id,
          payment_method: useMarketplace ? "marketplace" : "platform",
        });
      }

      return new Response(
        JSON.stringify({
          preference_id: preference.id,
          init_point: preference.init_point,
          sandbox_init_point: preference.sandbox_init_point,
          marketplace: useMarketplace,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Webhook handler
    if (path === "webhook") {
      // Verify MercadoPago webhook signature — MANDATORY
      const MP_WEBHOOK_SECRET = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
      if (!MP_WEBHOOK_SECRET) {
        console.error("MERCADOPAGO_WEBHOOK_SECRET is not configured — rejecting webhook");
        return new Response(JSON.stringify({ error: "Webhook verification not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const xSignature = req.headers.get("x-signature");
      const xRequestId = req.headers.get("x-request-id");
      if (!xSignature || !xRequestId) {
        console.error("Webhook missing signature headers");
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Parse ts and v1 from x-signature header
      const parts: Record<string, string> = {};
      for (const part of xSignature.split(",")) {
        const [key, value] = part.split("=").map((s) => s.trim());
        parts[key] = value;
      }
      const ts = parts["ts"];
      const v1 = parts["v1"];
      if (!ts || !v1) {
        console.error("Webhook signature missing ts or v1");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build manifest and compute HMAC
      const dataId = url.searchParams.get("data.id") || url.searchParams.get("id") || "";
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(MP_WEBHOOK_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
      );
      const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));

      // Constant-time comparison to prevent timing attacks
      const expectedBytes = new Uint8Array(signatureBytes);
      const receivedHex = v1;
      const expectedHex = Array.from(expectedBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (receivedHex.length !== expectedHex.length) {
        console.error("Webhook signature mismatch (length)");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // XOR-based constant-time compare
      const a = new TextEncoder().encode(expectedHex);
      const b = new TextEncoder().encode(receivedHex);
      let diff = 0;
      for (let i = 0; i < a.length; i++) {
        diff |= a[i] ^ b[i];
      }
      if (diff !== 0) {
        console.error("Webhook signature mismatch");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.json().catch(() => null);
      console.log("Webhook received:", JSON.stringify(body));

      if (body?.type === "payment" && body?.data?.id) {
        const paymentId = body.data.id;

        // --- IDEMPOTENCY GUARD ---
        // Check if this payment ID was already processed and marked as completed
        const { data: existingPayment } = await supabase
          .from("payments")
          .select("id, status")
          .eq("mp_payment_id", String(paymentId))
          .eq("status", "completed")
          .maybeSingle();

        if (existingPayment) {
          console.log(`Payment ${paymentId} already processed (idempotency guard)`);
          return new Response(JSON.stringify({ ok: true, message: "Already processed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // -------------------------

        // Determine the correct token to use for fetching payment status
        // First try with platform token, get external_reference to find provider
        let fetchToken = MP_TOKEN;

        // Attempt to find provider token if payment is for a marketplace transaction
        const { data: paymentRecord } = await supabase
          .from("payments")
          .select("service_request_id")
          .eq("mp_payment_id", String(paymentId))
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (paymentRecord?.service_request_id) {
          const { data: sr } = await supabase
            .from("service_requests")
            .select("provider_id")
            .eq("id", paymentRecord.service_request_id)
            .single();

          if (sr?.provider_id) {
            const { data: mpAccount } = await supabase
              .from("provider_mp_accounts")
              .select("mp_access_token")
              .eq("user_id", sr.provider_id)
              .single();

            if (mpAccount?.mp_access_token) {
              fetchToken = mpAccount.mp_access_token;
            }
          }
        }

        const mpRes = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${fetchToken}` },
        });
        const mpPayment = await mpRes.json();
        console.log("MP Payment status:", mpPayment.status, "external_reference:", mpPayment.external_reference);

        const serviceRequestId = mpPayment.external_reference;
        const mpStatus =
          mpPayment.status === "approved"
            ? "approved"
            : mpPayment.status === "rejected"
            ? "failed"
            : "pending";

        // Update payment record — match by service_request_id AND pending/approved status to avoid duplicates
        const { data: pendingPayment } = await supabase
          .from("payments")
          .select("id")
          .eq("service_request_id", serviceRequestId)
          .in("status", ["pending", "approved"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingPayment) {
          await supabase
            .from("payments")
            .update({
              status: mpStatus === "approved" ? "completed" : mpStatus,
              mp_payment_id: String(paymentId),
              payment_method: mpPayment.payment_method_id || null,
            })
            .eq("id", pendingPayment.id);
        }

        // If approved, mark service as completado
        if (mpStatus === "approved") {
          await supabase
            .from("service_requests")
            .update({ status: "completado" })
            .eq("id", serviceRequestId);

          // Notify both parties
          const { data: sr } = await supabase
            .from("service_requests")
            .select("provider_id, title, client_id")
            .eq("id", serviceRequestId)
            .single();

          if (sr?.provider_id) {
            await supabase.from("notifications").insert({
              user_id: sr.provider_id,
              title: "Pago recibido",
              message: `Se acreditó el pago por "${sr.title}". El dinero se depositará en tu cuenta de MercadoPago.`,
              type: "success",
            });
          }
          if (sr?.client_id) {
            await supabase.from("notifications").insert({
              user_id: sr.client_id,
              title: "Pago confirmado",
              message: `Tu pago por "${sr.title}" fue procesado exitosamente`,
              type: "success",
            });
          }
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("MercadoPago error:", error);
    return new Response(JSON.stringify({ error: "Error interno del servidor. Intente nuevamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
