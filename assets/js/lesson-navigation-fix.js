/* Purpose: Lesson navigation fix - Descriptive comment added for clarity */
(() => {
  "use strict";

  const lessonPath = /^\/(?:revision-2026-content\/)?lessons\/lessons-[^/]+\.html$/i;
  if (!lessonPath.test(location.pathname) || (window.__polyLessonStandardLoaded && document.documentElement.classList.contains("lesson-all-content"))) return;
  window.__polyLessonStandardLoaded = true;

  const root = document.documentElement;
  const nativeApp = /(?:PolytechnicStudyHubAndroid|PolyPmnaAndroid)\/[0-9]+(?:\.[0-9]+)*/i.test(navigator.userAgent || "");
  const revision2026 = /^\/revision-2026-content\//i.test(location.pathname);
  const courseCode = decodeURIComponent(location.pathname.match(/lessons-([^/]+)\.html$/i)?.[1] || "");
  const sectionSelector = ".view-section,.view,.panel,.tab-panel,.tab-content,.module-panel,.lesson-panel,.content-panel,.content-section,.section-panel,[role='tabpanel']";
  const originalUrl = `${location.pathname}${location.search}${location.hash}`;

  function markPage() {
    root.classList.add("poly-lesson-page", "lesson-all-content");
    root.classList.toggle("revision-2026-lesson", revision2026);
    root.classList.toggle("revision-2021-lesson", !revision2026);
    root.classList.toggle("polytechnic-native-app", nativeApp);
    root.dataset.lessonRevision = revision2026 ? "REV2026" : "REV2021";
    if (courseCode) root.dataset.courseCode = courseCode;
    const body = document.body;
    if (body) {
      body.classList.add("poly-lesson-page", "lesson-all-content");
      body.classList.toggle("revision-2026-lesson", revision2026);
      body.classList.toggle("revision-2021-lesson", !revision2026);
      body.classList.remove("portal-page", "has-fixed-site-header");
      body.style.setProperty("padding-top", "0", "important");
      body.style.setProperty("margin-top", "0", "important");
    }
    root.style.setProperty("--fixed-site-header-height", "0px");
    root.style.setProperty("--fixed-site-header-gap", "0px");
    root.style.setProperty("--header-h", "0px");
    root.style.setProperty("--topbar-h", "0px");
    root.style.setProperty("--toolbar-h", "0px");
    root.style.setProperty("--top", "0px");
  }

  function installStyles() {
    if (!document.getElementById("poly-lesson-critical")) {
      const style = document.createElement("style");
      style.id = "poly-lesson-critical";
      style.textContent = "html.poly-lesson-page,html.poly-lesson-page body{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;overflow-x:clip!important;scroll-padding-top:0!important}html.poly-lesson-page :is(#site-header,.site-header,.fixed-site-header,[data-site-header],[data-site-shell-header],.topbar,.hb-topbar,.lesson-topbar,.lesson-header,body>nav.top,body>header.top,.chapter-nav,.revision-back-button,.nav-arrows,.skip-link){display:none!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}html.poly-lesson-page :is(main,.lesson-shell,.page-shell,.shell,.main-content,.content,.screen,.wrap,.w,.page,.container){width:100%!important;max-width:none!important;min-width:0!important;margin:0!important}html.poly-lesson-page .lesson-shell{display:block!important;grid-template-columns:1fr!important}";
      (document.head || root).append(style);
    }
    let link = document.getElementById("poly-lesson-page-fix");
    if (!link) {
      link = document.createElement("link");
      link.id = "poly-lesson-page-fix";
      link.rel = "stylesheet";
      (document.head || root).append(link);
    }
    link.href = "/assets/css/lesson-page-fix.css?v=20260718-fullscreen4";
  }

  function ensureViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head?.prepend(viewport);
    }
    viewport.content = "width=device-width,initial-scale=1,viewport-fit=cover";
  }

  function isLessonSection(node) {
    return node instanceof HTMLElement && (node.matches(sectionSelector) || node.matches("main section[id],main article[id],main>section,main>article"));
  }

  function reveal(node) {
    if (!isLessonSection(node) || node.classList.contains("poly-dynamic-source")) return;
    const hidden = node.hidden || node.hasAttribute("hidden") || node.getAttribute("aria-hidden") === "true" || getComputedStyle(node).display === "none";
    node.hidden = false;
    node.removeAttribute("hidden");
    node.setAttribute("aria-hidden", "false");
    if (hidden) node.classList.add("poly-force-visible");
    node.style.setProperty("visibility", "visible", "important");
    node.style.setProperty("opacity", "1", "important");
    node.style.setProperty("height", "auto", "important");
    node.style.setProperty("max-height", "none", "important");
    node.style.setProperty("overflow", "visible", "important");
  }

  function revealAllLessonSections() {
    document.querySelectorAll(sectionSelector).forEach(reveal);
    document.querySelectorAll("main section[id],main article[id],main>section,main>article").forEach(reveal);
    document.querySelectorAll("details").forEach((item) => { item.open = true; });
  }

  function targetFor(control) {
    const id = control.getAttribute("aria-controls") || control.dataset.target || control.dataset.go || control.dataset.v || control.dataset.tab || control.dataset.open || control.dataset.jump || control.dataset.panel;
    if (id) return document.getElementById(id.replace(/^#/, ""));
    const view = control.dataset.view;
    const module = control.dataset.module;
    if (view && module !== undefined) {
      const exact = document.querySelector(`.view-section[data-view="${view}"][data-module="${module}"]`);
      if (exact) return exact;
    }
    if (module !== undefined) {
      const n = Number(module);
      for (const candidate of [`module-${n}`, `m${n}`, `module-${n + 1}`, `m${n + 1}`, "modules"]) {
        const found = document.getElementById(candidate);
        if (found) return found;
      }
    }
    return view ? document.getElementById(view) || document.querySelector(`[data-view="${view}"]`) : null;
  }

  const frames = () => new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    setTimeout(finish, 50);
    requestAnimationFrame(() => requestAnimationFrame(finish));
  });
  const textOf = (node) => (node.textContent || "").replace(/\s+/g, " ").trim();

  function removeCloneIds(clone) {
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    clone.querySelectorAll("[aria-controls],[aria-labelledby],[aria-describedby],[for]").forEach((node) => {
      node.removeAttribute("aria-controls");
      node.removeAttribute("aria-labelledby");
      node.removeAttribute("aria-describedby");
      node.removeAttribute("for");
    });
    clone.querySelectorAll('a[href^="#"]').forEach((link) => link.removeAttribute("href"));
  }

  async function expandDynamicModuleViews() {
    if (root.dataset.polyDynamicExpanded === "true") return;
    root.dataset.polyDynamicExpanded = "true";
    const entries = new Map();
    document.querySelectorAll("button[data-module],a[data-module]").forEach((control) => {
      if (control.matches(".download-btn,[download],[href$='.pdf']")) return;
      const target = targetFor(control);
      if (!isLessonSection(target)) return;
      const key = `${target.id || target.dataset.view || "target"}:${control.dataset.module}`;
      if (!entries.has(key)) entries.set(key, { control, target });
    });
    const groups = new Map();
    entries.forEach(({ control, target }) => {
      if (!groups.has(target)) groups.set(target, []);
      groups.get(target).push(control);
    });
    const x = scrollX;
    const y = scrollY;
    for (const [target, controls] of groups) {
      if (controls.length < 2 || controls.length > 12) continue;
      const seen = new Set();
      const clones = [];
      for (const control of controls) {
        try {
          control.click();
          await frames();
          await new Promise((resolve) => setTimeout(resolve, 20));
          const current = targetFor(control) || target;
          reveal(current);
          const text = textOf(current);
          if (text.length < 120 || seen.has(text)) continue;
          seen.add(text);
          const clone = current.cloneNode(true);
          removeCloneIds(clone);
          clone.hidden = false;
          clone.classList.add("poly-expanded-dynamic-view");
          const label = document.createElement("div");
          label.className = "poly-expanded-state-label";
          label.textContent = (control.textContent || `Module ${clones.length + 1}`).trim();
          clone.prepend(label);
          clones.push(clone);
        } catch (_) {}
      }
      if (clones.length > 1) {
        const wrapper = document.createElement("section");
        wrapper.className = "poly-expanded-dynamic-list";
        clones.forEach((clone) => wrapper.append(clone));
        target.classList.add("poly-dynamic-source");
        target.setAttribute("aria-hidden", "true");
        target.after(wrapper);
      }
    }
    history.replaceState(null, "", originalUrl);
    scrollTo(x, y);
    revealAllLessonSections();
  }

  function preparePrintMode(showBanner = false) {
    root.classList.add("pdf-export-mode");
    document.body?.classList.add("pdf-export-mode");
    revealAllLessonSections();
    if (showBanner && !document.querySelector(".notes-fallback-banner")) {
      const banner = document.createElement("div");
      banner.className = "notes-fallback-banner";
      banner.textContent = "The complete lesson is ready. Choose Save as PDF in the print window.";
      document.body?.prepend(banner);
    }
    scrollTo(0, 0);
  }

  function createEndActions() {
    if (document.getElementById("polyLessonEndActions")) return;
    const main = document.querySelector("main") || document.querySelector(".lesson-shell") || document.body;
    if (!main) return;
    const actions = document.createElement("section");
    actions.id = "polyLessonEndActions";
    actions.className = "poly-lesson-end-actions";
    actions.innerHTML = `<p class="poly-lesson-identity">${courseCode ? `Course ${courseCode} · ` : ""}${revision2026 ? "Revision 2026" : "Revision 2021"}</p><div class="poly-lesson-action-row"><a class="poly-lesson-action poly-lesson-back" href="${revision2026 ? "/revision-2026.html" : "/revision-2021.html"}">Back to ${revision2026 ? "Revision 2026" : "Revision 2021"}</a></div>`;
    const row = actions.querySelector(".poly-lesson-action-row");
    const pdf = [...document.querySelectorAll("a[href]")].find((link) => /\.pdf(?:$|[?#])|autoPrintNotes|downloadNotes/i.test(link.getAttribute("href") || ""));
    if (pdf) {
      const download = document.createElement("a");
      download.className = "poly-lesson-action poly-lesson-download";
      download.href = pdf.href;
      download.textContent = "Download PDF";
      row.append(download);
    }
    const print = document.createElement("button");
    print.className = "poly-lesson-action poly-lesson-print";
    print.type = "button";
    print.textContent = "Print / Save PDF";
    print.addEventListener("click", () => { preparePrintMode(false); setTimeout(() => printWindow(), 80); });
    row.append(print);
    main === document.body ? main.append(actions) : main.after(actions);
  }

  function printWindow() { window.print(); }

  function updateProgress() {
    const progress = document.querySelector("#progress,.progress,.prog");
    if (!progress) return;
    const total = Math.max(1, root.scrollHeight - innerHeight);
    progress.style.width = `${Math.min(100, Math.max(0, scrollY / total * 100))}%`;
  }

  async function boot() {
    markPage();
    ensureViewport();
    installStyles();
    revealAllLessonSections();
    await new Promise((resolve) => setTimeout(resolve, 120));
    if (!revision2026) await expandDynamicModuleViews();
    revealAllLessonSections();
    createEndActions();
    updateProgress();
    const params = new URLSearchParams(location.search);
    if (params.has("autoPrintNotes") || params.has("downloadNotes")) {
      preparePrintMode(true);
      setTimeout(() => printWindow(), 650);
    }
  }

  markPage();
  ensureViewport();
  installStyles();
  addEventListener("beforeprint", () => preparePrintMode(false));
  addEventListener("scroll", updateProgress, { passive: true });
  addEventListener("resize", updateProgress, { passive: true });
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => { void boot(); }, { once: true }) : void boot();
})();

(() => {
  "use strict";
  const isCourse2131 = /^\/revision-2026-content\/lessons\/lessons-2131\.html$/i.test(location.pathname);
  if (!isCourse2131 || window.__poly2131EnhancementLoaderInstalled) return;
  window.__poly2131EnhancementLoaderInstalled = true;

  const load = () => {
    if (window.__poly2131EnhancementsLoaded || document.querySelector('script[data-poly-course-enhancement="2131"]')) return;
    const script = document.createElement("script");
    script.src = "/assets/js/lessons/lesson-2131-enhancements.js?v=20260719";
    script.defer = true;
    script.dataset.polyCourseEnhancement = "2131";
    (document.head || document.documentElement).append(script);
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", load, { once: true })
    : load();
})();
