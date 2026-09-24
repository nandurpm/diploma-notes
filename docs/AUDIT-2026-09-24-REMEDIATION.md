# 24 September 2026 audit remediation

Base examined: main at 5f5ac72 (newer than the report's 7b9ac6d).
Changes are proposed for review; this document does not claim production deployment.

## Verified production correction

A live `curl -I https://polypmna.dpdns.org/` returned Cloudflare in front of GitHub
Pages, with enforced CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy and
Permissions-Policy. H1's claim that these headers are absent is not correct.
The live CSP already uses `ask-poly-ai.nandakumarkdpm.workers.dev`; `_headers`
contained the typo. The live policy differs from `_headers`, notably omitting
raw.githubusercontent.com, api.polypmna.dpdns.org and Supabase image storage.
Cloudflare rules must be reconciled separately; GitHub Pages ignores `_headers`.
Do not disable or weaken the existing production CSP to ship this PR.

## Implemented

- H3: protect literal code and generated links from emphasis replacements;
  preserve engineering variable underscores; test HTML injection and placeholders.
- H2: correct the repository worker hostname. Public builds externalize executable
  inline scripts and static event attributes into content-addressed JavaScript.
  JSON-LD stays inline. Code is emitted in original execution order; handlers use
  addEventListener, preserve `this`, and prevent default when returning false.
- M1: versioned public-resource cache; immediate activation; network-first public
  pages; stale-while-revalidate assets across `?v=` changes; bounded eviction.
  Exclude APIs, auth/account/admin pages, queried navigation, POSTs and private or
  no-store responses. Delete only this application's old cache names.
- M2: unique full-timestamp migration names. Both review migrations are retained:
  the later version changes owner authorization and introduces additional RPCs.
- M3: new SECURITY INVOKER role-protection migration permits postgres/service_role
  before requiring auth.uid. Never add a current_user bypass to the old SECURITY
  DEFINER implementation: its current_user is the function owner.
- M4: remove stale root Wrangler config, correct deployment path filter, remove
  spoofable X-Forwarded-For identity, redact OpenAI `sk-...` keys, and fail closed
  in production when distributed rate-limit bindings are unavailable.
- M5: remove v3.4/v3.5 APKs and served patch; exclude future .patch files from builds.
- M6: resolve and pin all tagged action references to upstream commit SHAs. Use
  read-only workflow defaults and explicit publishing-job grants where applicable.
  Upload configured Worker secrets through the existing protected JSON bundle,
  using environment values rather than interpolating secrets into shell code.
- Accessibility/CSS: repair 39 pages' control names, the malformed search-results
  element and missing search input, and 128 missing main landmarks (one uses an
  existing container with role=main). Remove invalid CSS, add 100dvh fallbacks and
  reduced-motion handling. Strip Word bullet characters from metadata at source
  and build time. Load seasonal controllers only in their IST date windows.

## Database rollout: inspect history before pushing

Renaming files does not rename rows already stored in
`supabase_migrations.schema_migrations`. Do not run db push against an existing
project until the applied statements have been compared with the mapping below.
Do not blindly mark all files applied: a duplicate old version may represent
only one of its statements. Back up and inspect the remote migration history;
use the CLI's documented migration repair command only for versions whose SQL
has actually been applied. Fresh databases use the unique ordered files directly.

| Old prefix and name | New version |
| --- | --- |
| 20260820 ownership_rls | 20260820000000 |
| 20260916 add_blog_publishing | 20260916000000 |
| 20260916 blog_contributor_review_workflow | 20260916010000 |
| 20260916 extend_blog_editor_options | 20260916020000 |
| 20260917 blog_contributor_review_workflow | 20260917000000 |
| 20260917 protect_profile_role_from_self_promotion | 20260917010000 |
| 20260918 harden_blog_function_execute_privileges | 20260918000000 |

Role protection is tested in an isolated PGlite PostgreSQL engine:

```sh
npm ci --prefix tests/database
npm test --prefix tests/database
```

It covers authenticated student inserts/updates, owner edits, SQL admin edits,
service-role edits and anonymous rejection. No live Supabase changes were made.

## Remaining and intentionally not claimed fixed

- Reconcile live Cloudflare header/cache rules with the deployment configuration;
  test with Report-Only in a staging environment before any new enforcement.
- Confirm the custom API domain and provider health with authorized credentials
  before disabling workers.dev or changing the provider/model fallback list.
  Cloudflare rate limits are not a substitute for a site-specific WAF/Turnstile
  policy; CORS is not authentication.
- The source HTML still contains legacy inline code; public build output is
  externalized. Publish through the public-build workflow, not raw source files.
  Validate key calculators, search, print and auth flows in staging before merge.
- Comprehensive CSS cascade consolidation (important flags, z-index, breakpoints,
  duplicate selectors and hotfix removal) needs page-by-page visual comparison.
  Mechanical deletion would change specificity and risk layout regressions.
- Heading hierarchy, remaining small fonts, long metadata, duplicate SEO titles,
  large lessons, obsolete center tags, HTTP links, image-loading markup, a proper
  maskable icon and optional Malayalam web fonts remain follow-up work.
- Reports are already excluded from production. Historical reports remain in the
  repository; no external report archive was created in this change.
- Practice quiz scores remain self-reported. This PR does not add a trusted
  leaderboard or change result access policies.
- Production deploy, database application, complete browser regression and
  archived-PDF restoration are not claimed complete by local test results.
