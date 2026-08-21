# Daily Quiz Screenshot Audit

Date: 2026-08-21

The screenshot shows a mismatch between the Recent Results section and Weekly Engagement summary. Recent Results contains two daily attempts at 5/10, while Weekly Engagement displays four challenge attempts but Best score 0/10 and Total points 0. The code confirms these are separate data models: daily quiz results use `poly-quiz-results-v4-single-submit`, while weekly challenge metrics use `poly-quiz-engagement-v1`. Therefore daily quiz scores are not expected to contribute to Weekly Engagement. The screenshot is nevertheless confusing and may also expose legacy challenge records whose score fields are missing or stored under an older name; the current summary defaults missing metrics to zero while still counting the attempts.

Current live guest session had no stored records and rendered zeros consistently. Repository audit target: `assets/js/quiz-engagement.js`, especially `storage()` and `refreshSummary()`.

Other observations from the screenshot: the selected answer is visually highlighted before submission, which is expected; no definite content error is visible from the captured question. Recommended fix: clarify labels as challenge-only, normalize legacy score/total fields, prevent malformed records from silently appearing as zero-score attempts, and keep the daily-results summary separate but explicit.

Evidence: `daily-quiz.html`, `assets/js/quiz-engagement.js`, live `https://polypmna.dpdns.org/daily-quiz.html`, and the supplied screenshot.
