/* =========================================================
   POLY SITE SHELL — Global Header, Navigation, and Footer
   ---------------------------------------------------------
   This module is responsible for rendering and maintaining the
   site-wide header (brand logo + navigation menu) and footer
   on every non-lesson page. It is loaded on every portal page
   via main.js and is also referenced directly in some HTML pages.

   Key responsibilities:
   - Injects the canonical favicon across all pages
   - Renders a consistent top navigation bar with active-page detection
   - Renders the site footer with copyright year and legal links
   - Manages the mobile hamburger menu (open/close, Escape, click-outside)
   - Automatically repairs the header if other scripts modify it
   - On lesson pages, injects watermark CSS and DOM overlay instead
   - Injects mobile header hotfix CSS on portal pages

   Page detection:
   - Lesson pages are identified by the pathname pattern
     /lessons/lessons-[CODE].html or
     /revision-2026-content/lessons/lessons-[CODE].html
   - Portal pages are all other pages

   Related files:
   - main.js (calls PolySiteShell.render())
   - assets/css/mobile-header-hotfix.css
   - assets/css/lesson-watermark.css
   - assets/media/poly-pmna-logo.png
   - assets/media/poly-pmna-favicon.svg

   Warning: Changes to navItems affect every page's navigation.
   Changes to headerMarkup or footer markup affect every page's layout.
   ========================================================= */
(() => {
  "use strict";

  // label: "Home" label: "About" label: "Revision 2026" label: "Revision 2021" label: "Mock Exams" label: "Ask POLY AI" label: "2015 Materials" label: "Tools" label: "Help"

  const VERSION = "20260725-watermark2";
  const SITE_NAME = "POLY PMNA";
  const FAVICON_HREF = "/assets/media/poly-pmna-favicon.svg";
  const LOGO_HREF = "/assets/media/poly-pmna-logo.png";
  const MOBILE_HEADER_CSS = "/assets/css/mobile-header-hotfix.css?v=20260720-mobile-header-fix3";
  const WATERMARK_CSS = "/assets/css/lesson-watermark.css?v=20260725-watermark1";
  const currentPath = () => window.location.pathname.replace(/\/+$/, "") || "/";
  const isLessonPage = () => /\/(?:revision-2026-content\/)?lessons\/lessons-[^/]+\.html$/i.test(currentPath());

  /* =========================================================
     NAVIGATION CONFIGURATION
     ---------------------------------------------------------
     Defines all navigation items with their display labels,
     target URLs, and active-page matching functions.
     Each entry is [label, href, activeMatchFn].
     The activeMatchFn receives the current pathname and returns
     true when the navigation item should be highlighted as active.
     ========================================================= */
  const navItems = [
    ["Home", "/", path => path === "/" || path.endsWith("/index.html")],
    ["About", "/about.html", path => path.endsWith("/about.html")],
    ["Revision 2026", "/revision-2026.html", path => path.endsWith("/revision-2026.html") || path.includes("/revision-2026/")],
    ["Revision 2021", "/revision-2021.html", path => path.endsWith("/revision-2021.html") || path.includes("/revision-2021/")],
    ["Mock Exams", "/daily-quiz.html", path => path.endsWith("/daily-quiz.html") || /\/mock-exam(?:-|\.html)/i.test(path)],
    ["Ask POLY AI", "/ask-poly.html", path => /\/ask-poly(?:-v2)?\.html$/i.test(path)],
    ["2015 Materials", "/materials-2015.html", path => path.endsWith("/materials-2015.html")],
    ["Tools", "/tools.html", path => /\/tools(?:-v2|-v2-original)?\.html$/i.test(path)],
    ["Help", "/contact.html", path => path.endsWith("/contact.html")]
  ];

  /* =========================================================
     FAVICON MANAGEMENT
     ---------------------------------------------------------
     Removes any existing favicon links and injects the canonical
     POLY PMNA SVG favicon. Prevents duplicate or conflicting
     favicons from other scripts or server-side templates.
     ========================================================= */
  function ensureFavicon() {
    document.head.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"]').forEach(node => node.remove());
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.type = "image/svg+xml";
    icon.href = FAVICON_HREF;
    icon.dataset.polyPmnaFavicon = "true";
    document.head.append(icon);
  }

  /* =========================================================
     LESSON WATERMARK (CSS)
     ---------------------------------------------------------
     Injects the lesson watermark stylesheet on lesson pages.
     The watermark is a subtle brand overlay on all lesson content.
     Guarded by a data attribute to prevent duplicate injection.
     Related: assets/css/lesson-watermark.css
     ========================================================= */
  function ensureWatermarkCss() {
    if (document.querySelector('link[data-poly-watermark-css="true"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = WATERMARK_CSS;
    link.dataset.polyWatermarkCss = "true";
    document.head.append(link);
  }

  /* =========================================================
     LESSON WATERMARK (DOM)
     ---------------------------------------------------------
     Creates the watermark overlay element and prepends it to
     the document body. The overlay is hidden during print
     and on pages that already have the marker attribute.
     ========================================================= */
  function ensureWatermarkDom() {
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
     MOBILE HEADER HOTFIX CSS
     ---------------------------------------------------------
     Injects a CSS fix for mobile header rendering issues.
     Only loaded on portal pages (not lesson pages).
     Guarded against duplicate injection via data attribute.
     Related: assets/css/mobile-header-hotfix.css
     ========================================================= */
  function ensureMobileHeaderStyles() {
    const existing = [...document.styleSheets].some(sheet => {
      try {
        return new URL(sheet.href || "", window.location.href).pathname === "/assets/css/mobile-header-hotfix.css";
      } catch (_) {
        return false;
      }
    });
    if (existing || document.querySelector('link[data-poly-mobile-header-fix="true"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = MOBILE_HEADER_CSS;
    link.dataset.polyMobileHeaderFix = "true";
    document.head.append(link);
  }

  /* =========================================================
     NAVIGATION MARKUP GENERATION
     ---------------------------------------------------------
     Builds the HTML for the navigation links. Each link is
     compared against the current pathname to determine if it
     should be marked as the active page (aria-current="page").
     ========================================================= */
  function navMarkup() {
    const path = currentPath().toLowerCase();
    return navItems.map(([label, href, matches]) => {
      const active = matches(path);
      return `<a href="${href}"${active ? ' class="active" aria-current="page"' : ""}>${label}</a>`;
    }).join("");
  }

  /* =========================================================
     MOBILE MENU BINDING
     ---------------------------------------------------------
     Attaches event listeners to the hamburger menu toggle
     and navigation container. Handles:
     - Click to toggle open/close
     - Click on a nav link closes the menu
     - Click outside the header closes the menu
     - Escape key closes the menu and refocuses the toggle
     - Window resize above 980px closes the menu
     - Dispatches a custom event for header resize observers
     ========================================================= */
  function bindMenu(header) {
    const button = header.querySelector(".menu-toggle");
    const nav = header.querySelector(".navlinks");
    if (!button || !nav || button.dataset.siteShellBound === "true") return;
    button.dataset.siteShellBound = "true";

    const setOpen = open => {
      nav.classList.toggle("open", open);
      header.classList.toggle("open", open);
      document.body.classList.toggle("poly-mobile-menu-open", open);
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      button.textContent = open ? "Close" : "Menu";
      window.dispatchEvent(new CustomEvent("poly-site-header-resize"));
    };

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(!nav.classList.contains("open"));
    });
    nav.addEventListener("click", event => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("click", event => {
      if (!header.contains(event.target) && nav.classList.contains("open")) setOpen(false);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        setOpen(false);
        button.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 980 && nav.classList.contains("open")) setOpen(false);
    }, { passive: true });
  }

  /* =========================================================
     HEADER MARKUP GENERATION
     ---------------------------------------------------------
     Produces the full header HTML including:
     - Brand logo with link to homepage
     - Hamburger menu toggle button
     - Navigation links container
     All attributes include accessibility labels.
     ========================================================= */
  function headerMarkup() {
    return `<a class="brand" href="/" aria-label="${SITE_NAME} home"><img class="brand-logo" src="${LOGO_HREF}" alt="" width="42" height="42" decoding="async" fetchpriority="high"><strong>${SITE_NAME}</strong></a><button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="primary-navigation">Menu</button><nav class="navlinks" id="primary-navigation" aria-label="Primary navigation">${navMarkup()}</nav>`;
  }

  /* =========================================================
     HEADER CANONICAL CHECK
     ---------------------------------------------------------
     Verifies whether the current header matches the expected
     canonical structure (brand + menu-toggle + navlinks) and
     the current shell version. Returns false if the header
     has been modified by another script or contains extra elements.
     ========================================================= */
  function headerIsCanonical(header) {
    const directChildren = [...header.children];
    return directChildren.length === 3 &&
      directChildren[0]?.classList.contains("brand") &&
      directChildren[1]?.classList.contains("menu-toggle") &&
      directChildren[2]?.classList.contains("navlinks") &&
      header.dataset.siteShellVersion === VERSION;
  }

  /* =========================================================
     HEADER MUTATION OBSERVER
     ---------------------------------------------------------
     Watches the header element for DOM changes. If the header
     is modified (e.g., by another script injecting elements),
     this observer restores the canonical header structure.
     Prevents other scripts from breaking the navigation.
     ========================================================= */
  function watchHeader(header) {
    if (header.dataset.siteShellObserved === "true" || !("MutationObserver" in window)) return;
    header.dataset.siteShellObserved = "true";
    const observer = new MutationObserver(() => {
      if (header.dataset.siteShellRepairing === "true" || headerIsCanonical(header)) return;
      header.dataset.siteShellRepairing = "true";
      observer.disconnect();
      header.className = "topbar";
      header.innerHTML = headerMarkup();
      header.dataset.siteHeader = "";
      header.dataset.siteShellVersion = VERSION;
      bindMenu(header);
      observer.observe(header, { childList: true });
      delete header.dataset.siteShellRepairing;
      window.dispatchEvent(new CustomEvent("poly-site-header-resize"));
    });
    observer.observe(header, { childList: true });
  }

  /* =========================================================
     HEADER RENDERING
     ---------------------------------------------------------
     Finds the header element (via data-site-header attribute
     or portal-page fallback) and renders the canonical header.
     Skips rendering on lesson pages.
     Removes any duplicate header candidates.
     ========================================================= */
  function renderHeader(force = false) {
    if (isLessonPage()) return;
    const candidates = [...new Set([
      ...document.querySelectorAll("[data-site-header]"),
      ...document.querySelectorAll("body.portal-page > header.topbar")
    ])];
    const header = candidates.find(node => node.hasAttribute("data-site-header")) || candidates[0];
    if (!header) return;
    candidates.forEach(node => {
      if (node !== header) node.remove();
    });
    if (force || !headerIsCanonical(header)) {
      header.className = "topbar";
      header.innerHTML = headerMarkup();
      header.dataset.siteHeader = "";
      header.dataset.siteShellVersion = VERSION;
    }
    bindMenu(header);
    watchHeader(header);
  }

  /* =========================================================
     FOOTER RENDERING
     ---------------------------------------------------------
     Renders the site footer with:
     - Copyright notice with dynamic year
     - About / Help / Developer links
     - Privacy / Terms / Disclaimer links
     Skips rendering on lesson pages.
     ========================================================= */
  function renderFooter(force = false) {
    if (isLessonPage()) return;
    const footer = document.querySelector("[data-site-footer]") || document.querySelector("body.portal-page > footer.footer");
    if (!footer) return;
    const desired = `<p>&copy; <span data-year>${new Date().getFullYear()}</span> ${SITE_NAME}.</p><nav class="footer-links" aria-label="Footer navigation"><a href="/about.html">About</a><a href="/contact.html">Help</a><a href="https://nandakumarm.dpdns.org/about.html" target="_blank" rel="noopener noreferrer">Developer</a></nav><nav class="footer-legal" aria-label="Legal"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/disclaimer.html">Disclaimer</a></nav>`;
    if (force || footer.dataset.siteShellVersion !== VERSION) {
      footer.className = "footer";
      footer.innerHTML = desired;
      footer.dataset.siteFooter = "";
      footer.dataset.siteShellVersion = VERSION;
    }
  }

  /* =========================================================
     PUBLIC RENDER API
     ---------------------------------------------------------
     Main entry point called by main.js on every page.
     On lesson pages: injects favicon, watermark CSS, and
     watermark DOM element. Returns early.
     On portal pages: ensures mobile header CSS, then renders
     header and footer.
     Exposed as window.PolySiteShell.render().
     ========================================================= */
  function render(options = {}) {
    ensureFavicon();
    if (isLessonPage()) {
      ensureWatermarkCss();
      ensureWatermarkDom();
      return;
    }
    ensureMobileHeaderStyles();
    const force = options.force === true;
    renderHeader(force);
    renderFooter(force);
  }

  /* Expose the public API and trigger initial render */
  window.PolySiteShell = Object.freeze({ render, version: VERSION, siteName: SITE_NAME });
  ensureFavicon();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => render({ force: true }), { once: true });
  } else {
    render({ force: true });
  }
})();
