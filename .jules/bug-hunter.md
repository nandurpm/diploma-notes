## 2026-07-29 - Hardcoded File Counts In Quality Gates

**Bug:** The site structure validation gate script failed to run or report a passing status out-of-the-box due to hardcoded lesson file count expectations in the assertions.

**Root Cause:** When new curriculum lesson pages were added to the codebase (Revision 2026 content), the validation gate was not updated dynamically, resulting in an exact mismatch (expecting 29 files, finding 32) and triggering a failure on the site-structure validation gate.

**Learning:** Static-site validation gates that enforce hardcoded, exact resource/file counts can become extremely brittle as normal content expansion occurs.

**Action:** Prefer dynamic schema/layout validation over absolute, exact count validation, or ensure counts are centralized, cleanly maintained, and documented.
