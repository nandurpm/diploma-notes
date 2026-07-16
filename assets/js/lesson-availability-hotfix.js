(() => {
  "use strict";

  const cache = new Map();
  const checking = new WeakSet();
  const SITTTR_BASE = "https://sitttrkerala.ac.in/index.php";
  const REV2026_INDEX = `${SITTTR_BASE}?r=site%2Fdiploma-modelqp&scheme=REV2026`;
  let programmeLookup = null;

  const root = () => {
    const depth = location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth ? "../".repeat(depth) : "";
  };
  const norm = value => String(value || "").trim().toUpperCase();
  const revisionOf = card => String(card.dataset.revision || "2021").trim();

  const notesUrlFor = (code, revision) => revision === "2026"
    ? `${root()}revision-2026-content/notes/downloadable-notes-${encodeURIComponent(code)}.pdf`
    : `${root()}notes/downloadable-notes-${encodeURIComponent(code)}.pdf`;

  const lessonUrlFor = (code, revision, printMode = false) => {
    const href = revision === "2026"
      ? `${root()}revision-2026-content/lessons/lessons-${encodeURIComponent(code)}.html`
      : `${root()}lessons/lessons-${encodeURIComponent(code)}.html`;
    return `${href}${printMode ? "?autoPrintNotes=1" : ""}`;
  };

  const questionPaperUrlFor = code =>
    `${SITTTR_BASE}?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(code)}`;

  const programmeQuestionPaperUrlFor = programmeCode =>
    `${SITTTR_BASE}?r=site%2Fdiploma-modelqp-courses&prog=${encodeURIComponent(programmeCode)}`;

  function normalizeQuestionPaperLink(card, row, code, revision) {
    const link = row.querySelector(".action.qp");
    if (!link || !code) return link;
    link.href = questionPaperUrlFor(code);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.dataset.courseCode = code;
    if (revision === "2026") {
      link.dataset.scheme = "REV2026";
      link.textContent = "Sample Question Paper";
      link.title = `Open the official SITTTR Revision 2026 model-question-paper page for course ${code}.`;
    }
    return link;
  }

  async function enhanceDepartmentPaperAccess() {
    const slug = document.body?.dataset?.programmeSlug;
    const revision = String(document.body?.dataset?.revision || "");
    const notice = document.getElementById("rev2026-model-qp-access");
    if (revision !== "2026" || !slug || !notice) return;

    if (!programmeLookup) {
      programmeLookup = fetch(`${root()}assets/data/revision-2026-programmes.json?v=20260716-modelqp-links3`, { cache: "no-store" })
        .then(response => response.ok ? response.json() : null)
        .catch(() => null);
    }

    const payload = await programmeLookup;
    const programme = payload?.programmes?.find(item => item.slug === slug);
    const programmeCode = norm(programme?.officialCode);
    if (!programmeCode || !notice.isConnected) return;

    document.body.dataset.programmeCode = programmeCode;
    let departmentLink = notice.querySelector("a[data-model-qp-programme]");
    if (!departmentLink) {
      departmentLink = document.createElement("a");
      departmentLink.className = "btn ghost";
      departmentLink.dataset.modelQpProgramme = programmeCode;
      departmentLink.target = "_blank";
      departmentLink.rel = "noopener noreferrer";
      notice.append(" ", departmentLink);
    }
    departmentLink.href = programmeQuestionPaperUrlFor(programmeCode);
    departmentLink.textContent = `Open ${programmeCode} department sample papers`;

    let indexLink = notice.querySelector("a[data-model-qp-index]");
    if (!indexLink) {
      indexLink = document.createElement("a");
      indexLink.className = "btn ghost";
      indexLink.dataset.modelQpIndex = "REV2026";
      indexLink.target = "_blank";
      indexLink.rel = "noopener noreferrer";
      indexLink.href = REV2026_INDEX;
      indexLink.textContent = "Open all REV2026 sample papers";
      notice.append(" ", indexLink);
    }
  }

  async function headOk(url, rejectHtml = false) {
    const absolute = new URL(url, location.href).href;
    const key = `${rejectHtml ? "file" : "page"}:${absolute}`;
    if (cache.has(key)) return cache.get(key);
    const promise = fetch(absolute, { method: "HEAD", cache: "no-store" })
      .then(response => {
        const type = response.headers.get("content-type") || "";
        return response.ok && (!rejectHtml || !/html/i.test(type));
      })
      .catch(() => false);
    cache.set(key, promise);
    const result = await promise;
    cache.set(key, result);
    return result;
  }

  const lessonExists = url => headOk(url, false);
  const pdfExists = url => headOk(url, true);

  function makeLink(href, className, label, download = false) {
    const link = document.createElement("a");
    link.className = className;
    link.href = href;
    link.textContent = label;
    if (download) link.download = "";
    else if (className.includes("download")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    return link;
  }

  function removeStudyControls(row) {
    row.querySelectorAll(".action.lessons,.action.download,.lessons-status,.notes-status").forEach(item => item.remove());
  }

  function addUnavailable(row, qp) {
    const lessons = document.createElement("span");
    lessons.className = "availability-label lessons-status";
    lessons.setAttribute("aria-disabled", "true");
    lessons.textContent = "Lessons unavailable";

    const notes = document.createElement("span");
    notes.className = "availability-label notes-status";
    notes.setAttribute("aria-disabled", "true");
    notes.textContent = "Notes unavailable";

    row.insertBefore(lessons, qp || null);
    row.insertBefore(notes, qp || null);
  }

  async function validateCard(card) {
    const row = card.querySelector(".action-row");
    const code = norm(card.dataset.subjectCode || card.querySelector(".subject-top strong")?.textContent);
    const revision = revisionOf(card);
    if (!row || !code || checking.has(card)) return;
    checking.add(card);

    try {
      const qp = normalizeQuestionPaperLink(card, row, code, revision);
      const lessonHref = lessonUrlFor(code, revision);
      const notesHref = notesUrlFor(code, revision);
      const printHref = lessonUrlFor(code, revision, true);
      const lessonAvailable = await lessonExists(lessonHref);
      if (!card.isConnected) return;

      removeStudyControls(row);
      if (!lessonAvailable) {
        card.dataset.lessonAvailable = "false";
        card.dataset.notesAvailable = "false";
        addUnavailable(row, qp);
        return;
      }

      card.dataset.lessonAvailable = "true";
      card.dataset.lessonHref = lessonHref;
      card.dataset.notesHref = notesHref;

      const syllabus = row.querySelector(".action.syllabus");
      const lessonsLink = makeLink(lessonHref, "action lessons", "View Lessons");
      row.insertBefore(lessonsLink, syllabus?.nextSibling || row.firstChild);

      const notesAvailable = await pdfExists(notesHref);
      if (!card.isConnected) return;
      const download = makeLink(
        notesAvailable ? notesHref : printHref,
        "action download",
        "Download Notes",
        notesAvailable
      );
      row.insertBefore(download, qp || null);
      card.dataset.notesAvailable = String(notesAvailable);
    } finally {
      checking.delete(card);
    }
  }

  let timer = 0;
  function run() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      enhanceDepartmentPaperAccess();
      document.querySelectorAll(".subject-card").forEach(validateCard);
    }, 120);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
})();
