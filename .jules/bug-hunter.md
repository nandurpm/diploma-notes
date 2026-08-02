## 2026-07-29 - Hardcoded File Counts In Quality Gates

**Bug:** The site structure validation gate script failed to run or report a passing status out-of-the-box due to hardcoded lesson file count expectations in the assertions.

**Root Cause:** When new curriculum lesson pages were added to the codebase (Revision 2026 content), the validation gate was not updated dynamically, resulting in an exact mismatch (expecting 29 files, finding 32) and triggering a failure on the site-structure validation gate.

**Learning:** Static-site validation gates that enforce hardcoded, exact resource/file counts can become extremely brittle as normal content expansion occurs.

**Action:** Prefer dynamic schema/layout validation over absolute, exact count validation, or ensure counts are centralized, cleanly maintained, and documented.

## 2026-07-29 - Stale Sitemap Check Failures on PR Merge Builds

**Bug:** When running validation checks on GitHub Actions PR builds, the sitemap check (`tools/generate_sitemap.py --check`) failed because it flagged `sitemap.xml` as stale.

**Root Cause:** The `git_lastmod(path)` helper used `git log -1 --format=%cs` to query the latest commit date of each resource file. On PR pull requests, GitHub Actions creates a merge commit of the PR branch into `main`. Since this merge commit is the most recent commit on the touched resource files, the git log for those files returned the merge commit's date (today's date) instead of their actual original commit dates, leading to a mismatch against the committed `sitemap.xml`.

**Learning:** Querying file modification dates via `git log -1` on PR branches is susceptible to automated test environment merge commits. Adding `--no-merges` instructs `git log` to bypass the merge commit and resolve the true author commit dates.

**Action:** Always append `--no-merges` when using `git log -1` to fetch file-specific commit properties during automated CI checks.

## 2026-08-02 - Premature Test Failures due to Hardened JWT Regex Checks

**Bug:** Multiple backend authentication tests in `workers/ask-poly-ai/test/result-store.test.js` failed out-of-the-box, throwing unexpected 401 errors instead of assertions checking the intended logic (like 502/503/504).

**Root Cause:** Production code in `result-store.js` was hardened to enforce strict format checks via `JWT_REGEX` on incoming Bearer tokens. Several older tests passed dummy strings like `"test-token"` or `"invalid-token"` which failed this format pre-validation, terminating the authentication function early before reaching the mock fetch handlers.

**Learning:** When hardening validation patterns in production helper libraries, always ensure associated mock data/test cases in the unit tests are fully synchronized to pass those structural filters before checking downstream logical outcomes.

**Action:** Before debugging complex error handling or downstream fetches in tests, always verify that mock inputs successfully pass early validation filters like regex or schemas.
