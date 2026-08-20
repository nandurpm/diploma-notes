# Secure Deployment and Security Monitoring

This project is a static Cloudflare Pages site with a Cloudflare Worker API and Supabase Auth/PostgREST. The browser may contain only the Supabase project URL and publishable key. All service credentials, AI provider keys, database service-role keys, SMTP credentials, signing secrets, and deployment tokens must remain in GitHub Actions or Cloudflare secret storage.

## HTTPS enforcement

Production domains must use Cloudflare SSL/TLS mode **Full (strict)**, with **Always Use HTTPS** enabled and HTTP/2 or HTTP/3 enabled as appropriate. The repository now includes explicit HTTP-to-HTTPS redirect rules, a two-year HSTS header with `includeSubDomains; preload`, `upgrade-insecure-requests` in the content security policy, and a scheduled certificate hostname/expiry check.

Do not submit the production domain to the HSTS preload list until every subdomain is permanently HTTPS-capable. Localhost exceptions are limited to development and are not included in the production origin allowlist used by the deployed Worker.

## Secret storage

Use GitHub Actions repository or environment secrets for deployment inputs and Cloudflare Worker secrets for runtime credentials. The Worker deployment workflow creates a temporary secret bundle with `umask 077`, verifies mode `0600`, uploads it with Wrangler, and deletes it with a shell trap on both success and failure. Never echo secret values, write them to workflow artifacts, commit generated bundles, or place them in `wrangler.toml`.

Recommended secret separation is shown below:

| Secret | Store in | Browser-visible? |
|---|---|---:|
| `CLOUDFLARE_API_TOKEN` | GitHub Actions secret | No |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions secret | No |
| AI provider credentials | Cloudflare Worker secrets | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Cloudflare Worker secret only | No |
| `SUPABASE_ANON_KEY` | Worker secret or public publishable configuration | Publishable key only |
| Supabase URL | Public configuration is acceptable | Yes |
| SMTP, database password, JWT/signing secrets | Supabase/Cloudflare secret management | No |

Rotate any credential that has ever been committed, printed in CI output, included in an artifact, or shipped in a browser bundle. Deleting it from the current branch does not revoke it.

## Database exposure boundary

Do not connect the browser or public Worker to a database port, PostgreSQL port, database password, or Supabase service-role endpoint. Browser database access is limited to Supabase’s HTTPS Auth/PostgREST endpoint with the publishable key and an authenticated user session. Enable RLS on every user-owned table and apply `supabase/migrations/20260820_ownership_rls.sql` before production use.

For Supabase network controls, restrict database connections to the Supabase-managed private/network boundary or approved administrative IPs where the selected plan supports it. Do not expose PostgreSQL directly through a firewall rule or public VM. The service-role key is used only by the Worker for server-controlled writes after the bearer token has been verified, and it must not be accepted from request headers or request bodies.

## Security logging

The Worker emits JSON records with `type: poly_pmna_security_event`. Logs intentionally exclude authorization headers, cookies, passwords, API keys, prompts, request bodies, and email addresses. Events include authentication success/failure, authentication service errors, blocked origins, HTTPS violations, oversized requests, rate-limit blocks, API/provider failures, and database-write errors. Cloudflare Workers Logs or Logpush must be enabled for the production Worker, with retention and access limited to the operational security team.

At minimum, create alerts for repeated `authentication_failed` events, sustained `rate_limit_blocked` events, `origin_blocked` or `https_violation` events, repeated `database_write_error` events, and elevated `api_error` or `api_provider_error` rates. Correlate events using the Cloudflare Ray ID, route, timestamp, status, and severity. Do not build alerts from raw IP addresses or store more personal data than needed for abuse detection.

Useful operational commands include:

```bash
cd workers/ask-poly-ai
npx wrangler tail --format json
npx wrangler secret list
npx wrangler deployments list
```

The first command is for live incident investigation and should be run only by an authorized operator. The second confirms secret names without printing values. The third verifies that the hardened Worker module, rather than an unintended asset-only deployment, is serving production traffic.

## Release gates

Before release, verify that the site responds with HTTPS and HSTS, HTTP redirects to HTTPS, the Worker rejects non-HTTPS production requests, no privileged secret names or values occur in frontend assets, RLS policies are applied, Worker secrets are present, and structured security events appear in the logging backend. The application should fail closed when required runtime credentials are absent instead of falling back to public or client-provided credentials.

## Abuse protection and automated traffic

The Worker now applies layered controls before expensive work. Ask POLY requests use the existing distributed per-client limiter, daily quiz submissions and mock-exam evaluations use the exam limiter, image-generation intents use a dedicated distributed limit of two requests per minute plus a local ten-minute budget and burst limiter, and obvious automation user agents are rejected at the edge. Blocked events are emitted as structured security logs.

The browser authentication module applies five-failure/fifteen-minute login backoff and three-failure/thirty-minute account-creation backoff. These client controls improve abuse resistance but are not authoritative because an attacker can bypass JavaScript. Supabase Auth rate limits, email abuse limits, CAPTCHA or equivalent challenge controls must be enabled in the production project for login, signup, password reset, and verification email flows.

Cloudflare WAF or Turnstile should be configured for the public API routes when abuse exceeds the Worker limits. Recommended rules challenge or block repeated requests based on rate, bot score, ASN/region anomalies, and missing or suspicious browser signals, while allowing the production site origin and the Android app’s approved API path. Do not rely on a user-agent block as the sole bot defense because user agents are trivial to spoof.

| Surface | Current repository control | Required platform control |
|---|---|---|
| Login | Client five-failure/fifteen-minute backoff and generic errors | Supabase Auth rate limits plus CAPTCHA/abuse protection |
| Account creation | Client three-failure/thirty-minute backoff | Supabase signup/email quotas, CAPTCHA, and production SMTP limits |
| Ask POLY API | Distributed request limiter, local fallback limiter, origin allowlist, request-size cap | Cloudflare WAF/Bot Management or Turnstile for distributed automation |
| Daily quiz grading | Distributed exam limiter, request-size cap | WAF rules and alerting for repeated automated submissions |
| Mock-exam evaluation | Authentication required, per-user distributed limiter, request-size cap | WAF rules and alerting for credential stuffing or token abuse |
| Image generation | Dedicated distributed two-per-ten-minute limit plus local limiter | Stronger challenge or authenticated quota if image generation is exposed publicly |
| Scraping | Obvious automation user-agent rejection and rate logs | Cloudflare bot controls, WAF rate rules, and robots policy; never treat robots.txt as access control |

Limits must be tuned from legitimate traffic metrics. A blocked request should receive a generic response and must not reveal remaining quota, account existence, or internal rate-limit keys.

## Credential-audit finding: Firebase web API key

The repository previously contained a Firebase web API key in `assets/js/help-comments.js`. It has been removed from the current frontend bundle, and the client-side Identity Toolkit account-creation path is disabled until a protected server endpoint is deployed. Public comment reads remain available through the Firestore HTTPS endpoint.

Because the key exists in repository history, it must be considered exposed. Rotate or revoke it in Google/Firebase Console and apply API restrictions limited to the required Firebase services and approved origins. If historical secret removal is required by policy, rewrite repository history with an approved secret-removal procedure and force-update all downstream clones after rotation; deleting the value from the latest commit alone does not remove historical exposure.

A server-side comments proxy should use the rotated value from a Cloudflare Worker secret or another server-only environment variable. It must authenticate the user, validate ownership on updates/deletes, and never return the Firebase key to the browser.

## Final release gate

The Worker deployment workflow now blocks deployment unless the repository secret scanner passes, the local non-destructive API security probe suite passes, production dependency audit reports no high-severity vulnerabilities, all Worker tests pass, the secure module entrypoint is configured, the ownership migration is present, and all distributed rate-limit bindings—including image generation—are declared. After deployment and secret synchronization, the workflow verifies the live health route, performs a safe Ask POLY smoke test, confirms unauthenticated mock-exam rejection, checks malformed Ask JSON rejection, and checks malformed daily-quiz rejection.

The release gate cannot rotate a credential that already exists in Google/Firebase history or change Supabase and Cloudflare dashboard settings. Those actions remain explicit production sign-off tasks: rotate the historical Firebase key, apply the ownership migration, enable Supabase Auth abuse controls, configure Cloudflare WAF/Bot Management or Turnstile, enable Workers Logs/Logpush and alerts, and confirm database network restrictions.
