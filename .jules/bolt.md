## 2026-07-23 - [Optimized SITTTR Revision 2021 Subject List Rendering]
**Learning:** Identified a major performance bottleneck where `hasLesson()` recreated and mapped the full `POLY_ASSET_MANIFEST.lessonCodes` array and performed an $O(M)$ inclusion search on *every single* subject card rendering, resulting in $O(S \times M)$ complexity. Caching the manifest array into a normalized `Set` once on load converts this into an $O(1)$ lookup. Additionally, found a redundant $O(N)$ deduplication `uniq(list)` call on the hot rendering path (invoked on every keystroke) when the underlying data source is already guaranteed to be unique.
**Action:** Always pre-compute and cache external assets or manifests into efficient lookup structures (like `Set` or `Map`) on first load instead of doing array allocation, mapping, and linear scans during render loops. Remove redundant deduplication passes from hot event paths.

## 2026-07-19 - [Optimized Department Subject Alias Rendering]
**Learning:** Found a redundant O(N) deduplication call `unique(all)` inside the user-facing `render()` loop of `assets/js/department-subject-alias-hotfix.js`. This function ran on every single keypress and dropdown filter change, causing wasteful calculations, string joins, and garbage collection on static data. Caching the deduplicated result at load time resolves the issue.
**Action:** Avoid calling deduplication, format parsing, or structural transformation functions inside input/render listeners when the underlying dataset is static. Parse once at load time instead.

## 2026-07-18 - [Optimized Homepage Subject Card Filter]
**Learning:** Found an $O(n^2)$ filtering function `array.findIndex` inside `assets/js/subject-browser.js` on the static homepage which processed 1800+ dynamically fetched elements. Replacing it with an $O(n)$ hash Set lookup reduces iterations from ~3.2 million down to just ~1800.
**Action:** Use standard hash Set/map objects for dynamic filtering logic on lists that can scale beyond 100+ elements on the client side.
