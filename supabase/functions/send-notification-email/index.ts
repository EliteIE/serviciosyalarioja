// =====================================================================
// send-notification-email
//
// Triggered by a Supabase Database Webhook on AFTER INSERT to
// public.notifications. Looks up the recipient's auth.users email,
// renders a transactional email template, and dispatches via Resend.
//
// Required env (Supabase Dashboard -> Edge Functions -> Secrets):
//   - RESEND_API_KEY     : Resend API key
//   - RESEND_FROM_EMAIL  : e.g. "Servicios 360 <noreply@serviciosyalr.com.ar>"
//   - WEBHOOK_SECRET     : shared secret used by the DB webhook
//   - APP_URL            : base URL for CTA links (e.g. https://serviciosyalr.com.ar)
//
// Behavior:
//   * If RESEND_API_KEY is missing -> logs and returns 200 (no-op),
//     so the webhook chain does not error before configuration.
//   * If WEBHOOK_SECRET is set, the X-Webhook-Secret header must match.
//   * Skips delivery if user has no email or notification has no message.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

interface NotificationRecord {
  id: string;
  user_id: string;
  type: string | null;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  read?: boolean;
  created_at?: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: NotificationRecord;
  old_record?: NotificationRecord | null;
}

const SEVERITY_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  success: { bg: "#dcfce7", fg: "#166534", label: "Éxito" },
  error:   { bg: "#fee2e2", fg: "#991b1b", label: "Atención" },
  warning: { bg: "#fef3c7", fg: "#92400e", label: "Aviso" },
  info:    { bg: "#dbeafe", fg: "#1e40af", label: "Información" },
};

// Map event-style types (e.g. "dispute_opened") to a severity bucket.
function severityFor(type: string | null): keyof typeof SEVERITY_COLORS {
  if (!type) return "info";
  const t = type.toLowerCase();
  if (["success"].includes(t)) return "success";
  if (["error", "payment_failed"].includes(t)) return "error";
  if (
    ["warning", "dispute_opened", "dispute_resolved", "bad_review"].includes(t)
  ) return "warning";
  return "info";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderEmail(
  record: NotificationRecord,
  appUrl: string
): { subject: string; html: string; text: string } {
  const sev = severityFor(record.type);
  const palette = SEVERITY_COLORS[sev];

  const subject = `[Servicios 360] ${record.title}`;

  const ctaUrl = `${appUrl.replace(/\/$/, "")}/login`;

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(record.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid #e2e8f0;">
              <div style="font-size:18px;font-weight:700;color:#0f172a;">
                Servicios <span style="color:#f97316;">360</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <div style="display:inline-block;padding:4px 12px;border-radius:999px;background:${palette.bg};color:${palette.fg};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:16px;">
                ${palette.label}
              </div>
              <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.4;color:#0f172a;">${escapeHtml(record.title)}</h1>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#334155;white-space:pre-wrap;">${escapeHtml(record.message)}</p>
              <a href="${escapeHtml(ctaUrl)}"
                 style="display:inline-block;padding:12px 22px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
                Ver en Servicios 360
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.5;">
              Recibís este correo porque tenés una cuenta en Servicios 360.
              Si pensás que fue un error, podés ignorarlo.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${record.title}\n\n${record.message}\n\nVer en Servicios 360: ${ctaUrl}`;

  return { subject, html, text };
}

async function sendViaResend(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const RESEND_FROM_EMAIL =
    Deno.env.get("RESEND_FROM_EMAIL") ??
    "Servicios 360 <noreply@serviciosyalr.com.ar>";
  const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
  const APP_URL = Deno.env.get("APP_URL") ?? "https://serviciosyalr.com.ar";

  // Auth via shared webhook secret (only if configured).
  if (WEBHOOK_SECRET) {
    const provided = req.headers.get("x-webhook-secret");
    if (provided !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (payload?.type !== "INSERT" || payload.table !== "notifications") {
    return new Response(JSON.stringify({ ok: true, skipped: "non-insert" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = payload.record;
  if (!record?.user_id || !record?.title || !record?.message) {
    return new Response(JSON.stringify({ ok: true, skipped: "incomplete" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Graceful no-op if Resend is not configured yet.
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping email delivery", {
      notification_id: record.id,
    });
    return new Response(
      JSON.stringify({ ok: true, skipped: "resend_not_configured" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Look up recipient email via service role.
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
    record.user_id
  );
  if (userError || !userData?.user?.email) {
    console.error("Could not resolve recipient email", {
      notification_id: record.id,
      user_id: record.user_id,
      err: userError?.message,
    });
    return new Response(
      JSON.stringify({ ok: true, skipped: "no_email" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const { subject, html, text } = renderEmail(record, APP_URL);

  try {
    const result = await sendViaResend({
      apiKey: RESEND_API_KEY,
      from: RESEND_FROM_EMAIL,
      to: userData.user.email,
      subject,
      html,
      text,
    });
    if (!result.ok) {
      console.error("Resend rejected the email", {
        status: result.status,
        body: result.body,
      });
      return new Response(
        JSON.stringify({ ok: false, status: result.status }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-notification-email error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
