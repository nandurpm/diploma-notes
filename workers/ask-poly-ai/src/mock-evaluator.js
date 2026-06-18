import { MOCK_PAPER, MOCK_INSTRUCTIONS } from "./mock-paper.js";

const clean = (value, maximum) => String(value || "").replace(/\u0000/g, "").trim().slice(0, maximum);

function answersFrom(body) {
  if (body?.paperId !== MOCK_PAPER.id || body?.subjectCode !== MOCK_PAPER.subjectCode) throw new Error("Unknown mock examination paper.");
  if (!Array.isArray(body.answers) || body.answers.length !== MOCK_PAPER.questions.length) throw new Error("All 11 answers are required.");
  const supplied = new Map();
  for (const item of body.answers) {
    const id = clean(item?.id, 10);
    const answer = clean(item?.answer, 4000);
    if (!id || answer.length < 8) throw new Error(`Answer ${id || "unknown"} is incomplete.`);
    supplied.set(id, answer);
  }
  return MOCK_PAPER.questions.map((question) => {
    const answer = supplied.get(question.id);
    if (!answer) throw new Error(`Answer ${question.id} is missing.`);
    return { ...question, studentAnswer: answer };
  });
}

function schema() {
  return {
    type: "object", additionalProperties: false,
    properties: {
      results: {
        type: "array", minItems: 11, maxItems: 11,
        items: {
          type: "object", additionalProperties: false,
          properties: {
            id: { type: "string" }, awardedMarks: { type: "number" }, confidence: { type: "number" },
            feedback: { type: "string" }, missingPoints: { type: "array", items: { type: "string" } }
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

function normalize(parsed, data, model) {
  const returned = new Map((parsed?.results || []).map((item) => [String(item?.id || ""), item]));
  const results = MOCK_PAPER.questions.map((question) => {
    const item = returned.get(question.id) || {};
    const awardedMarks = Math.round(Math.max(0, Math.min(question.maxMarks, Number(item.awardedMarks || 0))) * 2) / 2;
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
    evaluationMode: "openai",
    model: data.model || model,
    responseId: data.id || "",
    evaluatedAt: new Date().toISOString(),
    results,
    overallFeedback: clean(parsed?.overallFeedback || "Review the question-wise feedback and improve your next attempt.", 1200)
  };
}

export async function evaluateMockExam(body, env) {
  const questions = answersFrom(body);
  const model = env.MOCK_EXAM_MODEL || env.OPENAI_MODEL || "gpt-5.4-mini";
  const payload = {
    model,
    reasoning: { effort: env.MOCK_EXAM_REASONING_EFFORT || "low" },
    instructions: MOCK_INSTRUCTIONS,
    input: [{
      role: "user",
      content: JSON.stringify({
        examination: { id: MOCK_PAPER.id, subjectCode: MOCK_PAPER.subjectCode, title: MOCK_PAPER.title, totalMarks: MOCK_PAPER.totalMarks },
        questions
      })
    }],
    max_output_tokens: Number(env.MOCK_EXAM_MAX_OUTPUT_TOKENS || 5000),
    text: {
      format: {
        type: "json_schema",
        name: "applied_chemistry_mock_exam_evaluation",
        strict: true,
        schema: schema()
      }
    }
  };
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI evaluation failed with HTTP ${response.status}.`);
  const text = outputText(data);
  if (!text) throw new Error("The AI evaluator returned an empty result.");
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { throw new Error("The AI evaluator returned an invalid structured result."); }
  return normalize(parsed, data, model);
}
