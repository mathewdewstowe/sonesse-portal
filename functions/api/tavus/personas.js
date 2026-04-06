// Cloudflare Pages Function — POST /api/tavus/personas
// Creates a Tavus persona (avatar configuration with system prompt, voice, LLM).
// Set TAVUS_API_KEY in Cloudflare Pages → Settings → Environment Variables.
//
// POST body: {
//   persona_name,
//   replica_id,
//   system_prompt,
//   context?,
//   layers?: { llm?: { model, base_url?, api_key? }, tts?: { api_key?, tts_engine?, voice_id? } }
// }
// Returns: { persona_id, persona_name, replica_id, ... }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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

  const { persona_name, replica_id, system_prompt, context, layers, document_ids } = body;
  if (!persona_name || !replica_id) {
    return new Response(JSON.stringify({ error: "persona_name and replica_id are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const payload = {
    persona_name,
    default_replica_id: replica_id,
    system_prompt: system_prompt || "You are a helpful AI assistant.",
    ...(context ? { context } : {}),
    ...(layers ? { layers } : {}),
    ...(document_ids && document_ids.length > 0 ? { document_ids } : {}),
  };

  try {
    const resp = await fetch("https://tavusapi.com/v2/personas", {
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
    return new Response(JSON.stringify({ error: "Failed to create persona", detail: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

// GET /api/tavus/personas — list personas
export async function onRequestGet({ env }) {
  const apiKey = env.TAVUS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "TAVUS_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  try {
    const resp = await fetch("https://tavusapi.com/v2/personas", {
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to list personas", detail: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
