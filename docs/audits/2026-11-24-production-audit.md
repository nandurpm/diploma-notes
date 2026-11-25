# Production audit — 2026-11-24

Target: https://polypmna.dpdns.org/ · Repository: nandurpm/diploma-notes

## Confirmed findings and remediation
| Severity | Finding | Remediation |
| --- | --- | --- |
| High | GitHub Pages deployment rejected the intentional hidden Ask POLY queue control. | Assert the accessible hidden control instead; retain the unrelated context-bar guard. |
| High | Service worker keyed versioned assets by pathname, allowing old JavaScript to be served on a new release. | Use exact request URLs, rotate cache, and isolate cache-write failures from valid network responses. |
| High | Ask POLY active conversation could change during a pending answer, sending messages to the wrong chat. | Acquire generation lock before database writes, block conversation changes/deletion while busy, release after rendering. |
| High | Extensionless routes did not initialize Ask POLY's chat, recovery, layout or knowledge loader. | Accept canonical and clean route variants; suppress visitor popup consistently. |
| Medium | Health probes lacked a timeout and could incorrectly probe a POST route. | Apply per-probe five-second deadline and derive the proper health path. |
| Medium | Retry buttons could reuse a question from another saved conversation. | Resolve the question from the preceding user bubble. |
| Medium | A successful HTTP response with missing/invalid answer could appear to be a real answer. | Reject it and use normal error/fallback handling. |
| Medium | Stop during knowledge retrieval did not stop the subsequent API request. | Check stop flag before sending to provider. |
| High | Discussion-unavailable fallback used the old support mailbox. | Match the current Help page address: contact@polypmna.dpdns.org. |
| Medium | Help comments could fail with blocked browser storage or invalid timestamps; network requests lacked deadlines. | Session-only storage fallback, guarded formatting, and 15-second request deadlines. |

## Validation
- Public page retrieval: Home, both revision directories, Ask POLY, daily quiz, Tools and Help. The retrieved pages are not proof of a working interactive service; some snapshots are older.
- Direct source syntax parsing succeeded for eight changed JS scripts and two regression test files.
- Six Ask POLY route expressions, correct fallback email, and invalid/valid date handling were evaluated and passed.
- Added/updated regression tests in tests/frontend for exact-version offline behavior, route compatibility and support fallback.
- Existing CI covers all-document static audit, frontend Node tests, Worker tests, security policy and browser regressions. Full CI outcomes and deployed commit still require confirmation.

## Open verification
- Live AI health and real streaming replies; provider/relay failover, quota and configuration.
- Live quiz registration, reset, scoring, mock exams, database persistence, and role/RLS authorization.
- Full curriculum and PDF link integrity, official source accuracy, calculator edge cases.
- Real browser console/network errors, mobile/tablet layout, accessibility and Lighthouse performance.
- Actual live security headers (GitHub Pages does not apply Cloudflare _headers); TLS/DNS and mailbox delivery were not changed or verified.
- No browser credentials, production student records, DNS or provider secrets were modified. Do not treat this report as a full clean bill of health.
