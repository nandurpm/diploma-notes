(() => {
  "use strict";

  const path = window.location.pathname || "/";
  const isLessonPage = /\/(?:revision-2026-content\/)?lessons\/lessons-[^/]+\.html$/i.test(path);

  function updateYears() {
    document.querySelectorAll("[data-year], #year").forEach(node => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function ensureSiteShell() {
    if (isLessonPage || window.PolySiteShell) {
      window.PolySiteShell?.render();
      return;
    }

    const existing = [...document.scripts].find(script => {
      try {
        return new URL(script.src || "", window.location.href).pathname === "/assets/js/site-shell.js";
      } catch (_) {
        return false;
      }
    });

    if (existing) {
      existing.addEventListener("load", () => window.PolySiteShell?.render(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/assets/js/site-shell.js?v=20260717-fixed-header-restore1";
    script.defer = true;
    script.addEventListener("load", () => window.PolySiteShell?.render(), { once: true });
    document.head.append(script);
  }

  function normalizeLegacyInternalLinks() {
    document.querySelectorAll('a[href="/index.html"], a[href="../index.html"]').forEach(link => {
      link.setAttribute("href", "/");
    });
  }

  function init() {
    updateYears();
    normalizeLegacyInternalLinks();
    ensureSiteShell();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
