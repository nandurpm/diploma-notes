import { askPoly, configuredProviders } from "./ask-handler.js";
import { evaluateMockExam } from "./mock-evaluator.js";
import { SYSTEM_INSTRUCTIONS } from "./site-instructions.js";
import {
  cleanText,
  corsHeaders,
  createRateLimiter,
  isOriginAllowed,
  jsonResponse
} from "./http.js";

const allowAsk = createRateLimiter(30);
const allowExam = createRateLimiter(5);
const KNOWLEDGE_MODE = "whole-site-revision-aware-v1";

async function readJson(request) {
  try {
    return await request.json();
  } catch (_) {
    return null;
  }
}

function enrichAskBody(body) {
  const suppliedContext = cleanText(body?.pageContext, 12000);
  const websiteContext = [
    "POLY PMNA WEBSITE POLICY AND CURRENT STRUCTURE",
    SYSTEM_INSTRUCTIONS,
    suppliedContext ? `CURRENT MATCHES FROM THE GENERATED WEBSITE INDEX:\n${suppliedContext}` : "",
    "Use the matched website records when answering. Keep Revision 2026, Revision 2021 and 2015 materials separate."
  ].filter(Boolean).join("\n\n");

  return {
    ...body,
    pageTitle: cleanText(body?.pageTitle, 160) || "POLY PMNA whole-site knowledge",
    pageContext: websiteContext
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    const providers = configuredProviders(env);

    if (request.method === "OPTIONS") {
      if (!isOriginAllowed(origin, env)) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return jsonResponse({
        ok: true,
        service: "Ask POLY AI",
        configured: providers.length > 0,
        knowledgeMode: KNOWLEDGE_MODE,
        revisionAware: ["2026", "2021", "2015"],
        wholeSiteContext: true,
        localMathFallback: true,
        providers,
        model: providers[0] === "nvidia"
          ? (env.NVIDIA_MODEL || "nvidia/nemotron-3-ultra-550b-a55b")
          : providers[0] === "gemini"
            ? (env.GEMINI_MODEL || "gemini-3.5-flash")
            : (env.OPENAI_MODEL || "gpt-4o-mini"),
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
      const result = await askPoly(enrichAskBody(body), env);
      return jsonResponse({ ...result, knowledgeMode: KNOWLEDGE_MODE }, 200, origin, env);
    } catch (error) {
      console.error("Ask POLY AI request failed", error);
      const missingMessage = String(error?.message || "") === "Please enter a question.";
      return jsonResponse({
        error: missingMessage
          ? "Please enter a question."
          : "The AI service could not answer right now. Local maths still works for arithmetic, equations, percentages and common diploma calculations.",
        detail: env.EXPOSE_ERRORS === "true" ? cleanText(error?.message, 500) : undefined
      }, missingMessage ? 400 : 502, origin, env);
    }
  }
};
