# Tester Journal

Only record long-term testing insights here.

## 2026-07-28 - Restoring 100% Mock Exam Result Store Test Coverage

**Scenario:** Testing Cloudflare Worker backend logic responsible for saving verified exam scores to an external Supabase database.

**Learning:** Utility functions like configuration checkers (`canStoreVerifiedResults`) and record persistence helpers (`storeMockExamResult`) represent a critical bridge between frontend interactions and backend data integrity. Undocumented or untested changes to internal payload formats or request headers can cause silent database insert failures.

**Action:** Every database storage utility must be unit-tested by mocking `globalThis.fetch` to assert correct authentication headers, API keys, HTTP request method, and full validation of nested payload objects (e.g., scoring defaults, options selections, and student identity mappings).

## 2026-07-29 - Maintaining Exact Structural Validation Baselines for Growing Curriculum

**Scenario:** Validating high-risk site structure and content files when new curriculum semesters or lesson modules are introduced.

**Learning:** Hardcoded exact-match assertions on total file or directory counts in test and validation suites create artificial build breaks when contents are legitimately added (e.g., going from 29 to 32 lesson files).

**Action:** Ensure structural validation suites are kept in lockstep with codebase milestones or designed to use flexible bounds (such as minimum baseline ranges) unless strict exact equality is absolutely necessary for regression protection.
