(() => {
  "use strict";

  const SITE_NAME = "POLY PMNA";
  const TOOLS_URL = "/tools.html";
  const ASK_POLY_URL = "/ask-poly.html";
  const LESSON_PAGE = /\/lessons\//.test(window.location.pathname || "");
  const ONAM_VERSION = "20260704-banner6";
  const SHARED_VERSION = "20260717-site-shell1";

  const pathName = () => window.location.pathname.replace(/\/+$/, "") || "/";
  const isHomePage = () => pathName() === "/" || pathName() === "/index.html";

  function loadScript(id, src) {
    const existing = document.getElementById(id) || [...document.scripts].find((script) => {
      try { return new URL(script.src || "", location.href).pathname === new URL(src, location.href).pathname; }
      catch (_) { return false; }
    });
    if (existing) return Promise.resolve(existing);

    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.defer = true;
      script.onload = () => resolve(script);
      script.onerror = () => resolve(script);
      document.head.append(script);
    });
  }

  function normalizeToolLinks() {
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (/tools(?:-v2|-v2-original)?\.html/i.test(href)) {
        link.setAttribute("href", href.startsWith("http") ? "https://polypmna.dpdns.org/tools.html" : TOOLS_URL);
      }
    });
  }

  function injectSharedStyles() {
    if (document.getElementById("poly-shared-normalizer-style")) return;
    const style = document.createElement("style");
    style.id = "poly-shared-normalizer-style";
    style.textContent = `
      .footer strong,.brand strong{font-weight:950}
    `;
    document.head.append(style);
  }

  function currentPageKey() {
    const path = pathName();
    if (path === "/" || path === "/index.html") return "home";
    if (path.endsWith("/about.html")) return "about";
    if (path.endsWith("/revision-2021.html") || path.includes("/revision-2021/")) return "revision2021";
    if (path.endsWith("/revision-2026.html") || path.includes("/revision-2026/")) return "revision2026";
    if (path.endsWith("/daily-quiz.html") || /\/mock-exam(?:-|\.html)/.test(path)) return "exams";
    if (path.endsWith("/ask-poly.html") || path.endsWith("/ask-poly-v2.html")) return "ask";
    if (path.endsWith("/materials-2015.html")) return "materials";
    if (path.endsWith("/tools.html")) return "tools";
    if (path.endsWith("/contact.html")) return "help";
    return "";
  }

  function normalizeNav() {
    if (!LESSON_PAGE) window.PolySiteShell?.render();
  }

  function pageTitlePrefix() {
    const active = currentPageKey();
    if (active === "home") return "Kerala Polytechnic Diploma Notes & Study Materials";
    const map = {
      about: "About",
      revision2021: pathName().includes("/revision-2021/") ? "Revision 2021 Department Subjects" : "Revision 2021",
      revision2026: pathName().includes("/revision-2026/") ? "Revision 2026 Department Subjects" : "Revision 2026 Diploma Departments",
      exams: "Mock Exams",
      ask: "Ask POLY AI",
      materials: "2015 Materials",
      tools: "Student Tools",
      help: "Help"
    };
    return map[active] || (document.title || SITE_NAME).split("|")[0].trim();
  }

  function normalizeMetadata() {
    const prefix = pageTitlePrefix();
    if (!LESSON_PAGE) document.title = `${prefix} | ${SITE_NAME}`;

    const description = isHomePage()
      ? `${SITE_NAME} provides Kerala Polytechnic Revision 2026 and Revision 2021 syllabus, notes, Ask POLY AI, mock exams, student tools, 2015 materials and question papers.`
      : `${prefix} on ${SITE_NAME} for Kerala Polytechnic students.`;

    const metaDescription = document.querySelector('meta[name="description"]') || document.head.appendChild(document.createElement("meta"));
    metaDescription.name = "description";
    metaDescription.content = description;

    const canonical = document.querySelector('link[rel="canonical"]') || document.head.appendChild(document.createElement("link"));
    canonical.rel = "canonical";
    canonical.href = isHomePage() ? "https://polypmna.dpdns.org/" : `https://polypmna.dpdns.org${pathName()}`;

    const og = (prop, content) => {
      let tag = document.querySelector(`meta[property="${prop}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", prop);
        document.head.append(tag);
      }
      tag.content = content;
    };

    og("og:title", document.title);
    og("og:description", description);
    og("og:url", canonical.href);
  }

  function normalizeFooter() {
    if (!LESSON_PAGE) window.PolySiteShell?.render();
  }

  function setupHomepageToolsAccess() {
    if (!LESSON_PAGE) normalizeToolLinks();
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
      catch (_) { return false; }
    });
    if (alreadyLoaded) return;
    const script = document.createElement("script");
    script.src = "/assets/js/lesson-availability-hotfix.js?v=20260717-availability-stable1";
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

  function loadConsistencyFix() {
    return loadScript("poly-site-consistency-fix", `/assets/js/site-consistency-fix.js?v=${SHARED_VERSION}`);
  }

  function loadSiteAssistant() {
    return loadScript("poly-site-assistant-loader-script", `/assets/js/site-assistant-loader.js?v=${SHARED_VERSION}`);
  }

  function loadVisitorPopup() {
    return loadScript("poly-visitor-popup-script", `/assets/js/visitor-popup.js?v=${SHARED_VERSION}`);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    document.querySelectorAll(".student-tools-update,.apk-download-section,#student-tools-update,#apk-download-v2").forEach((section) => section.remove());
    normalizeToolLinks();
    normalizeNav();
    normalizeMetadata();
    normalizeFooter();
    setupMockExamLabels();
    setupHomepageToolsAccess();
    updateYears();
    loadLessonNotesFallback();
    loadOnamTheme();
    await loadConsistencyFix();

    await Promise.all([
      loadSiteAssistant(),
      loadVisitorPopup()
    ]);
  });
})();
