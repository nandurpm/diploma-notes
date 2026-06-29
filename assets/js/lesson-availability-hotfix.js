(() => {
  "use strict";

  // Must match actual files in /lessons. Letter variants stay exact, e.g. 5043A -> lessons-5043A.html.
  const LESSON_CODES = new Set([
    "1001", "1002", "1003", "1004", "1005", "1006", "1007", "1008",
    "2001", "2002", "2003", "2031", "2032", "2038", "2039", "2041", "2049",
    "3023", "3031", "3032", "3041", "3042", "3043", "3044", "3045", "3046", "3047", "3048", "3049", "3132",
    "4001", "4031", "4041", "4042", "4043", "5041", "5042", "5043", "5043A", "6002",
    "6041", "6041A", "6041B", "6041C", "6042A", "6042B", "6042C", "6042D"
  ]);

  const TITLE_FIXES = new Map([
    ["3048", "Digital Electronics Lab"],
    ["3049", "Fundamentals of C Programming Lab"],
    ["4031", "Power Electronics Devices and Circuits"],
    ["5043", "Optical Communication and Networking"],
    ["5043A", "Optical Communication and Networking"]
  ]);

  const rootPrefix = () => {
    const depth = window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth > 0 ? "../".repeat(depth) : "";
  };

  const normalize = (code) => String(code || "").trim().toUpperCase();
  const hasLesson = (code) => LESSON_CODES.has(normalize(code));

  function fixCard(card) {
    const codeEl = card.querySelector(".subject-top strong");
    const actions = card.querySelector(".action-row");
    if (!codeEl || !actions) return;

    const code = normalize(codeEl.textContent);
    if (!hasLesson(code)) return;

    const titleEl = card.querySelector("h3");
    const fixedTitle = TITLE_FIXES.get(code);
    if (titleEl && fixedTitle) titleEl.textContent = fixedTitle;

    const href = `${rootPrefix()}lessons/lessons-${encodeURIComponent(code)}.html`;
    let lessonBtn = actions.querySelector(".action.lessons");
    if (lessonBtn) {
      lessonBtn.setAttribute("href", href);
      lessonBtn.textContent = "View Lessons";
      return;
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
