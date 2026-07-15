(() => {
  "use strict";

  const cache = new Map();
  const checking = new WeakSet();
  const root = () => {
    const depth = location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth ? "../".repeat(depth) : "";
  };
  const norm = value => String(value || "").trim().toUpperCase();
  const revisionOf = card => String(card.dataset.revision || "2021").trim();

  function notesUrlFor(code, revision) {
    return revision === "2026"
      ? `${root()}revision-2026-content/notes/downloadable-notes-${encodeURIComponent(code)}.pdf`
      : `${root()}notes/downloadable-notes-${encodeURIComponent(code)}.pdf`;
  }

  function lessonUrlFor(code, revision, printMode = false) {
    const href = revision === "2026"
      ? `${root()}revision-2026-content/lessons/lessons-${encodeURIComponent(code)}.html`
      : `${root()}lessons/lessons-${encodeURIComponent(code)}.html`;
    return `${href}${printMode ? "?autoPrintNotes=1" : ""}`;
  }

  async function headOk(url, rejectHtml = false) {
    const absolute = new URL(url, location.href).href;
    const key = `${rejectHtml ? "file" : "page"}:${absolute}`;
    if (cache.has(key)) return cache.get(key);
    const check = fetch(absolute, { method: "HEAD", cache: "no-store" })
      .then(response => {
        const type = response.headers.get("content-type") || "";
        return response.ok && (!rejectHtml || !/html/i.test(type));
      })
      .catch(() => false);
    cache.set(key, check);
    const result = await check;
    cache.set(key, result);
    return result;
  }

  const pdfExists = url => headOk(url, true);
  const lessonExists = url => headOk(url, false);

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
        link.title = "The PDF is not published yet; open the lesson in print/PDF mode.";
      }
    }
    return link;
  }

  function isNotesLabel(item) {
    return item.classList?.contains("notes-status") || /notes?|preparing/i.test((item.textContent || "").trim());
  }

  function notesLabels(row) {
    return [...row.querySelectorAll(".availability-label")].filter(isNotesLabel);
  }

  function removeNotesControls(row) {
    row.querySelectorAll(".action.download,.notes-status").forEach(item => item.remove());
    row.querySelectorAll(".availability-label").forEach(item => {
      if (isNotesLabel(item)) item.remove();
    });
  }

  function removeLabels(row, pattern) {
    row.querySelectorAll(".availability-label").forEach(item => {
      if (pattern.test((item.textContent || "").trim())) item.remove();
    });
  }

  function hasLessonsUnavailable(row) {
    return [...row.querySelectorAll(".availability-label")].some(item => /lessons unavailable/i.test(item.textContent || ""));
  }

  function ensureLessonsUnavailable(row, qp) {
    row.querySelectorAll(".action.lessons").forEach(item => item.remove());
    if (hasLessonsUnavailable(row)) return;
    const syllabus = row.querySelector(".action.syllabus");
    const lessons = document.createElement("span");
    lessons.className = "availability-label lessons-status";
    lessons.setAttribute("aria-disabled", "true");
    lessons.textContent = "Lessons unavailable";
    row.insertBefore(lessons, syllabus?.nextSibling || qp || null);
  }

  function ensureNotesUnavailable(row, qp) {
    const current = notesLabels(row);
    if (!row.querySelector(".action.download") && current.length === 1 && /notes unavailable/i.test(current[0].textContent || "")) {
      current[0].classList.add("notes-status");
      return;
    }
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
      notesLabels(row).forEach(item => item.remove());
      return;
    }
    const notes = notesLabels(row);
    if (notes.length > 1) notes.slice(0, -1).forEach(item => item.remove());
    const final = notesLabels(row)[0];
    if (final) {
      final.classList.add("notes-status");
      if (!/preparing/i.test(final.textContent || "")) final.textContent = "Notes unavailable";
    }
  }

  function samePathAndQuery(href, expected) {
    try {
      const actualUrl = new URL(href, location.href);
      const expectedUrl = new URL(expected, location.href);
      return actualUrl.pathname === expectedUrl.pathname && actualUrl.search === expectedUrl.search;
    } catch {
      return false;
    }
  }

  function stableNoLesson(row) {
    const notes = notesLabels(row);
    return !row.querySelector(".action.download") && hasLessonsUnavailable(row) && notes.length === 1 && /notes unavailable/i.test(notes[0].textContent || "");
  }

  function stableLesson(row, expectedLesson, expectedDownload) {
    const lesson = row.querySelector(".action.lessons");
    const download = row.querySelector(".action.download");
    return Boolean(
      lesson && download
      && samePathAndQuery(lesson.href, expectedLesson)
      && samePathAndQuery(download.href, expectedDownload)
      && !notesLabels(row).length
    );
  }

  async function validateCard(card) {
    const row = card.querySelector(".action-row");
    const code = norm(card.dataset.subjectCode || card.querySelector(".subject-top strong")?.textContent);
    const revision = revisionOf(card);
    if (!row || !code || checking.has(card)) return;
    checking.add(card);

    try {
      const notesHref = notesUrlFor(code, revision);
      const lessonHref = lessonUrlFor(code, revision, false);
      const lessonPrintHref = lessonUrlFor(code, revision, true);
      const qp = row.querySelector(".action.qp");
      const existingLesson = row.querySelector(".action.lessons");

      if (existingLesson && !samePathAndQuery(existingLesson.href, lessonHref)) {
        existingLesson.remove();
        removeNotesControls(row);
        card.dataset.lessonAvailable = "false";
      }

      let lessonAvailable = Boolean(
        row.querySelector(".action.lessons")
        && samePathAndQuery(row.querySelector(".action.lessons").href, lessonHref)
      ) || card.dataset.lessonAvailable === "true";
      if (!lessonAvailable) lessonAvailable = await lessonExists(lessonHref);
      if (!card.isConnected) return;

      if (lessonAvailable) {
        card.dataset.lessonAvailable = "true";
        card.dataset.lessonHref = lessonHref;
        card.dataset.notesHref = notesHref;
        removeLabels(row, /lessons unavailable/i);
        if (!row.querySelector(".action.lessons")) {
          const syllabus = row.querySelector(".action.syllabus");
          row.insertBefore(buildLink(lessonHref, "action lessons", "View Lessons"), syllabus?.nextSibling || row.firstChild);
        }

        const notesAvailable = await pdfExists(notesHref);
        if (!card.isConnected) return;
        const expectedDownload = notesAvailable ? notesHref : lessonPrintHref;
        if (stableLesson(row, lessonHref, expectedDownload)) return;

        removeNotesControls(row);
        row.insertBefore(
          buildLink(expectedDownload, "action download", "Download Notes", notesAvailable),
          qp || null
        );
        card.dataset.notesAvailable = String(notesAvailable);
      } else {
        if (stableNoLesson(row)) return;
        card.dataset.lessonAvailable = "false";
        card.dataset.notesAvailable = "false";
        card.dataset.lessonHref = lessonHref;
        card.dataset.notesHref = notesHref;
        ensureLessonsUnavailable(row, qp);
        ensureNotesUnavailable(row, qp);
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
      document.querySelectorAll(".subject-card").forEach(card => {
        dedupeVisibleNotes(card);
        validateCard(card);
      });
    }, 120);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
})();
