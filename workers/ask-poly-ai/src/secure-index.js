/* Purpose: Secure index - Descriptive comment added for clarity */
import application from "./index.js";
import { corsHeaders, isOriginAllowed } from "./http.js";
import { authenticateStudent, storeMockExamResult } from "./result-store.js";

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

    /* Fail early on oversized requests to prevent resource/database-query exhaustion and DoS attacks */
    if (request.method === "POST") {
      const isExam = url.pathname === "/api/evaluate-mock-exam";
      const maximumSize = isExam ? 120000 : 40000;
      if (Number(request.headers.get("Content-Length") || 0) > maximumSize) {
        return json({ error: "The request is too large." }, 413, origin, env);
      }
    }

    if (request.method === "POST" && !isOriginAllowed(origin, env)) {
      return json({ error: "This website origin is not allowed." }, 403, origin, env);
    }

    if (request.method === "POST" && (url.pathname === "/" || url.pathname === "/api/ask-poly")) {
      if (!(await allowed(env.ASK_RATE_LIMITER, anonymousKey(request)))) {
        return json({ error: "Too many questions. Please wait a minute and try again." }, 429, origin, env);
      }
      return application.fetch(request, env, context);
    }

    if (request.method !== "POST" || url.pathname !== "/api/evaluate-mock-exam") {
      return application.fetch(request, env, context);
    }

    let student;
    try {
      student = await authenticateStudent(request, env);
    } catch (error) {
      return json(
        { error: error?.message || "Sign in before submitting a mock examination." },
        Number(error?.status || 401),
        origin,
        env,
      );
    }

    if (!(await allowed(env.EXAM_RATE_LIMITER, `exam:${student.id}`))) {
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
