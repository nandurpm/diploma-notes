# POLY PMNA Security Sign-off Checklist

**Repository status:** Local security gates pass after the latest hardening changes.
**Production status:** Not fully signed off until the external actions below are completed.

## Completed in the repository

| Control | Evidence |
|---|---|
| Authentication hardening | `assets/js/quiz-auth.js`, reset flows, session expiry and verified-email enforcement |
| Ownership enforcement | Worker owner derivation, ownership regression tests, `supabase/migrations/20260820_ownership_rls.sql` |
| HTTPS and headers | `_redirects`, `_headers`, Worker HTTPS rejection |
| Secret scanning | `tools/secret_scan.py`, `.github/workflows/secret-scan.yml` |
| Input validation | Worker strict schemas, `docs/INPUT-VALIDATION.md` |
| Upload protection | MIME/extension/signature/size checks and metadata-only API transport |
| Abuse controls | Distributed Ask, exam, and image rate-limit bindings; automation rejection |
| Security logging | Structured Worker security events and deployment documentation |
| Deployment gates | Full Worker tests, dependency audit, secret scan, local API probes, migration/binding checks, and post-deployment smoke checks in `.github/workflows/deploy-ask-poly-ai.yml` |
| Automated verification | 71 Worker tests, 13/13 local API probes, zero high-severity production dependency vulnerabilities |

## Required authorized production actions

### P0 — Must complete before production approval

- [ ] Revoke or rotate the Firebase API key that was present in Git history.
- [ ] Review Firebase/Google Cloud usage logs for activity associated with the historical key.
- [ ] Apply API restrictions and approved-origin restrictions to the replacement Firebase key.
- [ ] Deploy the current Worker source through the hardened workflow.
- [ ] Verify the serving Worker version and 100% traffic promotion.
- [ ] Apply the Supabase ownership/RLS migration.
- [ ] Confirm RLS is enabled and policies are active on `profiles`, `daily_quiz_results`, and `sample_paper_attempts`.
- [ ] Confirm Supabase email verification, session lifetime, refresh-token rotation, reset-token expiry, SMTP, and Auth rate limits.

### P1 — Must complete immediately after P0

- [ ] Enable Cloudflare Workers Logs or Logpush with restricted access and appropriate retention.
- [ ] Create alerts for authentication failures, automation blocks, origin blocks, rate-limit blocks, API/provider failures, and database-write failures.
- [ ] Enable Cloudflare WAF/Bot Management or Turnstile for public and expensive API routes.
- [ ] Confirm direct PostgreSQL/database ports are not publicly exposed.
- [ ] Confirm service-role credentials are absent from frontend assets and CI logs.
- [ ] Run a two-account staging authorization test for read, insert, update, and delete operations.
- [ ] Re-run the post-deployment malformed-input and unauthenticated API smoke tests.

### P2 — Complete before expanding functionality

- [ ] Implement a server-side comments proxy if comment posting is required.
- [ ] Add isolated Supabase integration tests to CI for cross-account RLS behavior.
- [ ] If binary upload inspection is added, use isolated scanning, parser limits, non-executable storage, and malware/content scanning.
- [ ] If repository history is rewritten, rotate first and verify all downstream clones are refreshed.

## Sign-off conditions

Production may be marked **security-approved** only when all P0 and P1 boxes are complete, the two-account authorization evidence is recorded, the historical Firebase key is disabled, and the live smoke-test results match the current Worker source behavior.

Until then, the correct status is **hardened in source; pending production verification**.
