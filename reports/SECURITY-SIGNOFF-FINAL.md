# POLY PMNA Production Security Sign-Off

**Project:** `nandurpm/diploma-notes`

**Repository:** [github.com/nandurpm/diploma-notes](https://github.com/nandurpm/diploma-notes)

**Author:** **Manus AI**

**Assessment date:** 20 August 2026

**Release commit:** `f369743da61a8ae697fa1b5a0e2ac46322a0879c`

## Executive conclusion

The POLY PMNA authentication, authorization, input-validation, abuse-protection, deployment, secret-scanning, and database-ownership controls have been hardened and verified as far as the current production plans and available integrations permit. The previously blocked Ask POLY Worker deployment is now successful, the browser and CI clients use a WAF-protectable custom API hostname, the custom edge guard is active, Workers Logs observability is enabled with full head sampling, and the production Supabase owner-versus-unrelated-user checks show the expected isolation.

> **Sign-off status: PASS WITH DOCUMENTED PLAN LIMITATIONS.** No high-confidence secret was found in tracked files by the successful Secret scan workflow. The remaining items are platform-plan limitations or operational follow-ups rather than unresolved repository authorization defects.

## Verified release evidence

The final release commit passed the relevant automated gates. The Worker workflow performed source validation, dependency and test gates, secret synchronization, deployment, and live smoke tests. The custom-domain migration was then verified by the live QA and post-deployment workflows.

| Control or workflow | Run | Result |
|---|---:|---|
| Deploy Ask POLY AI Worker | [32415769161](https://github.com/nandurpm/diploma-notes/actions/runs/32415769161) | **Success** |
| Secret scan | [32415769139](https://github.com/nandurpm/diploma-notes/actions/runs/32415769139) | **Success** |
| QA live Ask POLY Worker | [32415769147](https://github.com/nandurpm/diploma-notes/actions/runs/32415769147) | **Success** |
| Post-deploy verification | [32415769136](https://github.com/nandurpm/diploma-notes/actions/runs/32415769136) | **Success** |
| Site quality gate | [32415769177](https://github.com/nandurpm/diploma-notes/actions/runs/32415769177) | **Success** |
| Static-site deployment | [32415769157](https://github.com/nandurpm/diploma-notes/actions/runs/32415769157) | **Success** |
| Local Worker regression suite | `npm test` | **71 passed, 0 failed** |
| Local API security probe suite | `node tools/api_security_probe.mjs` | **13 passed, 0 failed** |

The release gate was also corrected so it requires `api.polypmna.dpdns.org/api/ask-poly` and `api.polypmna.dpdns.org/api/evaluate-mock-exam` in the public configuration. This prevents a future deployment from silently reintroducing the bypassable `workers.dev` API hostname.

## Security controls completed

The application now enforces a minimum twelve-character password policy in the browser and Supabase Auth, verified-email requirements, generic authentication errors, session-scoped client storage, inactivity logout, refresh-token rotation, and client-side backoff for repeated login and signup failures. The Worker authenticates bearer tokens and derives the effective `user_id` from the verified token instead of accepting an owner identifier from request input.

Strict schemas now validate Ask POLY, daily-quiz, and mock-exam payloads. Unknown fields, wrong types, control characters, invalid subject codes, malformed identifiers, unsafe attachment metadata, oversized requests, and binary data URLs are rejected. Server-side mock-exam rubrics are authoritative, and the Worker’s error responses avoid exposing provider credentials, authorization material, request bodies, or internal implementation details.

Layered abuse controls are active. The Worker uses distributed per-client and exam limiters, a dedicated image-generation limiter of two requests per minute, a local ten-minute image budget and burst limiter, origin and HTTPS enforcement, request-size caps, and obvious automation-user-agent rejection. Structured security events cover authentication, origin, HTTPS, oversized-request, rate-limit, API, provider, and database-write events.

The repository includes ownership regression tests, the Supabase RLS migration, a repository secret scanner, deployment gates, live probes, hardened HTTPS redirects and headers, and documentation of the trust boundaries. The Firebase browser key was removed from the current frontend and the client-side comment write path remains disabled pending a server-side authenticated proxy.

## Worker observability and edge protection

Workers Logs is enabled in `workers/ask-poly-ai/wrangler.toml` with `enabled = true` and `head_sampling_rate = 1`. The deployed Cloudflare script settings independently returned `observability.enabled = true`, `observability.head_sampling_rate = 1`, `observability.logs.enabled = true`, `invocation_logs = true`, and `persist = true`. Cloudflare documents this Wrangler configuration as the supported way to enable Workers Logs.[1]

The production API is now attached to the custom domain `api.polypmna.dpdns.org`, and all active browser clients, release probes, QA workflows, and CSP rules use that hostname. Cloudflare recommends custom domains or Worker routes for production Workers rather than relying on a `workers.dev` hostname.[2] [3]

A zone custom firewall ruleset named **POLY PMNA API edge guard** is active. It permits only `/health`, `/api/ask-poly`, `/api/evaluate-mock-exam`, and `/api/grade-daily-quiz` on the API hostname and blocks undocumented paths. Live probes returned `200` for `/health` and `403` for `/api/unknown`, confirming the edge rule is effective without breaking the documented health route.

| Edge control | Production evidence | Status |
|---|---|---|
| Custom Worker domain | `api.polypmna.dpdns.org` attached to `ask-poly-ai` | **Active** |
| Documented-path firewall guard | Ruleset `78e39e714aa24324bd720f9e81b9310e` | **Active** |
| Workers Logs | `observability.logs.enabled = true`, invocation logs and persistence enabled | **Active** |
| Edge rate-limit rule | Existing free-zone leaked-credential rule consumes the single free rate-limit slot | **Constraint recorded** |
| Worker quota enforcement | Two requests per minute for image-generation intents plus Worker limiters | **Active** |

Cloudflare’s documented free-plan legacy rate-limiting allowance is one rule with ten-second or one-minute periods, so a second independent zone rate rule was not added; duplicating or replacing the existing leaked-credential control would have reduced protection.[4] Stronger distributed bot challenges, additional rate rules, Turnstile, and alerting remain appropriate if the account plan is upgraded or abuse metrics justify them.

## Supabase ownership-isolation validation

The production Supabase project `hwobooljdvynsajtrvnk` reports RLS enabled on `profiles`, `daily_quiz_results`, `sample_paper_attempts`, and `admin_audit_log`. The policy catalog shows owner predicates based on `auth.uid()` for profile and result reads, inserts, updates, and deletes; administrative audit-log reads require an authenticated user whose profile role is `admin`.

A non-destructive impersonation test used the existing owner UUID `35c194b6-4265-481d-addb-db55bfcb5a8f` and a synthetic unrelated UUID `00000000-0000-0000-0000-000000000001`. The owner session could see one profile row, three daily-quiz rows, and two sample-paper rows. The unrelated session saw zero rows in all three protected tables.

| Simulated authenticated session | `profiles` visible | `daily_quiz_results` visible | `sample_paper_attempts` visible | Interpretation |
|---|---:|---:|---:|---|
| Existing row owner | 1 | 3 | 2 | Owner-only visibility works |
| Unrelated synthetic user | 0 | 0 | 0 | Cross-account reads are denied |

The authenticated database role has `SELECT` access to the protected tables, but `sample_paper_attempts` has no authenticated-role insert, update, or delete privilege. A rolled-back owner-session update attempt therefore returned `permission denied for table sample_paper_attempts`, which is the intended server-only write boundary for verified mock-exam attempts. Profiles and daily-quiz writes remain protected by `WITH CHECK (user_id = auth.uid())` or equivalent owner predicates; the Worker still performs server-side ownership verification before trusted writes.

## Remaining items and explicit limitations

The Supabase security advisor reports one warning: leaked-password protection through HaveIBeenPwned is disabled. The project is on the Free plan, and this feature is unavailable without the applicable paid-plan capability. It should be enabled after an upgrade; no repository code can safely emulate the provider-side breached-password database.

| Remaining item | Current state | Next action |
|---|---|---|
| Supabase leaked-password protection | Disabled; advisor warning | Enable after the required Supabase plan upgrade |
| Supabase server-side session time-box/inactivity controls | Plan-limited | Enable after the required plan upgrade; retain current client inactivity logout and refresh-token rotation |
| Supabase CAPTCHA | Not enabled | Configure hCaptcha or Turnstile provider credentials, then enable the challenge in Supabase Auth |
| Cloudflare Logpush export | `logpush = false`; Workers Logs is enabled | Enable only if external retention/SIEM export is required; restrict destination and access |
| Cloudflare WAF rate-rule capacity | Free-zone single-rule allowance already used | Upgrade or reassess the existing rule before adding a separate API rate rule |
| Workers Logs alert policies and retention review | Logs are active and persisted | Create operational alerts for repeated auth failures, rate-limit blocks, origin blocks, database-write errors, and provider errors |
| Firebase historical key exposure | Removed from current frontend; historical exposure remains possible | Keep the deleted key revoked and complete any required historical secret-removal procedure |
| Firebase comments write path | Disabled in browser | Deploy a server-side authenticated comments proxy before re-enabling writes |

The Supabase security advisor warning is the only current automated security-advisor finding. The remaining rows above are intentionally retained as operational or plan-dependent follow-ups rather than being represented as silently fixed.

## Final sign-off

The production security boundary is materially stronger and the critical release gates are green. Authentication is verified, API ownership is enforced, input and upload validation is strict, secrets are not present in current tracked frontend assets, abuse controls are layered, the Worker deploys with observability enabled, the public API is routed through a protected custom hostname, undocumented API paths are blocked at the edge, and production RLS isolation has been directly validated with two simulated authenticated identities.

> **Final disposition:** **Approved for production with documented plan limitations and operational monitoring follow-up.**

## References

[1]: https://developers.cloudflare.com/workers/observability/logs/workers-logs/ "Cloudflare Workers Logs"
[2]: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ "Cloudflare workers.dev"
[3]: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/ "Cloudflare Worker Custom Domains"
[4]: https://developers.cloudflare.com/waf/reference/legacy/old-rate-limiting/ "Cloudflare Rate Limiting plan limits"
[5]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
