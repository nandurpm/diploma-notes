# API Security Assessment Report

**Assessment type:** Non-destructive automated security assessment

**Assessment date:** 2026-08-20

**Target:** POLY PMNA Cloudflare Worker API and the local hardened Worker implementation

## Executive summary

The hardened local API implementation passed the automated security assessment. The assessment covered malformed JSON, unsupported fields, wrong data types, injection-shaped strings, unsafe data URLs, non-JSON uploads, oversized requests, invalid origins, HTTP downgrade attempts, obvious automation clients, distributed rate-limit failures, image-generation limits, daily-quiz validation, and unauthenticated mock-exam access.

No confirmed SQL injection, command injection, script injection, IDOR, unsafe raw upload acceptance, authentication bypass, or rate-limit failure was found in the local implementation. The Worker uses fixed REST/database paths and does not execute user input as SQL, shell commands, or JavaScript.

> **Important deployment observation:** the live Worker responded safely to the probes, but its daily-quiz response differed from the current local hardened implementation for an invalid subject. This indicates that the latest local validation changes may not yet be deployed to production. The live Worker should be redeployed and the production probes repeated after deployment.

## Assessment coverage

| Control area | Local automated coverage | Live deployed coverage |
|---|---|---|
| HTTPS downgrade rejection | Passed with HTTP 400 | Not exercised against HTTP because the Worker HTTPS endpoint was the safe target; Cloudflare site redirect controls remain separately configured |
| Origin allowlist | Passed with HTTP 403 | Passed with HTTP 403 |
| JSON content-type enforcement | Passed with HTTP 415 for explicit multipart input | Not separately exercised in the live run |
| Malformed JSON | Passed with HTTP 400 | Passed with HTTP 400 |
| Unknown request fields | Passed with HTTP 400 | Not separately exercised in the live run |
| Wrong input types | Passed with HTTP 400 | Not separately exercised in the live run |
| Data URL upload | Passed with HTTP 400 | Not separately exercised in the live run |
| Oversized request | Passed with HTTP 413 | Not separately exercised in the live run |
| Obvious automation user agent | Passed with HTTP 403 | Not separately exercised in the live run |
| Ask POLY distributed limiter | Passed with HTTP 429 using a deterministic binding stub | Not stress-tested against production to avoid operational impact |
| Image-generation limiter | Passed with HTTP 429 using a deterministic binding stub | Not stress-tested against production to avoid consuming AI quota |
| Daily-quiz invalid subject | Passed locally with generic input rejection | Live returned HTTP 400 with an unavailable-subject response; safe, but not identical to current local validation behavior |
| Mock-exam authentication | Passed with HTTP 401 | Passed with HTTP 401 |
| Dependency vulnerabilities | `npm audit --audit-level=high --omit=dev`: 0 vulnerabilities | N/A |
| Worker tests | 71 passing | N/A |

## Static checks

The assessment ran JavaScript syntax checks for the Worker security boundary, API handlers, daily-quiz grader, mock-exam evaluator, and browser upload/query code. `git diff --check` passed. The repository secret scanner reported no high-confidence secrets or non-placeholder privileged assignments. Dependency auditing reported zero high-severity production dependency vulnerabilities.

The local Worker regression suite completed with **71 passing tests and zero failures**. The test output includes expected simulated provider and authentication failure cases; those are intentional negative-path tests, not assessment failures.

## Findings and disposition

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| SEC-API-001 | Informational | Production behavior is not completely identical to the current local hardened code for invalid daily-quiz subjects. | Redeploy the current Worker and repeat the live smoke probes. |
| SEC-API-002 | Informational | Distributed rate limiting was verified deterministically with binding stubs, not by sending a production burst. | Keep Cloudflare rate-limit bindings enabled and validate through dashboards or a controlled staging test. |
| SEC-API-003 | Informational | Obvious automation user-agent blocking is bypassable by spoofing. | Retain it as defense in depth; use Cloudflare WAF/Bot Management or Turnstile for distributed automation. |
| SEC-API-004 | Informational | A full authenticated cross-account test requires two real accounts and must be run in a staging environment with non-production data. | Repeat the ownership matrix against staging using two test users. |

No high- or critical-severity issue was confirmed by this assessment.

## Limitations

This was a non-destructive assessment. It did not attempt credential stuffing, high-volume denial-of-service traffic, provider quota exhaustion, file malware execution, destructive database mutations, or production cross-account writes. It also did not test private Cloudflare dashboard settings, Supabase RLS against two live accounts, secret values, or the contents of the provider systems.

A black-box live assessment cannot prove that every code path is deployed or that platform-side controls are enabled. The local result is therefore stronger evidence for the current source tree than for the currently serving production Worker until redeployment is verified.

## Required follow-up

Redeploy the current Worker source and verify the deployment version. Re-run the live probes for malformed JSON, unknown fields, wrong types, data URLs, explicit multipart content, invalid daily-quiz subjects, blocked origins, and missing mock-exam authentication. Confirm Cloudflare rate-limit bindings, Worker Logs/Logpush, WAF/Bot Management or Turnstile, and Supabase RLS in their production dashboards.

For a formal penetration test, use an isolated staging project with two test accounts, controlled test data, a short approved rate-limit window, and explicit authorization for authenticated ownership tests.

## References

[1]: ../tools/api_security_probe.mjs "Local non-destructive API security probe harness"
[2]: ../docs/INPUT-VALIDATION.md "Input validation and injection-resistance contract"
[3]: ../docs/SECURE-DEPLOYMENT.md "Secure deployment and security monitoring runbook"
[4]: https://owasp.org/API-Security/ "OWASP API Security Project"
