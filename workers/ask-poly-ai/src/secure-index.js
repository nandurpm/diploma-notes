import application from "./index.js";
import { authenticateStudent, storeMockExamResult } from "./result-store.js";

function json(data, status, headers) {
  const output = new Headers(headers || {});
  output.set("Content-Type", "application/json; charset=utf-8");
  output.set("Cache-Control", "no-store");
  output.delete("Content-Length");
  return new Response(JSON.stringify(data), { status, headers: output });
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/api/evaluate-mock-exam") {
      return application.fetch(request, env, context);
    }

    let student;
    try {
      student = await authenticateStudent(request, env);
    } catch (error) {
      const response = await application.fetch(
        new Request(new URL("/health", request.url), { method: "GET", headers: request.headers }),
        env,
        context,
      );
      return json(
        { error: error?.message || "Sign in before submitting a mock examination." },
        Number(error?.status || 401),
        response.headers,
      );
    }

    const requestCopy = request.clone();
    const body = await requestCopy.json().catch(() => null);
    if (!body) {
      const response = await application.fetch(request, env, context);
      return response;
    }

    const evaluationResponse = await application.fetch(request, env, context);
    const result = await evaluationResponse.clone().json().catch(() => null);
    if (!evaluationResponse.ok || !result || !Array.isArray(result.results)) {
      return evaluationResponse;
    }

    try {
      const stored = await storeMockExamResult(student, body, result, env);
      return json({ ...result, ...stored }, evaluationResponse.status, evaluationResponse.headers);
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
        evaluationResponse.headers,
      );
    }
  }
};
