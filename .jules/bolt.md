## 2026-08-16 - Pre-computing Normalized Search Keys and Input Debouncing
**Learning:** Performing string concatenation and `toLocaleLowerCase()` inside search filter loops during active keypress events causes avoidable garbage collection overhead and CPU spikes on mobile devices.
**Action:** Pre-compute and cache a `_searchText` field when data loads and debounce input event handlers (100–120ms) on filter inputs to keep mobile scrolling and typing responsive.
