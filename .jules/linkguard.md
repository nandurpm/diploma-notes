# LinkGuard Learnings

## 2026-08-08 - Fix Model Question Papers Rendering and Caching
**Finding:** The model question papers page was completely blank on load due to `data-require-filter="true"`, and the subject-card render cache (`cachedCard`) lacked awareness of different browser `mode`s (e.g., standard vs. papers), causing incorrect cards to be cached and retrieved.
**Learning:** Pure functions that generate HTML must be cached with all distinguishing arguments (like `mode`) included in the cache key. When pages share the same dynamic search script, data-require-filter constraints should be avoided unless strictly necessary, to ensure search-engine and user-facing content renders seamlessly on load.
**Prevention:** Always use nested cache structures (e.g., Map of mode to WeakMap of subjects) for components whose layout varies dynamically based on the current page context.
