(() => {
  "use strict";

  const TOOLS_URL = "/tools-v2.html";
  const UNIFIED_CSS = "/assets/css/site-unified.css?v=20260620-unified1";
  const LESSON_PAGE = /\/lessons\//.test(window.location.pathname || "");
  const NAV_ITEMS = [
    { label: "Home", href: "/index.html", match: [/^\/$/, /\/index\.html$/] },
    { label: "About", href: "/about.html", match: [/\/about\.html$/] },
    { label: "Revision 2021", href: "/revision-2021.html", match: [/\/revision-2021\.html$/, /\/revision-2021\//] },
    { label: "Mock Exams", href: "/daily-quiz.html", match: [/\/daily-quiz\.html$/, /\/mock-exam(?:-|\.html)/] },
    { label: "2015 Materials", href: "/materials-2015.html", match: [/\/materials-2015\.html$/] },
    { label: "Tools", href: TOOLS_URL, badge: "New", match: [/\/tools-v2\.html$/, /\/tools\.html$/] },
    { label: "Help", href: "/contact.html", match: [/\/contact\.html$/] }
  ];

  function injectUnifiedCss() {
    if (LESSON_PAGE) return;
    if (document.querySelector('link[href*="/assets/css/site-unified.css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = UNIFIED_CSS;
    document.head.append(link);
  }

  function addGlobalStyle() {
    if (LESSON_PAGE) return;
    injectUnifiedCss();
    if (document.getElementById("poly-menu-tools-fix")) return;
    const style = document.createElement("style");
    style.id = "poly-menu-tools-fix";
    style.textContent = `
      .student-tools-update,.apk-download-section,#student-tools-update,#apk-download-v2{display:none!important}
      html body .topbar{overflow:visible!important}
      html body .topbar .navlinks{align-items:center!important;gap:8px!important;overflow:visible!important}
      html body .topbar .navlinks a{height:42px!important;min-height:42px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0 14px!important;line-height:1!important;white-space:nowrap!important;overflow-wrap:normal!important;text-align:center!important;flex:0 0 auto!important}
      html body .topbar .navlinks a:hover,html body .topbar .navlinks a.active{transform:none!important}
      .new-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-left:5px!important;padding:2px 7px!important;border-radius:999px!important;background:#dcfae6!important;color:#067647!important;font-size:.62rem!important;font-weight:950!important;line-height:1!important;text-transform:uppercase!important;vertical-align:middle!important;white-space:nowrap!important}
      @media(max-width:980px){
        html body .topbar{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;grid-template-areas:"brand menu" "nav nav"!important;gap:8px!important;align-items:center!important;width:100%!important;max-width:100%!important;overflow:visible!important;padding:8px!important;border-radius:0 0 18px 18px!important}
        html body .topbar .brand{grid-area:brand!important;grid-column:auto!important;grid-row:auto!important;min-width:0!important;width:auto!important;max-width:100%!important;overflow:hidden!important}
        html body .topbar .brand strong{display:block!important;max-width:calc(100vw - 112px)!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
        html body .topbar .menu-toggle{grid-area:menu!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:78px!important;min-height:42px!important;padding:9px 14px!important;margin:0!important;border-radius:999px!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:5!important}
        html body .topbar .site-notice{display:none!important}
        html body .topbar .navlinks{grid-area:nav!important;grid-column:1/-1!important;grid-row:auto!important;display:none!important;width:100%!important;min-width:0!important;overflow:visible!important;padding:0!important;margin:0!important}
        html body .topbar .navlinks.open{display:grid!important;grid-template-columns:1fr!important;gap:7px!important}
        html body .topbar .navlinks.open a{width:100%!important;height:44px!important;min-height:44px!important;padding:0 12px!important;font-size:.88rem!important;border-radius:14px!important;white-space:nowrap!important;overflow-wrap:normal!important;justify-content:center!important}
      }
    `;
    document.head.append(style);
  }

  function setupPrimaryNavigation() {
    if (LESSON_PAGE) return;
    const currentPath = window.location.pathname || "/";
    document.querySelectorAll(".topbar .navlinks").forEach((nav) => {
      const existingActiveHref = nav.querySelector('a.active, a[aria-current="page"]')?.getAttribute("href") || "";
      nav.dataset.primaryNavNormalized = "true";
      nav.replaceChildren();
      NAV_ITEMS.forEach((item) => {
        const link = document.createElement("a");
        link.href = item.href;
        link.textContent = item.label;
        if (item.badge) {
          link.append(" ");
          const badge = document.createElement("span");
          badge.className = "new-badge";
          badge.textContent = item.badge;
          link.append(badge);
        }
        const active = item.match.some((pattern) => pattern.test(currentPath)) || existingActiveHref.endsWith(item.href.replace(/^\//, ""));
        if (active) {
          link.classList.add("active");
          link.setAttribute("aria-current", "page");
        }
        nav.append(link);
      });
    });
  }

  function setupMenu() {
    if (LESSON_PAGE) return;
    document.querySelectorAll(".topbar").forEach((bar) => {
      const toggle = bar.querySelector(".menu-toggle");
      const nav = bar.querySelector(".navlinks");
      if (!toggle || !nav || toggle.dataset.mainInitialized === "true") return;
      toggle.dataset.mainInitialized = "true";
      const setOpen = (open) => {
        nav.classList.toggle("open", open);
        bar.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", String(open));
      };
      toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
      nav.addEventListener("click", (event) => { if (event.target.closest("a")) setOpen(false); });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape" && nav.classList.contains("open")) { setOpen(false); toggle.focus(); } });
    });
  }

  function normalizeFooter() {
    if (LESSON_PAGE) return;
    document.querySelectorAll(".footer").forEach((footer) => {
      let copyright = footer.querySelector("p");
      if (!copyright) {
        copyright = document.createElement("p");
        footer.prepend(copyright);
      }
      if (!copyright.querySelector("[data-year],#year")) {
        copyright.innerHTML = "&copy; <span data-year></span> Diploma Notes.";
      }
      if (!footer.querySelector('a[href*="nandakumarm.dpdns.org"]')) {
        const developer = document.createElement("a");
        developer.href = "https://nandakumarm.dpdns.org/about.html";
        developer.target = "_blank";
        developer.rel = "noopener noreferrer";
        developer.textContent = "Connect to Developer";
        footer.append(developer);
      }
      let legal = footer.querySelector(".footer-legal");
      if (!legal) {
        legal = document.createElement("nav");
        legal.className = "footer-legal";
        legal.setAttribute("aria-label", "Legal");
        footer.append(legal);
      }
      legal.innerHTML = '<a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/disclaimer.html">Disclaimer</a>';
    });
  }

  function cleanupHomepageExtras() {
    if (LESSON_PAGE) return;
    document.querySelectorAll(".student-tools-update,.apk-download-section,#student-tools-update,#apk-download-v2").forEach((section) => section.remove());
  }

  function setupHomepageToolsAccess() {
    if (LESSON_PAGE) return;
    const actions = document.querySelector(".home-compact-hero .hero-actions");
    if (actions && !actions.querySelector('a[href="/tools-v2.html"], a[href="tools-v2.html"], a[href="/tools.html"], a[href="tools.html"]')) {
      const link = document.createElement("a");
      link.className = "btn ghost";
      link.href = TOOLS_URL;
      link.textContent = "Student Tools";
      actions.insertBefore(link, actions.children[1] || null);
    }
    document.querySelectorAll('a[href="tools.html"], a[href="/tools.html"]').forEach((link) => {
      if ((link.textContent || "").toLowerCase().includes("tool")) link.href = TOOLS_URL;
    });
    const grid = document.querySelector(".selection-grid");
    if (grid && !grid.querySelector('a[href="/tools-v2.html"], a[href="tools-v2.html"], a[href="/tools.html"], a[href="tools.html"]')) {
      const card = document.createElement("a");
      card.className = "choice-card";
      card.href = TOOLS_URL;
      card.innerHTML = `<span>TOOLS</span><h2>Student Tools</h2><p>Open professional calculators, converters, CGPA, attendance, electrical, civil, mechanical, computer and career tools.</p>`;
      const help = grid.querySelector('a[href$="contact.html"]');
      if (help) help.before(card); else grid.append(card);
    }
  }

  function setupMockExamLabels() {
    if (LESSON_PAGE) return;
    document.querySelectorAll('a[href$="daily-quiz.html"], a[href$="/daily-quiz.html"]').forEach((link) => {
      const label = (link.textContent || "").trim();
      if (/^(daily quiz|quiz|mock exams?)$/i.test(label)) link.textContent = "Mock Exams";
    });
    document.querySelectorAll('.choice-card[href$="daily-quiz.html"], .choice-card[href$="/daily-quiz.html"]').forEach((card) => {
      const badge = card.querySelector("span");
      const title = card.querySelector("h2");
      const description = card.querySelector("p");
      if (badge) badge.textContent = "EXAMS";
      if (title) title.textContent = "Mock Exams";
      if (description) description.textContent = "Attend daily subject quizzes and full syllabus-based mock examinations with saved scores and feedback.";
    });
  }

  function renderMaterialLinks() {
    if (LESSON_PAGE) return;
    document.querySelectorAll("[data-link-group]").forEach((container) => {
      const group = globalThis.MATERIALS_2015?.[container.dataset.linkGroup] || [];
      container.replaceChildren();
      group.forEach((item) => {
        const link = document.createElement("a");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = item.label;
        container.append(link);
      });
    });
  }

  function setupLessonBackLinks() {
    /* Disabled: injecting a body-level back link broke the top of lesson pages. */
  }

  function setupTables() {
    if (LESSON_PAGE) return;
    document.querySelectorAll("table").forEach((table) => {
      table.querySelectorAll("thead th").forEach((header) => { if (!header.hasAttribute("scope")) header.scope = "col"; });
      if (table.parentElement?.matches(".table-wrapper, .table-wrap, .tbl")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";
      table.before(wrapper);
      wrapper.append(table);
    });
  }

  function setupHomepageVideoPoster() {
    if (LESSON_PAGE) return;
    document.querySelectorAll(".home-video[poster]").forEach((video) => {
      video.addEventListener("ended", () => { video.pause(); video.currentTime = 0; video.load(); });
    });
  }

  function updateYears() {
    document.querySelectorAll("[data-year],#year").forEach((item) => { item.textContent = new Date().getFullYear(); });
  }

  addGlobalStyle();
  setupPrimaryNavigation();
  setupMockExamLabels();
  document.addEventListener("DOMContentLoaded", () => {
    addGlobalStyle();
    cleanupHomepageExtras();
    setupPrimaryNavigation();
    setupMockExamLabels();
    setupHomepageToolsAccess();
    normalizeFooter();
    updateYears();
    setupMenu();
    setupHomepageVideoPoster();
    renderMaterialLinks();
    setupLessonBackLinks();
    setupTables();
  });
})();
