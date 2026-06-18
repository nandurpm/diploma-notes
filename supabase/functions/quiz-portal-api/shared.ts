export const CORS = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

export const ALLOWED_ORIGINS = new Set([
  "https://polypmna.dpdns.org",
  "https://www.polypmna.dpdns.org",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

export function corsForRequest(request) {
  const origin = request.headers.get("Origin") || "";
  return {
    ...CORS,
    ...(origin && ALLOWED_ORIGINS.has(origin)
      ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
      : {}),
  };
}

export const QUESTIONS_PER_DAY = 10;

export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

export function dateKeyIST(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function addDays(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12))
    .toISOString()
    .slice(0, 10);
}

export function hashString(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed) {
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(items, random) {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

export function sanitizeUsername(value, fallback = "") {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .slice(0, 30);
  return cleaned.length >= 3 ? cleaned : fallback;
}

export function attemptCount(row) {
  return Number(
    row?.attempt_count ??
      (row?.completed ? (row?.retry_used ? 2 : 1) : 0),
  );
}
