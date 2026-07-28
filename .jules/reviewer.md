# Reviewer Journal

## 2026-07-28 - Regex Word Boundary Stop Words In Parsers

**Learning:** When writing lightweight deterministic/heuristic parsers (such as local math-expression or algebraic equation solvers), using overly aggressive regex word boundaries (`\b`) to strip query/helper words (like stop words) can inadvertently match and strip out single-character mathematical variables (like `x` or `y`) if they happen to have word boundaries on both sides (e.g. `x = 5` or `x^2 - 4 = 0`). This alters the expression structure, leading to unhandled parser exceptions and broken fallback paths.

**Action:** Never include actual parser identifiers or variable names as stop words in generic word-boundary replacement patterns. Keep natural language cleaning patterns completely isolated from mathematical variables, and always verify that sanitization logic does not mutate the program/expression syntax.
