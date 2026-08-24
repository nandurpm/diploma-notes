# Backend boundaries

The site intentionally uses two backend systems for different responsibilities. This is an explicit boundary, not duplicate browser authentication.

| System | Active responsibility | Client surface | Security boundary |
|---|---|---|---|
| Supabase | Web quiz authentication, recovery sessions, and browser-facing quiz data services | `assets/js/quiz-auth.js`, `assets/js/reset-password.js`, and related quiz pages | Public project URL and publishable key may be used in the browser; privileged keys and authoritative grading remain server-side |
| Firebase Cloud Messaging | Android notification delivery for new lessons and operational announcements | Android app notification service and notification workflows | Firebase credentials and server-side notification operations stay outside public HTML and browser JavaScript |
| Cloudflare Worker | Ask POLY AI, daily-quiz grading, and mock-exam evaluation | Worker endpoints called by browser clients | Answer keys, rubrics, and model credentials remain in Worker-only modules and secrets |

The repository must not merge these responsibilities casually. Removing Firebase would break Android notification delivery; replacing Supabase would require a planned migration of web authentication and recovery flows. The security requirement is that no privileged Firebase or Supabase secret, quiz answer key, mock-exam rubric, or model credential is shipped to the browser.

## Maintenance rules

New web authentication code belongs in the Supabase boundary unless a migration decision is recorded first. New Android notification code belongs in the Firebase boundary. Authoritative grading and private evaluation data belong in the Cloudflare Worker. CI validators should reject browser-side answer keys, rubrics, privileged secrets, and password-reset token leakage.
