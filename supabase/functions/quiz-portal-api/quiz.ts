import {
  QUESTIONS_PER_DAY,
  attemptCount,
  dateKeyIST,
  hashString,
  seededRandom,
  shuffle,
} from "./shared.ts";

export const SUBJECTS = {
  "1001": {
    code: "1001",
    title: "English Quiz",
    subtitle: "Communication Skills in English · Course Code 1001",
    icon: "EN",
    description: "Reading, grammar, vocabulary, workplace communication and writing.",
    color: "#7c3aed",
    file: "1001",
  },
  "1002": {
    code: "1002",
    title: "Maths Quiz",
    subtitle: "Mathematics I · Course Code 1002",
    icon: "∑",
    description: "Complex numbers, coordinate geometry, trigonometry, limits and differentiation.",
    color: "#2563eb",
    file: "1002",
  },
  "1003": {
    code: "1003",
    title: "Physics Quiz",
    subtitle: "Applied Physics-I · Course Code 1003",
    icon: "PH",
    description: "Measurements, vectors, motion, rotation, energy, heat, elasticity and fluids.",
    color: "#0891b2",
    file: "1003",
  },
  "1004": {
    code: "1004",
    title: "Chemistry Quiz",
    subtitle: "Applied Chemistry · Course Code 1004",
    icon: "CH",
    description: "Atomic structure, bonding, water, polymers, electrochemistry and corrosion.",
    color: "#059669",
    file: "1004",
  },
  "GK": {
    code: "GK",
    title: "General Knowledge Quiz",
    subtitle: "General Knowledge · Daily Practice",
    icon: "GK",
    description: "India, Kerala, science, technology, safety and current fundamentals.",
    color: "#ea580c",
    file: "gk",
  },
};

const bankCache = new Map();
const bankPromises = new Map();

export function normalizeSubject(value) {
  const code = String(value ?? "").trim().toUpperCase();
  return Object.hasOwn(SUBJECTS, code) ? code : "";
}

export function subjectCatalog() {
  return Object.values(SUBJECTS).map(({ file, ...subject }) => subject);
}

async function loadBank(admin, subjectCode) {
  if (bankCache.has(subjectCode)) return bankCache.get(subjectCode);
  if (bankPromises.has(subjectCode)) return await bankPromises.get(subjectCode);

  const task = (async () => {
    const { data, error } = await admin.rpc("get_private_quiz_bank", {
      p_subject: subjectCode,
    });
    if (error) throw error;
    const parsed = { questions: data };
    if (!Array.isArray(parsed.questions) || parsed.questions.length < QUESTIONS_PER_DAY * 2) {
      throw new Error("Private question bank has too few questions.");
    }
    bankCache.set(subjectCode, parsed);
    return parsed;
  })();

  bankPromises.set(subjectCode, task);
  try {
    return await task;
  } finally {
    bankPromises.delete(subjectCode);
  }
}

async function dailyQuestions(admin, subjectCode, dateKey, mode) {
  const bank = await loadBank(admin, subjectCode);
  const shuffled = shuffle(
    bank.questions,
    seededRandom(hashString(`${subjectCode}-${dateKey}-daily`)),
  );
  const start = mode === "retry" ? QUESTIONS_PER_DAY : 0;
  const selected = shuffled.slice(start, start + QUESTIONS_PER_DAY);

  if (selected.length < QUESTIONS_PER_DAY) {
    throw new Error("Question bank needs at least 20 questions for a separate retry.");
  }

  return selected.map((question) => ({
    ...question,
    options: shuffle(
      question.options,
      seededRandom(
        hashString(`${subjectCode}-${dateKey}-${question.id}-${mode}`),
      ),
    ),
  }));
}

async function publicQuestions(admin, subjectCode, dateKey, mode) {
  const questions = await dailyQuestions(admin, subjectCode, dateKey, mode);
  return questions.map(({ answer, ...question }) => question);
}

async function reviewQuestions(admin, subjectCode, dateKey, mode, answers) {
  const questions = await dailyQuestions(admin, subjectCode, dateKey, mode);
  return questions.map((question, index) => ({
    number: index + 1,
    id: question.id,
    topic: question.topic,
    question: question.question,
    userAnswer: answers?.[String(question.id)] ?? "Not answered",
    correctAnswer: question.answer,
  }));
}

function hideCorrectAnswers(review) {
  return review.map(({ correctAnswer, ...item }) => item);
}

async function getTodayRow(admin, userId, subjectCode, today) {
  const { data, error } = await admin
    .from("daily_quiz_results")
    .select("*")
    .eq("user_id", userId)
    .eq("quiz_date", today)
    .eq("subject_code", subjectCode)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function subjectState(admin, userId, subjectCode) {
  const today = dateKeyIST();
  const row = await getTodayRow(admin, userId, subjectCode, today);
  const attempts = attemptCount(row);
  const retryStarted = Boolean(row?.retry_started_at);
  const mode = attempts === 1 && retryStarted ? "retry" : "first";
  const canSubmit = attempts === 0 || (attempts === 1 && retryStarted);

  return {
    subject: subjectCatalog().find((item) => item.code === subjectCode),
    date: today,
    attemptCount: attempts,
    retryStarted,
    mode,
    canStartRetry: attempts === 1 && !retryStarted,
    canSubmit,
    questions: canSubmit
      ? await publicQuestions(admin, subjectCode, today, mode)
      : [],
    currentReview: row && attempts > 0
      ? (attempts >= 2 ? await reviewQuestions(
          admin,
          subjectCode,
          today,
          "retry",
          row.answers,
        ) : hideCorrectAnswers(await reviewQuestions(
          admin,
          subjectCode,
          today,
          "first",
          row.answers,
        )))
      : null,
  };
}

export async function startRetry(admin, userId, subjectCode) {
  const today = dateKeyIST();
  const row = await getTodayRow(admin, userId, subjectCode, today);
  const attempts = attemptCount(row);

  if (!row || attempts === 0) {
    const error = new Error("Submit the first attempt before starting the retry.");
    error.status = 409;
    throw error;
  }
  if (attempts >= 2) {
    const error = new Error("The single daily retry has already been used.");
    error.status = 409;
    throw error;
  }

  if (!row.retry_started_at) {
    const { error } = await admin
      .from("daily_quiz_results")
      .update({
        retry_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("quiz_date", today)
      .eq("subject_code", subjectCode)
      .eq("attempt_count", 1)
      .is("retry_started_at", null);
    if (error) throw error;
  }

  return {
    date: today,
    mode: "retry",
    questions: await publicQuestions(admin, subjectCode, today, "retry"),
    canSubmit: true,
    retryStarted: true,
    attemptCount: 1,
  };
}

export async function submitQuiz(admin, userId, subjectCode, submittedAnswers) {
  if (
    !submittedAnswers ||
    typeof submittedAnswers !== "object" ||
    Array.isArray(submittedAnswers)
  ) {
    const error = new Error("Answers are required.");
    error.status = 400;
    throw error;
  }

  const today = dateKeyIST();
  const existing = await getTodayRow(admin, userId, subjectCode, today);
  const attempts = attemptCount(existing);

  if (attempts >= 2) {
    const error = new Error("Both allowed attempts are already complete.");
    error.status = 409;
    throw error;
  }
  if (attempts === 1 && !existing?.retry_started_at) {
    const error = new Error("Start the retry before submitting again.");
    error.status = 409;
    throw error;
  }

  const mode = attempts === 0 ? "first" : "retry";
  const questions = await dailyQuestions(admin, subjectCode, today, mode);
  const expectedIds = new Set(questions.map((question) => String(question.id)));
  const suppliedIds = Object.keys(submittedAnswers);

  if (
    suppliedIds.length !== QUESTIONS_PER_DAY ||
    suppliedIds.some((id) => !expectedIds.has(id))
  ) {
    const error = new Error("Answer all 10 questions before submitting.");
    error.status = 400;
    throw error;
  }

  let score = 0;
  for (const question of questions) {
    const answer = String(submittedAnswers[String(question.id)] ?? "");
    if (!question.options.includes(answer)) {
      const error = new Error("An invalid answer option was submitted.");
      error.status = 400;
      throw error;
    }
    if (answer === question.answer) score += 1;
  }

  const now = new Date().toISOString();
  const common = {
    score,
    answers: submittedAnswers,
    question_ids: questions.map((question) => Number(question.id)),
    question_keys: questions.map((question) => `${subjectCode}:${question.id}`),
    submitted_at: now,
    updated_at: now,
  };

  if (attempts === 0) {
    const { error } = await admin.from("daily_quiz_results").insert({
      user_id: userId,
      quiz_date: today,
      subject_code: subjectCode,
      best_score: score,
      total_questions: QUESTIONS_PER_DAY,
      retry_used: false,
      completed: true,
      attempt_count: 1,
      first_score: score,
      ...common,
    });
    if (error) throw error;

    return {
      score,
      bestScore: score,
      attemptCount: 1,
      canRetry: true,
      review: hideCorrectAnswers(
        await reviewQuestions(admin, subjectCode, today, "first", submittedAnswers),
      ),
    };
  }

  const bestScore = Math.max(score, Number(existing.best_score ?? 0));
  const { data, error } = await admin
    .from("daily_quiz_results")
    .update({
      best_score: bestScore,
      retry_used: true,
      completed: true,
      attempt_count: 2,
      retry_score: score,
      ...common,
    })
    .eq("user_id", userId)
    .eq("quiz_date", today)
    .eq("subject_code", subjectCode)
    .eq("attempt_count", 1)
    .not("retry_started_at", "is", null)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const conflict = new Error("The retry was already submitted elsewhere.");
    conflict.status = 409;
    throw conflict;
  }

  return {
    score,
    bestScore,
    attemptCount: 2,
    canRetry: false,
    review: await reviewQuestions(admin, subjectCode, today, "retry", submittedAnswers),
  };
}
