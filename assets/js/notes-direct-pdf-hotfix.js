/* Purpose: Notes direct pdf hotfix - Descriptive comment added for clarity */
(() => {
  "use strict";

  const cache = new Map();

  const root = () => {
    const depth = location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth ? "../".repeat(depth) : "";
  };

  const norm = (value) => String(value || "").trim().toUpperCase();
  const esc = (value) => encodeURIComponent(value);

  async function urlExists(url, options = {}) {
    const absolute = new URL(url, location.href).href;
    const key = `${absolute}|${options.expectHtml ? "html" : options.expectPdf ? "pdf" : "any"}`;
    if (cache.has(key)) return cache.get(key);

    const check = fetch(absolute, { method: "HEAD", cache: "no-store" })
      .then((response) => {
        if (!response.ok) return false;
        const type = response.headers.get("content-type") || "";
        if (options.expectHtml) return /html/i.test(type) || type === "";
        if (options.expectPdf) return !/html/i.test(type);
        return true;
      })
      .catch(() => false);

    cache.set(key, check);
    const result = await check;
    cache.set(key, result);
    return result;
  }

  function notesUrlFor(code) {
    return `${root()}notes/downloadable-notes-${esc(code)}.pdf`;
  }

  function lessonPathFor(code) {
    return `${root()}lessons/lessons-${esc(code)}.html`;
  }

  function lessonPrintUrlFor(code) {
    return `${lessonPathFor(code)}?autoPrintNotes=1`;
  }

  function clearNotes(row) {
    row.querySelectorAll(".action.download,.notes-status").forEach((item) => item.remove());
    Array.from(row.querySelectorAll(".availability-label"))
      .filter((item) => /notes?/i.test(item.textContent || ""))
      .forEach((item) => item.remove());
  }

  function makeLink(href, mode) {
    const link = document.createElement("a");
    link.className = "action download";
    link.href = href;
    link.textContent = "Download Notes";

    if (mode === "lesson") {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.dataset.generatedFromLesson = "true";
      link.title = "Generate clean PDF notes directly from the lesson HTML page.";
    } else {
      link.download = "";
      link.dataset.verified = "true";
      link.title = "Download the published PDF notes.";
    }
    return link;
  }

  async function validateCard(card) {
    const code = norm(card.querySelector(".subject-top strong")?.textContent || card.dataset.subjectCode);
    const row = card.querySelector(".action-row");
    if (!row || !code) return;

    const qp = row.querySelector(".action.qp");
    clearNotes(row);

    const waiting = document.createElement("span");
    waiting.className = "availability-label notes-status";
    waiting.setAttribute("aria-disabled", "true");
    waiting.textContent = "Preparing notes…";
    row.insertBefore(waiting, qp || null);

    const lessonAlreadyLinked = Boolean(row.querySelector(".action.lessons")) || card.dataset.lessonAvailable === "true";
    const lessonExists = lessonAlreadyLinked || await urlExists(lessonPathFor(code), { expectHtml: true });

    // Direct LFS CDN URL for actual files stored on GitHub CDN
    const mediaNotesUrl = `https://media.githubusercontent.com/media/nandurpm/diploma-notes/main/notes/downloadable-notes-${esc(code)}.pdf`;
    const staticPdfExists = lessonExists ? false : await urlExists(mediaNotesUrl, { expectPdf: true });

    if (!card.isConnected) return;
    clearNotes(row);

    if (lessonExists) {
      row.insertBefore(makeLink(lessonPrintUrlFor(code), "lesson"), qp || null);
      card.dataset.lessonAvailable = "true";
      card.dataset.notesSource = "lesson-html";
    } else if (staticPdfExists) {
      row.insertBefore(makeLink(mediaNotesUrl, "pdf"), qp || null);
      card.dataset.notesSource = "static-pdf";
    } else {
      const unavailable = document.createElement("span");
      unavailable.className = "availability-label notes-status";
      unavailable.setAttribute("aria-disabled", "true");
      unavailable.textContent = "Lessons unavailable";
      row.insertBefore(unavailable, qp || null);
    }
  }

  function run() {
    document.querySelectorAll(".subject-card").forEach((card) => {
      if (card.dataset.notesChecked === "1") return;
      card.dataset.notesChecked = "1";
      validateCard(card);
    });
  }

  addEventListener("DOMContentLoaded", () => {
    run();
    new MutationObserver(run).observe(document.getElementById("subjectGrid") || document.body, {
      childList: true,
      subtree: true
    });
  });
})();
