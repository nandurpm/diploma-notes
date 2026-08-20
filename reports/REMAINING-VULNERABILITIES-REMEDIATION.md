# Remaining Vulnerabilities and Remediation Plan

**Project:** POLY PMNA (`nandurpm/diploma-notes`)
**Review date:** 20 August 2026
**Status basis:** Hardened local source tree, 71 passing Worker tests, 13/13 local API probes, safe live smoke probes, and repository/dependency scans

## Executive risk summary

No confirmed high- or critical-severity vulnerability remains in the current local source tree. The remaining risks are primarily **production configuration, deployment consistency, historical credential exposure, and incomplete authenticated verification**. Several controls are implemented in code but are not effective until the corresponding Supabase or Cloudflare settings are enabled and verified in production.

The most urgent action is to **rotate or revoke the historical Firebase API key and redeploy the current Worker**. The next priority is to apply Supabase RLS and complete production authentication, rate-limit, logging, and database-network configuration. A two-account staging test should then verify that user ownership enforcement works across every resource operation.

> **Security status:** Hardened in source; pending production sign-off.

## Priority matrix

| ID | Remaining gap | Severity | Exploitability | Business impact | Priority |
|---|---|---:|---:|---:|---:|
| REM-001 | Historical Firebase API key remains in Git history | High until rotated | High if key is still active | Unauthorized Firebase API use, quota abuse, data exposure depending on Firebase rules | P0 |
| REM-002 | Production Worker may not serve the latest hardened source | High | Medium | Production can lack current validation, logging, or abuse controls | P0 |
| REM-003 | Supabase ownership/RLS migration not confirmed as deployed | High | Medium to high if policies are absent | Cross-account data access or mutation through direct PostgREST queries | P0 |
| REM-004 | Production Auth settings are not verified | High | Medium | Account takeover assistance, signup abuse, weak recovery/session controls | P0 |
| REM-005 | Cloudflare distributed bot controls are not confirmed | Medium | High for distributed attackers | API scraping, AI quota exhaustion, automated signup/login abuse | P1 |
| REM-006 | Security logging and alerting are not confirmed active | Medium | N/A | Delayed detection and response to abuse or compromise | P1 |
| REM-007 | Direct database/network exposure restrictions are not confirmed | High if misconfigured | Medium | Database probing or credential abuse | P1 |
| REM-008 | Authenticated two-account authorization test is incomplete | Medium | Unknown | Ownership regressions could reach production undetected | P1 |
| REM-009 | Comments write path is disabled pending a secure proxy | Low security risk / functional gap | Low | Users cannot post comments; re-enabling unsafely could expose Firebase credentials | P2 |
| REM-010 | Client-side backoff and user-agent blocking are bypassable | Medium residual risk | High for sophisticated automation | Rotating clients can still submit abusive traffic | P1 |
| REM-011 | Future file inspection requires an isolated upload pipeline | Medium future risk | Depends on implementation | Malicious files or parser abuse if binary processing is added unsafely | P2 |

## Detailed findings and fixes

### REM-001 — Historical Firebase API key exposure

**Severity: High until rotation; potentially lower after revocation and restriction.**

A Firebase web API key was found in the historical repository contents. It has been removed from the current `assets/js/help-comments.js` frontend bundle, and the client-side Identity Toolkit signup path has been disabled. However, deleting a key from the current tree does not invalidate copies in Git history, forks, caches, logs, or local clones.

**Why this matters.** Firebase web API keys are often intended to identify a web project, but an exposed key can still be abused when Firebase security rules, enabled services, quotas, or API restrictions are weak. The safe assumption is that the historical key is public and compromised.

**Fix procedure.** First, revoke or rotate the key in Google Cloud Console/Firebase Console. Apply API restrictions limited to only the Firebase services required by the application and application restrictions limited to approved production origins where supported. Review Firebase Authentication, Firestore, Storage, and project usage logs for unexpected activity. Then, if organizational policy requires complete removal, rewrite Git history using an approved secret-removal process and force-update the remote repository and downstream clones. Do not rewrite history before rotating the key.

**Verification.** Search all current files and Git history for the old key marker and exact value, confirm the old key is rejected or disabled, inspect Firebase API usage after rotation, and confirm the browser bundle contains no Firebase API key or Identity Toolkit key parameter.

### REM-002 — Production deployment drift

**Severity: High.**

The local Worker source contains stricter validation and security controls than the live endpoint behavior observed during the smoke test. In particular, the local invalid daily-quiz path uses the new strict validation contract, while the deployed Worker returned a different safe HTTP 400 response for the same malformed subject. The difference does not prove an exploitable live vulnerability, but it proves that source and production behavior are not fully aligned.

**Why this matters.** A production Worker serving an older revision may omit input validation, secret-handling changes, logging, rate limits, or ownership checks that are present in the repository.

**Fix procedure.** Deploy the current Worker from `workers/ask-poly-ai` using the hardened workflow. Record the deployment ID or version in the release record. Confirm that the production route points to the intended Worker and that `wrangler.toml` bindings are present. Do not rely solely on a successful CI job; verify the live behavior.

**Verification.** Repeat the live probes for malformed JSON, unknown fields, wrong types, unsafe data URLs, non-JSON content types, oversized requests, invalid quiz subjects, blocked origins, automation user agents, rate-limit denial, image-generation limits, and missing mock-exam authentication. Compare status codes and generic response bodies with the local probe expectations.

### REM-003 — Supabase RLS deployment not confirmed

**Severity: High if not deployed.**

The repository includes `supabase/migrations/20260820_ownership_rls.sql`, but the assessment did not have confirmation that it was applied to the production Supabase project. Browser-side `.eq("user_id", currentUser.id)` filters are useful but are not an authoritative security boundary without RLS.

**Why this matters.** If a client can call PostgREST directly and a table lacks correct RLS policies, an attacker may alter request filters or identifiers to read or mutate another user’s data.

**Fix procedure.** Apply the ownership migration through the approved Supabase migration process. Verify RLS is enabled on every user-owned table, including `profiles`, `daily_quiz_results`, and `sample_paper_attempts`. Verify policies use `auth.uid()` for the owner and that `INSERT`, `SELECT`, `UPDATE`, and `DELETE` policies are intentionally defined. Review whether service-role operations bypass RLS and ensure they are reachable only from server-side Worker code after bearer-token authentication.

**Verification.** Create two staging users, A and B. Create records for each. Attempt reads, updates, and deletes with the other user’s session and forged IDs. Every cross-account operation must return no data or a non-success response. Repeat the same test through the browser and direct PostgREST requests.

### REM-004 — Supabase Auth production settings not verified

**Severity: High.**

The frontend enforces several authentication rules, but authoritative settings remain in Supabase. The review did not have dashboard access to verify email confirmation, refresh-token rotation, session lifetime, password-reset expiry, SMTP security, Auth rate limits, or CAPTCHA/abuse controls.

**Why this matters.** Client JavaScript can be bypassed. If server-side Auth settings are weak, attackers can create unverified accounts, abuse password recovery, perform credential stuffing, or retain long-lived sessions.

**Fix procedure.** Enable email confirmation for new accounts. Configure refresh-token rotation and appropriate access/refresh session lifetimes. Set password-reset links to short expiry and one-time use. Enable Supabase Auth rate limits and CAPTCHA or an equivalent challenge for login, signup, password reset, and verification-email flows. Use production SMTP with domain authentication and monitor delivery abuse. Confirm that service-role and JWT/signing secrets are not exposed to the browser.

**Verification.** Test unconfirmed login, expired session restoration, reused reset links, repeated failed logins, repeated signups, and repeated reset requests in staging. Confirm generic error messages, rate-limit responses, and security events.

### REM-005 — Cloudflare distributed bot controls not confirmed

**Severity: Medium.**

The Worker has distributed rate-limit bindings and local fallback limits. However, WAF/Bot Management/Turnstile configuration was not verified. An attacker can rotate IP addresses, spoof user-agent strings, or bypass browser JavaScript.

**Why this matters.** AI generation is a costly resource, and distributed scraping or automated calls can exhaust quota, increase operating costs, degrade service, or harvest content.

**Fix procedure.** Configure Cloudflare WAF rules for the public API routes. Add rate rules by route, client reputation, bot score, ASN or network anomalies, and request burst patterns. Use Turnstile or an equivalent challenge for anonymous expensive operations if acceptable for the product. Keep authenticated mock-exam and user-facing traffic allowlisted appropriately. Do not use user-agent filtering as the only bot control.

**Verification.** Run a controlled staging burst from a test client and verify challenge/block behavior, 429 responses, security logs, and recovery after the window expires. Confirm legitimate browser and approved app traffic remains usable.

### REM-006 — Security logging and alerting activation

**Severity: Medium.**

The Worker emits structured security events, but the assessment did not verify that Cloudflare Workers Logs or Logpush is enabled, retained, access-controlled, and connected to alerts.

**Why this matters.** Logging without collection and alerting does not provide timely detection. Suspicious authentication failures, origin blocks, rate-limit spikes, provider failures, and database errors could remain unnoticed.

**Fix procedure.** Enable Workers Logs or Logpush for the production Worker. Restrict log access to authorized operators. Set retention according to incident-response requirements. Create alerts for repeated `authentication_failed`, `automated_client_blocked`, `origin_blocked`, `https_violation`, `rate_limit_blocked`, `api_error`, `api_provider_error`, and `database_write_error` events. Keep tokens, passwords, prompts, request bodies, and personal identifiers out of logs.

**Verification.** Generate controlled staging events and confirm they arrive with route, timestamp, severity, and correlation information. Trigger each alert threshold and confirm notification delivery without exposing sensitive values.

### REM-007 — Database and network exposure restrictions

**Severity: High if direct database access is exposed.**

The repository documents the required boundary, but the assessment could not verify Supabase network restrictions or whether any PostgreSQL endpoint is publicly reachable.

**Why this matters.** A public database port, leaked database password, or broadly exposed service-role endpoint can bypass application controls and enable direct probing or data theft.

**Fix procedure.** Ensure browsers never receive database passwords, service-role keys, connection strings, or administrative endpoints. Restrict administrative database access to approved private networks or IPs supported by the selected Supabase plan. Remove public firewall rules for PostgreSQL. Keep the service-role key only in Cloudflare Worker secrets. Review Supabase API exposure and ensure RLS is enabled for all user-owned tables.

**Verification.** Perform an external port and endpoint exposure check from an approved assessment network. Confirm that only intended HTTPS Auth/PostgREST endpoints are reachable publicly and that database credentials are absent from frontend bundles and CI logs.

### REM-008 — Incomplete authenticated authorization test

**Severity: Medium.**

Local tests cover forged owner IDs and invalid owners, but a full live cross-account test using two real authenticated users was not performed. This is a verification gap rather than a confirmed vulnerability.

**Fix procedure.** Create two staging accounts with no production data. Exercise every route and table operation as both users. Include direct API requests, browser requests, forged IDs, altered ownership fields, modified paper IDs, and attempted updates/deletes. Confirm generic responses and absence of data leakage.

**Verification.** Preserve the test matrix and results as release evidence. Add automated integration tests against an isolated Supabase project so future RLS or query changes fail CI when cross-account access becomes possible.

### REM-009 — Comments write path disabled

**Severity: Low security risk, functional gap.**

The public comments UI can read public Firestore comments, but client-side posting is intentionally disabled because the previous implementation shipped a Firebase API key and called Identity Toolkit directly from the browser.

**Fix procedure.** Implement a server-side comments endpoint in the Worker or an approved backend. Store the rotated Firebase credential only as a server secret. Authenticate and rate-limit comment creation. Validate author/message length and links. For update/delete, enforce ownership using a server-derived user ID and Firestore security rules. Never return the Firebase key to the browser.

**Verification.** Test anonymous reads, authenticated create, owner-only update/delete, cross-user denial, link and HTML payload rejection, rate limits, and secret scans.

### REM-010 — Bypassable client backoff and user-agent blocking

**Severity: Medium residual risk.**

Client-side login/signup backoff and the Worker’s obvious automation user-agent block are useful defense-in-depth controls, but neither is authoritative. Attackers can disable JavaScript, call Supabase directly, spoof a browser user-agent, or rotate IPs.

**Fix procedure.** Treat client controls as user-experience protections only. Enforce login/signup/recovery limits in Supabase Auth. Enforce API and AI limits with Cloudflare distributed controls and authenticated quotas where practical. Alert on account-level and IP/network-level anomalies.

**Verification.** Confirm that direct API calls without the browser are still rate-limited, that spoofed user agents do not bypass Cloudflare controls, and that limits are enforced per account, IP, route, and expensive operation as intended.

### REM-011 — Future binary upload processing

**Severity: Medium future risk.**

The current API rejects raw multipart uploads and receives attachment metadata only. If binary inspection is added later, file parsers and AI providers will become new attack surfaces.

**Fix procedure.** Use an isolated upload service. Detect type from magic bytes rather than trusting the MIME header, enforce compressed and decompressed size limits, reject archives unless explicitly needed, generate storage names, store outside executable web roots, scan with an approved malware/content scanner, and pass only sanitized representations to AI providers. Strip active content from SVG and office formats or reject them. Add timeouts and memory limits around parsers.

**Verification.** Test polyglot files, renamed executables, malformed PDFs/images, decompression bombs, oversized files, path traversal names, SVG scripts, and archive nesting in staging. Confirm files cannot execute or escape the intended storage namespace.

## Recommended remediation sequence

### P0 — Complete before production approval

1. Rotate or revoke the historical Firebase API key and review Firebase usage.
2. Deploy the current hardened Worker source and verify the serving version.
3. Apply and verify the Supabase ownership/RLS migration.
4. Confirm Supabase Auth email verification, token/session expiry, password-reset expiry, and server-side rate limits.
5. Repeat the live malformed-input and unauthenticated API probe suite after deployment.

### P1 — Complete immediately after P0

1. Enable Cloudflare WAF/Bot Management or Turnstile for public and expensive API routes.
2. Enable Workers Logs/Logpush, retention, access control, and security alerts.
3. Confirm database network restrictions and absence of public database access.
4. Execute the two-account staging authorization matrix and preserve the evidence.
5. Validate direct non-browser API calls and distributed rate-limit behavior.

### P2 — Complete before expanding functionality

1. Implement a server-side comments proxy if comment posting is required.
2. Add authenticated integration tests against isolated Supabase staging.
3. Design and test an isolated binary-upload inspection pipeline before enabling server-side file processing.
4. Review the secret scanner and CI history checks after any repository history rewrite.

## Final assessment

The remaining items are not evidence that the hardened local source contains an exploitable high-severity flaw. They are **production assurance gaps and residual abuse risks**. The project should be considered ready for controlled staging deployment, not final production approval, until P0 items are completed and verified.

## References

[1]: ../reports/API-SECURITY-ASSESSMENT.md "API security assessment report"
[2]: ../docs/AUTHENTICATION-SECURITY.md "Authentication security contract"
[3]: ../docs/SECURE-DEPLOYMENT.md "Secure deployment and security monitoring runbook"
[4]: ../docs/INPUT-VALIDATION.md "Input validation and injection-resistance contract"
[5]: ../supabase/migrations/20260820_ownership_rls.sql "Ownership RLS migration"
[6]: https://owasp.org/API-Security/ "OWASP API Security Project"
