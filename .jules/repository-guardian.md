# Repository Guardian Journal

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
