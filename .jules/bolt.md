## 2026-07-18 - [Optimized Homepage Subject Card Filter]
**Learning:** Found an $O(n^2)$ filtering function `array.findIndex` inside `assets/js/subject-browser.js` on the static homepage which processed 1800+ dynamically fetched elements. Replacing it with an $O(n)$ hash Set lookup reduces iterations from ~3.2 million down to just ~1800.
**Action:** Use standard hash Set/map objects for dynamic filtering logic on lists that can scale beyond 100+ elements on the client side.
