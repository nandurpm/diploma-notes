(() => {
  "use strict";

  // Disabled for stability. The previous Ask POLY loader caused page hangs on
  // Revision 2021 department pages because many HTML files still referenced an
  // old cached loader query string. Keep this file as a safe no-op so any old
  // page reference cannot lock the browser main thread.
  window.POLY_DISABLE_ASSISTANT = true;
  document.getElementById("polySiteAssistant")?.remove();
  document.querySelectorAll(".poly-ai-button,.poly-visitor-popup").forEach((element) => element.remove());
})();
