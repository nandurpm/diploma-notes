import { DAILY_QUIZ_BANK } from './daily-quiz-bank.js';
import { jsonResponse } from './http.js';

const QUESTIONS_PER_DAY = 10;
const MAX_BODY_BYTES = 40000;

function hash(text) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function randomFrom(seed) {
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function dateKeyIST(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const pick = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

function cleanSubject(value) {
  return String(value || '').trim().slice(0, 12);
}

function selectedQuestions(subjectCode, dateKey, mode) {
  const source = DAILY_QUIZ_BANK.questions[subjectCode];
  if (!Array.isArray(source) || source.length < QUESTIONS_PER_DAY) return null;
  const daily = shuffle(source, randomFrom(hash(`${dateKey}${subjectCode}`))).slice(0, QUESTIONS_PER_DAY);
  return daily.map((question) => ({
    ...question,
    options: shuffle(question.options, randomFrom(hash(`${dateKey}${subjectCode}${question.id}:single`)))
  }));
}

function clientAnswerMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return Object.fromEntries(Object.entries(value).slice(0, QUESTIONS_PER_DAY).map(([id, answer]) => [
    String(id).slice(0, 80), String(answer || '').trim().slice(0, 500)
  ]));
}

export async function handleDailyQuizGrading(request, env, origin) {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405, origin, env);
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > MAX_BODY_BYTES) return jsonResponse({ error: 'The request is too large.' }, 413, origin, env);

  const rawBody = await request.text().catch(() => '');
  if (rawBody.length > MAX_BODY_BYTES) return jsonResponse({ error: 'The request is too large.' }, 413, origin, env);
  let body;
  try {
    body = JSON.parse(rawBody || '{}');
  } catch {
    return jsonResponse({ error: 'Invalid JSON request.' }, 400, origin, env);
  }
  const subject = cleanSubject(body?.subject);
  const mode = body?.mode === 'retry' ? 'retry' : 'first';
  const answers = clientAnswerMap(body?.answers);
  const today = dateKeyIST();
  const questions = selectedQuestions(subject, today, mode);
  if (!questions) return jsonResponse({ error: 'This quiz subject is not available.' }, 400, origin, env);
  if (!answers || Object.keys(answers).length !== QUESTIONS_PER_DAY) {
    return jsonResponse({ error: `Answer all ${QUESTIONS_PER_DAY} questions before submitting.` }, 400, origin, env);
  }

  const expectedIds = new Set(questions.map((question) => String(question.id)));
  if (Object.keys(answers).some((id) => !expectedIds.has(id))) {
    return jsonResponse({ error: 'The submitted question set is invalid. Reload the quiz and try again.' }, 400, origin, env);
  }

  let score = 0;
  const review = questions.map((question, index) => {
    const userAnswer = answers[String(question.id)] || 'Not answered';
    const correctAnswer = question.options[question.answer];
    const correct = userAnswer === correctAnswer;
    if (correct) score += 1;
    return {
      number: index + 1,
      id: question.id,
      topic: question.topic,
      question: question.en,
      userAnswer,
      correctAnswer,
      correct
    };
  });

  return jsonResponse({
    quizDate: today,
    subjectCode: subject,
    mode,
    score,
    totalQuestions: QUESTIONS_PER_DAY,
    review
  }, 200, origin, env);
}
