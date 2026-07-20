## 2026-07-20 - [Optimized Allowed Origins Parsing in API Worker]
**Learning:** Found that `allowedOrigins(env)` in `workers/ask-poly-ai/src/http.js` repeatedly parsed `env.ALLOWED_ORIGINS` via splitting, mapping, trimming, and filtering on every single request. This caused multiple redundant arrays and `Set` allocations per request, wasting valuable serverless CPU cycles and triggering excessive garbage collection under strict worker limits. Caching the parsed `Set` in module-level state prevents these allocations.
**Action:** Cache the results of configuration-parsing or string-processing helpers in serverless workers when their inputs are static or change infrequently.

## 2026-07-19 - [Optimized Department Subject Alias Rendering]
**Learning:** Found a redundant O(N) deduplication call `unique(all)` inside the user-facing `render()` loop of `assets/js/department-subject-alias-hotfix.js`. This function ran on every single keypress and dropdown filter change, causing wasteful calculations, string joins, and garbage collection on static data. Caching the deduplicated result at load time resolves the issue.
**Action:** Avoid calling deduplication, format parsing, or structural transformation functions inside input/render listeners when the underlying dataset is static. Parse once at load time instead.

## 2026-07-18 - [Optimized Homepage Subject Card Filter]
**Learning:** Found an $O(n^2)$ filtering function `array.findIndex` inside `assets/js/subject-browser.js` on the static homepage which processed 1800+ dynamically fetched elements. Replacing it with an $O(n)$ hash Set lookup reduces iterations from ~3.2 million down to just ~1800.
**Action:** Use standard hash Set/map objects for dynamic filtering logic on lists that can scale beyond 100+ elements on the client side.
