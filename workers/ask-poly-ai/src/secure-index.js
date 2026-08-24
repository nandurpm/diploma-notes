/* Purpose: Secure index - Descriptive comment added for clarity */
import application from "./index.js";
import { abuseKey, corsHeaders, createRateLimiter, isOriginAllowed, looksAutomated, requestLogContext, securityLog } from "./http.js";
import { authenticateStudent, storeMockExamResult } from "./result-store.js";
import { handleDailyQuizGrading } from "./daily-quiz.js";
import { commentsHealth, handleComments } from "./comments.js";

const allowImage = createRateLimiter(2, 10 * 60 * 1000);
const allowComment = createRateLimiter(5, 60 * 1000);
const IMAGE_INTENT_PATTERN = /\b(?:create|generate|draw|make|show)\s+(?:an?\s+)?(?:image|picture|photo|drawing|sketch|illustration)\b/i;

function json(data, status, origin, env, inherited) {
  const output = new Headers(inherited || corsHeaders(origin, env));
  output.set("Content-Type", "application/json; charset=utf-8");
  output.set("Cache-Control", "no-store");
  output.set("X-Content-Type-Options", "nosniff");
  output.set("X-Frame-Options", "DENY");
  output.set("Content-Security-Policy", "default-src 'none'");
  output.set("Referrer-Policy", "no-referrer");
  output.delete("Content-Length");
  return new Response(JSON.stringify(data), { status, headers: output });
}

async function allowed(binding, key) {
  if (!binding || typeof binding.limit !== "function") return true;
  try {
    const result = await binding.limit({ key });
    return Boolean(result?.success);
  } catch (error) {
    console.error("Distributed rate-limit binding failed; delegating to application fallback.", error);
    return true;
  }
}

function anonymousKey(request) {
  const rawIp = request.headers.get("CF-Connecting-IP")
    || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()
    || "unknown";
  const ip = rawIp.replace(/[^0-9a-fA-F.:%_-]/g, "").slice(0, 45) || "unknown";
  return `ask:${ip}`;
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const logContext = requestLogContext(request);

    if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
      securityLog("https_violation", { ...logContext, severity: "warning" });
      return json({ error: "HTTPS is required." }, 400, origin, env);
    }

    /* Fail early on oversized requests to prevent resource/database-query exhaustion and DoS attacks */
    if (request.method === "POST") {
      const isExam = url.pathname === "/api/evaluate-mock-exam";
      const maximumSize = isExam ? 120000 : 40000;
      if (Number(request.headers.get("Content-Length") || 0) > maximumSize) {
        securityLog("request_oversized", { ...logContext, severity: "warning", maximumSize });
        return json({ error: "The request is too large." }, 413, origin, env);
      }
    }

    if (request.method === "POST" && !isOriginAllowed(origin, env)) {
      securityLog("origin_blocked", { ...logContext, severity: "warning" });
      return json({ error: "This website origin is not allowed." }, 403, origin, env);
    }

    const requestContentType = request.headers.get("Content-Type") || "";
    if (request.method === "POST" && requestContentType && !/^application\/json(?:\s*;|$)/i.test(requestContentType)) {
      securityLog("invalid_content_type", { ...logContext, severity: "warning" });
      return json({ error: "JSON requests are required." }, 415, origin, env);
    }

    if (request.method === "POST" && looksAutomated(request)) {
      securityLog("automated_client_blocked", { ...logContext, severity: "warning" });
      return json({ error: "Automated clients are not permitted." }, 403, origin, env);
    }

    if (request.method === "OPTIONS" && (url.pathname === "/api/help-comments" || url.pathname === "/health/comments")) {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (request.method === "GET" && url.pathname === "/health/comments") {
      return commentsHealth(env, origin);
    }

    if (request.method === "POST" && url.pathname === "/api/help-comments") {
      if (!(await allowed(env.COMMENT_RATE_LIMITER, abuseKey(request, "comments"))) || !allowComment(request)) {
        securityLog("rate_limit_blocked", { ...logContext, route: "help_comments", severity: "warning" });
        return json({ error: "Too many comments. Please wait a minute." }, 429, origin, env);
      }
      return handleComments(request, env, origin);
    }

    if (request.method === "POST" && (url.pathname === "/" || url.pathname === "/api/ask-poly")) {
      if (!(await allowed(env.ASK_RATE_LIMITER, anonymousKey(request)))) {
        securityLog("rate_limit_blocked", { ...logContext, route: "ask", severity: "warning" });
        return json({ error: "Too many questions. Please wait a minute and try again." }, 429, origin, env);
      }
      const askBody = await request.clone().json().catch(() => null);
      if (IMAGE_INTENT_PATTERN.test(String(askBody?.message || "")) && (!(await allowed(env.IMAGE_RATE_LIMITER, `image:${anonymousKey(request)}`)) || !allowImage(request))) {
        securityLog("rate_limit_blocked", { ...logContext, route: "image_generation", severity: "warning" });
        return json({ error: "Image-generation limit reached. Please try again later." }, 429, origin, env);
      }
      return application.fetch(request, env, context);
    }

    if (request.method === "POST" && url.pathname === "/api/grade-daily-quiz") {
      if (!(await allowed(env.EXAM_RATE_LIMITER, `daily:${anonymousKey(request)}`))) {
        securityLog("rate_limit_blocked", { ...logContext, route: "daily_quiz", severity: "warning" });
        return json({ error: "Too many quiz submissions. Please wait a minute." }, 429, origin, env);
      }
      return handleDailyQuizGrading(request, env, origin);
    }

    if (request.method !== "POST" || url.pathname !== "/api/evaluate-mock-exam") {
      return application.fetch(request, env, context);
    }

    let student;
    try {
      student = await authenticateStudent(request, env);
    } catch (error) {
      securityLog("authentication_failed", { ...logContext, route: "mock_exam", status: Number(error?.status) || 401, severity: "warning" });
      const rawStatus = Number(error?.status);
      const safeStatus = Number.isInteger(rawStatus) && rawStatus >= 100 && rawStatus <= 599 ? rawStatus : 401;
      return json(
        { error: error?.message || "Sign in before submitting a mock examination." },
        safeStatus,
        origin,
        env,
      );
    }

    if (!(await allowed(env.EXAM_RATE_LIMITER, `exam:${student.id}`))) {
      securityLog("rate_limit_blocked", { ...logContext, route: "mock_exam", userId: student.id, severity: "warning" });
      return json({ error: "Too many mock-exam evaluations. Please wait a minute." }, 429, origin, env);
    }

    const requestCopy = request.clone();
    const body = await requestCopy.json().catch(() => null);
    if (!body) return application.fetch(request, env, context);

    const evaluationResponse = await application.fetch(request, env, context);
    const result = await evaluationResponse.clone().json().catch(() => null);
    if (!evaluationResponse.ok || !result || !Array.isArray(result.results)) {
      return evaluationResponse;
    }

    try {
      const stored = await storeMockExamResult(student, body, result, env);
      return json({ ...result, ...stored }, evaluationResponse.status, origin, env, evaluationResponse.headers);
    } catch (error) {
      securityLog("database_write_error", { ...logContext, route: "mock_exam", status: evaluationResponse.status, severity: "error", error: error?.message });
      console.error("Verified mock-exam storage failed", error);
      return json(
        {
          ...result,
          serverSaved: false,
          savedOnline: false,
          storageError: "The evaluation completed, but verified online history storage is temporarily unavailable."
        },
        evaluationResponse.status,
        origin,
        env,
        evaluationResponse.headers,
      );
    }
  }
};
