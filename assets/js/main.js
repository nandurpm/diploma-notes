(() => {
  "use strict";

  const TOOLS_URL = "/tools.html";
  const LESSON_PAGE = /\/lessons\//.test(window.location.pathname || "");
  const ONAM_VERSION = "20260702-onam1";

  function normalizeToolLinks() {
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (/tools(?:-v2|-v2-original)?\.html/i.test(href)) {
        link.setAttribute("href", href.startsWith("http") ? "https://polypmna.dpdns.org/tools.html" : TOOLS_URL);
      }
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
      if (!copyright.querySelector("[data-year],#year")) copyright.innerHTML = "&copy; <span data-year></span> Diploma Notes.";
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
    normalizeToolLinks();
    const actions = document.querySelector(".home-compact-hero .hero-actions");
    if (actions && !actions.querySelector('a[href="/tools.html"], a[href="tools.html"]')) {
      const link = document.createElement("a");
      link.className = "btn ghost";
      link.href = TOOLS_URL;
      link.textContent = "Student Tools";
      actions.insertBefore(link, actions.children[1] || null);
    }
    const grid = document.querySelector(".selection-grid");
    if (grid && !grid.querySelector('a[href="/tools.html"], a[href="tools.html"]')) {
      const card = document.createElement("a");
      card.className = "choice-card";
      card.href = TOOLS_URL;
      card.innerHTML = '<span>TOOLS</span><h2>Student Tools</h2><p>Open professional calculators, converters, CGPA, attendance, electrical, civil, mechanical, academic and text tools.</p>';
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
      video.setAttribute("preload", "metadata");
      video.addEventListener("ended", () => { video.pause(); video.currentTime = 0; video.load(); });
    });
  }

  function updateYears() {
    document.querySelectorAll("[data-year],#year").forEach((item) => { item.textContent = new Date().getFullYear(); });
  }

  function loadLessonNotesFallback() {
    if (LESSON_PAGE || !document.getElementById("subjectGrid")) return;
    const path = "/assets/js/lesson-availability-hotfix.js?v=20260701-notes-dedupe1";
    const alreadyLoaded = [...document.scripts].some((script) => {
      try { return new URL(script.src || "", window.location.href).pathname === "/assets/js/lesson-availability-hotfix.js"; }
      catch { return false; }
    });
    if (alreadyLoaded) return;
    const script = document.createElement("script");
    script.src = path;
    script.defer = true;
    document.head.append(script);
  }

  function loadOnamTheme() {
    if (document.getElementById("poly-onam-theme-script")) return;
    const cssPath = `/assets/css/onam-theme.css?v=${ONAM_VERSION}`;
    if (!document.getElementById("poly-onam-theme-css")) {
      const link = document.createElement("link");
      link.id = "poly-onam-theme-css";
      link.rel = "stylesheet";
      link.href = cssPath;
      document.head.append(link);
    }
    const script = document.createElement("script");
    script.id = "poly-onam-theme-script";
    script.src = `/assets/js/onam-theme.js?v=${ONAM_VERSION}`;
    script.defer = true;
    document.head.append(script);
  }

  document.addEventListener("DOMContentLoaded", () => {
    cleanupHomepageExtras();
    normalizeToolLinks();
    setupMockExamLabels();
    setupHomepageToolsAccess();
    normalizeFooter();
    updateYears();
    setupHomepageVideoPoster();
    renderMaterialLinks();
    setupTables();
    loadLessonNotesFallback();
    loadOnamTheme();
  });
})();
