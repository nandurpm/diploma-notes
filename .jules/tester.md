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

## 2026-07-30 - Eliminating Deterministic Solver Coverage Gaps

**Scenario:** Testing complex mathematical logic flows (such as simultaneous linear equation solving, quadratic complex roots, multi-term calculus differentiation/integration, and shape circumference/area rules) inside deterministic local solvers.

**Learning:** Complex math parsing and coordinate math helpers contain subtle edge cases (e.g., parallel/dependent linear systems, repeated roots, complex conjugates, and non-x constants) that can fail silently if not protected. Even if an AI provider acts as a fallback, local deterministic solvers must be fully covered by direct unit tests to ensure high-accuracy responses without expensive API round-trips.

**Action:** Always identify deterministic parsing/calculation helpers and aggressively write unit tests covering standard inputs, complex coordinate/algebra solutions, boundary/null values (like zero coefficients), and all conditional branches.

## 2026-07-31 - Deterministic Rate Limiter Eviction & Pruning Validation

**Scenario:** Verifying rate-limiting map-pruning routines that automatically evict expired entries to prevent memory exhaustion when active entries exceed maximum limits.

**Learning:** Rate-limiting components that utilize internal Map objects for storage are susceptible to memory leaks if old or inactive keys are never purged. Validating this eviction behavior under high load is challenging using real-time delays, but mock-time stubbing allows for highly deterministic assertion of both the eviction trigger and the preservation of non-expired entries in the collection.

**Action:** Always test cache-eviction, map-pruning, and collection-cleanup routines by stubbing global time references (such as `Date.now()`) to simulate multi-minute or multi-hour time increments deterministically, ensuring eviction occurs exactly at specified thresholds and retains expected active elements.
