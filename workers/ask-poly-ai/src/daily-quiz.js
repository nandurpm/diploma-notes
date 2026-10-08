import { DAILY_QUIZ_BANK } from './daily-quiz-bank.js';
import { isPlainObject, jsonResponse, rejectUnknownKeys, strictJsonObject, strictText } from './http.js';
import { authenticateStudent, storeDailyQuizResult } from './result-store.js';

// Keep General Knowledge questions in the server-only grading bank.
const GENERAL_KNOWLEDGE_QUESTIONS = Object.freeze([
        { id: 'GK-01', topic: 'India', en: 'What is the capital of India?', ml: 'ഇന്ത്യയുടെ തലസ്ഥാനം ഏത്?', options: ['New Delhi', 'Mumbai', 'Kolkata', 'Chennai'], answer: 0 },
        { id: 'GK-02', topic: 'Kerala', en: 'What is the capital of Kerala?', ml: 'കേരളത്തിന്റെ തലസ്ഥാനം ഏത്?', options: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'], answer: 0 },
        { id: 'GK-03', topic: 'India', en: 'Which document is the supreme law of India?', ml: 'ഇന്ത്യയുടെ പരമോന്നത നിയമം ഏത് രേഖയാണ്?', options: ['The Constitution of India', 'The Union Budget', 'The Census', 'The Penal Code only'], answer: 0 },
        { id: 'GK-04', topic: 'Kerala', en: 'Kerala was formed as a state on which date?', ml: 'കേരളം സംസ്ഥാനമായി രൂപീകരിച്ചത് ഏത് തീയതി?', options: ['1 November 1956', '15 August 1947', '26 January 1950', '1 May 1960'], answer: 0 },
        { id: 'GK-05', topic: 'Science', en: 'What is the chemical symbol for oxygen?', ml: 'Oxygen-ന്റെ chemical symbol എന്ത്?', options: ['O', 'Ox', 'Og', 'On'], answer: 0 },
        { id: 'GK-06', topic: 'Science', en: 'Water freezes at what temperature on the Celsius scale?', ml: 'Celsius scale-ൽ വെള്ളം ഏത് temperature-ൽ തണുത്തുറയും?', options: ['0°C', '100°C', '32°C', '-100°C'], answer: 0 },
        { id: 'GK-07', topic: 'Technology', en: 'What does CPU stand for?', ml: 'CPU എന്നത് എന്തിന്റെ ചുരുക്കപ്പേരാണ്?', options: ['Central Processing Unit', 'Computer Primary Utility', 'Central Power Unit', 'Control Program User'], answer: 0 },
        { id: 'GK-08', topic: 'Technology', en: 'Which protocol is normally used for secure web browsing?', ml: 'Secure web browsing-ന് സാധാരണ ഉപയോഗിക്കുന്ന protocol ഏത്?', options: ['HTTPS', 'FTP only', 'SMTP', 'Bluetooth'], answer: 0 },
        { id: 'GK-09', topic: 'Environment', en: 'Which layer protects Earth from much harmful ultraviolet radiation?', ml: 'ഹാനികരമായ UV radiation-ൽ നിന്ന് ഭൂമിയെ സംരക്ഷിക്കുന്ന layer ഏത്?', options: ['Ozone layer', 'Troposphere only', 'Ocean layer', 'Core'], answer: 0 },
        { id: 'GK-10', topic: 'Geography', en: 'Which is the largest continent by area?', ml: 'വിസ്തീർണ്ണത്തിൽ ഏറ്റവും വലിയ ഭൂഖണ്ഡം ഏത്?', options: ['Asia', 'Africa', 'Europe', 'Australia'], answer: 0 }
      ]);

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
  if (String(value || '').toUpperCase() === 'GK') return 'GK';
  return strictText(value, 'subject', { min: 4, max: 5, pattern: /^\d{4}[A-Za-z]?$/ }).toUpperCase();
}

export function selectedQuestions(subjectCode, dateKey, mode) {
  const source = subjectCode === 'GK' ? GENERAL_KNOWLEDGE_QUESTIONS : DAILY_QUIZ_BANK.questions[subjectCode];
  if (!Array.isArray(source) || source.length < QUESTIONS_PER_DAY) return null;
  const daily = shuffle(source, randomFrom(hash(`${dateKey}${subjectCode}`))).slice(0, QUESTIONS_PER_DAY);
  return daily.map((question) => ({
    ...question,
    options: shuffle(question.options, randomFrom(hash(`${dateKey}${subjectCode}${question.id}:single`)))
  }));
}

function clientAnswerMap(value) {
  if (!isPlainObject(value)) throw new TypeError('answers must be an object.');
  const entries = Object.entries(value);
  if (entries.length !== QUESTIONS_PER_DAY) throw new TypeError(`answers must contain exactly ${QUESTIONS_PER_DAY} entries.`);
  return Object.fromEntries(entries.map(([id, answer]) => [
    strictText(id, 'question id', { min: 1, max: 80, pattern: /^[A-Za-z0-9_-]+$/ }),
    strictText(answer, 'answer', { min: 1, max: 500 })
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
    body = strictJsonObject(JSON.parse(rawBody || '{}'), 'request');
    rejectUnknownKeys(body, ['subject', 'mode', 'answers']);
    const subject = cleanSubject(body.subject);
    if (body.mode !== undefined && body.mode !== 'first' && body.mode !== 'retry') throw new TypeError('mode is invalid.');
    const mode = body.mode || 'first';
    const answers = clientAnswerMap(body.answers);
    const today = dateKeyIST();
    const questions = selectedQuestions(subject, today, mode);
    if (!questions) return jsonResponse({ error: 'This quiz subject is not available.' }, 400, origin, env);
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

    const graded = {
      quizDate: today,
      subjectCode: subject,
      mode,
      score,
      totalQuestions: QUESTIONS_PER_DAY,
      review
    };

    // Anonymous practice remains available, but never creates a verified row.
    if (!request.headers.get('Authorization')) {
      return jsonResponse({ ...graded, savedOnline: false }, 200, origin, env);
    }
    // The current authenticated daily quiz allows one submitted attempt.
    if (mode !== 'first') {
      return jsonResponse({ error: 'Authenticated retries are not supported.' }, 400, origin, env);
    }
    try {
      const student = await authenticateStudent(request, env);
      const row = await storeDailyQuizResult(student, graded, answers, env);
      return jsonResponse({ ...graded, savedOnline: true, row }, 200, origin, env);
    } catch (error) {
      const status = Number(error?.status) || 502;
      return jsonResponse(
        { error: status === 409 ? 'A result is already saved for this subject today.' : status === 401 ? 'Your login session is invalid or expired.' : 'Secure quiz result storage is temporarily unavailable.' },
        status,
        origin,
        env
      );
    }
  } catch (error) {
    return jsonResponse({ error: /invalid|must be|contains/i.test(String(error?.message || '')) ? 'The request contains invalid input.' : 'The quiz request could not be processed.' }, 400, origin, env);
  }
}
