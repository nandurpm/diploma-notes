(() => {
  "use strict";

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
    if (document.querySelector(".site-notice")) return;
    const brand = document.querySelector(".topbar .brand");
    if (!brand) return;

    const notice = document.createElement("a");
    notice.className = "site-notice";
    notice.href = "https://nandakumarm.dpdns.org/about.html";
    notice.target = "_blank";
    notice.rel = "noopener noreferrer";
    notice.innerHTML = `
      <strong class="site-notice-label">Update</strong>
      <span class="site-notice-viewport">
        <span class="site-notice-track">English study notes, syllabus links and lesson pages are being checked and improved. മലയാളം പഠനസഹായവും തിരുത്തലുകളും ക്രമമായി ചേർക്കുന്നു.</span>
      </span>
    `;
    brand.insertAdjacentElement("afterend", notice);
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

  document.addEventListener("DOMContentLoaded", () => {
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
