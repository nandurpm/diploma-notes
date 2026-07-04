(() => {
  "use strict";

  const TOOLS_URL = "/tools.html";
  const LESSON_PAGE = /\/lessons\//.test(window.location.pathname || "");
  const ONAM_VERSION = "20260704-banner5";

  function normalizeToolLinks() {
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (/tools(?:-v2|-v2-original)?\.html/i.test(href)) {
        link.setAttribute("href", href.startsWith("http") ? "https://polypmna.dpdns.org/tools.html" : TOOLS_URL);
      }
    });
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
  }

  function setupMockExamLabels() {
    if (LESSON_PAGE) return;
    document.querySelectorAll('a[href$="daily-quiz.html"], a[href$="/daily-quiz.html"]').forEach((link) => {
      const label = (link.textContent || "").trim();
      if (/^(daily quiz|quiz|mock exams?)$/i.test(label)) link.textContent = "Mock Exams";
    });
  }

  function updateYears() {
    document.querySelectorAll("[data-year],#year").forEach((item) => { item.textContent = new Date().getFullYear(); });
  }

  function loadLessonNotesFallback() {
    if (LESSON_PAGE || !document.getElementById("subjectGrid")) return;
    const alreadyLoaded = [...document.scripts].some((script) => {
      try { return new URL(script.src || "", window.location.href).pathname === "/assets/js/lesson-availability-hotfix.js"; }
      catch { return false; }
    });
    if (alreadyLoaded) return;
    const script = document.createElement("script");
    script.src = "/assets/js/lesson-availability-hotfix.js?v=20260701-notes-dedupe1";
    script.defer = true;
    document.head.append(script);
  }

  function loadOnamTheme() {
    if (LESSON_PAGE || document.getElementById("poly-onam-banner-script")) return;
    if (!document.getElementById("poly-onam-banner-css")) {
      const link = document.createElement("link");
      link.id = "poly-onam-banner-css";
      link.rel = "stylesheet";
      link.href = `/assets/css/onam-theme.css?v=${ONAM_VERSION}`;
      document.head.append(link);
    }
    const script = document.createElement("script");
    script.id = "poly-onam-banner-script";
    script.src = `/assets/js/onam-render-a.js?v=${ONAM_VERSION}`;
    script.defer = true;
    document.head.append(script);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".student-tools-update,.apk-download-section,#student-tools-update,#apk-download-v2").forEach((section) => section.remove());
    normalizeToolLinks();
    setupMockExamLabels();
    setupHomepageToolsAccess();
    updateYears();
    loadLessonNotesFallback();
    loadOnamTheme();
  });
})();
