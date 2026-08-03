## 2026-07-28 - Unified Timezone and Date-Key Formatting

**Learning:** Duplicate definitions of low-level timezone conversions and date key formatters (e.g., `Intl.DateTimeFormat` or custom system date string concatenation) lead to maintainability issues and potential alignment bugs across different client browsers. Centralizing standard formatting utilities under a shared namespace (like `PolyUtils`) simplifies code, encourages reuse, and enforces consistent date-key representations.

**Action:** Extract common date and timezone string manipulations into standard helpers like `PolyUtils.formatDateKey(date, timeZone)`, call them with defensive local browser fallbacks, and reuse them across all state-management and calendar-dependent modules.

## 2026-07-29 - Consolidated HTML Escaping via Centralized Namespace

**Learning:** Maintaining duplicate implementations of standard HTML escaping (`esc`/`escapeHtml`) across several page-specific scripts increases code redundancy and elevates the risk of inconsistent character-encoding rules. Integrating a centralized escaping function under `window.PolyUtils` allows multiple consumer modules to reuse a validated, highly cohesive implementation while retaining simple local fallbacks for zero-risk backward compatibility.

**Action:** Consolidate redundant local HTML-escaping utilities by delegating to `window.PolyUtils.escapeHtml` with fallback blocks, promoting cohesion and simplifying long-term client-side maintenance.

## 2026-07-30 - Comprehensive Client-Side Escape Consolidation and Tooling Alignments

**Learning:** Incrementally scaling a validated architectural pattern (centralized namespace utility delegation) across remaining edge-case client scripts eliminates final pockets of technical debt and guarantees standardized security behavior across the entire web application. Simultaneously, aligning developer test suites with revised lesson baselines removes duplicate logic and resolves tooling-verification discrepancies.

**Action:** Scale the delegation to `window.PolyUtils.escapeHtml` to older and RAG-specific modules (`materials-2015.js`, `ask-poly-upgrade.js`, `ask-poly-remote.js`, `daily-quiz-utils.js`), while updating baseline structure checks in validation scripts to preserve perfect site-quality gate compliance.

## 2026-08-01 - Defensive Centralized Timezone and Date-Key Formatting Delegation

**Learning:** Redundant implementation of timezone queries and date formatting across specialized browser modules (`daily-important-day-fallback-fix.js`, `visitor-popup.js`, `onam-render-a.js`) creates silent overhead and increases codebase entropy. Defensive delegation to centralized shared namespaces (`window.PolyUtils` or `window.DiplomaImportantDays`) with lightweight local fallbacks provides optimal reusability and execution safety.

**Action:** Implement layered timezone query delegation to `window.PolyUtils.formatDateKey` and `window.DiplomaImportantDays.getIndiaDateKey` at the entry point of page-specific modules while maintaining fallback blocks for independent, zero-dependency script execution.
