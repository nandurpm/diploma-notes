import { askPoly } from "./ask-handler.js";
import { evaluateMockExam } from "./mock-evaluator.js";
import {
  cleanText,
  checkRateLimit,
  corsHeaders,
  isOriginAllowed,
  jsonResponse
} from "./http.js";

async function readJson(request, maximumSize) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumSize) {
      await reader.cancel();
      const error = new Error("The request is too large.");
      error.status = 413;
      throw error;
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try { return JSON.parse(text); } catch (_) { return null; }
}

export class RateLimiter {
  constructor(state) {
    this.storage = state.storage;
  }

  async fetch(request) {
    if (request.method !== "POST") return new Response(null, { status: 405 });
    const body = await request.json().catch(() => ({}));
    const bucket = String(body.bucket || "request").slice(0, 32);
    const maximum = Math.max(1, Math.min(100, Number(body.maximum || 1)));
    const windowMs = Math.max(1000, Math.min(3600000, Number(body.windowMs || 60000)));
    const now = Date.now();
    const current = await this.storage.get(bucket);
    const value = !current || current.expiresAt <= now
      ? { count: 1, expiresAt: now + windowMs }
      : { count: current.count + 1, expiresAt: current.expiresAt };
    await this.storage.put(bucket, value);
    return Response.json(
      { allowed: value.count <= maximum, retryAfterMs: Math.max(0, value.expiresAt - now) },
      { status: value.count <= maximum ? 200 : 429 }
    );
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      if (!isOriginAllowed(origin, env)) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true }, {
        status: 200,
        headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
      });
    }

    const allowedPaths = ["/api/ask-poly", "/api/evaluate-mock-exam"];
    if (request.method !== "POST" || !allowedPaths.includes(url.pathname)) {
      return jsonResponse({ error: "Not found." }, 404, origin, env);
    }

    if (!isOriginAllowed(origin, env)) {
      return jsonResponse({ error: "This website origin is not allowed." }, 403, origin, env);
    }

    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ error: "Ask POLY AI is not configured yet." }, 503, origin, env);
    }

    const isExam = url.pathname === "/api/evaluate-mock-exam";
    const maximumSize = isExam ? 120000 : 40000;
    if (Number(request.headers.get("Content-Length") || 0) > maximumSize) {
      return jsonResponse({ error: "The request is too large." }, 413, origin, env);
    }

    const allowed = await checkRateLimit(request, env, isExam ? "exam" : "ask", isExam ? 5 : 30)
      .catch((error) => {
        console.error("Persistent rate limiter failed", error);
        return false;
      });
    if (!allowed) {
      return jsonResponse({ error: isExam
        ? "Too many mock-exam evaluations. Please wait a few minutes."
        : "Too many questions. Please wait a few minutes and try again." }, 429, origin, env);
    }

    let body;
    try {
      body = await readJson(request, maximumSize);
    } catch (error) {
      return jsonResponse({ error: error.message }, error.status || 400, origin, env);
    }
    if (!body) return jsonResponse({ error: "Invalid JSON request." }, 400, origin, env);

    if (isExam) {
      try {
        const result = await evaluateMockExam(body, env);
        return jsonResponse(result, 200, origin, env);
      } catch (error) {
        console.error("Mock exam evaluation failed", error);
        const validationError = /missing|incomplete|unknown|duplicate|select exactly|requires exactly/i.test(String(error?.message || ""));
        return jsonResponse({
          error: validationError
            ? cleanText(error.message, 300)
            : "The AI evaluation could not be completed right now. Your saved answers have not been lost; please submit again.",
          detail: env.EXPOSE_ERRORS === "true" ? cleanText(error?.message, 500) : undefined
        }, validationError ? 400 : 502, origin, env);
      }
    }

    try {
      const result = await askPoly(body, env);
      return jsonResponse(result, 200, origin, env);
    } catch (error) {
      console.error("Ask POLY AI request failed", error);
      const missingMessage = String(error?.message || "") === "Please enter a question.";
      return jsonResponse({
        error: missingMessage
          ? "Please enter a question."
          : "The AI service could not answer right now. The local lesson assistant is still available.",
        detail: env.EXPOSE_ERRORS === "true" ? cleanText(error?.message, 500) : undefined
      }, missingMessage ? 400 : 502, origin, env);
    }
  }
};
