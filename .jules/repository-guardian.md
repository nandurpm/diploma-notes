# Repository Guardian Journal

## 2026-10-29 - Orphaned One-Time Publishing Workflows After Payload Cleanup
**Finding:** `.github/workflows/publish-rev2026-detailed-handbooks-v2.yml` remained in `.github/workflows/` even though its path trigger `.rev2026-v2-trigger` and payload asset `tools/rev2026-detailed-v2-payload.xb64` were deleted after execution.
**Learning:** One-time automated publishing or migration workflows designed to clean up their own payload/trigger files on completion become orphaned and break CI path-trigger validation if the workflow definition file itself is not removed along with the payloads.
**Prevention:** When removing transient/one-time payload files or triggers, always delete or archive the associated workflow file under `.github/workflows/`.

## 2026-10-22 - Missing Middleware Dependencies and Unreferenced Path Triggers in Maintenance Workflow
**Finding:** `.github/workflows/validate-maintenance-schedule.yml` contained deleted path triggers (`functions/_middleware.js`, `reports/*.md`) and unconditionally attempted to copy `functions/_middleware.js`, which caused runtime step failures when triggered without Cloudflare Pages middleware.
**Learning:** Workflows verifying serverless middleware contracts fail abruptly if the target middleware file or reports are refactored out without corresponding file-existence guards or trigger cleanup in GitHub Actions definitions.
**Prevention:** Always check if files referenced in `paths:` triggers or `cp` / `node --check` workflow steps exist on `main`, and add defensive existence guards (`if [ -f ... ]`) for optional or refactored components.

## 2026-10-08 - Misplaced Workflow Definitions in Data Directories and Stale Path Triggers
**Finding:** An orphaned copy of `build-ask-poly-knowledge.yml` was sitting directly in `assets/data/`, alongside a non-existent path trigger `assets/data/ask-poly-extra-facts.json` in `.github/workflows/build-ask-poly-knowledge.yml`.
**Learning:** Workflows placed outside `.github/workflows/` are ignored by GitHub Actions and act as unreferenced repository noise. Similarly, stale path triggers in `.github/workflows/` referencing deleted or non-existent files create confusion when auditing workflow triggers.
**Prevention:** Regularly verify workflow files reside strictly in `.github/workflows/` and confirm all files listed under `paths:` triggers exist in the repository.

## 2026-10-01 - Absolute Paths and Unprotected Top-Level Execution in Tools
**Finding:** `tools/test_highlight.py` failed during test discovery (`python -m unittest discover -s tools`) because it referenced a hardcoded `/home/ubuntu/...` path and ran script code at the module level rather than inside an `if __name__ == "__main__":` block.
**Learning:** Utility scripts placed in testable directories like `tools/` will break automated test discovery if top-level code executes side-effects on module import or uses hardcoded environment paths.
**Prevention:** Always use `Path(__file__).resolve().parent.parent` for repository relative paths and wrap executable logic inside `if __name__ == "__main__":`.

## 2026-09-03 - Mismatched Heading Regexes in System Instruction Unit Tests
**Finding:** `workers/ask-poly-ai/test/site-instructions.test.js` failed during unit testing because the section assertion regex `/API FALLBACK HIERARCHY/` differed from the actual section heading `# 4. API FAILURE FALLBACK HIERARCHY & OFFLINE MODE` in `src/site-instructions.js`.
**Learning:** When system prompts or markdown contracts in worker source files are updated or renamed, test suite assertion regexes must be kept in sync to prevent silent CI failures.
**Prevention:** Run sub-project test suites (`npm test` in `workers/ask-poly-ai`) during repository hygiene checks to catch stale regex assertions early.

## 2026-08-20 - Unreferenced Debug Helper Scripts in Tools
**Finding:** Found `tools/debug_eq4.py`, an unreferenced temporary debug script containing hardcoded machine paths (`/home/ubuntu/...`) left over from local node testing.
**Learning:** Transient debug and diagnostic scripts can accumulate in utility folders over time if not scrubbed after issue resolution.
**Prevention:** Periodically scan `tools/` and root directories for unreferenced scripts with zero citations across workflows, code, or documentation.
