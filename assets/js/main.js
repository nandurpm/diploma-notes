(() => {
  "use strict";

  const TOOLS_URL = "/tools.html";
  const LESSON_PAGE = /\/lessons\//.test(window.location.pathname || "");
  const ONAM_VERSION = "20260704-banner5";

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

  function normalizeToolLinks() {
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (/tools(?:-v2|-v2-original)?\.html/i.test(href)) {
        link.setAttribute("href", href.startsWith("http") ? "https://polypmna.dpdns.org/tools.html" : TOOLS_URL);
      }
    });
  }

  function updateYears() {
    document.querySelectorAll("[data-year],#year").forEach((item) => {
      item.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    normalizeToolLinks();
    updateYears();
    loadOnamTheme();
  });
})();
