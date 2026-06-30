(() => {
  "use strict";

  const isLesson = /\/lessons\/lessons-[^/]+\.html$/i.test(location.pathname);
  if (!isLesson || window.__polyLessonNavigationFixLoaded) return;
  window.__polyLessonNavigationFixLoaded = true;

  function installHeaderStyle() {
    if (document.getElementById("polyLessonHeaderStandardStyle")) return;
    const style = document.createElement("style");
    style.id = "polyLessonHeaderStandardStyle";
    style.textContent = `
      .topbar,.hb-topbar,.lesson-topbar{position:sticky!important;top:0!important;z-index:1000!important;border-bottom:1px solid rgba(15,23,42,.13)!important;background:rgba(245,248,252,.96)!important;backdrop-filter:blur(18px)!important;overflow:hidden!important;box-shadow:none!important}
      .topbar-inner,.hb-top-inner,.lesson-topbar-inner{width:min(1700px,calc(100% - 24px))!important;margin-inline:auto!important;display:flex!important;align-items:center!important;gap:10px!important;padding:10px 0!important;flex-wrap:nowrap!important;overflow:hidden!important;min-height:auto!important}
      .brand,.hb-code,.brand-code,.lesson-brand{flex:0 0 auto!important;display:grid!important;place-items:center!important;width:58px!important;height:58px!important;border:0!important;background:transparent!important;border-radius:18px!important;padding:0!important;box-shadow:none!important;color:#fff!important;font-weight:950!important}
      .hb-code,.brand-code,.brand-mark,.lesson-brand-mark{width:58px!important;height:58px!important;border-radius:18px!important;display:grid!important;place-items:center!important;color:#fff!important;font-weight:950!important;font-size:18px!important;background:linear-gradient(135deg,#083344,#0e7490,#2563eb)!important;box-shadow:0 10px 28px rgba(3,105,161,.25)!important}
      .selector,.hb-tabs,.tabs,.lesson-selector{flex:1 1 auto!important;min-width:0!important;display:flex!important;gap:8px!important;justify-content:flex-start!important;align-items:center!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;padding:0 0 2px!important;scrollbar-width:none!important;white-space:nowrap!important}
      .selector::-webkit-scrollbar,.hb-tabs::-webkit-scrollbar,.tabs::-webkit-scrollbar{display:none!important}
      .view-btn,.hb-tabs a,.hb-tabs button,.tabs a,.tabs button,.lesson-tab{flex:0 0 auto!important;border:1px solid rgba(15,23,42,.13)!important;background:rgba(255,255,255,.9)!important;color:#334155!important;border-radius:999px!important;padding:13px 18px!important;white-space:nowrap!important;font-size:clamp(13px,.85vw,16px)!important;font-weight:850!important;line-height:1!important;transition:.18s ease!important;box-shadow:none!important;text-decoration:none!important}
      .view-btn:hover,.hb-tabs a:hover,.hb-tabs button:hover,.tabs a:hover,.tabs button:hover{transform:translateY(-1px)!important;border-color:rgba(3,105,161,.38)!important;color:#0369a1!important;box-shadow:0 10px 26px rgba(15,23,42,.08)!important}
      .view-btn.active,.hb-tabs a.active,.hb-tabs button.active,.tabs a.active,.tabs button.active{background:#0f172a!important;color:#fff!important;border-color:#0f172a!important;box-shadow:0 12px 30px rgba(15,23,42,.16)!important}
      .download-btn,.hb-tabs button:last-child,.tabs button:last-child{margin-left:auto!important;background:linear-gradient(135deg,#0284c7,#0891b2)!important;color:#fff!important;border-color:transparent!important}
      @media(max-width:700px){.topbar-inner,.hb-top-inner,.lesson-topbar-inner{width:calc(100% - 16px)!important}.view-btn,.hb-tabs a,.hb-tabs button,.tabs a,.tabs button{padding:11px 13px!important}.brand,.hb-code,.brand-code{width:50px!important;height:50px!important}.hb-code,.brand-code,.brand-mark{width:50px!important;height:50px!important}}
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
    const group = button.closest(".selector, .tabs, .hb-tabs, .hb-left, .left-rail, nav");
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

  installHeaderStyle();

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest?.("a[href^='#']");
    const hash = samePageHashLink(anchor);
    if (!hash) return;
    if (!document.querySelector(hash)) return;
    event.preventDefault();
    showHashTarget(hash, anchor);
    history.replaceState(null, "", `${location.pathname}${location.search}${hash}`);
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
