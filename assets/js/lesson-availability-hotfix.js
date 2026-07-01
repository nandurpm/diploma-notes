(() => {
  "use strict";

  const cache = new Map();
  const checking = new WeakSet();
  const root = () => {
    const depth = location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth ? "../".repeat(depth) : "";
  };
  const norm = (value) => String(value || "").trim().toUpperCase();
  const notesUrlFor = (code) => `${root()}notes/downloadable-notes-${encodeURIComponent(code)}.pdf`;
  const lessonUrlFor = (code, printMode = false) => `${root()}lessons/lessons-${encodeURIComponent(code)}.html${printMode ? "?autoPrintNotes=1" : ""}`;

  async function headOk(url, rejectHtml = false) {
    const absolute = new URL(url, location.href).href;
    const key = `${rejectHtml ? "file" : "page"}:${absolute}`;
    if (cache.has(key)) return cache.get(key);
    const check = fetch(absolute, { method: "HEAD", cache: "no-store" })
      .then((response) => {
        const type = response.headers.get("content-type") || "";
        return response.ok && (!rejectHtml || !/html/i.test(type));
      })
      .catch(() => false);
    cache.set(key, check);
    const result = await check;
    cache.set(key, result);
    return result;
  }

  const pdfExists = (url) => headOk(url, true);
  const lessonExists = (url) => headOk(url, false);

  function buildLink(href, className, label, verified = false) {
    const link = document.createElement("a");
    link.className = className;
    link.href = href;
    link.textContent = label;
    if (className.includes("download")) {
      if (verified) {
        link.download = "";
        link.dataset.verified = "true";
        link.title = "Download the generated PDF notes.";
      } else {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.dataset.generatedFromLesson = "true";
        link.title = "Generated PDF is not published yet; open the lesson in print/PDF mode.";
      }
    }
    return link;
  }

  function isNotesLabel(item) {
    return item.classList?.contains("notes-status") || /notes?|preparing/i.test((item.textContent || "").trim());
  }

  function removeNotesControls(row) {
    row.querySelectorAll(".action.download,.notes-status").forEach((item) => item.remove());
    row.querySelectorAll(".availability-label").forEach((item) => {
      if (isNotesLabel(item)) item.remove();
    });
  }

  function removeLabels(row, pattern) {
    row.querySelectorAll(".availability-label").forEach((item) => {
      if (pattern.test((item.textContent || "").trim())) item.remove();
    });
  }

  function insertNotesUnavailable(row, qp) {
    removeNotesControls(row);
    const unavailable = document.createElement("span");
    unavailable.className = "availability-label notes-status";
    unavailable.setAttribute("aria-disabled", "true");
    unavailable.textContent = "Notes unavailable";
    row.insertBefore(unavailable, qp || null);
  }

  function dedupeVisibleNotes(card) {
    const row = card.querySelector(".action-row");
    if (!row) return;
    if (row.querySelector(".action.download")) {
      row.querySelectorAll(".availability-label").forEach((item) => {
        if (isNotesLabel(item)) item.remove();
      });
      return;
    }
    const notes = [...row.querySelectorAll(".availability-label")].filter(isNotesLabel);
    if (notes.length > 1) notes.slice(0, -1).forEach((item) => item.remove());
    const final = [...row.querySelectorAll(".availability-label")].filter(isNotesLabel)[0];
    if (final) {
      final.classList.add("notes-status");
      if (/preparing/i.test(final.textContent || "")) return;
      final.textContent = "Notes unavailable";
    }
  }

  async function validateCard(card) {
    const row = card.querySelector(".action-row");
    const code = norm(card.dataset.subjectCode || card.querySelector(".subject-top strong")?.textContent);
    if (!row || !code || checking.has(card)) return;
    checking.add(card);

    try {
      const notesHref = notesUrlFor(code);
      const lessonHref = lessonUrlFor(code, false);
      const lessonPrintHref = lessonUrlFor(code, true);
      const qp = row.querySelector(".action.qp");

      let lessonAvailable = Boolean(row.querySelector(".action.lessons")) || card.dataset.lessonAvailable === "true";
      if (!lessonAvailable) lessonAvailable = await lessonExists(lessonHref);
      if (!card.isConnected) return;

      if (lessonAvailable) {
        card.dataset.lessonAvailable = "true";
        removeLabels(row, /lessons unavailable/i);
        if (!row.querySelector(".action.lessons")) {
          const syllabus = row.querySelector(".action.syllabus");
          row.insertBefore(buildLink(lessonHref, "action lessons", "View Lessons"), syllabus?.nextSibling || row.firstChild);
        }
        removeNotesControls(row);
        const ok = await pdfExists(notesHref);
        if (!card.isConnected) return;
        removeNotesControls(row);
        row.insertBefore(buildLink(ok ? notesHref : lessonPrintHref, "action download", "Download Notes", ok), qp || null);
      } else {
        card.dataset.lessonAvailable = "false";
        if (!row.querySelector(".availability-label") || !/lessons unavailable/i.test(row.textContent || "")) {
          const syllabus = row.querySelector(".action.syllabus");
          const lessons = document.createElement("span");
          lessons.className = "availability-label lessons-status";
          lessons.setAttribute("aria-disabled", "true");
          lessons.textContent = "Lessons unavailable";
          row.insertBefore(lessons, syllabus?.nextSibling || qp || null);
        }
        insertNotesUnavailable(row, qp);
      }
    } finally {
      checking.delete(card);
      dedupeVisibleNotes(card);
    }
  }

  let timer = 0;
  function run() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      document.querySelectorAll(".subject-card").forEach((card) => {
        dedupeVisibleNotes(card);
        validateCard(card);
      });
    }, 80);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
})();