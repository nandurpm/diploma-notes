(() => {
  "use strict";

  const VERSION = "20260720-audit-residual-fix2";
  const SITE_NAME = "POLY PMNA";
  const FAVICON_HREF = "/assets/media/poly-pmna-favicon.svg";
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
      button.setAttribute("aria-expanded", String(open));
      window.dispatchEvent(new CustomEvent("poly-site-header-resize"));
    };

    button.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
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
  }

  function renderHeader(force = false) {
    if (isLessonPage()) return;
    const header = document.querySelector("[data-site-header]") || document.querySelector("body.portal-page > header.topbar");
    if (!header) return;
    const desired = `<a class="brand" href="/" aria-label="${SITE_NAME} home"><span class="brand-symbol" aria-hidden="true">📚</span><strong>${SITE_NAME}</strong></a><button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">Menu</button><nav class="navlinks" aria-label="Primary navigation">${navMarkup()}</nav>`;
    if (force || header.dataset.siteShellVersion !== VERSION) {
      header.className = "topbar";
      header.innerHTML = desired;
      header.dataset.siteHeader = "";
      header.dataset.siteShellVersion = VERSION;
    }
    bindMenu(header);
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
