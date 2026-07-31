# Reviewer Journal

## 2026-07-28 - Regex Word Boundary Stop Words In Parsers

**Learning:** When writing lightweight deterministic/heuristic parsers (such as local math-expression or algebraic equation solvers), using overly aggressive regex word boundaries (`\b`) to strip query/helper words (like stop words) can inadvertently match and strip out single-character mathematical variables (like `x` or `y`) if they happen to have word boundaries on both sides (e.g. `x = 5` or `x^2 - 4 = 0`). This alters the expression structure, leading to unhandled parser exceptions and broken fallback paths.

**Action:** Never include actual parser identifiers or variable names as stop words in generic word-boundary replacement patterns. Keep natural language cleaning patterns completely isolated from mathematical variables, and always verify that sanitization logic does not mutate the program/expression syntax.

## 2026-07-29 - Hardcoded File Counts In Quality Gates

**Learning:** In static-site or asset-heavy repositories, hardcoding exact file counts (e.g. asserting that there are exactly 27 lesson files) in site-structure validation gates introduces brittleness. Normal content updates (such as generating a new lesson page) will inadvertently break these quality gates, requiring manual updates to test scripts and causing build/validation failures.

**Action:** Prefer dynamic schema/layout validation (verifying that every lesson file is valid and compliant) over absolute count validation. When absolute counts are absolutely necessary for regression prevention, ensure they are centralized, clearly labeled, and easily maintainable.

## 2026-07-30 - Defensive Runtime Delegation and Self-Contained Fallbacks

**Learning:** Highly optimized public-facing pages (such as index.html, tools.html, and revision browsers) often exclude larger centralized utilities like `poly-utils.js` to minimize page weight and network overhead. In such architectures, individual client-side scripts must remain self-contained and avoid throwing runtime exceptions by using defensive conditional checks (delegating to `window.PolyUtils` APIs if present, with reliable local fallbacks if absent).

**Action:** When refactoring duplicate helper functions across highly optimized static pages, always inspect the HTML layout's imported script tags first to confirm dependency availability. Use dynamic delegation with robust local fallbacks rather than assuming global namespaces are always present.
