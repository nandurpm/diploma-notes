(() => {
  "use strict";

  const currentPath = () => window.location.pathname.replace(/\/+$/, "") || "/";
  const isDepartmentSubjectPage = () => /^\/revision-(?:2021|2026)\/.+\.html$/i.test(currentPath());
  const isLessonPage = () => /\/lessons\/lessons-\d+[a-z]?\.html$/i.test(currentPath());

  function loadConsistencyFix() {
    if (document.getElementById("poly-site-consistency-fix")) return;
    const script = document.createElement("script");
    script.id = "poly-site-consistency-fix";
    script.src = "/assets/js/site-consistency-fix.js?v=20260716-revision-switch1";
    script.defer = true;
    document.head.append(script);
  }

  function normalizeLinks() {
    document.querySelectorAll(".navlinks a.active").forEach(link => link.setAttribute("aria-current", "page"));
    document.querySelectorAll('a[target="_blank"]').forEach(link => link.setAttribute("rel", "noopener noreferrer"));
    document.querySelectorAll('a[href="departments.html"], a[href="/departments.html"]').forEach(link => {
      link.href = link.getAttribute("href")?.startsWith("/") ? "/revision-2021.html" : "revision-2021.html";
      if (/departments/i.test(link.textContent || "")) link.textContent = "Revision 2021";
    });
  }

  function restoreScrolling() {
    if (!isDepartmentSubjectPage()) return;
    [document.documentElement, document.body].filter(Boolean).forEach(element => {
      element.style.setProperty("height", "auto", "important");
      element.style.setProperty("min-height", "100%", "important");
      element.style.setProperty("overflow-y", "auto", "important");
      element.style.setProperty("overflow-x", "hidden", "important");
    });
    document.body?.style.setProperty("position", "relative", "important");
    document.getElementById("subjectGrid")?.style.setProperty("min-height", "45vh", "important");
  }

  function basicLessonFixes() {
    if (!isLessonPage()) return;
    document.querySelectorAll("details").forEach(detail => {
      if (new URLSearchParams(window.location.search).get("print") === "1") detail.open = true;
    });
  }

  loadConsistencyFix();
  restoreScrolling();
  document.addEventListener("DOMContentLoaded", () => {
    loadConsistencyFix();
    normalizeLinks();
    restoreScrolling();
    basicLessonFixes();
  });
})();
