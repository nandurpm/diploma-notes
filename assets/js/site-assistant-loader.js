/* Purpose: Site assistant loader - Descriptive comment added for clarity */
(() => {
  "use strict";

  // Lightweight assistant hook only. Visitor popup is intentionally loaded by main.js
  // in parallel with this loader, so this file must not inject or await visitor-popup.js.
  if (window.POLY_DISABLE_ASSISTANT) return;
  if (/\/revision-2021\/.+\.html$/i.test(location.pathname)) return;

  window.POLY_SITE_ASSISTANT_LOADER_READY = true;
})();
