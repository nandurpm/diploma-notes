# Deployment Notes

- Repository default branch: `main`.
- Expected public source: repository root on `main`.
- Production domain must remain `https://polypmna.dpdns.org/`; `CNAME` contains `polypmna.dpdns.org`.
- Static hosting must publish the repository root, not a stale build folder.
- `_redirects` and `_headers` are repository-controlled and should be honored by Cloudflare Pages or compatible static hosting.
- `build-info.json` is committed as a fallback and should be regenerated during deployment with `python tools/write_build_info.py`.
- The deployment environment should expose either `CF_PAGES_COMMIT_SHA` / `CF_PAGES_BRANCH` or `GITHUB_SHA` / `GITHUB_REF_NAME` so `build-info.json` can reflect the deployed commit.
- The post-deploy workflow checks `https://polypmna.dpdns.org/build-info.json` against the intended `main` commit after pushes to `main`.

Manual hosting items that cannot be changed from this repository:

- Confirm Cloudflare Pages/GitHub hosting uses `main` as the production branch.
- Confirm the publish directory is `/` (repository root).
- If Cloudflare Pages is used, set the build command to `python tools/write_build_info.py` or an equivalent command before publishing root files.
- Confirm redirects and headers files are enabled by the hosting provider.
- Deploy Firebase rules with the Firebase CLI or Firebase Console after review.
- App Check, Turnstile, moderation workflow, and any Firestore indexes must be enabled/configured in Firebase or Cloudflare dashboards.

Current production verification result from `python tools/production_url_audit.py`:

- Sitemap URLs checked: 73.
- HTTP failures: 0.
- Production `build-info.json`: 404 before this branch is deployed.
