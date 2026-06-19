(() => {
  "use strict";

  const NAV_ITEMS = [
    { label: "Home", href: "/index.html", match: [/^\/$/, /\/index\.html$/] },
    { label: "About", href: "/about.html", match: [/\/about\.html$/] },
    { label: "Revision 2021", href: "/revision-2021.html", match: [/\/revision-2021\.html$/, /\/revision-2021\//] },
    { label: "Mock Exams", href: "/daily-quiz.html", match: [/\/daily-quiz\.html$/, /\/mock-exam-/] },
    { label: "2015 Materials", href: "/materials-2015.html", match: [/\/materials-2015\.html$/] },
    { label: "Question Papers", href: "/model-question-papers.html", match: [/\/model-question-papers\.html$/, /\/previous-question-papers\.html$/] },
    { label: "Help", href: "/contact.html", match: [/\/contact\.html$/] }
  ];

  function setupMobileHeaderHotfix() {
    if (document.getElementById("mobile-header-inline-nav-hotfix")) return;
    const style = document.createElement("style");
    style.id = "mobile-header-inline-nav-hotfix";
    style.textContent = `
      @media (max-width: 760px) {
        html, body { max-width: 100% !important; overflow-x: hidden !important; }
        html body .topbar {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) auto !important;
          grid-template-areas:
            "brand menu"
            "notice notice"
            "nav nav" !important;
          grid-auto-flow: row !important;
          grid-auto-rows: auto !important;
          align-items: center !important;
          width: 100vw !important;
          max-width: 100vw !important;
          margin: 0 !important;
          padding: 8px 8px 10px !important;
          gap: 8px !important;
          overflow-x: hidden !important;
          border-radius: 0 0 18px 18px !important;
        }
        html body .topbar .brand {
          grid-area: brand !important;
          grid-column: 1 !important;
          grid-row: 1 !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          overflow: hidden !important;
        }
        html body .topbar .brand .brand-symbol,
        html body .topbar .brand > span:first-child {
          flex: 0 0 42px !important;
          width: 42px !important;
          height: 42px !important;
          min-width: 42px !important;
          border-radius: 14px !important;
        }
        html body .topbar .brand .brand-copy,
        html body .topbar .brand > .brand-symbol + span {
          display: grid !important;
          min-width: 0 !important;
          max-width: 100% !important;
          overflow: hidden !important;
        }
        html body .topbar .brand strong,
        html body .topbar .brand small {
          display: block !important;
          max-width: 100% !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        html body .topbar .brand strong {
          font-size: clamp(0.9rem, 4vw, 1.12rem) !important;
          line-height: 1.05 !important;
        }
        html body .topbar .brand small {
          font-size: 0.72rem !important;
          line-height: 1.15 !important;
        }
        html body .topbar .menu-toggle {
          grid-area: menu !important;
          grid-column: 2 !important;
          grid-row: 1 !important;
          display: inline-flex !important;
          visibility: visible !important;
          align-items: center !important;
          justify-content: center !important;
          width: auto !important;
          min-width: 76px !important;
          height: auto !important;
          min-height: 42px !important;
          padding: 8px 14px !important;
          margin: 0 !important;
          border-radius: 999px !important;
          font-size: 0.92rem !important;
          line-height: 1 !important;
          white-space: nowrap !important;
          overflow: visible !important;
        }
        html body .topbar .navlinks,
        html body .topbar .navlinks:not(.open) {
          grid-area: nav !important;
          grid-column: 1 / -1 !important;
          grid-row: 3 !important;
          display: none !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          height: auto !important;
          min-height: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: hidden !important;
        }
        html body .topbar .navlinks.open {
          grid-area: nav !important;
          grid-column: 1 / -1 !important;
          grid-row: 3 !important;
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 7px !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          padding-top: 3px !important;
          margin: 0 !important;
          overflow: hidden !important;
        }
        html body .topbar .navlinks a,
        html body .topbar .navlinks.open a {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          min-height: 42px !important;
          padding: 10px !important;
          font-size: 0.86rem !important;
          font-weight: 800 !important;
          line-height: 1.1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          border-radius: 999px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        html body .topbar .site-notice {
          grid-area: notice !important;
          grid-column: 1 / -1 !important;
          grid-row: 2 !important;
          width: 100% !important;
          max-width: calc(100vw - 16px) !important;
          min-width: 0 !important;
          height: 38px !important;
          display: flex !important;
          align-items: center !important;
          justify-self: stretch !important;
          overflow: hidden !important;
        }
        html body .topbar .site-notice > .site-notice-label {
          flex: 0 0 auto !important;
          height: 100% !important;
          padding: 0 13px !important;
          margin: 0 7px 0 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          font-size: 0.82rem !important;
        }
        html body .topbar .site-notice > .site-notice-viewport {
          min-width: 0 !important;
          overflow: hidden !important;
        }
        html body .topbar .site-notice .site-notice-track {
          font-size: 0.82rem !important;
        }
      }
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
        const isActive = item.match.some((pattern) => pattern.test(currentPath)) || existingActiveHref.endsWith(item.href.replace(/^\//, ""));
        if (isActive) {
          link.classList.add("active");
          link.setAttribute("aria-current", "page");
        }
        nav.append(link);
      });
    });
  }

  function setupQuizRuntime() {
    const Q = window.PolyQuiz;
    const warning = document.getElementById("serviceWarning");
    if (!Q || !warning || warning.dataset.runtimeReady === "true") return;

    warning.dataset.runtimeReady = "true";
    warning.innerHTML = `
      <span class="service-warning-text">Quiz service is temporarily down. Guest mode still works. Try again later.</span>
      <button class="btn soft service-retry-button" type="button">Retry Service</button>
    `;

    const textNode = warning.querySelector(".service-warning-text");
    const retryButton = warning.querySelector(".service-retry-button");

    const originalShow = Q.showServiceWarning;
    Q.showServiceWarning = (text) => {
      if (textNode) textNode.textContent = text || "Quiz service is temporarily down. Guest mode still works. Try again later.";
      warning.classList.remove("hidden");
      if (typeof originalShow === "function") originalShow(text);
    };

    const originalHide = Q.hideServiceWarning;
    Q.hideServiceWarning = () => {
      warning.classList.add("hidden");
      if (typeof originalHide === "function") originalHide();
    };

    retryButton?.addEventListener("click", () => Q.retryService?.());
    window.addEventListener("online", () => {
      if (Q.state?.mode === "authenticated" && !warning.classList.contains("hidden")) {
        Q.retryService?.();
      }
    });
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
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  function setupSiteNotice() {
    const brand = document.querySelector(".topbar .brand");
    if (!brand) return;

    const englishNotice = [
      "📚 Use Revision 2021 for current department and semester subject cards",
      "📝 Open Mock Exams for daily quiz practice and saved score feedback",
      "🗂 Use 2015 Materials only for older-scheme resources",
      "📄 Question Papers contains model, sample and exam-practice resources",
      "💬 Report broken links, missing subjects or corrections through Help",
      "✅ Always verify syllabus, marks and exam notices with official SITTTR and institution updates"
    ].join("  •  ");

    const malayalamNotice = [
      "📚 നിലവിലെ department/semester subject cards കാണാൻ Revision 2021 ഉപയോഗിക്കുക",
      "📝 daily quiz practice, saved score feedback എന്നിവയ്ക്ക് Mock Exams തുറക്കുക",
      "🗂 പഴയ scheme ആവശ്യങ്ങൾക്ക് മാത്രം 2015 Materials ഉപയോഗിക്കുക",
      "📄 model, sample, exam-practice resources Question Papersൽ ലഭിക്കും",
      "💬 broken links, missing subjects, corrections എന്നിവ Help വഴി അറിയിക്കുക",
      "✅ syllabus, marks, exam notices എന്നിവ official SITTTR/institution updates ഉപയോഗിച്ച് പരിശോധിക്കുക"
    ].join("  •  ");

    const message = `${englishNotice}  ◆  ${malayalamNotice}`;
    const notice = document.querySelector(".site-notice") || document.createElement("a");
    notice.className = "site-notice";
    notice.href = "/about.html#site-guide";
    notice.dataset.floatingInstructions = "true";
    notice.setAttribute("aria-label", "Floating website instructions and important study-resource updates");
    notice.innerHTML = `
      <strong class="site-notice-label">Update</strong>
      <span class="site-notice-viewport" aria-hidden="true">
        <span class="site-notice-track">${message}  ◆  ${message}  ◆  </span>
      </span>
    `;

    if (!notice.parentElement) brand.insertAdjacentElement("afterend", notice);
  }

  function setupHomepageVideoPoster() {
    document.querySelectorAll(".home-video[poster]").forEach((video) => {
      video.addEventListener("ended", () => {
        video.pause();
        video.currentTime = 0;
        video.load();
      });
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
      revision = existing && /2015|materials-2015/i.test(`${existing.textContent} ${existing.getAttribute("href") || ""}`)
        ? "2015"
        : "2021";
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
      table.querySelectorAll("thead th").forEach((header) => {
        if (!header.hasAttribute("scope")) header.scope = "col";
      });
      if (table.parentElement?.matches(".table-wrapper, .table-wrap, .tbl")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";
      table.before(wrapper);
      wrapper.append(table);
    });
  }

  setupMobileHeaderHotfix();
  setupQuizRuntime();
  setupPrimaryNavigation();
  setupMockExamLabels();

  document.addEventListener("DOMContentLoaded", () => {
    setupMobileHeaderHotfix();
    setupQuizRuntime();
    setupPrimaryNavigation();
    setupMockExamLabels();
    setupSiteNotice();
    document.querySelectorAll("[data-year]").forEach((item) => {
      item.textContent = new Date().getFullYear();
    });
    setupMenu();
    setupHomepageVideoPoster();
    renderMaterialLinks();
    setupLessonBackLinks();
    setupTables();
  });
})();
