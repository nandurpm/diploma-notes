/* Purpose: Lesson availability hotfix - Descriptive comment added for clarity */
(() => {
  "use strict";

  const cache = new Map();
  const checking = new WeakSet();
  const SITTTR_BASE = "https://sitttrkerala.ac.in/index.php";
  const VALIDATION_VERSION = "20260718-model-paper-navigation3";

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

  const modelPaperUnavailableMessage = (revision, code) =>
    `Model Question Paper not available for Revision ${revision} for course ${code}.`;

  function bindReliableOfficialNavigation(link) {
    if (!link) return;
    link.dataset.officialNavigationBound = "native-anchor";
  }

  function configureOfficialLink(link, href, text, title) {
    if (!link) return null;
    link.href = href;
    link.textContent = text;
    link.title = title;
    link.removeAttribute("download");
    link.removeAttribute("target");
    link.setAttribute("rel", "external");
    bindReliableOfficialNavigation(link);
    return link;
  }

  function normalizeQuestionPaperLink(card, row, code, revision) {
    const link = row.querySelector(".action.qp");
    if (!link || !code) return link;
    link.dataset.courseCode = code;
    link.dataset.modelPaperCourse = code;
    link.dataset.modelPaperRevision = revision;
    if (revision === "2026") {
      const message = modelPaperUnavailableMessage(revision, code);
      link.textContent = "Open Model Question Paper";
      link.title = message;
      link.setAttribute("aria-label", message);
      link.setAttribute("aria-disabled", "true");
      link.dataset.modelPaperUnavailable = "true";
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.removeAttribute("download");
      link.setAttribute("role", "button");
      link.tabIndex = 0;
      if (!link.dataset.modelPaperUnavailableBound) {
        link.dataset.modelPaperUnavailableBound = "true";
        link.addEventListener("click", event => {
          event.preventDefault();
          window.alert(link.title || message);
        });
        link.addEventListener("keydown", event => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          window.alert(link.title || message);
        });
      }
      return link;
    }
    link.removeAttribute("aria-disabled");
    delete link.dataset.modelPaperUnavailable;
    return configureOfficialLink(
      link,
      questionPaperUrlFor(code),
      "Open Model Question Paper",
      `Open the official SITTTR Revision 2021 model-question-paper page for course ${code}.`
    );
  }

  function rebuildModelPaperNotice(notice) {
    if (!notice) return;
    let label = notice.querySelector("strong");
    if (!label) {
      label = document.createElement("strong");
      notice.prepend(label);
    }
    label.textContent = "Official Revision 2026 model question papers:";
    [...notice.childNodes].forEach(node => { if (node !== label) node.remove(); });
    notice.append(label, document.createTextNode(" Not available on the official SITTTR model-question-paper pages yet."));
  }

  async function enhanceDepartmentPaperAccess() {
    const slug = document.body?.dataset?.programmeSlug;
    const revision = String(document.body?.dataset?.revision || "");
    const notice = document.getElementById("rev2026-model-qp-access");
    if (revision !== "2026" || !notice) return;
    if (!slug) return;

    rebuildModelPaperNotice(notice);
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

  function keepSingle(row, selector) {
    const items = [...row.querySelectorAll(selector)];
    items.slice(1).forEach(item => item.remove());
    return items[0] || null;
  }

  function ensureUnavailable(row, qp) {
    row.querySelectorAll(".action.lessons,.action.download").forEach(item => item.remove());

    let lessons = keepSingle(row, ".lessons-status");
    if (!lessons) {
      lessons = document.createElement("span");
      row.insertBefore(lessons, qp || null);
    }
    lessons.className = "availability-label lessons-status";
    lessons.setAttribute("aria-disabled", "true");
    if (lessons.textContent !== "Lessons unavailable") lessons.textContent = "Lessons unavailable";

    let notes = keepSingle(row, ".notes-status");
    if (!notes) {
      notes = document.createElement("span");
      row.insertBefore(notes, qp || null);
    }
    notes.className = "availability-label notes-status";
    notes.setAttribute("aria-disabled", "true");
    if (notes.textContent !== "Notes unavailable") notes.textContent = "Notes unavailable";
  }

  function ensureAvailable(row, qp, lessonHref, notesHref, printHref, notesAvailable) {
    row.querySelectorAll(".lessons-status,.notes-status").forEach(item => item.remove());

    let lessons = keepSingle(row, ".action.lessons");
    if (!lessons) {
      lessons = document.createElement("a");
      const syllabus = row.querySelector(".action.syllabus");
      row.insertBefore(lessons, syllabus?.nextSibling || row.firstChild);
    }
    lessons.className = "action lessons";
    if (lessons.getAttribute("href") !== lessonHref) lessons.setAttribute("href", lessonHref);
    if (lessons.textContent !== "View Lessons") lessons.textContent = "View Lessons";
    lessons.removeAttribute("aria-disabled");

    let download = keepSingle(row, ".action.download");
    if (!download) {
      download = document.createElement("a");
      row.insertBefore(download, qp || null);
    }
    download.className = "action download";
    const downloadHref = notesAvailable ? notesHref : printHref;
    if (download.getAttribute("href") !== downloadHref) download.setAttribute("href", downloadHref);
    if (download.textContent !== "Download Notes") download.textContent = "Download Notes";
    download.removeAttribute("aria-disabled");

    if (notesAvailable) {
      download.setAttribute("download", "");
      download.removeAttribute("target");
      download.removeAttribute("rel");
    } else {
      download.removeAttribute("download");
      download.target = "_blank";
      download.rel = "noopener noreferrer";
    }
  }

  async function validateCard(card) {
    const row = card.querySelector(".action-row");
    const code = norm(card.dataset.subjectCode || card.querySelector(".subject-top strong")?.textContent);
    const revision = revisionOf(card);
    const validationKey = `${VALIDATION_VERSION}:${revision}:${code}`;
    if (!row || !code || checking.has(card) || card.dataset.availabilityValidated === validationKey) return;
    checking.add(card);

    try {
      const qp = normalizeQuestionPaperLink(card, row, code, revision);
      const lessonHref = lessonUrlFor(code, revision);
      const notesHref = notesUrlFor(code, revision);
      const printHref = lessonUrlFor(code, revision, true);
      const lessonAvailable = await lessonExists(lessonHref);
      if (!card.isConnected) return;

      if (!lessonAvailable) {
        card.dataset.lessonAvailable = "false";
        card.dataset.notesAvailable = "false";
        ensureUnavailable(row, qp);
        return;
      }

      card.dataset.lessonAvailable = "true";
      card.dataset.lessonHref = lessonHref;
      card.dataset.notesHref = notesHref;

      const notesAvailable = await pdfExists(notesHref);
      if (!card.isConnected) return;
      ensureAvailable(row, qp, lessonHref, notesHref, printHref, notesAvailable);
      card.dataset.notesAvailable = String(notesAvailable);
    } finally {
      if (card.isConnected) card.dataset.availabilityValidated = validationKey;
      checking.delete(card);
    }
  }

  let timer = 0;
  function run() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      enhanceDepartmentPaperAccess();
      const grid = document.getElementById("subjectGrid");
      if (grid?.dataset.mode === "papers") return;
      document.querySelectorAll(".subject-card").forEach(validateCard);
    }, 120);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();

  new MutationObserver(mutations => {
    const hasRelevantChange = mutations.some(mutation =>
      [...mutation.addedNodes].some(node =>
        node.nodeType === 1 && (
          node.matches?.(".subject-card,#rev2026-model-qp-access") ||
          node.querySelector?.(".subject-card,#rev2026-model-qp-access")
        )
      )
    );
    if (hasRelevantChange) run();
  }).observe(document.body, { childList: true, subtree: true });
})();
