(() => {
  "use strict";

  const currentPath = () => window.location.pathname.replace(/\/+$/, "") || "/";
  const KNOWN_LESSON_CODES = new Set(["3043", "6002"]);
  const KNOWN_NOTES_CODES = new Set(["3043"]);

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

  function replaceAvailabilityLabel(label, href, text, className, download = false) {
    const link = document.createElement("a");
    link.className = `action ${className}`;
    link.href = href;
    link.textContent = text;
    if (download) link.setAttribute("download", "");
    label.replaceWith(link);
  }

  function repairKnownUploadedMaterials(root = document) {
    const cards = root.matches?.(".subject-card") ? [root] : root.querySelectorAll?.(".subject-card") || [];
    cards.forEach((card) => {
      const code = card.querySelector(".subject-top strong")?.textContent.trim();
      if (!code) return;

      card.querySelectorAll(".availability-label").forEach((label) => {
        const labelText = label.textContent.trim();
        if (/^Lessons unavailable$/i.test(labelText) && KNOWN_LESSON_CODES.has(code)) {
          replaceAvailabilityLabel(label, `/lessons/lessons-${encodeURIComponent(code)}.html`, "View Lessons", "lessons");
        } else if (/^Notes unavailable$/i.test(labelText) && KNOWN_NOTES_CODES.has(code)) {
          replaceAvailabilityLabel(label, `/notes/downloadable-notes-${encodeURIComponent(code)}.pdf`, "Download Notes", "download", true);
        }
      });
    });
  }

  function observeSubjectCards() {
    const grid = document.getElementById("subjectGrid");
    if (!grid) return;

    repairKnownUploadedMaterials(grid);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) repairKnownUploadedMaterials(node);
        });
      });
    });
    observer.observe(grid, { childList: true, subtree: true });
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
    repairKnownUploadedMaterials();
    observeSubjectCards();
    materialPageFallbacks();
    contactFallbackTimer();
    layoutOverflowFlag();
  });
})();
