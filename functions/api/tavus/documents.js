// Cloudflare Pages Function — /api/tavus/documents
// Proxies Tavus Knowledge Base document endpoints.
// Set TAVUS_API_KEY in Cloudflare Pages → Settings → Environment Variables.
//
// POST body: { document_name, document_url, tags? }
// Returns: { document_id, status, ... }
//
// GET: Lists all documents in the knowledge base.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// POST /api/tavus/documents — upload a document to Tavus KB
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

  const { document_name, document_url, tags } = body;
  if (!document_name || !document_url) {
    return new Response(JSON.stringify({ error: "document_name and document_url are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const payload = { document_name, document_url };
  if (tags) payload.tags = tags;

  try {
    const resp = await fetch("https://tavusapi.com/v2/documents", {
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
    return new Response(JSON.stringify({ error: "Failed to upload document", detail: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

// GET /api/tavus/documents — list all documents
export async function onRequestGet({ env }) {
  const apiKey = env.TAVUS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "TAVUS_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  try {
    const resp = await fetch("https://tavusapi.com/v2/documents", {
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to list documents", detail: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
