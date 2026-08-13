/* Purpose: Http - Descriptive comment added for clarity */
const DEFAULT_ORIGINS = [
  "https://polypmna.dpdns.org",
  "https://www.polypmna.dpdns.org",
  "https://polypmna.dpdns.com",
  "https://www.polypmna.dpdns.com",
  "https://polypmna.blogspot.com",
  "https://polypmna.blogspot.in",
  "https://gptcperinthalamanna.dpdns.org",
  "https://www.gptcperinthalamanna.dpdns.org",
  "http://localhost:8000",
  "http://127.0.0.1:8000"
];

const DEFAULT_ORIGINS_SET = new Set(DEFAULT_ORIGINS);

// Module-scope cache for parsed ALLOWED_ORIGINS to avoid parsing on every request.
let cachedOriginsSet = null;
let cachedAllowedOriginsString = null;

export function cleanText(value, maximum = 10000) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, maximum);
}

/**
 * Returns a Set of allowed origins.
 * PERFORMANCE OPTIMIZATION: Caches the parsed Set of allowed origins in module scope.
 * This avoids calling split(), map(), trim(), and Set construction on every API request
 * when the configured ALLOWED_ORIGINS value has not changed.
 */
export function allowedOrigins(env) {
  const rawConfig = env?.ALLOWED_ORIGINS || "";

  if (cachedOriginsSet !== null && cachedAllowedOriginsString === rawConfig) {
    return cachedOriginsSet;
  }

  const configured = String(rawConfig)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const result = configured.length ? new Set(configured) : DEFAULT_ORIGINS_SET;

  // Cache the result and the input config string
  cachedOriginsSet = result;
  cachedAllowedOriginsString = rawConfig;

  return result;
}

export function isOriginAllowed(origin, env) {
  return !origin || allowedOrigins(env).has(origin);
}

export function corsHeaders(origin, env) {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins(env).has(origin) ? origin : DEFAULT_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy": "default-src 'none'",
      "Referrer-Policy": "no-referrer"
    }
  });
}

export function createRateLimiter(maximum, windowMs = 10 * 60 * 1000) {
  const buckets = new Map();
  return (request) => {
    const rawIp = request.headers.get("CF-Connecting-IP")
      || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()
      || "unknown";
    const key = rawIp.replace(/[^0-9a-fA-F.:%_-]/g, "").slice(0, 45) || "unknown";
    const now = Date.now();
    const recent = (buckets.get(key) || []).filter((timestamp) => now - timestamp < windowMs);
    if (recent.length >= maximum) {
      buckets.set(key, recent);
      return false;
    }
    recent.push(now);
    buckets.set(key, recent);
    if (buckets.size > 2000) {
      for (const [bucketKey, timestamps] of buckets) {
        if (!timestamps.some((timestamp) => now - timestamp < windowMs)) buckets.delete(bucketKey);
        if (buckets.size <= 1500) break;
      }
    }
    return true;
  };
}
