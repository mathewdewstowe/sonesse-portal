// Cloudflare Pages Function — POST /api/notify-signup
// Called from the portal after a successful Supabase signup.
// Sends a notification email to matthew@sonesse.ai via Resend.
// Set RESEND_API_KEY in Cloudflare Pages → Settings → Environment Variables.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const NOTIFY_TO = "matthew@sonesse.ai";
const FROM     = "noreply@sonesse.ai";

export async function onRequestPost({ request, env }) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    // Silently succeed so signup UX isn't broken if key isn't set yet
    return new Response(JSON.stringify({ ok: true, note: "RESEND_API_KEY not set" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  let body = {};
  try { body = await request.json(); } catch {}

  const { email = "unknown", name = "" } = body;
  const now = new Date().toUTCString();

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e;">
      <div style="margin-bottom:24px;">
        <svg width="24" height="24" viewBox="0 0 40 40" style="vertical-align:middle;margin-right:8px;">
          <circle cx="8" cy="20" r="4" fill="#6d28d9"/>
          <circle cx="20" cy="20" r="4" fill="#7c3aed"/>
          <circle cx="32" cy="20" r="4" fill="#8b5cf6"/>
        </svg>
        <span style="font-weight:700;font-size:16px;vertical-align:middle;">Sonesse</span>
      </div>
      <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">New portal sign-up 🎉</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">A new user just created an account on the Sonesse portal.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <table style="font-size:14px;width:100%;border-collapse:collapse;">
          <tr><td style="color:#6b7280;padding:4px 0;width:100px;">Email</td><td style="font-weight:600;color:#111827;">${email}</td></tr>
          ${name ? `<tr><td style="color:#6b7280;padding:4px 0;">Name</td><td style="font-weight:600;color:#111827;">${name}</td></tr>` : ""}
          <tr><td style="color:#6b7280;padding:4px 0;">Time</td><td style="font-weight:600;color:#111827;">${now}</td></tr>
        </table>
      </div>
      <p style="font-size:12px;color:#9ca3af;margin:0;">Sent automatically by Sonesse Portal</p>
    </div>
  `;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [NOTIFY_TO],
        subject: `New sign-up: ${email}`,
        html,
      }),
    });

    const result = await resp.json();
    return new Response(JSON.stringify({ ok: resp.ok, result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 200, // Still 200 so portal signup UX isn't broken
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
