// Cloudflare Pages Function — GET /api/tavus/personas/:id
// Fetches a single Tavus persona by persona_id.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestGet({ params, env }) {
  const apiKey = env.TAVUS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "TAVUS_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const personaId = params.id;
  if (!personaId) {
    return new Response(JSON.stringify({ error: "persona id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  try {
    const resp = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch persona", detail: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
