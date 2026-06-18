const DEFAULT_ORIGINS = [
  "https://polypmna.dpdns.org",
  "http://localhost:8000",
  "http://127.0.0.1:8000"
];

export function cleanText(value, maximum) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, maximum);
}

export function allowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set(configured.length ? configured : DEFAULT_ORIGINS);
}

export function isOriginAllowed(origin, env) {
  return Boolean(origin) && allowedOrigins(env).has(origin);
}

export function corsHeaders(origin, env) {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins(env).has(origin) ? origin : DEFAULT_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

export function jsonResponse(data, status, origin, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin, env),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export async function checkRateLimit(request, env, bucket, maximum) {
  if (!env.RATE_LIMITER) throw new Error("Persistent rate limiter is not configured.");
  const key = request.headers.get("CF-Connecting-IP")
    || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()
    || "unknown";
  const id = env.RATE_LIMITER.idFromName(key);
  const response = await env.RATE_LIMITER.get(id).fetch("https://rate-limit/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, maximum, windowMs: 10 * 60 * 1000 })
  });
  return response.ok;
}
