# SEC-1 / SEC-2 / SEC-3 — Deployment security rollout

## What changes in GitHub source

- The Cloudflare Worker and Pages workflows no longer expose privileged
  credentials to build, dependency installation, audit, and test steps through
  job-wide environment variables.
- The Ask POLY Worker deploy token is **never** sent to the Worker as
  `CLOUDFLARE_AI_API_TOKEN`. If a separately scoped REST AI credential is
  configured, its value must differ from the deploy credential.
- If no `CLOUDFLARE_AI_API_TOKEN` GitHub secret is configured, the Worker
  deploy explicitly removes the older runtime AI REST token using
  `wrangler secret bulk` with a JSON `null` entry. Merely omitting the key
  would retain the old value in Cloudflare. The `[ai]` Workers AI binding
  continues to work without an AI REST token.
- Deployment source includes a dedicated `tools/verify_security_headers.py`
  check against both the compiled `_headers` file and a live HTTPS response.

## SEC-1: production domain cutover still required

**A GitHub Pages origin does not apply Cloudflare Pages `_headers`.**
The repository's CSP, HSTS, X-Frame-Options, and Permissions-Policy settings
become authoritative only when `polypmna.dpdns.org` is served by an endpoint
that actually attaches the headers (e.g., Cloudflare Pages with `_headers`,
or a Cloudflare Worker/reverse proxy with equivalent headers).

1. Deploy the Cloudflare Pages mirror `diploma-notes` and verify that
   `https://diploma-notes.pages.dev/` serves correct content and response
   headers. Run
   `python tools/verify_security_headers.py --url https://diploma-notes.pages.dev/`.
2. Back up current GitHub Pages custom-domain and DNS records. In Cloudflare
   Pages, add `polypmna.dpdns.org` under **Custom domains** and complete the
   platform's ownership and TLS verification. Follow the DNS target shown by
   Cloudflare rather than guessing a record.
3. Switch the domain to the verified Cloudflare Pages deployment by updating
   authoritative DNS. Remove conflicting GitHub Pages custom-domain settings
   once the Cloudflare cutover is ready; preserve the rollback plan.
4. Verify certificate, redirects, the homepage, `daily-quiz.html`, and
   `reset-password.html`. Then run:

   ```bash
   python tools/verify_security_headers.py --url https://polypmna.dpdns.org/
   ```

5. After production verification succeeds, set the GitHub Actions repository
   variable `ENFORCE_PRODUCTION_SECURITY_HEADERS=true`. Future static-site
   deployment diagnostics will then fail on missing headers. Until then they
   emit a prominent SEC-1 warning instead of disrupting GitHub Pages publishing.

**Do not claim SEC-1 closed** until a live HTTPS check passes. A successful
GitHub commit or `_headers` copy alone cannot enforce HSTS or CSP on a GitHub
Pages response. Avoid HSTS preloading until every required subdomain is
HTTPS-capable and the domain's long-term HTTPS plan is confirmed.

## SEC-2 / SEC-3: credential rollout

1. Review the GitHub Actions secrets. Use a minimally scoped
   `CLOUDFLARE_API_TOKEN` **only for deployment**. If REST-based Workers AI is
   needed, set a separate `CLOUDFLARE_AI_API_TOKEN` with Workers AI invocation
   permissions; otherwise leave it unset and rely on the `[ai]` binding.
2. Review existing Cloudflare Worker secrets. The updated deployment will
   replace the AI token with the dedicated value or explicitly delete it when
   unset; the upload step must succeed before promotion.
3. Rotate the **old deployment API token** if it was previously copied into a
   Worker runtime secret. Update GitHub's deployment secret accordingly.
   Changing a YAML fallback does not revoke a credential that remains valid.
4. Run `npm test --prefix workers/ask-poly-ai`, secret scan, and the
   Actions checks on the draft PR. Confirm the upload and post-upload promotion
   still work with least-privileged credentials.
5. Verify the live Worker health checks, Ask POLY, mock exams, daily quizzes,
   and Firebase comments after deployment. Use
   `wrangler secret list` to inspect **names only**, not values.

The GitHub PR does not apply DNS changes, rotate Cloudflare API tokens, or
perform a production deployment. These require the owner's explicit
Cloudflare / DNS administration.
