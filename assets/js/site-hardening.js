(() => {
  "use strict";

  const currentPath = () => window.location.pathname.replace(/\/+$/, "") || "/";

  function normalizeLinks() {
    document.querySelectorAll(".navlinks a.active").forEach((link) => {
      link.setAttribute("aria-current", "page");
    });
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      link.setAttribute("rel", "noopener noreferrer");
    });
    document.querySelectorAll('a[href="departments.html"], a[href="/departments.html"]').forEach((link) => {
      link.href = link.getAttribute("href")?.startsWith("/") ? "/revision-2021.html" : "revision-2021.html";
      if (/departments/i.test(link.textContent)) link.textContent = "Revision 2021";
    });
  }

  function materialPageFallbacks() {
    if (currentPath() !== "/materials-2015.html") return;
    window.setTimeout(() => {
      document.querySelectorAll("[data-link-group]").forEach((container) => {
        if (container.querySelector("a") || container.textContent.trim()) return;
        const span = document.createElement("span");
        span.className = "availability-label";
        span.setAttribute("aria-disabled", "true");
        span.textContent = "Not available yet";
        container.append(span);
      });
    }, 0);
  }

  function contactFallbackTimer() {
    if (currentPath() !== "/contact.html") return;
    const list = document.getElementById("commentsList");
    if (!list) return;
    window.setTimeout(() => {
      if (!list.querySelector(".discussion-loading")) return;
      const box = document.createElement("div");
      box.className = "comment-error-box";
      box.textContent = "Discussion is currently unavailable. Please contact us by email.";
      list.replaceChildren(box);
      console.error("Discussion initialization timed out before the comments module produced a success or error state.");
    }, 12000);
  }

  function layoutOverflowFlag() {
    if (new URLSearchParams(window.location.search).get("layout-test") !== "1") return;
    const check = () => {
      document.body.dataset.layoutOverflow = String(document.documentElement.scrollWidth > window.innerWidth + 1);
    };
    check();
    requestAnimationFrame(() => requestAnimationFrame(check));
  }

  document.addEventListener("DOMContentLoaded", () => {
    normalizeLinks();
    materialPageFallbacks();
    contactFallbackTimer();
    layoutOverflowFlag();
  });
})();
