(() => {
  "use strict";

  const isLesson = /\/lessons\/lessons-[^/]+\.html$/i.test(location.pathname);
  if (!isLesson || window.__polyLessonNavigationFixLoaded) return;
  window.__polyLessonNavigationFixLoaded = true;

  const ONAM_VERSION = "20260702-onam1";

  function installOnamThemeLoader() {
    if (!document.getElementById("poly-onam-theme-css")) {
      const link = document.createElement("link");
      link.id = "poly-onam-theme-css";
      link.rel = "stylesheet";
      link.href = `/assets/css/onam-theme.css?v=${ONAM_VERSION}`;
      document.head.append(link);
    }
    if (document.getElementById("poly-onam-theme-script")) return;
    const script = document.createElement("script");
    script.id = "poly-onam-theme-script";
    script.src = `/assets/js/onam-theme.js?v=${ONAM_VERSION}`;
    script.defer = true;
    document.head.append(script);
  }

  function installHeaderStyle() {
    if (document.getElementById("polyLessonHeaderStandardStyle")) return;
    const style = document.createElement("style");
    style.id = "polyLessonHeaderStandardStyle";
    style.textContent = `
      /* POLY PMNA UCS lesson shell enforcement
         Normalizes old lesson headers (.bar/.nav/.logo), tab lessons (.tabstrip/.tab-btn),
         and newer 1003/1004-style headers without touching lesson content. */
      .topbar,.hb-topbar,.lesson-topbar,.bar{position:sticky!important;top:0!important;z-index:1000!important;border-bottom:1px solid rgba(15,23,42,.13)!important;background:rgba(245,248,252,.96)!important;backdrop-filter:blur(18px)!important;overflow:hidden!important;box-shadow:none!important}
      .topbar-inner,.hb-top-inner,.lesson-topbar-inner,.bar>.nav,.top-main{width:min(1700px,calc(100% - 24px))!important;margin-inline:auto!important;display:flex!important;align-items:center!important;gap:10px!important;padding:10px 0!important;flex-wrap:nowrap!important;overflow:hidden!important;min-height:auto!important}
      .brand,.hb-code,.brand-code,.lesson-brand,.logo,.code-badge,.course-code{flex:0 0 auto!important;display:grid!important;place-items:center!important;width:58px!important;min-width:58px!important;height:58px!important;border:0!important;border-radius:18px!important;padding:0!important;color:#fff!important;font-weight:950!important;font-size:18px!important;letter-spacing:0!important;background:linear-gradient(135deg,#083344,#0e7490,#2563eb)!important;box-shadow:0 10px 28px rgba(3,105,161,.25)!important;text-decoration:none!important}
      .brand-mark,.lesson-brand-mark{width:58px!important;height:58px!important;border-radius:18px!important;display:grid!important;place-items:center!important;color:#fff!important;font-weight:950!important;font-size:18px!important;background:linear-gradient(135deg,#083344,#0e7490,#2563eb)!important;box-shadow:0 10px 28px rgba(3,105,161,.25)!important}
      .selector,.hb-tabs,.tabs,.lesson-selector,.tabstrip{flex:1 1 auto!important;min-width:0!important;display:flex!important;gap:8px!important;justify-content:flex-start!important;align-items:center!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;padding:0 0 2px!important;scrollbar-width:none!important;white-space:nowrap!important}
      .selector::-webkit-scrollbar,.hb-tabs::-webkit-scrollbar,.tabs::-webkit-scrollbar,.lesson-selector::-webkit-scrollbar,.tabstrip::-webkit-scrollbar,.bar>.nav::-webkit-scrollbar{display:none!important}
      .bar>.nav{overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important}
      .view-btn,.hb-tabs a,.hb-tabs button,.tabs a,.tabs button,.lesson-tab,.nav a,.tab-btn,.tabstrip button{flex:0 0 auto!important;border:1px solid rgba(15,23,42,.13)!important;background:rgba(255,255,255,.9)!important;color:#334155!important;border-radius:999px!important;padding:13px 18px!important;white-space:nowrap!important;font-size:clamp(13px,.85vw,16px)!important;font-weight:850!important;line-height:1!important;transition:.18s ease!important;box-shadow:none!important;text-decoration:none!important;min-height:auto!important}
      .view-btn:hover,.hb-tabs a:hover,.hb-tabs button:hover,.tabs a:hover,.tabs button:hover,.nav a:hover,.tab-btn:hover,.tabstrip button:hover{transform:translateY(-1px)!important;border-color:rgba(3,105,161,.38)!important;color:#0369a1!important;box-shadow:0 10px 26px rgba(15,23,42,.08)!important}
      .view-btn.active,.hb-tabs a.active,.hb-tabs button.active,.tabs a.active,.tabs button.active,.tab-btn.active,.tabstrip button.active,.nav a.active,.nav a[aria-current='page']{background:#0f172a!important;color:#fff!important;border-color:#0f172a!important;box-shadow:0 12px 30px rgba(15,23,42,.16)!important}
      .download-btn,.hb-tabs button:last-child,.tabs button:last-child,.bar .btn,.nav .btn,.printbtn,.pdf-link{flex:0 0 auto!important;margin-left:auto!important;background:linear-gradient(135deg,#0284c7,#0891b2)!important;color:#fff!important;border-color:transparent!important;border-radius:999px!important;padding:13px 18px!important;font-weight:900!important;line-height:1!important;white-space:nowrap!important;text-decoration:none!important;box-shadow:0 10px 26px rgba(3,105,161,.18)!important}
      .download-btn:hover,.bar .btn:hover,.nav .btn:hover,.printbtn:hover,.pdf-link:hover{color:#fff!important;background:linear-gradient(135deg,#0369a1,#0e7490)!important;transform:translateY(-1px)!important}
      .wrap,.screen,.page-shell,.hb-container,.container,.wrapper,.content,.main-content{max-width:none!important;width:min(100%,1900px)!important}
      .notes-fallback-banner{position:sticky;top:80px;z-index:900;margin:8px auto;padding:12px 16px;width:min(1100px,calc(100% - 20px));border:1px solid #bae6fd;border-radius:16px;background:#ecfeff;color:#083344;font-weight:800;box-shadow:0 12px 30px rgba(15,23,42,.12)}
      @media(max-width:700px){.topbar-inner,.hb-top-inner,.lesson-topbar-inner,.bar>.nav,.top-main{width:calc(100% - 16px)!important}.view-btn,.hb-tabs a,.hb-tabs button,.tabs a,.tabs button,.nav a,.tab-btn,.tabstrip button,.download-btn,.bar .btn,.nav .btn,.printbtn,.pdf-link{padding:11px 13px!important;font-size:14px!important}.brand,.hb-code,.brand-code,.lesson-brand,.logo,.code-badge,.course-code,.brand-mark,.lesson-brand-mark{width:50px!important;min-width:50px!important;height:50px!important;font-size:15px!important;border-radius:15px!important}}
      @media print{
        @page{size:A4;margin:7mm}
        html,body{background:#fff!important;color:#111827!important;width:100%!important;min-width:0!important;overflow:visible!important}
        body:before,body:after,.topbar,.hb-topbar,.lesson-topbar,.bar,.revision-back-button,#polySiteAssistant,#hbToTop,.hb-actions,.notes-fallback-banner,.selector,.tabs,.hb-tabs,.tabstrip,.download-btn,.view-btn,#toTop,#progress{display:none!important}
        main,.screen,.hb-container,.container,.wrapper,.content,.main-content,.wrap,.page-shell{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;box-shadow:none!important;background:#fff!important}
        details{display:block!important}details>*{display:block!important}
        .view-section,.hb-section,[hidden],.panel,.tab-panel,.tab-content,.module-panel,.lesson-panel,.content-panel,.content-section,.section-panel,[role='tabpanel']{display:block!important;visibility:visible!important;opacity:1!important;height:auto!important;max-height:none!important;overflow:visible!important;position:static!important}
        .hb-left,.hb-right,aside{position:static!important;max-height:none!important;overflow:visible!important}
        .hb-layout,.hb-grid,.grid,.grid-2,.grid-3,.grid-4{display:block!important;width:100%!important;max-width:none!important}
        .hb-card,.card,section,article{break-inside:auto!important;page-break-inside:auto!important;box-shadow:none!important}
        .pdf-export-mode *{animation:none!important;transition:none!important;filter:none!important}
      }
    `;
    document.head.append(style);
  }

  function samePageHashLink(anchor) {
    if (!anchor || !anchor.getAttribute) return null;
    const raw = anchor.getAttribute("href") || "";
    if (!raw.startsWith("#")) return null;
    if (raw === "#" || raw.length < 2) return null;
    return raw;
  }

  function activateButton(button) {
    const group = button.closest(".selector, .tabs, .hb-tabs, .tabstrip, .hb-left, .left-rail, nav");
    if (!group) return;
    group.querySelectorAll(".active,[aria-current='page']").forEach((item) => {
      if (item !== button) {
        item.classList.remove("active");
        item.removeAttribute("aria-current");
      }
    });
    button.classList.add("active");
    button.setAttribute("aria-current", "page");
  }

  function showHashTarget(hash, trigger) {
    const id = decodeURIComponent(hash.slice(1));
    const target = document.getElementById(id) || document.querySelector(`[name="${CSS.escape(id)}"]`);
    if (!target) return false;
    const viewSection = target.matches(".view-section") ? target : target.closest(".view-section");
    if (viewSection && viewSection.hasAttribute("data-view")) {
      const view = viewSection.getAttribute("data-view");
      document.querySelectorAll(".view-section[data-view]").forEach((section) => {
        section.hidden = section !== viewSection;
      });
      const related = document.querySelector(`[data-view="${CSS.escape(view)}"]${trigger?.dataset?.module ? `[data-module="${CSS.escape(trigger.dataset.module)}"]` : ""}`);
      if (related) activateButton(related);
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  function forceAllLessonSectionsVisible() {
    document.querySelectorAll("details").forEach((item) => { item.open = true; });
    document.querySelectorAll("[hidden]").forEach((item) => { item.hidden = false; item.removeAttribute("hidden"); });
    document.querySelectorAll("[aria-hidden='true']").forEach((item) => item.setAttribute("aria-hidden", "false"));
    document.querySelectorAll(".view-section,.hb-section,.panel,.tab-panel,.tab-content,.module-panel,.lesson-panel,.content-panel,.content-section,.section-panel,[role='tabpanel']").forEach((item) => {
      item.hidden = false;
      item.removeAttribute("hidden");
      item.setAttribute("aria-hidden", "false");
      item.style.setProperty("display", "block", "important");
      item.style.setProperty("visibility", "visible", "important");
      item.style.setProperty("opacity", "1", "important");
      item.style.setProperty("height", "auto", "important");
      item.style.setProperty("max-height", "none", "important");
      item.style.setProperty("overflow", "visible", "important");
      item.style.setProperty("position", "static", "important");
    });
  }

  function setDownloadTitle() {
    const match = location.pathname.match(/lessons-([^/]+)\.html$/i);
    if (match) document.title = `downloadable-notes-${decodeURIComponent(match[1])}`;
  }

  function prepareFallbackMode(shouldPrint = false) {
    document.documentElement.classList.add("pdf-export-mode");
    document.body?.classList.add("pdf-export-mode");
    forceAllLessonSectionsVisible();
    setDownloadTitle();
    if (!document.querySelector(".notes-fallback-banner")) {
      const banner = document.createElement("div");
      banner.className = "notes-fallback-banner";
      banner.textContent = "PDF notes are being generated from this lesson page. Choose Save as PDF / Print to PDF to download the clean notes file.";
      document.body.prepend(banner);
    }
    window.scrollTo(0, 0);
    if (shouldPrint) window.setTimeout(() => window.print(), 450);
  }

  function installHtmlPdfDownload() {
    document.querySelectorAll("#downloadPdfBtn,.download-btn[data-html-pdf],button[data-html-pdf]").forEach((button) => {
      button.removeAttribute("download");
      if (button.tagName === "A") button.setAttribute("href", `${location.pathname}?downloadNotes=1`);
      button.setAttribute("title", "Download this lesson as a clean PDF from the HTML notes layout.");
      button.addEventListener("click", (event) => {
        event.preventDefault();
        prepareFallbackMode(true);
      });
    });
  }

  installOnamThemeLoader();
  installHeaderStyle();
  const params = new URLSearchParams(location.search);
  if (params.has("autoPrintNotes") || params.has("downloadNotes")) prepareFallbackMode(params.has("autoPrintNotes") || params.has("downloadNotes"));
  installHtmlPdfDownload();

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest?.("a[href^='#']");
    const hash = samePageHashLink(anchor);
    if (!hash) return;
    if (!document.querySelector(hash)) return;
    event.preventDefault();
    showHashTarget(hash, anchor);
    history.replaceState(null, "", `${location.pathname}${location.search}${hash}`);
    activateButton(anchor);
  }, true);

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("button[data-view]");
    if (!button) return;
    window.setTimeout(() => {
      const view = button.getAttribute("data-view");
      const module = button.getAttribute("data-module");
      const hash = module !== null ? "#modules" : `#${view}`;
      if (location.hash !== hash) history.replaceState(null, "", `${location.pathname}${location.search}${hash}`);
      activateButton(button);
    }, 0);
  }, true);

  window.addEventListener("hashchange", () => {
    const hash = location.hash;
    if (hash && document.querySelector(hash)) showHashTarget(hash);
  });
})();