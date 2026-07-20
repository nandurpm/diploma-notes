(() => {
  "use strict";

  const VERSION = "20260720-mobile-header-fix3";
  const SITE_NAME = "POLY PMNA";
  const FAVICON_HREF = "/assets/media/poly-pmna-favicon.svg";
  const MOBILE_HEADER_CSS = "/assets/css/mobile-header-hotfix.css?v=20260720-mobile-header-fix3";
  const currentPath = () => window.location.pathname.replace(/\/+$/, "") || "/";
  const isLessonPage = () => /\/(?:revision-2026-content\/)?lessons\/lessons-[^/]+\.html$/i.test(currentPath());
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

  function ensureFavicon() {
    document.head.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"]').forEach(node => node.remove());
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.type = "image/svg+xml";
    icon.href = FAVICON_HREF;
    icon.dataset.polyPmnaFavicon = "true";
    document.head.append(icon);
  }

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

  function navMarkup() {
    const path = currentPath().toLowerCase();
    return navItems.map(([label, href, matches]) => {
      const active = matches(path);
      return `<a href="${href}"${active ? ' class="active" aria-current="page"' : ""}>${label}</a>`;
    }).join("");
  }

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

  function headerMarkup() {
    return `<a class="brand" href="/" aria-label="${SITE_NAME} home"><span class="brand-symbol" aria-hidden="true">📚</span><strong>${SITE_NAME}</strong></a><button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false">Menu</button><nav class="navlinks" aria-label="Primary navigation">${navMarkup()}</nav>`;
  }

  function headerIsCanonical(header) {
    const directChildren = [...header.children];
    return directChildren.length === 3 &&
      directChildren[0]?.classList.contains("brand") &&
      directChildren[1]?.classList.contains("menu-toggle") &&
      directChildren[2]?.classList.contains("navlinks") &&
      header.dataset.siteShellVersion === VERSION;
  }

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

  function render(options = {}) {
    ensureFavicon();
    if (isLessonPage()) return;
    ensureMobileHeaderStyles();
    const force = options.force === true;
    renderHeader(force);
    renderFooter(force);
  }

  window.PolySiteShell = Object.freeze({ render, version: VERSION, siteName: SITE_NAME });
  ensureFavicon();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => render({ force: true }), { once: true });
  } else {
    render({ force: true });
  }
})();
