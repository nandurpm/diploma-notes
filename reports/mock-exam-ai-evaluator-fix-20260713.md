# Mock Exam AI Evaluator Fix — 13 July 2026

## Root cause

The previous Supabase evaluator forwarded all mock-exam subjects to the Cloudflare Worker route `/api/evaluate-mock-exam`.

That Worker evaluator is built around the single hard-coded Applied Chemistry paper (`1004`). When a different subject such as Environmental Science (`2001`) was sent, the Worker rejected it as an unknown paper. The Supabase function then returned the automated rubric fallback, which is why the result always displayed `Automated Rubric`.

## Fix applied

- Deployed Supabase Edge Function `evaluate-mock-exam` version 3.
- The function now sends questions to the generic Ask POLY AI endpoint in batches of five.
- Each batch requests structured question-wise marks, confidence, feedback and missing points.
- Only a failed AI batch uses the local rubric fallback.
- The final response records AI batch count, total batch count and fallback reasons.
- JWT verification remains enabled.
- Updated `assets/js/mock-exam-loader.js` cache version to `20260713-ai-evaluator3`.
- Added `assets/js/mock-exam-mode-label-fix.js` for AI/partial-fallback labels.

## Database correction

The `sample_paper_attempts_subject_check` constraint previously allowed only `1001`, `1002`, `1003`, `1004` and `GK`. This blocked saving subject `2001` attempts and caused `Published on this page`.

The constraint now accepts `GK` or any four-digit course code with an optional suffix letter, for example `2001`, `6031A` and `6041C`.
