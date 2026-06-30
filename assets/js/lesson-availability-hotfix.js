(() => {
  "use strict";

  const cache = new Map();
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

  function removeLabels(row, selectorText) {
    row.querySelectorAll(".availability-label").forEach((item) => {
      if (selectorText.test((item.textContent || "").trim())) item.remove();
    });
  }

  async function validateCard(card) {
    const row = card.querySelector(".action-row");
    const code = norm(card.dataset.subjectCode || card.querySelector(".subject-top strong")?.textContent);
    if (!row || !code) return;

    const notesHref = notesUrlFor(code);
    const lessonHref = lessonUrlFor(code, false);
    const lessonPrintHref = lessonUrlFor(code, true);
    const qp = row.querySelector(".action.qp");

    let lessonAvailable = Boolean(row.querySelector(".action.lessons")) || card.dataset.lessonAvailable === "true";
    if (!lessonAvailable) lessonAvailable = await lessonExists(lessonHref);
    if (!card.isConnected) return;

    if (lessonAvailable) {
      card.dataset.lessonAvailable = "true";
      if (!row.querySelector(".action.lessons")) {
        removeLabels(row, /lessons unavailable/i);
        const syllabus = row.querySelector(".action.syllabus");
        row.insertBefore(buildLink(lessonHref, "action lessons", "View Lessons"), syllabus?.nextSibling || row.firstChild);
      }
    }

    row.querySelectorAll(".action.download,.notes-status").forEach((item) => item.remove());
    const pending = document.createElement("span");
    pending.className = "availability-label notes-status";
    pending.setAttribute("aria-disabled", "true");
    pending.textContent = "Preparing notes…";
    row.insertBefore(pending, qp || null);

    const ok = await pdfExists(notesHref);
    if (!card.isConnected) return;
    row.querySelectorAll(".action.download,.notes-status").forEach((item) => item.remove());
    if (ok) {
      row.insertBefore(buildLink(notesHref, "action download", "Download Notes", true), qp || null);
    } else if (lessonAvailable) {
      row.insertBefore(buildLink(lessonPrintHref, "action download", "Download Notes", false), qp || null);
    } else {
      const unavailable = document.createElement("span");
      unavailable.className = "availability-label notes-status";
      unavailable.setAttribute("aria-disabled", "true");
      unavailable.textContent = "Notes unavailable";
      row.insertBefore(unavailable, qp || null);
    }
  }

  function run() {
    document.querySelectorAll(".subject-card").forEach((card) => {
      if (card.dataset.notesVerified === "1") return;
      card.dataset.notesVerified = "1";
      validateCard(card);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
})();