# Quiz Validator's Journal

## 2026-05-17 - Dual Answer Schema Patterns Across Client and Worker Quiz Banks
**Finding:** Uncovered two distinct answer schemas in the codebase: `POLY_QUIZ_BANK` (`assets/js/quiz-bank.js`) and `DAILY_QUIZ_BANK` (`workers/ask-poly-ai/src/daily-quiz-bank.js`) use zero-based integer index for `answer` (`0`), whereas guest bank files (`assets/js/quiz-bank-[code].js`) use an exact matching string value for `answer` (`"Clarity and precision"`).
**Learning:** `quiz-bank-public.js` strips the `answer` property entirely for secure client-side daily quiz rendering, while server-side worker endpoints evaluate client submissions using `DAILY_QUIZ_BANK`'s numeric index. Validating data integrity requires checking numeric bounds for indexed banks and string option existence for guest banks.
**Prevention:** When auditing quiz data, always check the source file's schema type before validating answer fields to avoid false positive error reports.

## 2025-02-16 - Duplicate Quiz Question in central Bank
**Finding:** Found an exact duplicate entry for `2005-08` under subject code `2005` inside `assets/js/quiz-bank.js`.
**Learning:** Duplicate items in central quiz bank array keys lead to incorrect question counts and repeated rendering of the exact same question in quizzes or exams, degrading user experience and messing with total question calculations.
**Prevention:** Always run automated scanning scripts to identify key duplication or duplicate question texts in JavaScript array configurations before committing.
