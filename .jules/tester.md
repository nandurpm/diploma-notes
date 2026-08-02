# Tester Journal

Only record long-term testing insights here.

## 2026-07-28 - Restoring 100% Mock Exam Result Store Test Coverage

**Scenario:** Testing Cloudflare Worker backend logic responsible for saving verified exam scores to an external Supabase database.

**Learning:** Utility functions like configuration checkers (`canStoreVerifiedResults`) and record persistence helpers (`storeMockExamResult`) represent a critical bridge between frontend interactions and backend data integrity. Undocumented or untested changes to internal payload formats or request headers can cause silent database insert failures.

**Action:** Every database storage utility must be unit-tested by mocking `globalThis.fetch` to assert correct authentication headers, API keys, HTTP request method, and full validation of nested payload objects (e.g., scoring defaults, options selections, and student identity mappings).

## 2026-07-29 - Synchronizing Automation Validation and Test Baselines with Content Expansion

**Scenario:** The site layout and structural validation script fails because the baseline expectations for the number of lesson files do not match newly compiled Revision 2026 course content additions.

**Learning:** When content is expanded or directories are updated, automated quality gates and regression testing scripts must have their hardcoded baselines and count constraints updated simultaneously. Desynchronized constraints will trigger false negatives, breaking build workflows and continuous integration loops.

**Action:** When adding or modifying course modules or files in a content-driven repository, immediately run and verify local validation scripts (`tools/validate_site_structure.py`), and synchronize all expected resource counts, baseline assertions, and sitemap generation records.
## 2026-07-29 - Maintaining Exact Structural Validation Baselines for Growing Curriculum

**Scenario:** Validating high-risk site structure and content files when new curriculum semesters or lesson modules are introduced.

**Learning:** Hardcoded exact-match assertions on total file or directory counts in test and validation suites create artificial build breaks when contents are legitimately added (e.g., going from 29 to 32 lesson files).

**Action:** Ensure structural validation suites are kept in lockstep with codebase milestones or designed to use flexible bounds (such as minimum baseline ranges) unless strict exact equality is absolutely necessary for regression protection.

## 2026-07-30 - Resolving Indentation and Syntax Anomalies in Local Quality Gate Runner Logic

**Scenario:** Running local quality gates or pre-deployment test suites on newly introduced or modified content files.

**Learning:** Syntactic anomalies (such as misaligned Python indentation) or duplicate markup block insertions in dynamic content templates can quietly bypass compiler checks but trigger fatal exceptions during full-tree XML/HTML schema validations or CI quality gate steps.

**Action:** Regularly audit the internal syntax of quality gate runners, assert schema uniqueness in generated HTML metadata, and verify that HTML-normalizer scripts do not duplicate structure blocks.

## 2026-07-31 - Avoiding Masked Test Gaps and False Passes in Regex-Validated Auth Flows

**Scenario:** Testing downstream user-identity/session validation handlers when early token format validation (such as `JWT_REGEX`) is introduced or tightened in production.

**Learning:** When input validation regexes (like JWT formats) are introduced into production code, pre-existing unit tests that mock external downstream service requests (e.g. Supabase auth user fetch) with generic test strings (e.g., `test-token` or `invalid-token`) will unexpectedly fail early during validation. Even worse, some tests designed to verify downstream service errors (such as non-UUID response rejections) can produce "false passes" (masked coverage) because they throw the expected error status early due to the format regex validation, completely bypassing the downstream logic and mock fetch assertions they were intended to verify.

**Action:** Ensure mock inputs and headers in testing suites are updated to satisfy format requirements (e.g. using `mock.jwt.token` containing standard header.payload.signature structure) so that tests actually execute their target downstream code paths. Add specific, dedicated unit tests to test the format validation independently.
