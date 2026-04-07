// Cloudflare Pages Function — POST /api/tavus/conversations
// Creates a Tavus CVI conversation (live avatar session) server-side.
// Set TAVUS_API_KEY in Cloudflare Pages → Settings → Environment Variables.
//
// POST body: { replica_id, persona_id?, conversation_name?, conversational_context?, properties? }
// Returns: { conversation_id, conversation_url, status, ... }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestPost({ request, env }) {
  const apiKey = env.TAVUS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "TAVUS_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const { replica_id, persona_id, conversation_name, conversational_context, properties } = body;
  if (!replica_id) {
    return new Response(JSON.stringify({ error: "replica_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const payload = {
    replica_id,
    conversation_name: conversation_name || "Sonesse Preview",
    conversational_context: conversational_context || "You are a helpful AI assistant.",
    properties: {
      max_call_duration: 300,
      enable_recording: true,
      enable_closed_captions: true,
      apply_greenscreen: false,
      ...(properties || {}),
    },
  };
  if (persona_id) payload.persona_id = persona_id;

  try {
    const resp = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to create conversation", detail: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

// GET /api/tavus/conversations — list all conversations
export async function onRequestGet({ env }) {
  const apiKey = env.TAVUS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "TAVUS_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  try {
    // Fetch up to 3 pages to get recent conversations
    const headers = { "x-api-key": apiKey, "Content-Type": "application/json" };
    const allConversations = [];
    let page = 1;
    while (page <= 3) {
      const resp = await fetch(`https://tavusapi.com/v2/conversations?limit=100&page=${page}`, { headers });
      if (!resp.ok) break;
      const data = await resp.json();
      const list = Array.isArray(data) ? data : (data.data || data.conversations || []);
      if (list.length === 0) break;
      allConversations.push(...list);
      if (list.length < 100) break; // last page
      page++;
    }
    // Sort newest first
    allConversations.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return new Response(JSON.stringify(allConversations), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to list conversations", detail: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
