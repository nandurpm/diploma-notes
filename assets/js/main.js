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
  const isHomePage = path === "/" || /\/index\.html$/i.test(path);
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
     IMMEDIATE CONTENT VISIBILITY
     ---------------------------------------------------------
     Scroll-reveal effects are disabled across the portal. The previous
     controller could leave elements with reveal-ready opacity zero when a
     browser delayed its observer callback. Clear any stale reveal classes so
     course content remains available as soon as the page is parsed.
     ========================================================= */
  function ensureImmediateContentVisibility() {
    document.documentElement.classList.add("reveal-disabled");
    document.body?.setAttribute("data-reveal-disabled", "true");
    document.querySelectorAll("[data-reveal], .reveal").forEach((element) => {
      element.classList.remove("reveal-ready", "reveal-visible", "is-revealed");
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
      element.style.removeProperty("filter");
    });
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

  // Revision 2026 action links are owned by the repository PDF manifest.

  /* =========================================================
     REVISION 2026 CARD LINK NORMALIZER
     ---------------------------------------------------------
     Revision 2026 cards are already linked to the repository PDF
     manifest by their page generator and browser renderer. The
     legacy official-link rewrite is intentionally disabled.
     ========================================================= */
  // Revision 2026 cards are generated from the repository PDF manifest. Do not
  // rewrite their links to the official SITTTR pages after the page renders.
  function normalizeRev2026OfficialLinks() {
    return;
  }

  /* =========================================================
     REVISION 2026 CARD WATCHER
     ---------------------------------------------------------
     Retained as a compatibility no-op for older integrations;
     current Revision 2026 pages own their repository PDF links.
     ========================================================= */
  function watchRev2026Cards() {
    return;
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
     GLOBAL SEARCH SHORTCUT LOADER
     ---------------------------------------------------------
     Loads the search shortcut utility script on all pages.
     The shortcut listens for the '/' key to focus the first
     available page-specific search input.
     Related: assets/js/search.js
     ========================================================= */
  function ensureSearchShortcut() {
    const searchPath = "/assets/js/search.js";
    const existing = [...document.scripts].some(script => {
      try {
        return new URL(script.src || "", window.location.href).pathname === searchPath;
      } catch (_) {
        return false;
      }
    });
    if (existing) return;

    const script = document.createElement("script");
    script.src = `${searchPath}?v=20260804-search-shortcut`;
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
    ensureImmediateContentVisibility();
    ensureMaintenanceController();
    updateYears();
    normalizeLegacyInternalLinks();
    ensureSiteShell();
    ensureVisitorPopup();
    // Revision 2026 pages own their syllabus/model-paper links through the PDF manifest.

    ensureSearchShortcut();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
