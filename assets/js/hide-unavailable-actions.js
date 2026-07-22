/* Purpose: Hide unavailable actions - Descriptive comment added for clarity */
(() => {
  "use strict";

  function clean(root = document) {
    root.querySelectorAll(".availability-label").forEach((element) => element.remove());
  }

  clean();
  document.addEventListener("DOMContentLoaded", () => clean(), { once: true });

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) clean(node);
      });
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
