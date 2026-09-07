## 2026-03-31 - Directory Search Toolbar Accessibility & Keyboard Parity

**Learning:** Search toolbars with dynamic live result counters (e.g., `#programmeResultCount`) benefit significantly when explicitly connected to the `<input>` element using `aria-describedby`, ensuring screen readers announce filtered result count changes seamlessly. Additionally, supporting the `Escape` key to clear non-empty search fields provides an intuitive keyboard shortcut that aligns search inputs across all directory pages.

**Action:** When working on search or filter toolbars, ensure `aria-describedby` links to the result counter and `Escape` key handling is present to maintain consistent accessibility and keyboard interaction patterns.

## 2026-09-07 - Ask POLY AI Diagram Export Buttons Accessibility

**Learning:** Interactive diagram controls rendered via JS template strings (such as SVG/PNG export buttons) need descriptive `aria-label` attributes to clarify their action to screen reader users beyond brief format abbreviations.

**Action:** Always verify that dynamic action buttons rendered in template strings include descriptive `aria-label` strings (e.g. `aria-label="Download diagram as SVG"`).
