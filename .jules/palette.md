## 2026-03-31 - Directory Search Toolbar Accessibility & Keyboard Parity

**Learning:** Search toolbars with dynamic live result counters (e.g., `#programmeResultCount`) benefit significantly when explicitly connected to the `<input>` element using `aria-describedby`, ensuring screen readers announce filtered result count changes seamlessly. Additionally, supporting the `Escape` key to clear non-empty search fields provides an intuitive keyboard shortcut that aligns search inputs across all directory pages.

**Action:** When working on search or filter toolbars, ensure `aria-describedby` links to the result counter and `Escape` key handling is present to maintain consistent accessibility and keyboard interaction patterns.

## 2026-04-01 - Engineering Handbook Floating Buttons & In-Page Search UX

**Learning:** Floating navigation controls (e.g. back-to-top buttons like `#hbToTop`) using unicode symbol characters (`↑`) must carry explicit `aria-label` and `type="button"` attributes to be properly announced by screen readers and prevent default form behavior. Adding `Escape` key event listeners on in-page document search controls enables fast filtering cancellation without requiring manual backspacing or mouse interaction.

**Action:** Ensure all floating or icon-only controls generated in JS template literals include `aria-label` and `type="button"`, and verify search fields support `Escape` key clearing across custom renderers.

## 2026-04-02 - Paginated Long List Viewport Reset & Screen Reader Page Context

**Learning:** In paginated long lists (such as 100 items per page in the PDF Library browser), changing pages without adjusting the scroll position leaves mobile users stranded at the bottom of the page after clicking pagination controls. Programmatically scrolling the list top (`files.scrollIntoView({ behavior: 'smooth', block: 'start' })`) into view upon page change restores visual orientation, while including the page number in live status regions (`Page X of Y`) ensures screen readers announce navigation transitions clearly.

**Action:** When implementing pagination on long data lists, combine smooth scroll resetting to the top of the list container with dynamic page-number updates in `aria-live` status elements.
