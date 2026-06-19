const ALLOWED_ORIGINS = new Set([
  "https://polypmna.dpdns.org",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const corsHeaders = (request: Request) => {
  const origin = request.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://polypmna.dpdns.org",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};

Deno.serve(async (request) => {
  const headers = corsHeaders(request);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });

  let body: { action?: string } = {};
  try { body = await request.json(); } catch (_) {}

  if (body.action === "health") {
    return Response.json({ ok: true, service: "quiz-portal-api", time: new Date().toISOString() }, { headers });
  }

  return Response.json({ error: "Unsupported action" }, { status: 400, headers });
});
