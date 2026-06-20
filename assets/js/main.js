(() => {
  "use strict";

  const NAV_ITEMS = [
    { label: "Home", href: "/index.html", match: [/^\/$/, /\/index\.html$/] },
    { label: "About", href: "/about.html", match: [/\/about\.html$/] },
    { label: "Revision 2021", href: "/revision-2021.html", match: [/\/revision-2021\.html$/, /\/revision-2021\//] },
    { label: "Mock Exams", href: "/daily-quiz.html", match: [/\/daily-quiz\.html$/, /\/mock-exam-/] },
    { label: "2015 Materials", href: "/materials-2015.html", match: [/\/materials-2015\.html$/] },
    { label: "Tools", href: "/tools.html", badge: "New", match: [/\/tools\.html$/] },
    { label: "Help", href: "/contact.html", match: [/\/contact\.html$/] }
  ];

  function addGlobalStyle() {
    if (document.getElementById("poly-tools-menu-fix-style")) return;
    const style = document.createElement("style");
    style.id = "poly-tools-menu-fix-style";
    style.textContent = `
      .new-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-left:5px!important;padding:2px 7px!important;border-radius:999px!important;background:#dcfae6!important;color:#067647!important;font-size:.66rem!important;font-weight:950!important;line-height:1!important;letter-spacing:.04em!important;text-transform:uppercase!important;vertical-align:middle!important}
      .topbar .navlinks a[href$="tools.html"]{white-space:nowrap!important}
      .site-notice{min-width:180px;max-width:min(42vw,560px);height:34px;overflow:hidden;border:1px solid rgba(49,88,244,.16);border-radius:999px;background:#eef6ff;color:#102a80;text-decoration:none;display:flex;align-items:center;gap:8px;padding:0 10px;font-size:.78rem;font-weight:850}.site-notice-label{background:#dcfae6;color:#067647;border-radius:999px;padding:3px 8px;text-transform:uppercase;font-size:.68rem;flex:0 0 auto}.site-notice-viewport{overflow:hidden;white-space:nowrap}.site-notice-track{display:inline-block;padding-left:10px;animation:polyNotice 24s linear infinite}@keyframes polyNotice{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      @media(max-width:760px){html,body{max-width:100%!important;overflow-x:hidden!important}.topbar{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;grid-template-areas:"brand menu" "notice notice" "nav nav"!important;gap:8px!important;width:100vw!important;max-width:100vw!important;margin:0!important;padding:8px 8px 10px!important;border-radius:0 0 18px 18px!important}.topbar .brand{grid-area:brand!important;min-width:0!important;overflow:hidden!important}.topbar .brand strong{display:block!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font-size:clamp(.9rem,4vw,1.12rem)!important}.topbar .menu-toggle{grid-area:menu!important;display:inline-flex!important;min-width:76px!important;min-height:42px!important;align-items:center!important;justify-content:center!important}.topbar .navlinks,.topbar .navlinks:not(.open){grid-area:nav!important;display:none!important;width:100%!important}.topbar .navlinks.open{display:grid!important;grid-template-columns:1fr!important;gap:7px!important}.topbar .navlinks a{width:100%!important;min-height:42px!important;padding:10px!important;display:flex!important;align-items:center!important;justify-content:center!important}.topbar .site-notice{grid-area:notice!important;max-width:calc(100vw - 16px)!important;height:36px!important;display:flex!important}.home-app-actions{display:flex!important;flex-wrap:wrap!important;gap:10px!important}.home-app-actions .app-download{display:inline-flex!important}}
    `;
    document.head.append(style);
  }

  function setupPrimaryNavigation() {
    const currentPath = window.location.pathname || "/";
    document.querySelectorAll(".topbar .navlinks").forEach((nav) => {
      if (nav.dataset.primaryNavNormalized === "true") return;
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
    document.querySelectorAll(".topbar").forEach((bar) => {
      const toggle = bar.querySelector(".menu-toggle");
      const nav = bar.querySelector(".navlinks");
      if (!toggle || !nav || toggle.dataset.mainInitialized === "true") return;
      toggle.dataset.mainInitialized = "true";
      const setOpen = (open) => {
        nav.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", String(open));
      };
      toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
      nav.addEventListener("click", (event) => { if (event.target.closest("a")) setOpen(false); });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape" && nav.classList.contains("open")) { setOpen(false); toggle.focus(); } });
    });
  }

  function setupSiteNotice() {
    const brand = document.querySelector(".topbar .brand");
    if (!brand || document.querySelector(".site-notice")) return;
    const message = [
      "Student Tools added: scientific calculator, voltage, CGPA, attendance, converters and career tools",
      "Use Mock Exams for daily quiz practice and score feedback",
      "Use Help to report broken links or corrections"
    ].join("  •  ");
    const notice = document.createElement("a");
    notice.className = "site-notice";
    notice.href = "/tools.html";
    notice.setAttribute("aria-label", "Open Student Tools update");
    notice.innerHTML = `<strong class="site-notice-label">Update</strong><span class="site-notice-viewport" aria-hidden="true"><span class="site-notice-track">${message}  ◆  ${message}  ◆  </span></span>`;
    brand.insertAdjacentElement("afterend", notice);
  }

  function cleanupHomepageExtras() {
    document.querySelectorAll(".student-tools-update,.apk-download-section,#student-tools-update,#apk-download-v2").forEach((section) => section.remove());
  }

  function setupHomepageToolsAccess() {
    const hero = document.querySelector(".home-compact-hero");
    const actions = hero?.querySelector(".hero-actions");
    if (actions && !actions.querySelector('a[href="tools.html"], a[href="/tools.html"]')) {
      const link = document.createElement("a");
      link.className = "btn ghost";
      link.href = "tools.html";
      link.textContent = "Student Tools";
      actions.insertBefore(link, actions.children[1] || null);
    }
    const grid = document.querySelector(".selection-grid");
    if (grid && !grid.querySelector('a[href="tools.html"], a[href="/tools.html"]')) {
      const card = document.createElement("a");
      card.className = "choice-card";
      card.href = "tools.html";
      card.innerHTML = `<span>TOOLS</span><h2>Student Tools</h2><p>Open calculators, converters, CGPA, attendance, electrical, civil, mechanical, computer and career tools.</p>`;
      const help = grid.querySelector('a[href$="contact.html"]');
      if (help) help.before(card); else grid.append(card);
    }
  }

  function setupMockExamLabels() {
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
    const path = window.location.pathname;
    if (!path.includes("/lessons/")) return;
    const params = new URLSearchParams(window.location.search);
    let revision = params.get("revision");
    const existing = [...document.querySelectorAll("a")].find((link) => /back to/i.test(link.textContent));
    if (revision !== "2015" && revision !== "2021") {
      revision = existing && /2015|materials-2015/i.test(`${existing.textContent} ${existing.getAttribute("href") || ""}`) ? "2015" : "2021";
    }
    const href = revision === "2015" ? "/materials-2015.html" : "/revision-2021.html";
    const text = revision === "2015" ? "Back to 2015 Materials" : "Back to Revision 2021";
    const link = existing || document.createElement("a");
    link.href = href;
    link.textContent = text;
    link.classList.add("curriculum-back");
    if (!existing) document.body.prepend(link);
  }

  function setupTables() {
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
    document.querySelectorAll(".home-video[poster]").forEach((video) => {
      video.addEventListener("ended", () => { video.pause(); video.currentTime = 0; video.load(); });
    });
  }

  addGlobalStyle();
  setupPrimaryNavigation();
  setupMockExamLabels();
  document.addEventListener("DOMContentLoaded", () => {
    addGlobalStyle();
    cleanupHomepageExtras();
    setupPrimaryNavigation();
    setupMockExamLabels();
    setupSiteNotice();
    setupHomepageToolsAccess();
    document.querySelectorAll("[data-year]").forEach((item) => { item.textContent = new Date().getFullYear(); });
    setupMenu();
    setupHomepageVideoPoster();
    renderMaterialLinks();
    setupLessonBackLinks();
    setupTables();
  });
})();
