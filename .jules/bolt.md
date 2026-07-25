## 2026-07-24 - [Removed Redundant Deduplication inside Search-Filter Render Loop]
**Learning:** Found a redundant O(N) deduplication call `unique(list)` inside the active `render()` loop of `assets/js/subject-browser.js` which executes on every single keypress, search input, and filter change event. Since the master dataset `all` is already deduplicated once at initial load inside `getSubjects()`, this call was fully redundant and wasted CPU cycles and memory allocations.
**Action:** Remove unnecessary operations (such as deduplication or heavy map transformations) from input/filter change rendering handlers when the underlying data is already known to be clean and unique.

## 2026-07-19 - [Optimized Department Subject Alias Rendering]
**Learning:** Found a redundant O(N) deduplication call `unique(all)` inside the user-facing `render()` loop of `assets/js/department-subject-alias-hotfix.js`. This function ran on every single keypress and dropdown filter change, causing wasteful calculations, string joins, and garbage collection on static data. Caching the deduplicated result at load time resolves the issue.
**Action:** Avoid calling deduplication, format parsing, or structural transformation functions inside input/render listeners when the underlying dataset is static. Parse once at load time instead.

## 2026-07-18 - [Optimized Homepage Subject Card Filter]
**Learning:** Found an $O(n^2)$ filtering function `array.findIndex` inside `assets/js/subject-browser.js` on the static homepage which processed 1800+ dynamically fetched elements. Replacing it with an $O(n)$ hash Set lookup reduces iterations from ~3.2 million down to just ~1800.
**Action:** Use standard hash Set/map objects for dynamic filtering logic on lists that can scale beyond 100+ elements on the client side.

## 2026-07-25 - [Cached DOM Queries in Site Assistant Indexing Loop]
**Learning:** Discovered an $O(N \times M)$ DOM querying bottleneck inside `buildLessonChunks()` in `assets/js/site-assistant.js`, which runs dynamically on page interactions/mutations. For every DOM element processed (up to hundreds of elements), the script executed a full-document query selector search `document.querySelectorAll("[data-target]")` to find matching buttons. Building a lookup Map of targets before entering the loop reduces DOM querying to $O(1)$ per iteration.
**Action:** Avoid performing repetitive, document-wide DOM query selector searches (like `document.querySelectorAll`) inside loops. Query once and cache the results in a Map/object lookup.
