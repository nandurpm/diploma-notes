## 2026-07-25 - [Cached Static Mock Paper Question Bank Map]
**Learning:** Found a performance bottleneck where the mock exam evaluation API was recreating a `Map` of all questions from a static configuration `MOCK_PAPER.questions` on every single request. Although the list has only 33 entries, constructing a new `Map` on every invocation wastes CPU cycles, allocates unnecessary memory, and triggers garbage collection overhead on hot API endpoints.
**Action:** Pre-compile and cache static maps or lookup indices in the module-level scope at load time, rather than reconstructing them dynamically inside request handlers.

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

## 2026-07-26 - [Pre-computed and Cached Search Text on Page Elements]
**Learning:** Found a severe performance bottleneck where search/filtering input handlers dynamically joined multiple dataset attributes and performed heavy string operations (like Unicode normalization `normalize("NFKD")` or lowercase coercion) on every single keystroke across hundreds/thousands of elements. Pre-computing and caching the search string as an object property (`_searchText`) during initialization completely eliminates CPU-intensive operations and garbage-collection overhead on the active render loop.
**Action:** Always pre-calculate and cache static/normalized search indexes on objects/elements before entering interactive filtering or rendering loops.

## 2026-07-27 - [Cached Search Text in Revision 2021 Directory Browser]
**Learning:** Found an unoptimized search input handler in `assets/js/sitttr-rev2021-browser.js` that concatenated multiple subject attributes on every keystroke/render invocation. This caused excessive memory allocation and frequent garbage collection cycles for large datasets. Pre-computing and caching the combined string (`_searchText`) directly on each subject object at load time solves this and makes search smooth.
**Action:** Avoid performing repetitive string joins or case coercions on dataset items inside interactive render and keypress event loops. Pre-compute and cache search keys during initial loading instead.
## 2026-07-27 - [Optimized SITTTR Revision 2021 Search Render Loop]
**Learning:** Discovered a redundant and expensive $O(N)$ `uniq(list)` call inside the active `render()` loop of `sitttr-rev2021-browser.js` that was executing on every user keypress, and search input change. Combined with repetitive string joining and case coercion on subject elements, this was causing significant CPU usage and memory churn. Pre-computing `_searchText` during `init()` and removing the redundant `uniq()` call ensures a lightning-fast render response.
**Action:** Remove redundant deduplication passes from active UI render loops if the underlying data has already been uniquely loaded and cached.
