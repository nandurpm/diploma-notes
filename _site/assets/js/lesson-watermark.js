/*
 * POLY PMNA — Lesson Watermark Component
 * Shared JS for the watermark overlay loaded on all lesson pages.
 *
 * Accessibility & performance guarantees:
 *   - Never blocks text content
 *   - Never intercepts clicks (pointer-events: none)
 *   - Never affects scrolling
 *   - Never affects text selection (user-select: none)
 *   - Never reduces readability (low opacity, z-index: 0)
 *   - GPU-accelerated (transform: translateZ(0))
 *   - Lightweight: single DOM node, no libraries
 *   - No layout shifts (fixed positioning, injected after render)
 */
(() => {
  "use strict";

  const MARKER = "data-poly-watermark";

  /* Guard: do not inject on print views or if already present */
  if (window.matchMedia && window.matchMedia("print").matches) return;
  if (document.querySelector(`[${MARKER}]`)) return;

  const overlay = document.createElement("div");
  overlay.className = "poly-watermark";
  overlay.setAttribute(MARKER, "");
  overlay.setAttribute("aria-hidden", "true");

  const inner = document.createElement("div");
  inner.className = "poly-watermark-inner";

  overlay.appendChild(inner);

  /*
   * Insert as the first child of <body> so z-index: 0 keeps it
   * behind all page content without needing high z-index values.
   */
  const insertNode = () => {
    const body = document.body;
    if (!body) return;
    body.insertBefore(overlay, body.firstChild);
  };

  /*
   * If the DOM is ready, insert immediately.
   * Otherwise wait for DOMContentLoaded.
   */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", insertNode, { once: true });
  } else {
    insertNode();
  }
})();
