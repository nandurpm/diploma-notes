import { askPoly } from "./ask-handler.js";
import { evaluateMockExam } from "./mock-evaluator.js";
import {
  cleanText,
  corsHeaders,
  createRateLimiter,
  isOriginAllowed,
  jsonResponse
} from "./http.js";

const allowAsk = createRateLimiter(30);
const allowExam = createRateLimiter(5);

async function readJson(request) {
  try {
    return await request.json();
  } catch (_) {
    return null;
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

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return jsonResponse({
        ok: true,
        service: "Ask POLY AI",
        configured: Boolean(env.NVIDIA_API_KEY || env.OPENAI_API_KEY),
        provider: env.NVIDIA_API_KEY ? "nvidia" : "openai",
        model: env.NVIDIA_API_KEY
          ? env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct"
          : env.OPENAI_MODEL || "gpt-4o-mini",
        mockExamEvaluation: true,
        mockExamPattern: "1004-75-mark-official-model"
      }, 200, origin, env);
    }

    const allowedPaths = ["/", "/api/ask-poly", "/api/evaluate-mock-exam"];
    if (request.method !== "POST" || !allowedPaths.includes(url.pathname)) {
      return jsonResponse({ error: "Not found." }, 404, origin, env);
    }

    if (!isOriginAllowed(origin, env)) {
      return jsonResponse({ error: "This website origin is not allowed." }, 403, origin, env);
    }

    const isExam = url.pathname === "/api/evaluate-mock-exam";
    if ((isExam && !env.OPENAI_API_KEY) || (!isExam && !env.NVIDIA_API_KEY && !env.OPENAI_API_KEY)) {
      return jsonResponse({ error: "Ask POLY AI is not configured yet." }, 503, origin, env);
    }
    const maximumSize = isExam ? 120000 : 40000;
    if (Number(request.headers.get("Content-Length") || 0) > maximumSize) {
      return jsonResponse({ error: "The request is too large." }, 413, origin, env);
    }

    const body = await readJson(request);
    if (!body) return jsonResponse({ error: "Invalid JSON request." }, 400, origin, env);

    if (isExam) {
      if (!allowExam(request)) {
        return jsonResponse({ error: "Too many mock-exam evaluations. Please wait a few minutes." }, 429, origin, env);
      }
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

    if (!allowAsk(request)) {
      return jsonResponse({ error: "Too many questions. Please wait a few minutes and try again." }, 429, origin, env);
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
        diagnostic: missingMessage ? undefined : {
          provider: cleanText(error?.provider, 40) || undefined,
          upstreamStatus: Number(error?.status) || undefined,
          upstreamCode: cleanText(error?.code, 80) || undefined,
          upstreamType: cleanText(error?.type, 80) || undefined,
          responsesStatus: Number(error?.responsesStatus) || undefined,
          responsesCode: cleanText(error?.responsesCode, 80) || undefined,
          nvidiaStatus: Number(error?.nvidiaStatus) || undefined,
          nvidiaCode: cleanText(error?.nvidiaCode, 80) || undefined
        },
        detail: env.EXPOSE_ERRORS === "true" ? cleanText(error?.message, 500) : undefined
      }, missingMessage ? 400 : 502, origin, env);
    }
  }
};
