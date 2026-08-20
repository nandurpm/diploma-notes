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
  return String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maximum);
}

export function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function strictText(value, field, { min = 0, max = 10000, pattern = null } = {}) {
  if (typeof value !== "string") throw new TypeError(`${field} must be a string.`);
  if (value.length < min || value.length > max) throw new TypeError(`${field} has an invalid length.`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) throw new TypeError(`${field} contains invalid control characters.`);
  if (pattern && !pattern.test(value)) throw new TypeError(`${field} has an invalid format.`);
  return cleanText(value, max);
}

export function strictJsonObject(value, field = "request") {
  if (!isPlainObject(value)) throw new TypeError(`${field} must be a JSON object.`);
  return value;
}

export function rejectUnknownKeys(value, allowed, field = "request") {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new TypeError(`${field} contains unsupported fields.`);
  return value;
}

function safeLogValue(value, depth = 0) {
  if (depth > 2 || value === null || value === undefined) return undefined;
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return cleanText(value, 240);
  if (Array.isArray(value)) return value.slice(0, 10).map((item) => safeLogValue(item, depth + 1));
  if (typeof value === "object") {
    const output = {};
    for (const [key, item] of Object.entries(value).slice(0, 30)) {
      if (/(authorization|token|password|secret|api.?key|cookie|email|body|prompt)/i.test(key)) {
        output[key] = "[REDACTED]";
      } else {
        const safe = safeLogValue(item, depth + 1);
        if (safe !== undefined) output[key] = safe;
      }
    }
    return output;
  }
  return undefined;
}

/** Structured Cloudflare Workers log event. Never pass credentials or request bodies. */
export function securityLog(event, fields = {}) {
  const payload = {
    type: "poly_pmna_security_event",
    event: cleanText(event, 100),
    timestamp: new Date().toISOString(),
    ...safeLogValue(fields)
  };
  console.log(JSON.stringify(payload));
}

export function requestLogContext(request) {
  return {
    method: request?.method || "UNKNOWN",
    path: request ? new URL(request.url).pathname : "unknown",
    origin: cleanText(request?.headers?.get("Origin"), 180) || "none",
    cfRay: cleanText(request?.headers?.get("CF-Ray"), 120) || "none"
  };
}

const AUTOMATION_USER_AGENT = /(curl|wget|python-requests|python\/[0-9]|scrapy|httpclient|headless|phantomjs|selenium|playwright|puppeteer|nikto|sqlmap|masscan|nmap)/i;

export function looksAutomated(request) {
  const userAgent = cleanText(request?.headers?.get("User-Agent"), 300);
  return Boolean(userAgent && AUTOMATION_USER_AGENT.test(userAgent));
}

export function abuseKey(request, scope = "api") {
  const rawIp = request?.headers?.get("CF-Connecting-IP")
    || request?.headers?.get("X-Forwarded-For")?.split(",")[0]?.trim()
    || "unknown";
  const normalized = rawIp.replace(/[^0-9a-fA-F.:%_-]/g, "").slice(0, 45) || "unknown";
  return `${scope}:${normalized}`;
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

export function streamResponse(stream, origin, env, metadata = {}) {
  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders(origin, env),
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy": "default-src 'none'",
      "Referrer-Policy": "no-referrer",
      ...(metadata.provider ? { "X-Ask-Poly-Provider": metadata.provider } : {}),
      ...(metadata.model ? { "X-Ask-Poly-Model": metadata.model } : {})
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
