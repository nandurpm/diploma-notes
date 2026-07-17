(() => {
  "use strict";

  const lessonPath = /^\/(?:revision-2026-content\/)?lessons\/lessons-[^/]+\.html$/i;
  if (!lessonPath.test(window.location.pathname) || window.__polyLessonStandardLoaded) return;
  window.__polyLessonStandardLoaded = true;

  const root = document.documentElement;
  const body = document.body;
  const userAgent = navigator.userAgent || "";
  const nativeApp = /(?:PolytechnicStudyHubAndroid|PolyPmnaAndroid)\/[0-9]+(?:\.[0-9]+)*/i.test(userAgent);
  const revision2026 = /^\/revision-2026-content\//i.test(window.location.pathname);
  const courseMatch = window.location.pathname.match(/lessons-([^/]+)\.html$/i);
  const courseCode = courseMatch ? decodeURIComponent(courseMatch[1]) : "";
  const sectionSelector = [
    ".view-section",
    ".view",
    ".panel",
    ".tab-panel",
    ".tab-content",
    ".module-panel",
    ".lesson-panel",
    ".content-panel",
    ".content-section",
    ".section-panel",
    "[role='tabpanel']"
  ].join(",");

  root.classList.add("poly-lesson-page");
  root.classList.toggle("polytechnic-native-app", nativeApp);
  root.dataset.lessonRevision = revision2026 ? "REV2026" : "REV2021";
  if (courseCode) root.dataset.courseCode = courseCode;

  if (body) {
    body.classList.add("poly-lesson-page", "lesson-all-content");
    body.classList.remove("has-fixed-site-header", "portal-page");
    body.style.setProperty("padding-top", "0", "important");
    body.style.setProperty("margin-top", "0", "important");
  }
  root.style.setProperty("--fixed-site-header-height", "0px");
  root.style.setProperty("--fixed-site-header-gap", "0px");

  function ensureStandardStyles() {
    if (document.getElementById("poly-lesson-page-fix")) return;
    const link = document.createElement("link");
    link.id = "poly-lesson-page-fix";
    link.rel = "stylesheet";
    link.href = "/assets/css/lesson-page-fix.css?v=20260717-standard1";
    document.head.append(link);
  }

  function ensureDocumentMetadata() {
    root.lang ||= "en";
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head?.prepend(viewport);
    }
    viewport.content = "width=device-width,initial-scale=1,viewport-fit=cover";
  }

  function isLessonSection(element) {
    if (!(element instanceof HTMLElement)) return false;
    if (element.matches(sectionSelector)) return true;
    return element.matches("main section[id], main article[id], main > section, main > article");
  }

  function revealSection(element) {
    if (!isLessonSection(element)) return;
    const hiddenByAttribute = element.hidden || element.hasAttribute("hidden") || element.getAttribute("aria-hidden") === "true";
    const hiddenByLayout = window.getComputedStyle(element).display === "none";
    if (!hiddenByAttribute && !hiddenByLayout) return;
    element.hidden = false;
    element.removeAttribute("hidden");
    element.setAttribute("aria-hidden", "false");
    element.style.setProperty("display", "block", "important");
    element.style.setProperty("visibility", "visible", "important");
    element.style.setProperty("opacity", "1", "important");
    element.style.setProperty("height", "auto", "important");
    element.style.setProperty("max-height", "none", "important");
    element.style.setProperty("overflow", "visible", "important");
  }

  function revealAllLessonSections() {
    document.querySelectorAll(sectionSelector).forEach(revealSection);
    document.querySelectorAll("main section[id], main article[id], main > section, main > article").forEach(revealSection);
  }

  function findTarget(control) {
    if (!(control instanceof Element)) return null;
    const hash = control.matches("a[href^='#']") ? control.getAttribute("href") : null;
    if (hash && hash.length > 1) {
      try { return document.querySelector(hash); } catch (_) { return null; }
    }

    const controlsId = control.getAttribute("aria-controls");
    if (controlsId) return document.getElementById(controlsId);

    const direct = control.dataset.target || control.dataset.go || control.dataset.v || control.dataset.tab ||
      control.dataset.open || control.dataset.jump || control.dataset.panel ||
      (control.dataset.view ? "" : control.dataset.module);
    if (direct) {
      const id = direct.replace(/^#/, "");
      return document.getElementById(id) || document.querySelector(`[data-view="${CSS.escape(id)}"]`);
    }

    const view = control.dataset.view;
    if (view) {
      const moduleNumber = control.dataset.module;
      if (moduleNumber !== undefined) {
        const exact = document.querySelector(`.view-section[data-view="${CSS.escape(view)}"][data-module="${CSS.escape(moduleNumber)}"]`);
        if (exact) return exact;
        const numeric = Number(moduleNumber);
        for (const id of [`module-${numeric + 1}`, `module-${numeric}`, `m${numeric + 1}`, `m${numeric}`]) {
          const target = document.getElementById(id);
          if (target) return target;
        }
      }
      return document.getElementById(view) || document.querySelector(`.view-section[data-view="${CSS.escape(view)}"]`);
    }

    const inlineHandler = control.getAttribute("onclick") || "";
    const inlineId = inlineHandler.match(/getElementById\(['\"]([^'\"]+)['\"]\)/i)?.[1];
    return inlineId ? document.getElementById(inlineId) : null;
  }

  function setActiveControl(control) {
    const group = control.closest("nav, .selector, .tabs, .hb-tabs, .lesson-tabs, .module-tabs, .tabstrip, .tabbar, .nav-scroll");
    if (!group) return;
    group.querySelectorAll(".active, .on, [aria-current='page']").forEach((item) => {
      if (item === control) return;
      item.classList.remove("active", "on");
      item.removeAttribute("aria-current");
    });
    control.classList.add("active");
    control.classList.toggle("on", control.classList.contains("t"));
    control.setAttribute("aria-current", "page");
  }

  function scrollToTarget(target, control) {
    revealSection(target);
    setActiveControl(control);
    const id = target.id;
    if (id) history.replaceState(null, "", `${location.pathname}${location.search}#${encodeURIComponent(id)}`);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function preparePrintMode(showBanner = false) {
    root.classList.add("pdf-export-mode");
    body?.classList.add("pdf-export-mode");
    revealAllLessonSections();
    document.querySelectorAll("details").forEach((item) => { item.open = true; });
    if (showBanner && !document.querySelector(".notes-fallback-banner")) {
      const banner = document.createElement("div");
      banner.className = "notes-fallback-banner";
      banner.setAttribute("role", "status");
      banner.textContent = "The complete lesson is ready. Choose Save as PDF in the print window.";
      body?.prepend(banner);
    }
    window.scrollTo(0, 0);
  }

  function updateScrollProgress() {
    const progress = document.querySelector("#progress, .progress, .prog");
    if (!progress) return;
    const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.width = `${Math.min(100, Math.max(0, (window.scrollY / total) * 100))}%`;
  }

  ensureStandardStyles();
  ensureDocumentMetadata();
  revealAllLessonSections();
  requestAnimationFrame(revealAllLessonSections);
  window.setTimeout(revealAllLessonSections, 250);

  document.addEventListener("click", (event) => {
    const control = event.target.closest?.("a[href^='#'], button[data-view], button[data-v], button[data-go], button[data-tab], button[data-target], button[data-open], button[data-jump], button[data-panel], button[data-module], button[aria-controls], button[onclick*='getElementById']");
    if (!control) return;
    const target = findTarget(control);
    if (!target || !isLessonSection(target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    scrollToTarget(target, control);
  }, true);

  window.addEventListener("beforeprint", () => preparePrintMode(false));
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress, { passive: true });
  updateScrollProgress();

  const params = new URLSearchParams(location.search);
  if (params.has("autoPrintNotes") || params.has("downloadNotes")) {
    preparePrintMode(true);
    window.setTimeout(() => window.print(), 500);
  }

  if (location.hash) {
    window.setTimeout(() => {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) scrollToTarget(target, document.querySelector(`a[href="${CSS.escape(location.hash)}"]`) || target);
    }, 80);
  }
})();
