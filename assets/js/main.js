(() => {
  "use strict";

  const NAV_ITEMS = [
    { label: "Home", href: "/index.html", match: [/^\/$/, /\/index\.html$/] },
    { label: "About", href: "/about.html", match: [/\/about\.html$/] },
    { label: "Revision 2021", href: "/revision-2021.html", match: [/\/revision-2021\.html$/, /\/revision-2021\//] },
    { label: "Mock Exams", href: "/daily-quiz.html", match: [/\/daily-quiz\.html$/, /\/mock-exam-/] },
    { label: "2015 Materials", href: "/materials-2015.html", match: [/\/materials-2015\.html$/] },
    { label: "Tools", href: "/tools.html", match: [/\/tools\.html$/] },
    { label: "Help", href: "/contact.html", match: [/\/contact\.html$/] }
  ];

  function addGlobalStyle() {
    if (document.getElementById("poly-tools-v2-style")) return;
    const style = document.createElement("style");
    style.id = "poly-tools-v2-style";
    style.textContent = `
      .new-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-left:5px!important;padding:2px 7px!important;border-radius:999px!important;background:#dcfae6!important;color:#067647!important;font-size:.66rem!important;font-weight:950!important;line-height:1!important;letter-spacing:.04em!important;text-transform:uppercase!important}
      .student-tools-update,.apk-download-section{margin:18px clamp(14px,2.6vw,42px);border:1px solid rgba(49,88,244,.18);border-radius:24px;box-shadow:0 16px 44px rgba(30,55,90,.11);overflow:hidden;background:#fff}
      .student-tools-update{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;padding:22px;background:linear-gradient(135deg,#f7fbff,#eef7ff)}
      .student-tools-update .badge{display:inline-flex;width:max-content;border-radius:999px;background:#dcfae6;color:#067647;padding:6px 12px;font-size:.8rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
      .student-tools-update h2,.apk-download-section h2{margin:8px 0 8px;color:#102a80;font-size:clamp(1.45rem,2.6vw,2.15rem)}
      .student-tools-update p,.apk-download-section p{margin:0;color:#475467;line-height:1.55}
      .student-tools-update .btn,.apk-download-section .download-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:12px 18px;border-radius:999px;background:linear-gradient(135deg,#3158f4,#0ea5c6);color:#fff;font-weight:950;text-decoration:none;box-shadow:0 12px 28px rgba(49,88,244,.22)}
      .apk-download-section{display:grid;grid-template-columns:1.2fr .8fr;gap:18px;padding:22px}.apk-version-card{border-radius:18px;background:#f1f7ff;border:1px solid #d8e4f3;padding:16px}.apk-version-card strong{display:block;color:#102a80;font-size:1.05rem;margin-bottom:6px}.apk-note{font-size:.92rem;color:#667085;margin-top:10px!important}
      .topbar .navlinks a{min-width:max-content!important;height:42px!important;min-height:42px!important;padding:0 14px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;line-height:1!important;white-space:nowrap!important}
      @media(max-width:760px){html,body{max-width:100%!important;overflow-x:hidden!important}.topbar{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;grid-template-areas:"brand menu" "notice notice" "nav nav"!important;gap:8px!important;width:100vw!important;max-width:100vw!important;margin:0!important;padding:8px 8px 10px!important;border-radius:0 0 18px 18px!important}.topbar .brand{grid-area:brand!important;min-width:0!important;overflow:hidden!important}.topbar .brand strong{display:block!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font-size:clamp(.9rem,4vw,1.12rem)!important}.topbar .menu-toggle{grid-area:menu!important;display:inline-flex!important;min-width:76px!important;min-height:42px!important;align-items:center!important;justify-content:center!important}.topbar .navlinks,.topbar .navlinks:not(.open){grid-area:nav!important;display:none!important;width:100%!important}.topbar .navlinks.open{display:grid!important;grid-template-columns:1fr!important;gap:7px!important}.topbar .navlinks a{width:100%!important;min-height:42px!important;padding:10px!important;display:flex!important;align-items:center!important;justify-content:center!important}.topbar .site-notice{grid-area:notice!important;max-width:calc(100vw - 16px)!important;height:38px!important;display:flex!important}.student-tools-update,.apk-download-section{grid-template-columns:1fr;margin-inline:10px}.student-tools-update .btn,.apk-download-section .download-btn{width:100%}}
    `;
    document.head.append(style);
  }

  function setupPrimaryNavigation() {
    const currentPath = window.location.pathname || "/";
    document.querySelectorAll(".topbar .navlinks").forEach((nav) => {
      const existingActiveHref = nav.querySelector('a.active, a[aria-current="page"]')?.getAttribute("href") || "";
      nav.dataset.primaryNavNormalized = "true";
      nav.replaceChildren();
      NAV_ITEMS.forEach((item) => {
        const link = document.createElement("a");
        link.href = item.href;
        link.textContent = item.label;
        const isActive = item.match.some((pattern) => pattern.test(currentPath)) || existingActiveHref.endsWith(item.href.replace(/^\//, ""));
        if (isActive) {
          link.classList.add("active");
          link.setAttribute("aria-current", "page");
        }
        nav.append(link);
      });
    });
  }

  function setupMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".navlinks");
    if (!toggle || !nav || toggle.dataset.mainInitialized === "true") return;
    toggle.dataset.mainInitialized = "true";
    const setOpen = (open) => {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
    nav.addEventListener("click", (event) => { if (event.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && nav.classList.contains("open")) { setOpen(false); toggle.focus(); } });
  }

  function setupSiteNotice() {
    const brand = document.querySelector(".topbar .brand");
    if (!brand) return;
    const message = [
      "🧰 Student Tools added: calculators, converters, CGPA, attendance, electrical, civil, mechanical, computer and career helpers",
      "📚 Use Revision 2021 for current department and semester subject cards",
      "📝 Open Mock Exams for daily quiz practice and saved score feedback",
      "🗂 Use 2015 Materials only for older-scheme resources",
      "💬 Report broken links, missing subjects or corrections through Help"
    ].join("  •  ");
    const notice = document.querySelector(".site-notice") || document.createElement("a");
    notice.className = "site-notice";
    notice.href = "/tools.html";
    notice.dataset.floatingInstructions = "true";
    notice.setAttribute("aria-label", "Website instructions and Student Tools update");
    notice.innerHTML = `<strong class="site-notice-label">Update</strong><span class="site-notice-viewport" aria-hidden="true"><span class="site-notice-track">${message}  ◆  ${message}  ◆  </span></span>`;
    if (!notice.parentElement) brand.insertAdjacentElement("afterend", notice);
  }

  function setupHomepageStudentToolsUpdate() {
    const hero = document.querySelector(".home-compact-hero");
    if (!hero || document.getElementById("student-tools-update")) return;
    document.querySelectorAll(".app-download").forEach((button) => {
      button.href = "/downloads/POLY_PMNA_v2.0.apk";
      button.setAttribute("download", "POLY_PMNA_v2.0.apk");
      button.dataset.requiredVersion = "2.0";
      button.dataset.appButtonState = "download";
      button.setAttribute("aria-label", "Download POLY PMNA Android version 2.0");
      button.textContent = "📱 Download Latest APK";
    });
    const update = document.createElement("section");
    update.id = "student-tools-update";
    update.className = "student-tools-update reveal";
    update.setAttribute("aria-label", "New Student Tools update");
    update.innerHTML = `<div><span class="badge">New Update</span><h2>Student Tools Added</h2><p>Scientific calculator, voltage calculator, CGPA calculator, attendance calculator, engineering converters, resume builder and more tools are now available.</p></div><a class="btn" href="tools.html">Explore Student Tools</a>`;
    const apk = document.createElement("section");
    apk.id = "apk-download-v2";
    apk.className = "apk-download-section reveal";
    apk.setAttribute("aria-label", "Android app download");
    apk.innerHTML = `<div><h2>Download POLY PMNA Android App</h2><p>Get the latest POLY PMNA Android app with the new Student Tools section, mock exams, syllabus materials, notes, and engineering calculators.</p><p class="apk-note">Latest Version: <strong>v2.0</strong><br>Updated: Student Tools Added</p></div><div class="apk-version-card"><strong>POLY PMNA v2.0</strong><p>Includes Tools navigation, engineering calculators, converters, resume/letter tools and improved student utility experience.</p><br><a href="downloads/POLY_PMNA_v2.0.apk" download class="download-btn">Download Latest APK</a></div>`;
    hero.insertAdjacentElement("afterend", apk);
    hero.insertAdjacentElement("afterend", update);
    const actions = hero.querySelector(".hero-actions");
    if (actions && !actions.querySelector('a[href="tools.html"]')) {
      const link = document.createElement("a");
      link.className = "btn ghost";
      link.href = "tools.html";
      link.textContent = "Explore Student Tools";
      actions.insertBefore(link, actions.children[1] || null);
    }
    const grid = document.querySelector(".selection-grid");
    if (grid && !grid.querySelector('a[href="tools.html"]')) {
      const card = document.createElement("a");
      card.className = "choice-card";
      card.href = "tools.html";
      card.innerHTML = `<span>TOOLS</span><h2>Student Tools</h2><p>Open scientific calculator, converters, CGPA, attendance, electrical, civil, mechanical, computer and career tools.</p>`;
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
    setupPrimaryNavigation();
    setupMockExamLabels();
    setupSiteNotice();
    document.querySelectorAll("[data-year]").forEach((item) => { item.textContent = new Date().getFullYear(); });
    setupMenu();
    setupHomepageStudentToolsUpdate();
    setupHomepageVideoPoster();
    renderMaterialLinks();
    setupLessonBackLinks();
    setupTables();
  });
})();
