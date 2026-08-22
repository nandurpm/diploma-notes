/* Purpose: Index - Descriptive comment added for clarity */
import { askPoly, askPolyStream, configuredProviders } from "./ask-handler.js";
import { evaluateMockExam } from "./mock-evaluator.js";
import { canStoreVerifiedResults } from "./result-store.js";
import { SYSTEM_INSTRUCTIONS } from "./site-instructions.js";
import { matchFaq } from "./faq-match.js";
import {
  cleanText,
  corsHeaders,
  createRateLimiter,
  isOriginAllowed,
  isPlainObject,
  jsonResponse,
  rejectUnknownKeys,
  securityLog,
  strictJsonObject,
  strictText,
  streamResponse
} from "./http.js";

const allowAsk = createRateLimiter(30);
const allowExam = createRateLimiter(5);
const KNOWLEDGE_MODE = "whole-site-revision-aware-v1";
const DEFAULT_CLOUDFLARE_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";
const IMAGE_GEN_MODEL = "@cf/bytedance/stable-diffusion-xl-base-1.0";
const IMAGE_INTENT_PATTERN = /^\s*(?:create|generate|draw|make|show)\s+(?:an?\s+)?(?:image|picture|photo|drawing|sketch|illustration)\s+(?:of\s+)?(.+)/i;
const WEBSITE_INTENT_PATTERN = /\b(?:poly\s*pmna|revision|rev\s*20(?:21|26)|sitttr|subject(?:\s+code)?|syllabus|lessons?|notes?|model\s+question(?:\s+paper)?|sample\s+(?:question\s+)?paper|question\s+papers?|mock\s+exams?|department|semester|programme|course|website|web\s*site|page|links?|downloads?|resources?|2015\s+materials?|materials?\s+2015|student\s+tools?)\b/i;

async function readJson(request) {
  try {
    return await request.json();
  } catch (_) {
    return null;
  }
}

const ASK_KEYS = ["message", "history", "stream", "pageTitle", "pageContext", "selectedText", "departmentContext", "learningContext", "answerMode", "preferredLanguage", "dataSaver", "marks", "learningLevel", "attachment", "diagramRequest", "semester", "revision"];
const SIMPLE_STRING_FIELDS = {
  pageTitle: 160,
  pageContext: 12000,
  selectedText: 6000,
  answerMode: 40,
  preferredLanguage: 20,
  marks: 12,
  learningLevel: 30,
  semester: 30,
  revision: 30
};

function validateAskBody(value) {
  const body = strictJsonObject(value);
  rejectUnknownKeys(body, ASK_KEYS);
  strictText(body.message, "message", { min: 1, max: 2200 });
  for (const [field, max] of Object.entries(SIMPLE_STRING_FIELDS)) {
    if (body[field] !== undefined && body[field] !== null) strictText(body[field], field, { max });
  }
  if (body.stream !== undefined && typeof body.stream !== "boolean") throw new TypeError("stream must be a boolean.");
  if (body.dataSaver !== undefined && typeof body.dataSaver !== "boolean") throw new TypeError("dataSaver must be a boolean.");
  if (body.history !== undefined) {
    if (!Array.isArray(body.history) || body.history.length > 6) throw new TypeError("history has an invalid shape.");
    body.history = body.history.map((item) => {
      if (!isPlainObject(item)) throw new TypeError("history entries must be objects.");
      rejectUnknownKeys(item, ["role", "content", "text"], "history entry");
      if (item.role !== "user" && item.role !== "assistant") throw new TypeError("history role is invalid.");
      const content = item.content ?? item.text;
      return { role: item.role, content: strictText(content, "history content", { max: 1000 }) };
    });
  }
  if (body.departmentContext !== undefined && body.departmentContext !== null) {
    strictJsonObject(body.departmentContext, "departmentContext");
    rejectUnknownKeys(body.departmentContext, ["code", "displayName"], "departmentContext");
    if (body.departmentContext.code !== undefined) strictText(body.departmentContext.code, "department code", { max: 20, pattern: /^[A-Za-z0-9_-]+$/ });
    if (body.departmentContext.displayName !== undefined) strictText(body.departmentContext.displayName, "department name", { max: 160 });
  }
  if (body.learningContext !== undefined && body.learningContext !== null) {
    strictJsonObject(body.learningContext, "learningContext");
    rejectUnknownKeys(body.learningContext, ["semester", "revision", "mode", "marks", "level"], "learningContext");
    for (const [field, max] of Object.entries({ semester: 30, revision: 30, mode: 40, marks: 12, level: 30 })) {
      if (body.learningContext[field] !== undefined) strictText(body.learningContext[field], `learningContext.${field}`, { max });
    }
  }
  if (body.attachment !== undefined && body.attachment !== null) {
    strictJsonObject(body.attachment, "attachment");
    rejectUnknownKeys(body.attachment, ["name", "type", "size", "dataUrl"], "attachment");
    strictText(body.attachment.name, "attachment.name", { min: 1, max: 120, pattern: /^[^/\\\\]+$/ });
    strictText(body.attachment.type, "attachment.type", { max: 80, pattern: /^(?:image\/(?:png|jpeg|webp)|application\/pdf)$/i });
    if (!Number.isInteger(body.attachment.size) || body.attachment.size < 0 || body.attachment.size > 5 * 1024 * 1024) throw new TypeError("attachment.size is invalid.");
    if (body.attachment.dataUrl) throw new TypeError("Binary uploads are not accepted by this endpoint; paste text instead.");
    body.attachment = { name: body.attachment.name, type: body.attachment.type, size: body.attachment.size };
  }
  if (body.diagramRequest !== undefined && body.diagramRequest !== null) {
    strictJsonObject(body.diagramRequest, "diagramRequest");
    rejectUnknownKeys(body.diagramRequest, ["type", "title", "department"], "diagramRequest");
    if (body.diagramRequest.type !== undefined) strictText(body.diagramRequest.type, "diagramRequest.type", { max: 80, pattern: /^[A-Za-z0-9_-]+$/ });
    if (body.diagramRequest.title !== undefined) strictText(body.diagramRequest.title, "diagramRequest.title", { max: 120 });
    if (body.diagramRequest.department !== undefined) strictText(body.diagramRequest.department, "diagramRequest.department", { max: 160 });
  }
  return body;
}

function wantsWebsiteContext(body) {
  const message = cleanText(body?.message, 2200);
  if (!message) return false;
  return WEBSITE_INTENT_PATTERN.test(message) || /\b[1-6]\d{3,4}[A-Z]?\b/i.test(message);
}

function enrichAskBody(body) {
  const useWebsiteContext = wantsWebsiteContext(body);
  const suppliedContext = useWebsiteContext ? cleanText(body?.pageContext, 12000) : "";
  const websiteContext = suppliedContext
    ? `MATCHED RECORDS FROM THE POLY PMNA WEBSITE INDEX:\n${suppliedContext}\n\nUse only records directly relevant to the user's request. Ignore unrelated matches.`
    : "";

  return {
    ...body,
    pageTitle: useWebsiteContext
      ? (cleanText(body?.pageTitle, 160) || "POLY PMNA website question")
      : "Ask POLY AI general question",
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
    ? `${question}\n\n--- RELEVANT POLY PMNA WEBSITE CONTEXT ---\n${context}\n--- END WEBSITE CONTEXT ---`
    : question;

  return [
    {
      role: "system",
      content: [
        "You are Ask POLY AI, an educational assistant for Kerala Polytechnic students.",
        "Answer only the user's actual question. For simple factual questions, answer directly and stop.",
        "Do not mention POLY PMNA, subjects, syllabus, resources or links unless the user explicitly asks about them.",
        "Use supplied website context only when it directly answers an explicit website or academic-resource question.",
        body?.preferredLanguage === "ml"
          ? "Language requirement: Answer in simple Malayalam or mixed Malayalam-English, retaining technical terms in English when useful. Do not switch to English unless the user asks for English."
          : body?.preferredLanguage === "en"
            ? "Language requirement: Answer entirely in English. Do not switch to Malayalam or another language because supplied context, saved history, or source records contain Malayalam. Switch language only when the user explicitly asks for it."
            : "Language requirement: Match the language of the user's latest question; do not let supplied context or previous messages override the latest question's language.",
        SYSTEM_INSTRUCTIONS
      ].join("\n\n")
    },
    ...history,
    { role: "user", content: userContent }
  ];
}

function cloudflareInput(body, env, stream = false) {
  return {
    messages: cloudflareMessages(body),
    max_tokens: Math.max(128, Math.min(6000, Number(env.MAX_OUTPUT_TOKENS || 1600))),
    temperature: 0.25,
    top_p: 0.9,
    ...(stream ? { stream: true } : {})
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

async function askWithWorkersAIStream(body, env) {
  if (!hasWorkersAI(env)) throw new Error("Cloudflare Workers AI binding is unavailable.");
  const model = workersAIModel(env);
  const stream = await env.AI.run(model, cloudflareInput(body, env, true));
  if (!stream || typeof stream.getReader !== "function") {
    throw new Error("Cloudflare Workers AI did not return a stream.");
  }
  return { stream, provider: "cloudflare-workers-ai", model };
}

function cloudflareRestModelPath(model) {
  return String(model || "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function askWithWorkersAIRestStream(body, env) {
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
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      },
      body: JSON.stringify(cloudflareInput(body, env, true)),
      signal: controller.signal
    });
    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => "");
      const error = new Error(cleanText(detail || `Cloudflare Workers AI REST returned HTTP ${response.status}.`, 300));
      error.status = response.status;
      throw error;
    }
    return { stream: response.body, provider: "cloudflare-workers-ai-rest", model };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Cloudflare Workers AI REST streaming timed out.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
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

function wantsStreaming(body, request) {
  return body?.stream === true || /text\/event-stream/i.test(request.headers.get("Accept") || "");
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
        verifiedResultStorage: canStoreVerifiedResults(env),
        knowledgeMode: KNOWLEDGE_MODE,
        revisionAware: ["2026", "2021", "2015"],
        wholeSiteContext: true,
        localMathFallback: true,
        preloadedFaq: true,
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
        mockExamPattern: "1004-75-mark-official-model",
        dailyQuizGrading: true,
        commentsConfigured: Boolean(env.FIREBASE_SERVICE_ACCOUNT_JSON)
      }, 200, origin, env);
    }

    const allowedPaths = ["/", "/api/ask-poly", "/api/evaluate-mock-exam", "/api/grade-daily-quiz"];
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

    const parsedBody = await readJson(request);
    if (!parsedBody) return jsonResponse({ error: "Invalid JSON request." }, 400, origin, env);
    let body;
    try {
      body = isExam ? strictJsonObject(parsedBody, "request") : validateAskBody(parsedBody);
    } catch (error) {
      securityLog("input_validation_failed", { route: isExam ? "mock_exam" : "ask", severity: "warning", error: error?.message });
      return jsonResponse({ error: "The request contains invalid input." }, 400, origin, env);
    }

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

    const userMessage = cleanText(body?.message, 2200);

    // 1. Image Generation Check
    const imageMatch = userMessage.match(IMAGE_INTENT_PATTERN);
    if (imageMatch && hasWorkersAI(env)) {
      try {
        const prompt = imageMatch[1].trim();
        const response = await env.AI.run(IMAGE_GEN_MODEL, { prompt });
        
        // The response is a binary stream (Uint8Array)
        const binaryString = Array.from(new Uint8Array(response))
          .map(b => String.fromCharCode(b))
          .join('');
        const base64Image = btoa(binaryString);
        const dataUrl = `data:image/png;base64,${base64Image}`;

        return jsonResponse({
          answer: `I have generated the image of "${prompt}" for you:\n\n![${prompt}](${dataUrl})`,
          provider: "cloudflare-workers-ai-image",
          model: IMAGE_GEN_MODEL,
          knowledgeMode: KNOWLEDGE_MODE
        }, 200, origin, env);
      } catch (error) {
        console.error("Ask POLY Image generation failed", error);
        // Fall back to normal chat if image generation fails
      }
    }

    // Preloaded FAQ check: runs before any AI provider, so a matched
    // question gets an instant, guaranteed-consistent answer at zero AI cost.
    // Edit workers/ask-poly-ai/src/faq-data.js to add or change entries.
    const faqMessage = cleanText(body?.message, 2200);
    const faqMatch = matchFaq(faqMessage);
    if (faqMatch) {
      return jsonResponse({ ...faqMatch, knowledgeMode: KNOWLEDGE_MODE }, 200, origin, env);
    }

    const enrichedBody = enrichAskBody(body);
    const providerErrors = [];
    const streamRequested = wantsStreaming(body, request);

    if (streamRequested) {
      try {
        const result = await askPolyStream(enrichedBody, env);
        return streamResponse(result.stream, origin, env, result);
      } catch (error) {
        providerErrors.push(`external-providers-stream: ${cleanText(error?.message, 240)}`);
        console.error("Ask POLY external provider streaming failed", error);
      }
    }

    if (streamRequested && hasWorkersAI(env)) {
      try {
        const result = await askWithWorkersAIStream(enrichedBody, env);
        return streamResponse(result.stream, origin, env, result);
      } catch (error) {
        providerErrors.push(`cloudflare-workers-ai-stream: ${cleanText(error?.message, 240)}`);
        securityLog("api_provider_error", { route: "ask_stream", provider: "cloudflare_workers_ai", severity: "error", error: error?.message });
        console.error("Ask POLY Cloudflare Workers AI streaming failed", error);
      }
    }

    if (streamRequested && hasWorkersAIRest(env)) {
      try {
        const result = await askWithWorkersAIRestStream(enrichedBody, env);
        return streamResponse(result.stream, origin, env, result);
      } catch (error) {
        providerErrors.push(`cloudflare-workers-ai-rest-stream: ${cleanText(error?.message, 240)}`);
        securityLog("api_provider_error", { route: "ask_stream", provider: "cloudflare_workers_ai_rest", severity: "error", error: error?.message });
        console.error("Ask POLY Cloudflare Workers AI REST streaming failed", error);
      }
    }

    try {
      const result = await askPoly(enrichedBody, env);
      return jsonResponse({ ...result, knowledgeMode: KNOWLEDGE_MODE }, 200, origin, env);
    } catch (error) {
      providerErrors.push(`external-providers: ${cleanText(error?.message, 240)}`);
      securityLog("api_provider_error", { route: "ask", provider: "external", severity: "error", error: error?.message });
      console.error("Ask POLY external provider failed", error);
    }

    if (hasWorkersAI(env)) {
      try {
        const result = await askWithWorkersAI(enrichedBody, env);
        return jsonResponse({ ...result, knowledgeMode: KNOWLEDGE_MODE }, 200, origin, env);
      } catch (error) {
        providerErrors.push(`cloudflare-workers-ai: ${cleanText(error?.message, 240)}`);
        securityLog("api_provider_error", { route: "ask", provider: "cloudflare_workers_ai", severity: "error", error: error?.message });
        console.error("Ask POLY Cloudflare Workers AI binding failed", error);
      }
    }

    if (hasWorkersAIRest(env)) {
      try {
        const result = await askWithWorkersAIRest(enrichedBody, env);
        return jsonResponse({ ...result, knowledgeMode: KNOWLEDGE_MODE }, 200, origin, env);
      } catch (error) {
        providerErrors.push(`cloudflare-workers-ai-rest: ${cleanText(error?.message, 240)}`);
        securityLog("api_provider_error", { route: "ask", provider: "cloudflare_workers_ai_rest", severity: "error", error: error?.message });
        console.error("Ask POLY Cloudflare Workers AI REST failed", error);
      }
    }

    try {
      // Final attempt catch-all if somehow nothing returned above
      throw new Error("No AI provider succeeded.");
    } catch (error) {
      providerErrors.push(`external-providers: ${cleanText(error?.message, 240)}`);
      const missingMessage = String(error?.message || "") === "Please enter a question.";
      securityLog("api_error", { route: "ask", status: missingMessage ? 400 : 502, severity: missingMessage ? "warning" : "error", error: error?.message });
      console.error("Ask POLY AI request failed", error);
      return jsonResponse({
        error: missingMessage
          ? "Please enter a question."
          : "The AI assistant is temporarily unavailable. All backup providers failed; please try again in a few minutes.",
        retryable: !missingMessage,
        detail: env.EXPOSE_ERRORS === "true" ? providerErrors.join(" | ") : undefined
      }, missingMessage ? 400 : 502, origin, env);
    }
  }
};
