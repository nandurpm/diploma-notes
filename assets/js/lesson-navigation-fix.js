(() => {
  "use strict";

  const isLesson = /\/lessons\/lessons-[^/]+\.html$/i.test(location.pathname);
  if (!isLesson || window.__polyLessonNavigationFixLoaded) return;
  window.__polyLessonNavigationFixLoaded = true;

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
