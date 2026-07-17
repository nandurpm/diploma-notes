(() => {
  "use strict";
  const VERSION = "20260717-site-shell1";
  const SITE_NAME = "POLY PMNA";
  const NAV_ITEMS = [
    { label: "Home", href: "/index.html", matches: p => p === "/" || p.endsWith("/index.html") },
    { label: "About", href: "/about.html", matches: p => p.endsWith("/about.html") },
    { label: "Revision 2026", href: "/revision-2026.html", matches: p => p.endsWith("/revision-2026.html") || p.includes("/revision-2026/") },
    { label: "Revision 2021", href: "/revision-2021.html", matches: p => p.endsWith("/revision-2021.html") || p.includes("/revision-2021/") },
    { label: "Mock Exams", href: "/daily-quiz.html", matches: p => p.endsWith("/daily-quiz.html") || /\/mock-exam(?:-|\.html)/i.test(p) },
    { label: "Ask POLY AI", href: "/ask-poly.html", matches: p => /\/ask-poly(?:-v2)?\.html$/i.test(p) },
    { label: "2015 Materials", href: "/materials-2015.html", matches: p => p.endsWith("/materials-2015.html") },
    { label: "Tools", href: "/tools.html", matches: p => /\/tools(?:-v2|-v2-original)?\.html$/i.test(p) },
    { label: "Help", href: "/contact.html", matches: p => p.endsWith("/contact.html") }
  ];
  const path = () => window.location.pathname.replace(/\/+$/, "") || "/";
  function navMarkup() {
    const current = path().toLowerCase();
    return NAV_ITEMS.map(item => {
      const active = item.matches(current);
      return `<a href="${item.href}"${active ? ' class="active" aria-current="page"' : ""}>${item.label}</a>`;
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
    nav.addEventListener("click", event => { if (event.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && nav.classList.contains("open")) { setOpen(false); button.focus(); }
    });
  }
  function renderHeader(force = false) {
    const header = document.querySelector("[data-site-header], header.topbar");
    if (!header) return;
    const desired = `<a class="brand" href="/index.html" aria-label="${SITE_NAME} home"><span class="brand-symbol" aria-hidden="true">📚</span><strong>${SITE_NAME}</strong></a><button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">Menu</button><nav class="navlinks" aria-label="Primary navigation">${navMarkup()}</nav>`;
    if (force || header.dataset.siteShellVersion !== VERSION) {
      header.className = "topbar";
      header.innerHTML = desired;
      header.dataset.siteHeader = "";
      header.dataset.siteShellVersion = VERSION;
    }
    bindMenu(header);
  }
  function renderFooter(force = false) {
    const footer = document.querySelector("[data-site-footer], footer.footer");
    if (!footer) return;
    const desired = `<p>&copy; <span data-year>${new Date().getFullYear()}</span> ${SITE_NAME}.</p><a href="https://nandakumarm.dpdns.org/about.html" target="_blank" rel="noopener noreferrer">Connect to Developer</a><nav class="footer-legal" aria-label="Legal"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/disclaimer.html">Disclaimer</a></nav>`;
    if (force || footer.dataset.siteShellVersion !== VERSION) {
      footer.className = "footer";
      footer.innerHTML = desired;
      footer.dataset.siteFooter = "";
      footer.dataset.siteShellVersion = VERSION;
    }
  }
  function render(options = {}) {
    const force = options.force === true;
    renderHeader(force);
    renderFooter(force);
  }
  window.PolySiteShell = Object.freeze({ render, version: VERSION, siteName: SITE_NAME });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => render({ force: true }), { once: true });
  else render({ force: true });
})();
