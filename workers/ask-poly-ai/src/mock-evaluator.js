/* Purpose: Mock evaluator - Descriptive comment added for clarity */
import { MOCK_PAPER, MOCK_INSTRUCTIONS } from "./mock-paper.js";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_NVIDIA_MODEL = "meta/llama-3.1-8b-instruct";
const clean = (value, maximum) => String(value || "").replace(/\u0000/g, "").trim().slice(0, maximum);

// PERFORMANCE OPTIMIZATION: Cache the mock paper question bank Map to avoid O(N) array mapping
// and Map instantiation on every single API evaluation request.
const MOCK_QUESTION_BANK_MAP = new Map(MOCK_PAPER.questions.map((question) => [question.id, question]));

function selectedQuestionsFrom(body) {
  if (body?.paperId !== MOCK_PAPER.id || body?.subjectCode !== MOCK_PAPER.subjectCode) {
    throw new Error("Unknown mock examination paper.");
  }
  if (!Array.isArray(body.answers) || body.answers.length !== 23) {
    throw new Error("The official-pattern paper requires exactly 23 selected answers.");
  }

  const bank = MOCK_QUESTION_BANK_MAP;
  const supplied = new Map();
  for (const item of body.answers) {
    const id = clean(item?.id, 10);
    const question = bank.get(id);
    if (!question || supplied.has(id)) throw new Error(`Unknown or duplicate answer ${id || "unknown"}.`);
    const answer = clean(item?.answer, 4000);
    const minimum = question.section === "A" ? 1 : 8;
    if (answer.length < minimum) throw new Error(`Answer ${id} is incomplete.`);
    supplied.set(id, answer);
  }

  for (const id of MOCK_PAPER.partAIds) {
    if (!supplied.has(id)) throw new Error(`Part A answer ${id} is missing.`);
  }

  const selectedB = MOCK_PAPER.partBIds.filter((id) => supplied.has(id));
  if (selectedB.length !== 8) throw new Error("Select exactly eight Part B questions.");

  for (const pair of MOCK_PAPER.pairs) {
    const selected = MOCK_PAPER.questions.filter((question) => question.pair === pair && supplied.has(question.id));
    if (selected.length !== 1) throw new Error(`Select exactly one answer from Part C pair ${pair}.`);
  }

  return [...supplied.entries()].map(([id, studentAnswer]) => ({ ...bank.get(id), studentAnswer }));
}

function schema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      results: {
        type: "array",
        minItems: 23,
        maxItems: 23,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            awardedMarks: { type: "number" },
            confidence: { type: "number" },
            feedback: { type: "string" },
            missingPoints: { type: "array", items: { type: "string" } }
          },
          required: ["id", "awardedMarks", "confidence", "feedback", "missingPoints"]
        }
      },
      overallFeedback: { type: "string" }
    },
    required: ["results", "overallFeedback"]
  };
}

function outputText(data) {
  for (const item of data?.output || []) {
    for (const part of item?.content || []) {
      if (part?.type === "output_text" && part.text) return part.text;
    }
  }
  return "";
}

function extractNvidiaContent(data) {
  return String(data?.choices?.[0]?.message?.content || "");
}

/* Fallback path: NVIDIA chat completions (no structured-output schema support).
   The model is instructed to emit ONLY the evaluation JSON; we strip fences
   and parse the result, reusing the same normalizer so the response shape is
   identical to the OpenAI path. */
async function requestNvidiaEvaluation(env, questions) {
  const model = clean(env.NVIDIA_MODEL || "", 140) || DEFAULT_NVIDIA_MODEL;
  const timeoutMs = Math.max(5000, Math.min(60000, Number(env.MOCK_EXAM_TIMEOUT_MS || 30000) || 30000));
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.NVIDIA_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a strict exam evaluator. Evaluate each student answer against the supplied rubric and return ONLY a JSON object. Never include explanations outside the JSON."
          },
          {
            role: "user",
            content: "Return a JSON object with exactly two keys: \"results\" (an array of 23 objects, one per question, each with id, awardedMarks (0 to " + MOCK_PAPER.totalMarks + ", half-mark steps where the question allows, else integers), confidence (0-1), feedback, missingPoints (up to 6 short strings)) and \"overallFeedback\" (a single paragraph, max 1200 characters).\n\n" + MOCK_INSTRUCTIONS + "\n\nExamination data:\n" + JSON.stringify({
              examination: {
                id: MOCK_PAPER.id,
                subjectCode: MOCK_PAPER.subjectCode,
                title: MOCK_PAPER.title,
                totalMarks: MOCK_PAPER.totalMarks,
                structure: "Part A 9x1; Part B any 8 of 10 at 3 marks; Part C six OR pairs at 7 marks"
              },
              questions
            })
          }
        ],
        temperature: Number(env.AI_TEMPERATURE || 0.3),
        top_p: Number(env.AI_TOP_P || 0.9),
        max_tokens: Number(env.MOCK_EXAM_MAX_OUTPUT_TOKENS || 4000),
        stream: false
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error?.message || data?.detail || `NVIDIA evaluation failed with HTTP ${response.status}.`);
      error.status = response.status;
      error.provider = "nvidia";
      throw error;
    }
    const raw = extractNvidiaContent(data);
    if (!raw) throw new Error("NVIDIA returned an empty evaluation response.");
    let parsed;
    try {
      const stripped = raw.replace(/```json\s*/i, "").replace(/```/g, "").trim();
      parsed = JSON.parse(stripped);
    } catch {
      throw new Error("The NVIDIA evaluator returned an invalid structured result.");
    }
    return { parsed, model, data };
  } catch (error) {
    if (error?.name === "AbortError" || String(error?.message || "").toLowerCase().includes("abort")) {
      const timeoutError = new Error(`NVIDIA evaluation timed out after ${timeoutMs}ms.`);
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}


function normalize(parsed, selectedQuestions, data, model, evaluationMode) {
  const returned = new Map((parsed?.results || []).map((item) => [String(item?.id || ""), item]));
  const results = selectedQuestions.map((question) => {
    const item = returned.get(question.id) || {};
    const step = question.maxMarks === 1 ? 1 : 0.5;
    const raw = Math.max(0, Math.min(question.maxMarks, Number(item.awardedMarks || 0)));
    const awardedMarks = Math.round(raw / step) * step;
    return {
      id: question.id,
      awardedMarks,
      maxMarks: question.maxMarks,
      confidence: Math.max(0, Math.min(1, Number(item.confidence || 0))),
      feedback: clean(item.feedback || "Answer evaluated against the supplied rubric.", 700),
      missingPoints: Array.isArray(item.missingPoints)
        ? item.missingPoints.slice(0, 6).map((value) => clean(value, 240)).filter(Boolean)
        : []
    };
  });

  const score = Math.round(results.reduce((sum, item) => sum + item.awardedMarks, 0) * 2) / 2;
  return {
    paperId: MOCK_PAPER.id,
    subjectCode: MOCK_PAPER.subjectCode,
    title: MOCK_PAPER.title,
    score,
    totalMarks: MOCK_PAPER.totalMarks,
    percentage: Math.round(score / MOCK_PAPER.totalMarks * 1000) / 10,
    status: "published",
    evaluationMode: evaluationMode || "openai",
    model: data.model || model,
    responseId: data.id || "",
    evaluatedAt: new Date().toISOString(),
    results,
    overallFeedback: clean(parsed?.overallFeedback || "Review the question-wise feedback and improve your next attempt.", 1200)
  };
}

async function requestEvaluation(payload, env) {
  const parsedTimeout = Number(env.MOCK_EXAM_TIMEOUT_MS);
  const timeoutMs = Math.max(5000, Math.min(60000, isNaN(parsedTimeout) ? 30000 : parsedTimeout));
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error?.message || `OpenAI evaluation failed with HTTP ${response.status}.`);
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error?.name === "AbortError" || String(error?.message || "").toLowerCase().includes("abort")) {
      const timeoutError = new Error(`OpenAI evaluation timed out after ${timeoutMs}ms.`);
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

function shouldRetryDefaultModel(error, model) {
  const message = String(error?.message || "").toLowerCase();
  return model !== DEFAULT_MODEL && /model|does not exist|not found|unsupported|invalid/.test(message);
}

export async function evaluateMockExam(body, env) {
  const questions = selectedQuestionsFrom(body);
  const useNvidia = env.NVIDIA_API_KEY && !env.OPENAI_API_KEY;
  if (!useNvidia && !env.OPENAI_API_KEY) throw new Error("Ask POLY AI is not configured yet.");

  if (useNvidia) {
    const { parsed, model, data } = await requestNvidiaEvaluation(env, questions);
    return normalize(parsed, questions, { id: data?.id || "", model: data?.model || model }, model, "nvidia");
  }

  let model = env.MOCK_EXAM_MODEL || env.OPENAI_MODEL || DEFAULT_MODEL;
  const payload = {
    model,
    reasoning: { effort: env.MOCK_EXAM_REASONING_EFFORT || "low" },
    instructions: MOCK_INSTRUCTIONS,
    input: [{
      role: "user",
      content: JSON.stringify({
        examination: {
          id: MOCK_PAPER.id,
          subjectCode: MOCK_PAPER.subjectCode,
          title: MOCK_PAPER.title,
          totalMarks: MOCK_PAPER.totalMarks,
          structure: "Part A 9x1; Part B any 8 of 10 at 3 marks; Part C six OR pairs at 7 marks"
        },
        questions
      })
    }],
    max_output_tokens: Number(env.MOCK_EXAM_MAX_OUTPUT_TOKENS || 7500),
    text: {
      format: {
        type: "json_schema",
        name: "applied_chemistry_official_pattern_evaluation",
        strict: true,
        schema: schema()
      }
    }
  };

  let data;
  try {
    data = await requestEvaluation(payload, env);
  } catch (error) {
    if (!shouldRetryDefaultModel(error, model)) throw error;
    model = DEFAULT_MODEL;
    data = await requestEvaluation({ ...payload, model }, env);
  }

  const text = outputText(data);
  if (!text) throw new Error("The AI evaluator returned an empty result.");
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { throw new Error("The AI evaluator returned an invalid structured result."); }
    return normalize(parsed, questions, data, model);
}
