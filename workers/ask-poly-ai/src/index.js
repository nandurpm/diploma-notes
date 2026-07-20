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
const DEFAULT_CLOUDFLARE_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";

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

function hasWorkersAI(env) {
  return Boolean(env?.AI && typeof env.AI.run === "function");
}

function hasWorkersAIRest(env) {
  return Boolean(
    cleanText(env?.CLOUDFLARE_AI_ACCOUNT_ID, 128)
    && cleanText(env?.CLOUDFLARE_AI_API_TOKEN, 512)
  );
}

function workersAIModel(env) {
  return cleanText(env?.CLOUDFLARE_AI_MODEL, 180) || DEFAULT_CLOUDFLARE_AI_MODEL;
}

function cloudflareMessages(body) {
  const history = Array.isArray(body?.history)
    ? body.history.slice(-6).map((item) => ({
        role: item?.role === "assistant" ? "assistant" : "user",
        content: cleanText(item?.content ?? item?.text, 1000)
      })).filter((item) => item.content)
    : [];
  const question = cleanText(body?.message, 2200);
  const context = cleanText(body?.pageContext, 7000);
  const userContent = context
    ? `${question}\n\n--- CURRENT POLY PMNA WEBSITE CONTEXT ---\n${context}\n--- END WEBSITE CONTEXT ---`
    : question;

  return [
    {
      role: "system",
      content: [
        "You are Ask POLY AI, the educational assistant inside POLY PMNA for Kerala Polytechnic students.",
        "Answer the user's actual question directly. Match the user's language. Be accurate, practical and concise.",
        "Use supplied website context only when relevant. Never pretend the website contains information that is not present.",
        "Keep Revision 2026, Revision 2021 and 2015 scheme materials separate. Prioritize electrical and workshop safety.",
        SYSTEM_INSTRUCTIONS
      ].join("\n\n")
    },
    ...history,
    { role: "user", content: userContent }
  ];
}

function cloudflareInput(body, env) {
  return {
    messages: cloudflareMessages(body),
    max_tokens: Math.max(128, Math.min(1400, Number(env.MAX_OUTPUT_TOKENS || 900))),
    temperature: 0.25,
    top_p: 0.9
  };
}

function extractCloudflareAnswer(result) {
  return cleanText(
    result?.response
      || result?.answer
      || result?.result?.response
      || result?.result?.answer
      || result?.output_text,
    7000
  );
}

async function askWithWorkersAI(body, env) {
  if (!hasWorkersAI(env)) throw new Error("Cloudflare Workers AI binding is unavailable.");
  const model = workersAIModel(env);
  const result = await env.AI.run(model, cloudflareInput(body, env));
  const answer = extractCloudflareAnswer(result);
  if (!answer) throw new Error("Cloudflare Workers AI returned an empty response.");
  return {
    answer,
    citations: [],
    usedWeb: false,
    provider: "cloudflare-workers-ai",
    model,
    responseId: cleanText(result?.id || result?.request_id, 180)
  };
}

function cloudflareRestModelPath(model) {
  return String(model || "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function askWithWorkersAIRest(body, env) {
  if (!hasWorkersAIRest(env)) throw new Error("Cloudflare Workers AI REST credentials are unavailable.");
  const model = workersAIModel(env);
  const accountId = cleanText(env.CLOUDFLARE_AI_ACCOUNT_ID, 128);
  const token = cleanText(env.CLOUDFLARE_AI_API_TOKEN, 512);
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${cloudflareRestModelPath(model)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(cloudflareInput(body, env)),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      const detail = payload?.errors?.[0]?.message
        || payload?.error
        || `Cloudflare Workers AI REST returned HTTP ${response.status}.`;
      const error = new Error(cleanText(detail, 300));
      error.status = response.status;
      throw error;
    }
    const answer = extractCloudflareAnswer(payload);
    if (!answer) throw new Error("Cloudflare Workers AI REST returned an empty response.");
    return {
      answer,
      citations: [],
      usedWeb: false,
      provider: "cloudflare-workers-ai-rest",
      model,
      responseId: cleanText(payload?.result?.id || payload?.id, 180)
    };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Cloudflare Workers AI REST timed out.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function healthProviders(env, externalProviders) {
  return [
    ...(hasWorkersAI(env) ? ["cloudflare-workers-ai"] : []),
    ...(hasWorkersAIRest(env) ? ["cloudflare-workers-ai-rest"] : []),
    ...externalProviders
  ];
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    const externalProviders = configuredProviders(env);
    const providers = healthProviders(env, externalProviders);

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
        workersAIFallback: hasWorkersAI(env),
        workersAIRestFallback: hasWorkersAIRest(env),
        providers,
        model: (hasWorkersAI(env) || hasWorkersAIRest(env))
          ? workersAIModel(env)
          : externalProviders[0] === "nvidia"
            ? (env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct")
            : externalProviders[0] === "gemini"
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

    const enrichedBody = enrichAskBody(body);
    const providerErrors = [];

    if (hasWorkersAI(env)) {
      try {
        const result = await askWithWorkersAI(enrichedBody, env);
        return jsonResponse({ ...result, knowledgeMode: KNOWLEDGE_MODE }, 200, origin, env);
      } catch (error) {
        providerErrors.push(`cloudflare-workers-ai: ${cleanText(error?.message, 240)}`);
        console.error("Ask POLY Cloudflare Workers AI binding failed", error);
      }
    }

    if (hasWorkersAIRest(env)) {
      try {
        const result = await askWithWorkersAIRest(enrichedBody, env);
        return jsonResponse({ ...result, knowledgeMode: KNOWLEDGE_MODE }, 200, origin, env);
      } catch (error) {
        providerErrors.push(`cloudflare-workers-ai-rest: ${cleanText(error?.message, 240)}`);
        console.error("Ask POLY Cloudflare Workers AI REST failed", error);
      }
    }

    try {
      const result = await askPoly(enrichedBody, env);
      return jsonResponse({ ...result, knowledgeMode: KNOWLEDGE_MODE }, 200, origin, env);
    } catch (error) {
      providerErrors.push(`external-providers: ${cleanText(error?.message, 240)}`);
      console.error("Ask POLY AI request failed", error);
      const missingMessage = String(error?.message || "") === "Please enter a question.";
      return jsonResponse({
        error: missingMessage
          ? "Please enter a question."
          : "The AI service could not answer right now. Please retry once; your chat is saved.",
        retryable: !missingMessage,
        detail: env.EXPOSE_ERRORS === "true" ? providerErrors.join(" | ") : undefined
      }, missingMessage ? 400 : 502, origin, env);
    }
  }
};
