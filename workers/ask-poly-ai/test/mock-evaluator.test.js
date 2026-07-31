/* Purpose: Mock evaluator unit tests */
import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMockExam } from "../src/mock-evaluator.js";
import { MOCK_PAPER } from "../src/mock-paper.js";

function buildValidAnswers() {
  const answers = [];
  for (const id of MOCK_PAPER.partAIds) {
    answers.push({ id, answer: "Placeholder A" });
  }
  for (const id of MOCK_PAPER.partBIds.slice(0, 8)) {
    answers.push({ id, answer: "Placeholder B is long enough" });
  }
  for (const pair of MOCK_PAPER.pairs) {
    const question = MOCK_PAPER.questions.find((q) => q.pair === pair);
    if (question) {
      answers.push({ id: question.id, answer: "Placeholder C is long enough" });
    }
  }
  return answers;
}

test("evaluateMockExam throws 504 when OpenAI request times out", async () => {
  const body = {
    paperId: MOCK_PAPER.id,
    subjectCode: MOCK_PAPER.subjectCode,
    answers: buildValidAnswers()
  };
  const env = {
    OPENAI_API_KEY: "test-key",
    MOCK_EXAM_TIMEOUT_MS: "50" // very low timeout to ensure quick test
  };

  const originalFetch = globalThis.fetch;
  // Mock fetch that hangs/delays or throws AbortError
  globalThis.fetch = async (url, options) => {
    const err = new Error("The operation was aborted.");
    err.name = "AbortError";
    throw err;
  };

  try {
    await assert.rejects(
      evaluateMockExam(body, env),
      (err) => {
        assert.equal(err.status, 504);
        assert.match(err.message, /timed out/i);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("evaluateMockExam handles successful mock evaluation response", async () => {
  const answers = buildValidAnswers();
  const body = {
    paperId: MOCK_PAPER.id,
    subjectCode: MOCK_PAPER.subjectCode,
    answers
  };
  const env = {
    OPENAI_API_KEY: "test-key"
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.headers.Authorization, "Bearer test-key");

    const mockResponseText = JSON.stringify({
      results: answers.map((a) => ({
        id: a.id,
        awardedMarks: 1,
        confidence: 0.95,
        feedback: "Correct step",
        missingPoints: []
      })),
      overallFeedback: "Great effort on this chemistry paper."
    });

    return {
      ok: true,
      json: async () => ({
        id: "resp-123",
        model: "gpt-4o-mini",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: mockResponseText
              }
            ]
          }
        ]
      })
    };
  };

  try {
    const result = await evaluateMockExam(body, env);
    assert.equal(result.paperId, MOCK_PAPER.id);
    assert.equal(result.subjectCode, MOCK_PAPER.subjectCode);
    assert.equal(result.overallFeedback, "Great effort on this chemistry paper.");
    assert.equal(result.status, "published");
    assert.ok(result.score > 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("evaluateMockExam throws on bad OpenAI API non-ok response", async () => {
  const body = {
    paperId: MOCK_PAPER.id,
    subjectCode: MOCK_PAPER.subjectCode,
    answers: buildValidAnswers()
  };
  const env = {
    OPENAI_API_KEY: "test-key"
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: "Invalid API Key" }
      })
    };
  };

  try {
    await assert.rejects(
      evaluateMockExam(body, env),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /Invalid API Key/i);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
