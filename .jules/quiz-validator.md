## 2026-03-30 - Quiz and Mock Exam Data Schemas

**Finding:**
Quiz and mock exam data across the repository follow three distinct data schemas:
1. `window.POLY_QUIZ_BANK` (`assets/js/quiz-bank.js`) & `DAILY_QUIZ_BANK` (`workers/ask-poly-ai/src/daily-quiz-bank.js`):
   - Structured as `{ subjects: { [code]: name }, questions: { [code]: Array<{ id: string, topic: string, en: string, ml: string, options: string[], answer: number }> } }`.
   - `answer` is a zero-based integer index pointing to the correct string in `options`.
2. `window.QuizGuestSubjects` (`assets/js/quiz-bank-[code].js`):
   - Structured as `{ [code]: { title: string, subtitle: string, icon: string, description: string, color: string, questions: Array<{ id: number, topic: string, question: string, answer: string, options: string[] }> } }`.
   - `answer` is an exact matching string in the `options` array.
3. `window.POLY_QUIZ_BANK` (`assets/js/quiz-bank-public.js`) & `MOCK_PAPERS` (`workers/ask-poly-ai/src/mock-papers.js`):
   - Public answer-free question payloads where options are stripped of answers for server-side grading.

**Learning:**
Validating quiz data requires matching the correct schema parser for each file context (0-indexed integer `answer` for full quiz banks vs string matching `answer` for modular guest quiz banks).

**Prevention:**
Use the schema definitions above when validating question data integrity or adding new subject quiz banks.
