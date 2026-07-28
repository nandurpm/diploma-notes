/* =========================================================
   POLY PMNA — Main Site Initializer
   ---------------------------------------------------------
   This is the global initialization script loaded on every
   portal page. It orchestrates the loading and execution of
   other shared scripts and performs cross-page normalization.

   Responsibilities:
   - Loads the global reveal animation framework
     (CSS + IntersectionObserver controller)
   - Loads the site shell (header/footer/navigation renderer)
   - Loads the visitor popup rotation system
   - Loads the maintenance mode controller
   - Updates copyright year in the footer
   - Normalizes legacy internal links to clean URLs
   - Normalizes Revision 2026 subject card action links
     to point to the official SITTTR Kerala website

   Related files:
   - assets/css/reveal.css (loaded by this script)
   - assets/js/reveal.js (loaded by this script)
   - assets/js/site-shell.js (loaded by this script)
   - assets/js/visitor-popup.js (loaded by this script)
   - assets/js/maintenance-controller.js (loaded by this script)
   - assets/data/revision-2026-subjects.json (referenced by card normalization)

   Warning: Changes to ensureSiteShell() or ensureVisitorPopup()
   affect every page on the site. Test thoroughly.
   ========================================================= */
(() => {
  "use strict";

  const path = window.location.pathname || "/";
  const isLessonPage = /\/(?:revision-2026-content\/)?lessons\/lessons-[^/]+\.html$/i.test(path);
  const SITTTR_BASE = "https://www.sitttrkerala.ac.in/index.php";
  const REV2026_SYLLABUS_ROUTE = "site%2Fdiploma-syllabus-course-contents";
  const REV2026_MODEL_QP_ROUTE = "site%2Fdiploma-modelqp-courses-show";
  const REVEAL_CSS_PATH = "/assets/css/reveal.css";
  const REVEAL_JS_PATH = "/assets/js/reveal.js";
  const REVEAL_VERSION = "20260728-global-reveal1";

  function assetAlreadyLoaded(selector, pathname) {
    return [...document.querySelectorAll(selector)].some(node => {
      try {
        return new URL(node.href || node.src || "", window.location.href).pathname === pathname;
      } catch (_) {
        return false;
      }
    });
  }

  /* =========================================================
     GLOBAL REVEAL ASSET LOADER
     ---------------------------------------------------------
     Loads the reusable reveal animation stylesheet and script
     once per page. The framework remains opt-in: only elements
     with data-reveal or .reveal are affected.
     Related: assets/css/reveal.css, assets/js/reveal.js
     ========================================================= */
  function ensureRevealAssets() {
    if (!assetAlreadyLoaded('link[rel="stylesheet"]', REVEAL_CSS_PATH)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${REVEAL_CSS_PATH}?v=${REVEAL_VERSION}`;
      link.dataset.polyRevealCss = "true";
      document.head.append(link);
    }

    if (window.PolyReveal || assetAlreadyLoaded("script[src]", REVEAL_JS_PATH)) return;

    const script = document.createElement("script");
    script.src = `${REVEAL_JS_PATH}?v=${REVEAL_VERSION}`;
    script.defer = true;
    script.dataset.polyRevealLoader = "true";
    document.head.append(script);
  }

  /* =========================================================
     COPYRIGHT YEAR UPDATER
     ---------------------------------------------------------
     Updates all elements with data-year attribute or id="year"
     to display the current year. Used in the site footer.
     ========================================================= */
  function updateYears() {
    document.querySelectorAll("[data-year], #year").forEach(node => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  /* =========================================================
     SITE SHELL LOADER
     ---------------------------------------------------------
     Ensures the global site header/footer/navigation (site-shell)
     is loaded and rendered. On lesson pages, renders existing
     shell if already present but skips loading the script.
     Checks for duplicate script tags before injecting.
     Related: assets/js/site-shell.js
     ========================================================= */
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

  /* =========================================================
     VISITOR POPUP LOADER
     ---------------------------------------------------------
     Loads the visitor popup rotation script on non-Ask-POLY
     pages. The popup shows promotional content (announcements,
     new features) once per day. Can be disabled globally via
     window.POLY_DISABLE_ASSISTANT.
     Related: assets/js/visitor-popup.js, assets/popup/
     ========================================================= */
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

  /* =========================================================
     LEGACY LINK NORMALIZER
     ---------------------------------------------------------
     Converts old internal link patterns (/index.html,
     ../index.html) to clean root URLs (/). Ensures consistent
     URL structure across the site regardless of how links
     were originally written.
     ========================================================= */
  function normalizeLegacyInternalLinks() {
    document.querySelectorAll('a[href="/index.html"], a[href="../index.html"]').forEach(link => {
      link.setAttribute("href", "/");
    });
  }

  /* =========================================================
     REVISION 2026 OFFICIAL LINK CONFIGURATION
     ---------------------------------------------------------
     Configures individual action links (Syllabus, Model QP)
     on a single Revision 2026 subject card to point to the
     official SITTTR Kerala website. Extracts the course code
     from the card's data attributes and constructs the
     appropriate external URL.
     ========================================================= */
  function configureOfficialLink(link, href, label, title) {
    if (!link) return;
    link.href = href;
    link.textContent = label;
    link.title = title;
    link.target = "_blank";
    link.rel = "noopener noreferrer external";
    link.removeAttribute("download");
  }

  /* =========================================================
     REVISION 2026 CARD LINK NORMALIZER
     ---------------------------------------------------------
     Scans all Revision 2026 subject cards on the page and
     updates their Syllabus and Model Question Paper action
     buttons to link to the official SITTTR Kerala website.
     Extracts the 4-digit course code from each card.
     ========================================================= */
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

  /* =========================================================
     REVISION 2026 CARD WATCHER
     ---------------------------------------------------------
     Uses a MutationObserver to watch for dynamically added
     Revision 2026 subject cards (e.g., from AJAX-loaded content
     or browser-rendered grids) and normalizes their links
     as they appear. Prevents cards loaded after initial page
     render from having broken Syllabus/QP links.
     ========================================================= */
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

  /* =========================================================
     MAINTENANCE CONTROLLER LOADER
     ---------------------------------------------------------
     Loads the maintenance mode controller script on all pages
     except the maintenance page itself. The controller checks
     whether the current time falls within a scheduled
     maintenance window and redirects accordingly.
     Related: assets/js/maintenance-controller.js
     ========================================================= */
  function ensureMaintenanceController() {
    if (window.location.pathname.startsWith("/maintenance/")) return;
    const script = document.createElement("script");
    script.src = "/assets/js/maintenance-controller.js?v=20260722-main-ctrl1";
    script.defer = true;
    document.head.append(script);
  }

  /* =========================================================
     INITIALIZATION
     ---------------------------------------------------------
     Runs all initialization steps in order.
     If the document is still loading, waits for DOMContentLoaded.
     ========================================================= */
  function init() {
    ensureRevealAssets();
    ensureMaintenanceController();
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
