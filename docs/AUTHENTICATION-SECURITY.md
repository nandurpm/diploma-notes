# Authentication Security Contract

This project uses the Supabase Auth service from a static Cloudflare Pages frontend. The browser may contain only the Supabase project URL and publishable key. It must never contain a `service_role` key, database password, SMTP credential, signing secret, or other privileged secret.

## Controls implemented in the frontend

The shared browser client stores the Supabase session in `sessionStorage`, rather than persistent `localStorage`, and the quiz auth module signs the user out after 30 minutes of inactivity. The module rejects unverified email accounts during login, registration, and session restoration. Login errors are deliberately generic, and the client applies a five-failure, fifteen-minute backoff per normalized email address as a user-experience safeguard. The browser cannot be the only rate-limiting boundary; production enforcement is required in Supabase as described below.

New and reset passwords must contain at least 12 characters. Password hashing and password comparison are delegated to Supabase Auth; passwords are never stored, logged, or sent to project database tables by this repository. Recovery URLs are removed from browser history after a successful update, and the reset page is served with `no-store` caching. Authenticated quiz and recovery pages are also excluded from intermediary caching.

## Required Supabase production settings

These settings must be verified in the Supabase dashboard for the project used by `daily-quiz.html`. They are service configuration, not frontend code, and therefore cannot be safely enabled by editing this static repository alone.

| Control | Required setting | Verification criterion |
|---|---|---|
| Email verification | Authentication → Providers → Email: enable email confirmations | A newly registered account has no session until its confirmation link is used; an unconfirmed login is rejected. |
| Password hashing | Keep Supabase Auth password storage enabled; never create a custom password column | Database tables contain no plaintext or reversible password field. |
| Session lifetime | Configure an access-token lifetime appropriate for the application, with refresh-token rotation enabled and reuse interval minimized | Expired or revoked refresh tokens cannot restore a session. The frontend additionally enforces 30 minutes of inactivity. |
| Password recovery | Configure recovery links to `https://polypmna.dpdns.org/reset-password.html` and use a short recovery-token lifetime, such as 30–60 minutes | A used or expired recovery link cannot update a password. |
| Login rate limiting | Configure Auth rate limits and, where available, CAPTCHA or abuse protection for password sign-in and signup | Repeated failures receive throttled responses at the service boundary, even when JavaScript is bypassed. |
| Email abuse protection | Use production SMTP with sender/domain controls and rate limits | Verification and reset emails are not dependent on permissive test-email limits. |
| Database authorization | Enable RLS on `profiles`, `daily_quiz_results`, and every authenticated result table; scope policies to `auth.uid()` | A user cannot read or modify another user’s records by changing a client-side ID. |
| Secret handling | Store service-role and server-only credentials only in Cloudflare Worker/Supabase secrets | Repository search and deployed HTML contain no privileged key. |

## Deployment checks

Before release, inspect the generated site and worker configuration for privileged material:

```bash
grep -RInE 'service_role|SUPABASE_SERVICE|PRIVATE_KEY|JWT_SECRET|SMTP_PASSWORD|DATABASE_URL' \
  --exclude-dir=.git --exclude-dir=node_modules .
```

The command should return no deployed frontend source. A service-role key may appear only in a server-side secret configuration that is not shipped to Cloudflare Pages. Rotate any credential that has ever been committed or exposed in a browser bundle; removing it from the latest commit is not sufficient.

The worker’s server-side result storage must continue to validate the bearer token with Supabase before using its service-role credential. The service-role credential must never be accepted from request headers, query parameters, or browser configuration.

## Scope and residual risk

The static frontend cannot provide authoritative password hashing, email-confirmation policy, token expiry, or distributed login throttling. Those controls belong to Supabase Auth and its edge/network boundary. The frontend changes provide defense in depth and fail closed for unverified users, but deployment is not complete until the dashboard settings and database RLS policies above are verified in the production project.

## Resource ownership and IDOR prevention

All authenticated resource queries must enforce ownership twice: the application query should scope the result to the authenticated user, and the database must enforce the same invariant with RLS. The client’s `user_id` filters are therefore treated as query narrowing, not authorization. The migration `supabase/migrations/20260820_ownership_rls.sql` enables RLS and adds owner-only select, insert, update, and delete policies for `profiles`, `daily_quiz_results`, and `sample_paper_attempts`.

The verified mock-exam worker derives `user_id` from the Supabase `/auth/v1/user` response associated with the bearer token. It ignores any `body.user_id` value and rejects a missing or malformed authenticated owner UUID before writing. The client history queries also constrain results by the current authenticated user ID, subject code, and paper code; RLS remains the authoritative cross-account boundary.

Apply and verify the migration against the production Supabase project before deployment. A policy migration that exists only in the repository does not protect a live database until it has been applied successfully.
