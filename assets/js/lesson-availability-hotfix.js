(() => {
  "use strict";

  // Must match actual files in /lessons. Letter variants stay exact, e.g. 5043A -> lessons-5043A.html.
  const LESSON_CODES = new Set([
    "1001", "1002", "1003", "1004", "1005", "1006", "1007", "1008",
    "2001", "2002", "2003", "2031", "2032", "2038", "2039", "2041", "2049",
    "3023", "3031", "3032", "3041", "3042", "3043", "3044", "3045", "3046", "3047", "3048", "3049", "3132",
    "4001", "4031", "4041", "4042", "4043", "5031", "5041", "5042", "5043", "5043A", "6002",
    "6041", "6041A", "6041B", "6041C", "6042A", "6042B", "6042C", "6042D"
  ]);

  const TITLE_FIXES = new Map([
    ["3048", "Electronic Devices Lab"],
    ["3049", "Digital Electronics Lab"],
    ["4031", "Power Electronics Devices and Circuits"],
    ["5043", "Optical Communication and Networking"],
    ["5043A", "Optical Communication and Networking"]
  ]);

  const pdfStatus = new Map();
  const rootPrefix = () => {
    const depth = window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth > 0 ? "../".repeat(depth) : "";
  };

  const normalize = (code) => String(code || "").trim().toUpperCase();
  const hasLesson = (code) => LESSON_CODES.has(normalize(code));
  const lessonHrefFor = (code) => `${rootPrefix()}lessons/lessons-${encodeURIComponent(code)}.html`;
  const pdfHrefFor = (code) => `${rootPrefix()}notes/downloadable-notes-${encodeURIComponent(code)}.pdf`;
  const fallbackPrintHrefFor = (code) => `${lessonHrefFor(code)}?print=1`;

  async function pdfExists(code) {
    const normalized = normalize(code);
    if (pdfStatus.has(normalized)) return pdfStatus.get(normalized);
    const href = pdfHrefFor(normalized);
    try {
      const response = await fetch(href, { method: "HEAD", cache: "no-store" });
      const size = Number(response.headers.get("content-length") || 0);
      const ok = response.ok && (!size || size > 20000);
      pdfStatus.set(normalized, ok);
      return ok;
    } catch {
      pdfStatus.set(normalized, false);
      return false;
    }
  }

  function ensureLessonButton(actions, code) {
    const href = lessonHrefFor(code);
    let lessonBtn = actions.querySelector(".action.lessons");
    if (lessonBtn) {
      lessonBtn.setAttribute("href", href);
      lessonBtn.textContent = "View Lessons";
      return lessonBtn;
    }

    [...actions.querySelectorAll(".availability-label")]
      .filter((el) => /lesson/i.test(el.textContent || ""))
      .forEach((el) => el.remove());

    lessonBtn = document.createElement("a");
    lessonBtn.className = "action lessons";
    lessonBtn.href = href;
    lessonBtn.textContent = "View Lessons";

    const syllabus = actions.querySelector(".action.syllabus");
    if (syllabus && syllabus.nextSibling) actions.insertBefore(lessonBtn, syllabus.nextSibling);
    else actions.prepend(lessonBtn);
    return lessonBtn;
  }

  function ensureNotesButton(actions, code) {
    let notesBtn = actions.querySelector(".action.download");
    if (!notesBtn) {
      [...actions.querySelectorAll(".availability-label")]
        .filter((el) => /notes/i.test(el.textContent || ""))
        .forEach((el) => el.remove());

      notesBtn = document.createElement("a");
      notesBtn.className = "action download";
      notesBtn.textContent = "Download Notes";

      const lessonBtn = actions.querySelector(".action.lessons");
      const qp = actions.querySelector(".action.qp");
      if (lessonBtn && lessonBtn.nextSibling) actions.insertBefore(notesBtn, lessonBtn.nextSibling);
      else if (qp) actions.insertBefore(notesBtn, qp);
      else actions.append(notesBtn);
    }

    const fallbackHref = fallbackPrintHrefFor(code);
    notesBtn.href = fallbackHref;
    notesBtn.removeAttribute("download");
    notesBtn.title = "PDF will download when generated. Until then, this opens the lesson page for Print / Save as PDF.";
    notesBtn.dataset.notesFallback = "html-print";

    pdfExists(code).then((available) => {
      if (!available) return;
      notesBtn.href = pdfHrefFor(code);
      notesBtn.setAttribute("download", "");
      notesBtn.title = "Download generated PDF notes";
      notesBtn.dataset.notesFallback = "pdf";
    });

    return notesBtn;
  }

  function fixCard(card) {
    const codeEl = card.querySelector(".subject-top strong");
    const actions = card.querySelector(".action-row");
    if (!codeEl || !actions) return;

    const code = normalize(codeEl.textContent);
    if (!hasLesson(code)) return;

    const titleEl = card.querySelector("h3");
    const fixedTitle = TITLE_FIXES.get(code);
    if (titleEl && fixedTitle) titleEl.textContent = fixedTitle;

    ensureLessonButton(actions, code);
    ensureNotesButton(actions, code);
  }

  function applyFixes() {
    document.querySelectorAll(".subject-card").forEach(fixCard);
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyFixes();
    const grid = document.getElementById("subjectGrid") || document.body;
    new MutationObserver(applyFixes).observe(grid, { childList: true, subtree: true });
  });
})();