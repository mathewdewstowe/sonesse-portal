// Cloudflare Pages Function — POST /api/teams/create-meeting
// Creates a Microsoft Teams calendar event in the umified.com tenant and
// invites [experienceId]@my-meeting-bot.com as a required attendee.
//
// Required env vars (Cloudflare Pages → Settings → Environment Variables):
//   AZURE_TENANT_ID       — Azure AD / Entra tenant ID for umified.com
//   AZURE_CLIENT_ID       — App registration client ID (needs Calendars.ReadWrite application permission)
//   AZURE_CLIENT_SECRET   — App registration client secret
//   TEAMS_ORGANIZER_UPN   — UPN of the calendar owner, e.g. matthew@umified.com
//
// POST body: { experienceId, experienceName?, startTime?, endTime? }
// Returns:   { ok, joinWebUrl, eventId, botEmail }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Persona-Id, X-Replica-Id",
};

async function getAccessToken(tenantId, clientId, clientSecret) {
  const resp = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error_description || data.error || "Failed to get access token");
  }
  return data.access_token;
}

export async function onRequestPost({ request, env }) {
  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, TEAMS_ORGANIZER_UPN } = env;

  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET || !TEAMS_ORGANIZER_UPN) {
    return new Response(
      JSON.stringify({ ok: false, error: "Teams integration not configured. Set AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET and TEAMS_ORGANIZER_UPN in Cloudflare Pages environment variables." }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json", ...CORS } }
    );
  }

  const { experienceId, experienceName = "Sonesse Experience", startTime, endTime, botEmail: customBotEmail, userEmail } = body;
  const personaId = request.headers.get("X-Persona-Id") || "";
  const replicaId = request.headers.get("X-Replica-Id") || "";
  if (!experienceId) {
    return new Response(
      JSON.stringify({ ok: false, error: "experienceId is required" }),
      { status: 400, headers: { "Content-Type": "application/json", ...CORS } }
    );
  }

  const botEmail = customBotEmail || `${experienceId}@my-meeting-bot.com`;

  // Default: start now, end in 15 minutes
  const start = new Date(start.getTime() + 9 * 60 * 1000);
  const end   = new Date(start.getTime() + 19 * 60 * 1000);

  try {
    const token = await getAccessToken(AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET);

    const event = {
      subject: `Sonesse: ${experienceName}${personaId ? ` | ${personaId}` : ""}${replicaId ? ` / ${replicaId}` : ""}`,
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness",
      start: { dateTime: start.toISOString().replace("Z", ""), timeZone: "UTC" },
      end:   { dateTime: end.toISOString().replace("Z", ""),   timeZone: "UTC" },
      attendees: [
        {
          emailAddress: { address: botEmail, name: "Sonesse Meeting Bot" },
          type: "required",
        },
        ...(userEmail ? [{
          emailAddress: { address: userEmail, name: userEmail },
          type: "required",
        }] : []),
      ],
      body: {
        contentType: "HTML",
        content: `<p>This Teams meeting was created automatically by <strong>Sonesse</strong>.</p><p>Experience: <strong>${experienceName}</strong></p><p>Experience ID: <code>${experienceId}</code></p>`,
      },
    };

    const resp = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(TEAMS_ORGANIZER_UPN)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error?.message || JSON.stringify(data.error) || "Failed to create Teams event");
    }

    // Graph returns onlineMeeting.joinUrl for the Teams join link
    const joinWebUrl =
      data.onlineMeeting?.joinUrl ||
      data.onlineMeetingUrl ||
      null;

    return new Response(
      JSON.stringify({
        ok: true,
        eventId: data.id,
        joinWebUrl,
        subject: data.subject,
        botEmail,
        start: data.start?.dateTime,
        end: data.end?.dateTime,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...CORS } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
