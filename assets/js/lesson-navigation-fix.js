/* =========================================================
   LESSON NAVIGATION FIX — Shared Lesson Page Runtime
   ---------------------------------------------------------
   This script is the universal runtime for every lesson page
   on the POLY PMNA platform. It normalizes the lesson page
   layout, hides the global site header, reveals all hidden
   content sections, and adds end-of-lesson navigation actions.

   Loaded by every lesson page via:
     <script src="/assets/js/lesson-navigation-fix.js" defer></script>

   Key responsibilities:
   - Marks the page as a lesson page (CSS classes + data attributes)
   - Removes the site header, navigation, and any portal chrome
   - Injects lesson-specific critical CSS (full-width, no header gap)
   - Injects the lesson watermark
   - Reveals all hidden/collapsed lesson sections
   - Expands dynamic tabbed module views into a continuous document
   - Creates end-of-lesson actions (back button, PDF download, print)
   - Handles auto-print mode for notes PDF generation
   - Supports both Revision 2021 and Revision 2026 lesson paths
   - Detects the Android native app via user agent

   Related files:
   - assets/css/lesson-page-fix.css
   - assets/css/lesson-watermark.css
   - assets/js/lessons/lesson-2131-enhancements.js (Rev 2026 course 2131)

   Warning: Changes here affect EVERY lesson page on the site.
   Test on both desktop and mobile before committing.
   ========================================================= */
(() => {
  "use strict";

  /* =========================================================
     PAGE DETECTION AND CONSTANTS
     ---------------------------------------------------------
     Identifies the current page as a lesson page using the
     pathname pattern. Detects revision year and course code.
     Detects the Android native app via user agent string.
     Defines the CSS selector for all lesson content sections
     that should be revealed.
     ========================================================= */
  const lessonPath = /^\/(?:revision-2026-content\/)?lessons\/lessons-[^/]+\.html$/i;
  if (!lessonPath.test(location.pathname) || (window.__polyLessonStandardLoaded && document.documentElement.classList.contains("lesson-all-content"))) return;
  window.__polyLessonStandardLoaded = true;

  const root = document.documentElement;
  const nativeApp = /(?:PolytechnicStudyHubAndroid|PolyPmnaAndroid)\/[0-9]+(?:\.[0-9]+)*/i.test(navigator.userAgent || "");
  const revision2026 = /^\/revision-2026-content\//i.test(location.pathname);
  const courseCode = decodeURIComponent(location.pathname.match(/lessons-([^/]+)\.html$/i)?.[1] || "");
  const sectionSelector = ".view-section,.view,.panel,.tab-panel,.tab-content,.module-panel,.lesson-panel,.content-panel,.content-section,.section-panel,[role='tabpanel']";
  const originalUrl = `${location.pathname}${location.search}${location.hash}`;

  /* =========================================================
     PAGE MARKING
     ---------------------------------------------------------
     Applies CSS classes and data attributes to both <html> and
     <body> elements to identify this as a lesson page.
     Removes portal-specific classes (portal-page, has-fixed-site-header).
     Resets all header-height CSS variables to 0 to eliminate
     the fixed header gap that portal pages normally need.
     ========================================================= */
  function markPage() {
    root.classList.add("poly-lesson-page", "lesson-all-content");
    root.classList.toggle("revision-2026-lesson", revision2026);
    root.classList.toggle("revision-2021-lesson", !revision2026);
    root.classList.toggle("polytechnic-native-app", nativeApp);
    root.dataset.lessonRevision = revision2026 ? "REV2026" : "REV2021";
    if (courseCode) root.dataset.courseCode = courseCode;
    const body = document.body;
    if (body) {
      body.classList.add("poly-lesson-page", "lesson-all-content");
      body.classList.toggle("revision-2026-lesson", revision2026);
      body.classList.toggle("revision-2021-lesson", !revision2026);
      body.classList.remove("portal-page", "has-fixed-site-header");
      body.style.setProperty("padding-top", "0", "important");
      body.style.setProperty("margin-top", "0", "important");
    }
    root.style.setProperty("--fixed-site-header-height", "0px");
    root.style.setProperty("--fixed-site-header-gap", "0px");
    root.style.setProperty("--header-h", "0px");
    root.style.setProperty("--topbar-h", "0px");
    root.style.setProperty("--toolbar-h", "0px");
    root.style.setProperty("--top", "0px");
    root.style.setProperty("--topbar-h", "0px");
    root.style.setProperty("--toolbar-h", "0px");
    root.style.setProperty("--top", "0px");
    root.style.setProperty("--topbar-h", "0px");
    root.style.setProperty("--toolbar-h", "0px");
    root.style.setProperty("--top", "0px");
    root.style.setProperty("--topbar-h", "0px");
    root.style.setProperty("--toolbar-h", "0px");
    root.style.setProperty("--top", "0px");
    root.style.setProperty("--topbar-h", "0px");
    root.style.setProperty("--toolbar-h", "0px");
    root.style.setProperty("--top", "0px");
  }

  /* =========================================================
     WATERMARK INSTALLATION
     ---------------------------------------------------------
     Injects the lesson watermark CSS and DOM overlay.
     The watermark is a semi-transparent brand mark on lesson
     content. Guarded against duplicate injection and hidden
     during print media queries.
     Related: assets/css/lesson-watermark.css
     ========================================================= */
  function installWatermark() {
    if (!document.querySelector('link[data-poly-watermark-css="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/assets/css/lesson-watermark.css?v=20260725-watermark1";
      link.dataset.polyWatermarkCss = "true";
      (document.head || root).append(link);
    }
    const MARKER = "data-poly-watermark";
    if (document.querySelector(`[${MARKER}]`)) return;
    if (window.matchMedia && window.matchMedia("print").matches) return;
    const overlay = document.createElement("div");
    overlay.className = "poly-watermark";
    overlay.setAttribute(MARKER, "");
    overlay.setAttribute("aria-hidden", "true");
    const inner = document.createElement("div");
    inner.className = "poly-watermark-inner";
    overlay.appendChild(inner);
    document.body.insertBefore(overlay, document.body.firstChild);
  }

  /* =========================================================
     CRITICAL LESSON STYLES
     ---------------------------------------------------------
     Injects inline critical CSS that:
     - Forces full-width layout (100%, no max-width)
     - Hides all header-related elements (site header, topbar,
       lesson topbar, chapter nav, back buttons, skip links)
     - Removes margins and padding on main content containers
     Also loads the external lesson-page-fix.css stylesheet.
     Related: assets/css/lesson-page-fix.css
     ========================================================= */
  function installStyles() {
    if (!document.getElementById("poly-lesson-critical")) {
      const style = document.createElement("style");
      style.id = "poly-lesson-critical";
      style.textContent = "html.poly-lesson-page,html.poly-lesson-page body{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;overflow-x:clip!important;scroll-padding-top:0!important}html.poly-lesson-page :is(#site-header,.site-header,.fixed-site-header,[data-site-header],[data-site-shell-header],.topbar,.hb-topbar,.lesson-topbar,.lesson-header,body>nav.top,body>header.top,.chapter-nav,.revision-back-button,.nav-arrows,.skip-link){display:none!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}html.poly-lesson-page :is(main,.lesson-shell,.page-shell,.shell,.main-content,.content,.screen,.wrap,.w,.page,.container){width:100%!important;max-width:none!important;min-width:0!important;margin:0!important}html.poly-lesson-page .lesson-shell{display:block!important;grid-template-columns:1fr!important}";
      (document.head || root).append(style);
    }
    let link = document.getElementById("poly-lesson-page-fix");
    if (!link) {
      link = document.createElement("link");
      link.id = "poly-lesson-page-fix";
      link.rel = "stylesheet";
      (document.head || root).append(link);
    }
    link.href = "/assets/css/lesson-page-fix.css?v=20260725-watermark1";
  }

  /* =========================================================
     VIEWPORT ENFORCEMENT
     ---------------------------------------------------------
     Ensures the page has a proper responsive viewport meta tag
     with viewport-fit=cover for notch-safe display on mobile.
     Creates the meta tag if missing.
     ========================================================= */
  function ensureViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head?.prepend(viewport);
    }
    viewport.content = "width=device-width,initial-scale=1,viewport-fit=cover";
  }

  /* =========================================================
     SECTION DETECTION AND REVEAL
     ---------------------------------------------------------
     Identifies elements that represent lesson content sections
     (using multiple CSS selectors for compatibility with
     different lesson HTML structures). The reveal function
     makes hidden sections visible by clearing hidden attributes,
     aria-hidden, display:none, opacity, and height constraints.
     ========================================================= */
  function isLessonSection(node) {
    return node instanceof HTMLElement && (node.matches(sectionSelector) || node.matches("main section[id],main article[id],main>section,main>article"));
  }

  function reveal(node) {
    if (!isLessonSection(node) || node.classList.contains("poly-dynamic-source")) return;
    const hidden = node.hidden || node.hasAttribute("hidden") || node.getAttribute("aria-hidden") === "true" || getComputedStyle(node).display === "none";
    node.hidden = false;
    node.removeAttribute("hidden");
    node.setAttribute("aria-hidden", "false");
    if (hidden) node.classList.add("poly-force-visible");
    node.style.setProperty("visibility", "visible", "important");
    node.style.setProperty("opacity", "1", "important");
    node.style.setProperty("height", "auto", "important");
    node.style.setProperty("max-height", "none", "important");
    node.style.setProperty("overflow", "visible", "important");
  }

  function revealAllLessonSections() {
    document.querySelectorAll(sectionSelector).forEach(reveal);
    document.querySelectorAll("main section[id],main article[id],main>section,main>article").forEach(reveal);
    document.querySelectorAll("details").forEach((item) => { item.open = true; });
  }

  /* =========================================================
     DYNAMIC MODULE VIEW EXPANSION
     ---------------------------------------------------------
     Some lessons use tabbed/module interfaces where content
     is only visible when a user clicks a module button.
     This function programmatically clicks each module button,
     captures the revealed content, and creates a continuous
     document with all modules expanded in sequence.
     This ensures the entire lesson is printable as a single
     continuous document without requiring user interaction.
     Skipped on Revision 2026 lessons (they use a different structure).
     ========================================================= */
  function targetFor(control) {
    const id = control.getAttribute("aria-controls") || control.dataset.target || control.dataset.go || control.dataset.v || control.dataset.tab || control.dataset.open || control.dataset.jump || control.dataset.panel;
    if (id) return document.getElementById(id.replace(/^#/, ""));
    const view = control.dataset.view;
    const module = control.dataset.module;
    if (view && module !== undefined) {
      const exact = document.querySelector(`.view-section[data-view="${view}"][data-module="${module}"]`);
      if (exact) return exact;
    }
    if (module !== undefined) {
      const n = Number(module);
      for (const candidate of [`module-${n}`, `m${n}`, `module-${n + 1}`, `m${n + 1}`, "modules"]) {
        const found = document.getElementById(candidate);
        if (found) return found;
      }
    }
    return view ? document.getElementById(view) || document.querySelector(`[data-view="${view}"]`) : null;
  }

  const frames = () => new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    setTimeout(finish, 50);
    requestAnimationFrame(() => requestAnimationFrame(finish));
  });
  const textOf = (node) => (node.textContent || "").replace(/\s+/g, " ").trim();

  function removeCloneIds(clone) {
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    clone.querySelectorAll("[aria-controls],[aria-labelledby],[aria-describedby],[for]").forEach((node) => {
      node.removeAttribute("aria-controls");
      node.removeAttribute("aria-labelledby");
      node.removeAttribute("aria-describedby");
      node.removeAttribute("for");
    });
    clone.querySelectorAll('a[href^="#"]').forEach((link) => link.removeAttribute("href"));
  }

  async function expandDynamicModuleViews() {
    if (root.dataset.polyDynamicExpanded === "true") return;
    root.dataset.polyDynamicExpanded = "true";
    const entries = new Map();
    document.querySelectorAll("button[data-module],a[data-module]").forEach((control) => {
      if (control.matches(".download-btn,[download],[href$='.pdf']")) return;
      const target = targetFor(control);
      if (!isLessonSection(target)) return;
      const key = `${target.id || target.dataset.view || "target"}:${control.dataset.module}`;
      if (!entries.has(key)) entries.set(key, { control, target });
    });
    const groups = new Map();
    entries.forEach(({ control, target }) => {
      if (!groups.has(target)) groups.set(target, []);
      groups.get(target).push(control);
    });
    const x = scrollX;
    const y = scrollY;
    for (const [target, controls] of groups) {
      if (controls.length < 2 || controls.length > 12) continue;
      const seen = new Set();
      const clones = [];
      for (const control of controls) {
        try {
          control.click();
          await frames();
          await new Promise((resolve) => setTimeout(resolve, 20));
          const current = targetFor(control) || target;
          reveal(current);
          const text = textOf(current);
          if (text.length < 120 || seen.has(text)) continue;
          seen.add(text);
          const clone = current.cloneNode(true);
          removeCloneIds(clone);
          clone.hidden = false;
          clone.classList.add("poly-expanded-dynamic-view");
          const label = document.createElement("div");
          label.className = "poly-expanded-state-label";
          label.textContent = (control.textContent || `Module ${clones.length + 1}`).trim();
          clone.prepend(label);
          clones.push(clone);
        } catch (_) {}
      }
      if (clones.length > 1) {
        const wrapper = document.createElement("section");
        wrapper.className = "poly-expanded-dynamic-list";
        clones.forEach((clone) => wrapper.append(clone));
        target.classList.add("poly-dynamic-source");
        target.setAttribute("aria-hidden", "true");
        target.after(wrapper);
      }
    }
    history.replaceState(null, "", originalUrl);
    scrollTo(x, y);
    revealAllLessonSections();
  }

  /* =========================================================
     PRINT MODE PREPARATION
     ---------------------------------------------------------
     Adds the pdf-export-mode class to the page, reveals all
     content, and optionally shows a banner instructing the
     user to use "Save as PDF" in the print dialog.
     ========================================================= */
  function preparePrintMode(showBanner = false) {
    root.classList.add("pdf-export-mode");
    document.body?.classList.add("pdf-export-mode");
    revealAllLessonSections();
    if (showBanner && !document.querySelector(".notes-fallback-banner")) {
      const banner = document.createElement("div");
      banner.className = "notes-fallback-banner";
      banner.textContent = "The complete lesson is ready. Choose Save as PDF in the print window.";
      document.body?.prepend(banner);
    }
    scrollTo(0, 0);
  }

  /* =========================================================
     END-OF-LESSON ACTIONS
     ---------------------------------------------------------
     Creates a section at the bottom of every lesson page with:
     - Course code and revision label
     - Back button (links to the appropriate revision page)
     - PDF download button (if a PDF link exists in the lesson)
     - Print / Save PDF button (triggers window.print())
     ========================================================= */
  function createEndActions() {
    if (document.getElementById("polyLessonEndActions")) return;
    const main = document.querySelector("main") || document.querySelector(".lesson-shell") || document.body;
    if (!main) return;
    const actions = document.createElement("section");
    actions.id = "polyLessonEndActions";
    actions.className = "poly-lesson-end-actions";
    actions.innerHTML = `<p class="poly-lesson-identity">${courseCode ? `Course ${courseCode} · ` : ""}${revision2026 ? "Revision 2026" : "Revision 2021"}</p><div class="poly-lesson-action-row"><a class="poly-lesson-action poly-lesson-back" href="${revision2026 ? "/revision-2026.html" : "/revision-2021.html"}">Back to ${revision2026 ? "Revision 2026" : "Revision 2021"}</a></div>`;
    const row = actions.querySelector(".poly-lesson-action-row");
    const pdf = [...document.querySelectorAll("a[href]")].find((link) => /\.pdf(?:$|[?#])|autoPrintNotes|downloadNotes/i.test(link.getAttribute("href") || ""));
    if (pdf) {
      const download = document.createElement("a");
      download.className = "poly-lesson-action poly-lesson-download";
      download.href = pdf.href;
      download.textContent = "Download PDF";
      row.append(download);
    }
    const print = document.createElement("button");
    print.className = "poly-lesson-action poly-lesson-print";
    print.type = "button";
    print.textContent = "Print / Save PDF";
    print.addEventListener("click", () => { preparePrintMode(false); setTimeout(() => printWindow(), 80); });
    row.append(print);
    main === document.body ? main.append(actions) : main.after(actions);
  }

  function printWindow() { window.print(); }

  /* =========================================================
     SCROLL PROGRESS
     ---------------------------------------------------------
     Updates a progress bar element (if present) to reflect
     the user's scroll position within the lesson.
     ========================================================= */
  function updateProgress() {
    const progress = document.querySelector("#progress,.progress,.prog");
    if (!progress) return;
    const total = Math.max(1, root.scrollHeight - innerHeight);
    progress.style.width = `${Math.min(100, Math.max(0, scrollY / total * 100))}%`;
  }

  /* =========================================================
     BOOT SEQUENCE
     ---------------------------------------------------------
     Executes the full lesson page initialization:
     1. Mark the page as a lesson page
     2. Ensure responsive viewport
     3. Install critical styles and watermark
     4. Reveal all content sections
     5. Expand dynamic module views (Rev 2021 only)
     6. Create end-of-lesson navigation
     7. Handle auto-print URL parameters
     ========================================================= */
  async function boot() {
    markPage();
    ensureViewport();
    installStyles();
    installWatermark();
    revealAllLessonSections();
    await new Promise((resolve) => setTimeout(resolve, 120));
    if (!revision2026) await expandDynamicModuleViews();
    revealAllLessonSections();
    createEndActions();
    updateProgress();
    const params = new URLSearchParams(location.search);
    if (params.has("autoPrintNotes") || params.has("downloadNotes")) {
      preparePrintMode(true);
      setTimeout(() => printWindow(), 650);
    }
  }

  markPage();
  ensureViewport();
  installStyles();
  addEventListener("beforeprint", () => preparePrintMode(false));
  addEventListener("scroll", updateProgress, { passive: true });
  addEventListener("resize", updateProgress, { passive: true });
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => { void boot(); }, { once: true }) : void boot();
})();

/* =========================================================
   COURSE 2131 ENHANCEMENT LOADER
   ---------------------------------------------------------
   Revision 2026 course 2131 (Electrical Circuits) requires
   additional content enhancement tables (taxonomy hours,
   subtopic allocation) that are dynamically injected.
   This section lazily loads the course-specific enhancement
   script only on the matching lesson page.
   Related: assets/js/lessons/lesson-2131-enhancements.js
   ========================================================= */
(() => {
  "use strict";
  const isCourse2131 = /^\/revision-2026-content\/lessons\/lessons-2131\.html$/i.test(location.pathname);
  if (!isCourse2131 || window.__poly2131EnhancementLoaderInstalled) return;
  window.__poly2131EnhancementLoaderInstalled = true;

  const load = () => {
    if (window.__poly2131EnhancementsLoaded || document.querySelector('script[data-poly-course-enhancement="2131"]')) return;
    const script = document.createElement("script");
    script.src = "/assets/js/lessons/lesson-2131-enhancements.js?v=20260719";
    script.defer = true;
    script.dataset.polyCourseEnhancement = "2131";
    document.head.append(script);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load, { once: true });
  } else {
    load();
  }
})();
