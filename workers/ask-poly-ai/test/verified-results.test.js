import test from "node:test";
import assert from "node:assert/strict";
import { selectedQuestions, handleDailyQuizGrading } from "../src/daily-quiz.js";

function todayIST() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type).value;
  return [get("year"), get("month"), get("day")].join("-");
}

test("anonymous practice grading does not persist a verified score", async () => {
  const questions = selectedQuestions("1001", todayIST(), "first");
  const answers = Object.fromEntries(questions.map((q) => [q.id, q.correctAnswer]));
  const request = new Request("https://example.test/api/grade-daily-quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject: "1001", answers })
  });
  const response = await handleDailyQuizGrading(request, {}, "");
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.score, 10);
  assert.equal(result.savedOnline, false);
  assert.equal(result.row, undefined);
});

test("General Knowledge has a server-side question bank", () => {
  const questions = selectedQuestions("GK", todayIST(), "first");
  assert.equal(questions.length, 10);
  assert.ok(questions.every((question) => question.correctAnswer));
});

test("authenticated quiz saves the server score with the authenticated owner", async () => {
  const userId = "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6";
  const questions = selectedQuestions("1001", todayIST(), "first");
  const answers = Object.fromEntries(questions.map((q) => [q.id, q.correctAnswer]));
  const request = new Request("https://example.test/api/grade-daily-quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer header.payload.signature" },
    body: JSON.stringify({ subject: "1001", answers })
  });
  const env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "public-test-key",
    SUPABASE_SERVICE_ROLE_KEY: "server-test-key"
  };
  const original = globalThis.fetch;
  let stored;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ id: userId }), { status: 200 });
    }
    if (String(url).includes("/rest/v1/daily_quiz_results")) {
      stored = JSON.parse(options.body);
      assert.equal(options.headers.Authorization, "Bearer server-test-key");
      return new Response(JSON.stringify([stored]), { status: 201 });
    }
    throw new Error("Unexpected destination");
  };
  try {
    const response = await handleDailyQuizGrading(request, env, "");
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.score, 10);
    assert.equal(result.savedOnline, true);
    assert.equal(stored.score, 10);
    assert.equal(stored.user_id, userId);
    assert.equal(stored.evaluation_source, "worker-graded");
    assert.equal(stored.answers.__verified_review.length, 10);
  } finally {
    globalThis.fetch = original;
  }
});
