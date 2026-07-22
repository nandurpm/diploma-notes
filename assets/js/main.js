/* Purpose: Main - Descriptive comment added for clarity */
(() => {
  "use strict";

  const path = window.location.pathname || "/";
  const isLessonPage = /\/(?:revision-2026-content\/)?lessons\/lessons-[^/]+\.html$/i.test(path);
  const SITTTR_BASE = "https://www.sitttrkerala.ac.in/index.php";
  const REV2026_SYLLABUS_ROUTE = "site%2Fdiploma-syllabus-course-contents";
  const REV2026_MODEL_QP_ROUTE = "site%2Fdiploma-modelqp-courses-show";

  /* Updates all elements with data-year or #year to the current year for the footer copyright */
  function updateYears() {
    document.querySelectorAll("[data-year], #year").forEach(node => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  /* Ensures the global site navigation and header (site-shell.js) is loaded and rendered */
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

  function ensureVisitorPopup() {
    if (window.POLY_DISABLE_ASSISTANT || /\/ask-poly(?:-v2)?\.html$/i.test(path)) return;

    const popupPath = "/assets/js/visitor-popup.js";
    const existing = [...document.scripts].find(script => {
      try {
        return new URL(script.src || "", window.location.href).pathname === popupPath;
      } catch (_) {
        return false;
      }
    });
    if (existing) return;

    const script = document.createElement("script");
    script.src = `${popupPath}?v=20260719-popup-loader-fix2`;
    script.defer = true;
    script.dataset.polyVisitorPopupLoader = "true";
    script.addEventListener("error", () => {
      console.error("POLY PMNA visitor popup script failed to load.");
    }, { once: true });
    document.head.append(script);
  }

  function normalizeLegacyInternalLinks() {
    document.querySelectorAll('a[href="/index.html"], a[href="../index.html"]').forEach(link => {
      link.setAttribute("href", "/");
    });
  }

  function configureOfficialLink(link, href, label, title) {
    if (!link) return;
    link.href = href;
    link.textContent = label;
    link.title = title;
    link.target = "_blank";
    link.rel = "noopener noreferrer external";
    link.removeAttribute("download");
  }

  /* Automatically points syllabus and model paper buttons to the official SITTTR Kerala website */
  function normalizeRev2026OfficialLinks(scope = document) {
    const cards = [];
    if (scope.nodeType === 1 && scope.matches?.('.subject-card[data-revision="2026"]')) cards.push(scope);
    scope.querySelectorAll?.('.subject-card[data-revision="2026"]').forEach(card => cards.push(card));

    cards.forEach(card => {
      const code = String(
        card.dataset.subjectCode || card.querySelector(".subject-top strong")?.textContent || ""
      ).trim().toUpperCase();
      if (!/^[0-9]{4}[A-Z]?$/.test(code)) return;

      const encodedCode = encodeURIComponent(code);
      configureOfficialLink(
        card.querySelector(".action.syllabus"),
        `${SITTTR_BASE}?r=${REV2026_SYLLABUS_ROUTE}&course=${encodedCode}`,
        "Open Syllabus",
        `Open the official SITTTR syllabus for Revision 2026 course ${code}.`
      );
      configureOfficialLink(
        card.querySelector(".action.qp"),
        `${SITTTR_BASE}?r=${REV2026_MODEL_QP_ROUTE}&course=${encodedCode}`,
        "Open Model Question Paper",
        `Open the official SITTTR model-question-paper page for Revision 2026 course ${code}.`
      );
    });
  }

  function watchRev2026Cards() {
    normalizeRev2026OfficialLinks(document);
    if (!document.body || isLessonPage) return;

    let timer = 0;
    new MutationObserver(mutations => {
      const relevant = mutations.some(mutation =>
        [...mutation.addedNodes].some(node =>
          node.nodeType === 1 && (
            node.matches?.('.subject-card[data-revision="2026"]') ||
            node.querySelector?.('.subject-card[data-revision="2026"]')
          )
        )
      );
      if (!relevant) return;
      clearTimeout(timer);
      timer = window.setTimeout(() => normalizeRev2026OfficialLinks(document), 50);
    }).observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    updateYears();
    normalizeLegacyInternalLinks();
    ensureSiteShell();
    ensureVisitorPopup();
    watchRev2026Cards();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();