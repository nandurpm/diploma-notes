(() => {
  "use strict";

  const VERSION = "20260717-fixed-header-restore1";
  const SITE_NAME = "POLY PMNA";
  const currentPath = () => window.location.pathname.replace(/\/+$/, "") || "/";
  const isLessonPage = () => /\/(?:revision-2026-content\/)?lessons\/lessons-[^/]+\.html$/i.test(currentPath());
  const navItems = [
    {
      label: "Home",
      href: "/",
      matches: path => path === "/" || path.endsWith("/index.html")
    },
    {
      label: "About",
      href: "/about.html",
      matches: path => path.endsWith("/about.html")
    },
    {
      label: "Revision 2026",
      href: "/revision-2026.html",
      matches: path => path.endsWith("/revision-2026.html") || path.includes("/revision-2026/")
    },
    {
      label: "Revision 2021",
      href: "/revision-2021.html",
      matches: path => path.endsWith("/revision-2021.html") || path.includes("/revision-2021/")
    },
    {
      label: "Mock Exams",
      href: "/daily-quiz.html",
      matches: path => path.endsWith("/daily-quiz.html") || /\/mock-exam(?:-|\.html)/i.test(path)
    },
    {
      label: "Ask POLY AI",
      href: "/ask-poly.html",
      matches: path => /\/ask-poly(?:-v2)?\.html$/i.test(path)
    },
    {
      label: "2015 Materials",
      href: "/materials-2015.html",
      matches: path => path.endsWith("/materials-2015.html")
    },
    {
      label: "Tools",
      href: "/tools.html",
      matches: path => /\/tools(?:-v2|-v2-original)?\.html$/i.test(path)
    },
    {
      label: "Help",
      href: "/contact.html",
      matches: path => path.endsWith("/contact.html")
    }
  ];

  function linkMarkup(item, path) {
    const active = item.matches(path);
    return `<a href="${item.href}"${active ? ' class="active" aria-current="page"' : ""}>${item.label}</a>`;
  }

  function navMarkup() {
    const path = currentPath().toLowerCase();
    return navItems.map(item => linkMarkup(item, path)).join("");
  }

  function bindMenu(header) {
    const menuButton = header.querySelector(".menu-toggle");
    const nav = header.querySelector(".navlinks");
    if (!menuButton || !nav || menuButton.dataset.siteShellBound === "true") return;

    menuButton.dataset.siteShellBound = "true";

    const setMenuOpen = open => {
      nav.classList.toggle("open", open);
      header.classList.toggle("open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      window.dispatchEvent(new CustomEvent("poly-site-header-resize"));
    };

    menuButton.addEventListener("click", () => setMenuOpen(!nav.classList.contains("open")));
    nav.addEventListener("click", event => {
      if (event.target.closest("a")) setMenuOpen(false);
    });
    document.addEventListener("click", event => {
      if (!header.contains(event.target) && nav.classList.contains("open")) setMenuOpen(false);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        setMenuOpen(false);
        menuButton.focus();
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
    if (isLessonPage()) return;
    const force = options.force === true;
    renderHeader(force);
    renderFooter(force);
  }

  window.PolySiteShell = Object.freeze({ render, version: VERSION, siteName: SITE_NAME });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => render({ force: true }), { once: true });
  } else {
    render({ force: true });
  }
})();
