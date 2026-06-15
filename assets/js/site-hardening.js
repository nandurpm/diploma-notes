(() => {
  "use strict";

  const currentPath = () => window.location.pathname.replace(/\/+$/, "") || "/";
  const isLessonPage = () => /\/lessons\/lessons-\d+\.html$/i.test(currentPath());

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

  function lessonPdfHref(lessonHref) {
    const url = new URL(lessonHref, window.location.href);
    url.searchParams.set("download", "pdf");
    return url.href;
  }

  function enhanceLessonDownloadButtons(root = document) {
    root.querySelectorAll?.(".subject-card").forEach((card) => {
      const lesson = card.querySelector("a.action.lessons");
      if (!lesson || card.querySelector("a.action.download")) return;

      const download = document.createElement("a");
      download.className = "action download generated-pdf-fallback";
      download.href = lessonPdfHref(lesson.href);
      download.textContent = "Download Notes (PDF)";
      download.setAttribute("aria-label", `Download ${card.querySelector("h3")?.textContent?.trim() || "lesson"} as PDF`);

      const unavailable = [...card.querySelectorAll(".availability-label")]
        .find((item) => /notes/i.test(item.textContent || ""));
      if (unavailable) {
        unavailable.replaceWith(download);
      } else {
        card.querySelector(".action-row")?.append(download);
      }
    });
  }

  function observeLessonCards() {
    enhanceLessonDownloadButtons();
    const grid = document.getElementById("subjectGrid");
    if (!grid) return;
    const observer = new MutationObserver(() => enhanceLessonDownloadButtons(grid));
    observer.observe(grid, { childList: true, subtree: true });
  }

  function improveLessonPdfButtonLabel() {
    if (!isLessonPage()) return;
    document.querySelectorAll("button, a").forEach((control) => {
      if (/print\s*\/\s*save as pdf/i.test(control.textContent || "")) {
        control.textContent = "Download as PDF";
      }
    });
  }

  function openAllPrintableContent() {
    document.querySelectorAll("details").forEach((detail) => {
      detail.open = true;
    });
    document.querySelectorAll("[hidden]").forEach((element) => {
      if (element.closest("main")) element.hidden = false;
    });
  }

  function autoPrintLessonFromDownloadLink() {
    if (!isLessonPage()) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("download") !== "pdf" && params.get("print") !== "1") return;

    const started = Date.now();
    const timeout = 45000;
    const waitForCompleteLesson = window.setInterval(() => {
      const fragmentsLoading = document.querySelectorAll(".fragment-slot").length > 0;
      const loadingText = [...document.querySelectorAll("main *")]
        .some((node) => /^Loading\b/i.test((node.textContent || "").trim()));
      const ready = document.readyState === "complete" && !fragmentsLoading && !loadingText;

      if (ready || Date.now() - started > timeout) {
        window.clearInterval(waitForCompleteLesson);
        openAllPrintableContent();
        document.body.dataset.pdfDownloadReady = "true";
        window.setTimeout(() => window.print(), 500);
      }
    }, 250);
  }

  document.addEventListener("DOMContentLoaded", () => {
    normalizeLinks();
    materialPageFallbacks();
    contactFallbackTimer();
    layoutOverflowFlag();
    observeLessonCards();
    improveLessonPdfButtonLabel();
    autoPrintLessonFromDownloadLink();
  });
})();