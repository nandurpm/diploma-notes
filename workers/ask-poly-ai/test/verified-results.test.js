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
