// Ask POLY Cloudflare Worker
// Multi-provider fallback: Website/RAG context -> Cache -> NVIDIA -> Gemini -> OpenRouter -> safe local fallback.
// Keep all API keys as Cloudflare Worker secrets. Never put keys in frontend files.

const ALLOWED_ORIGINS = new Set([
  "https://polypmna.dpdns.org",
  "https://www.polypmna.dpdns.org",
  "http://localhost:8787"
]);

const MODEL_CONFIG = {
  nvidia: {
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    model: "meta/llama-3.1-70b-instruct"
  },
  gemini: {
    model: "gemini-1.5-flash"
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "qwen/qwen-2.5-72b-instruct"
  }
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://polypmna.dpdns.org";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonResponse(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hashKey(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `ask-poly:${(hash >>> 0).toString(16)}`;
}

function buildMessages(message, history = []) {
  const system = `You are Ask POLY, the official website assistant for polypmna.dpdns.org / Polytechnic Study Hub.
Answer clearly and practically for Kerala Polytechnic students.
Do not invent missing local lesson pages, notes PDFs, ZIP files, or download links.
If local notes or lessons are unavailable, say they are not uploaded yet.
For official syllabus and sample question papers, direct users to SITTTR links shown on the subject cards.
Keep answers short unless the user asks for detail.`;

  const safeHistory = Array.isArray(history) ? history.slice(-8).map((item) => ({
    role: item.role === "assistant" ? "assistant" : "user",
    content: normalizeText(item.content).slice(0, 2000)
  })).filter((item) => item.content) : [];

  return [
    { role: "system", content: system },
    ...safeHistory,
    { role: "user", content: normalizeText(message).slice(0, 6000) }
  ];
}

async function withTimeout(promise, ms = 22000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function callNvidia(env, messages) {
  if (!env.NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY secret missing");
  return withTimeout(async (signal) => {
    const response = await fetch(MODEL_CONFIG.nvidia.url, {
      method: "POST",
      signal,
      headers: {
        "Authorization": `Bearer ${env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.NVIDIA_MODEL || MODEL_CONFIG.nvidia.model,
        messages,
        temperature: 0.35,
        max_tokens: 900
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`NVIDIA failed ${response.status}: ${data.error?.message || data.detail || "unknown"}`);
    const answer = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";
    if (!answer.trim()) throw new Error("NVIDIA returned empty answer");
    return { answer, provider: "nvidia" };
  });
}

async function callGemini(env, messages) {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY secret missing");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL || MODEL_CONFIG.gemini.model}:generateContent?key=${env.GEMINI_API_KEY}`;
  const text = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
  return withTimeout(async (signal) => {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 900 }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Gemini failed ${response.status}: ${data.error?.message || "unknown"}`);
    const answer = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
    if (!answer.trim()) throw new Error("Gemini returned empty answer");
    return { answer, provider: "gemini" };
  });
}

async function callOpenRouter(env, messages) {
  if (!env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY secret missing");
  return withTimeout(async (signal) => {
    const response = await fetch(MODEL_CONFIG.openrouter.url, {
      method: "POST",
      signal,
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://polypmna.dpdns.org",
        "X-Title": "Ask POLY"
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL || MODEL_CONFIG.openrouter.model,
        messages,
        temperature: 0.35,
        max_tokens: 900
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`OpenRouter failed ${response.status}: ${data.error?.message || "unknown"}`);
    const answer = data.choices?.[0]?.message?.content || "";
    if (!answer.trim()) throw new Error("OpenRouter returned empty answer");
    return { answer, provider: "openrouter" };
  });
}

function localFallback(message) {
  const q = normalizeText(message).toLowerCase();
  if (/subject|syllabus|notes|lesson|department|semester|sitttr|qp|question paper/.test(q)) {
    return "AI providers are temporarily unavailable, but you can still use the website: open Revision 2021, choose your department, and use the subject cards for Open Syllabus and Sample QP. Lesson/Notes buttons appear only when local files are uploaded.";
  }
  if (/mock|quiz|exam/.test(q)) return "AI providers are temporarily unavailable. For exam practice, open the Mock Exams page from the top menu.";
  if (/tool|calculator/.test(q)) return "AI providers are temporarily unavailable. Open the Tools page for calculators and student helpers.";
  if (/broken|report|not working/.test(q)) return "AI providers are temporarily unavailable. To report an issue, open Help and send the page URL, subject code, button name, screenshot, and what happened.";
  return "AI providers are temporarily unavailable. Try again later, or use Revision 2021, Tools, Mock Exams, and Help from the top menu.";
}

async function getCached(env, key) {
  if (!env.ASK_POLY_CACHE) return null;
  try {
    const value = await env.ASK_POLY_CACHE.get(key, "json");
    if (value?.answer) return value;
  } catch (_) {}
  return null;
}

async function putCached(env, key, value) {
  if (!env.ASK_POLY_CACHE) return;
  try {
    await env.ASK_POLY_CACHE.put(key, JSON.stringify(value), { expirationTtl: 60 * 60 * 12 });
  } catch (_) {}
}

async function handleAsk(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 40_000) return jsonResponse(request, { error: "Message too large" }, 413);

  const body = await request.json().catch(() => null);
  const message = normalizeText(body?.message);
  const history = Array.isArray(body?.history) ? body.history : [];

  if (!message) return jsonResponse(request, { error: "Empty message" }, 400);
  if (message.length > 7000) return jsonResponse(request, { error: "Message too long" }, 413);

  const cacheKey = hashKey(`${message}|${history.slice(-2).map((m) => m.content).join("|")}`);
  const cached = await getCached(env, cacheKey);
  if (cached) return jsonResponse(request, { ...cached, cached: true });

  const messages = buildMessages(message, history);
  const errors = [];
  const providers = [callNvidia, callGemini, callOpenRouter];

  for (const provider of providers) {
    try {
      const result = await provider(env, messages);
      const response = { answer: result.answer, provider: result.provider, cached: false };
      await putCached(env, cacheKey, response);
      return jsonResponse(request, response);
    } catch (error) {
      errors.push(error.message || String(error));
    }
  }

  const fallback = { answer: localFallback(message), provider: "local-fallback", cached: false, errors: errors.slice(0, 3) };
  return jsonResponse(request, fallback, 200);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(request) });

    const url = new URL(request.url);
    if (url.pathname !== "/api/ask-poly") {
      return jsonResponse(request, { error: "Not found" }, 404);
    }
    if (request.method !== "POST") {
      return jsonResponse(request, { error: "Method not allowed" }, 405);
    }

    try {
      return await handleAsk(request, env);
    } catch (error) {
      return jsonResponse(request, {
        answer: "Ask POLY backend had an internal error. Use website search, Revision 2021, Tools, or Help page for now.",
        provider: "error-fallback",
        error: error.message || String(error)
      }, 200);
    }
  }
};
