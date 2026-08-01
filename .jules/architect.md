## 2026-07-28 - Unified Timezone and Date-Key Formatting

**Learning:** Duplicate definitions of low-level timezone conversions and date key formatters (e.g., `Intl.DateTimeFormat` or custom system date string concatenation) lead to maintainability issues and potential alignment bugs across different client browsers. Centralizing standard formatting utilities under a shared namespace (like `PolyUtils`) simplifies code, encourages reuse, and enforces consistent date-key representations.

**Action:** Extract common date and timezone string manipulations into standard helpers like `PolyUtils.formatDateKey(date, timeZone)`, call them with defensive local browser fallbacks, and reuse them across all state-management and calendar-dependent modules.

## 2026-07-29 - Consolidated HTML Escaping via Centralized Namespace

**Learning:** Maintaining duplicate implementations of standard HTML escaping (`esc`/`escapeHtml`) across several page-specific scripts increases code redundancy and elevates the risk of inconsistent character-encoding rules. Integrating a centralized escaping function under `window.PolyUtils` allows multiple consumer modules to reuse a validated, highly cohesive implementation while retaining simple local fallbacks for zero-risk backward compatibility.

**Action:** Consolidate redundant local HTML-escaping utilities by delegating to `window.PolyUtils.escapeHtml` with fallback blocks, promoting cohesion and simplifying long-term client-side maintenance.

## 2026-07-30 - Comprehensive Client-Side Escape Consolidation and Tooling Alignments

**Learning:** Incrementally scaling a validated architectural pattern (centralized namespace utility delegation) across remaining edge-case client scripts eliminates final pockets of technical debt and guarantees standardized security behavior across the entire web application. Simultaneously, aligning developer test suites with revised lesson baselines removes duplicate logic and resolves tooling-verification discrepancies.

**Action:** Scale the delegation to `window.PolyUtils.escapeHtml` to older and RAG-specific modules (`materials-2015.js`, `ask-poly-upgrade.js`, `ask-poly-remote.js`, `daily-quiz-utils.js`), while updating baseline structure checks in validation scripts to preserve perfect site-quality gate compliance.
