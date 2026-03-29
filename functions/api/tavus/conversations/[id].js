// Cloudflare Pages Function — GET /api/tavus/conversations/:id
// Fetches a single Tavus conversation (includes transcript + recording_url).

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

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing conversation id" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  try {
    const resp = await fetch(`https://tavusapi.com/v2/conversations/${id}`, {
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch conversation", detail: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
