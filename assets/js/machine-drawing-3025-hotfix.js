/* Purpose: Machine drawing 3025 hotfix - Descriptive comment added for clarity */
(() => {
  "use strict";
  const TARGET_DEPARTMENTS = new Set(["Mechanical Engineering", "Manufacturing Technology"]);
  const CODE = "3025";
  const NAME = "Machine Drawing";
  const revision = "2021";
  const semester = "Semester 3";
  const type = "Program Core / Drawing";
  const root = () => {
    const depth = location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth ? "../".repeat(depth) : "";
  };
  const esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const syllabus = () => `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${CODE}`;
  const qp = () => `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${CODE}`;
  const lesson = () => `${root()}lessons/lessons-${CODE}.html`;
  const notes = () => `${root()}lessons/lessons-${CODE}.html?autoPrintNotes=1`;
  function departmentName() {
    const grid = document.getElementById("subjectGrid");
    const dataDept = grid?.dataset?.department || "";
    if (TARGET_DEPARTMENTS.has(dataDept)) return dataDept;
    const heading = document.querySelector("h1")?.textContent?.trim() || "";
    if (TARGET_DEPARTMENTS.has(heading)) return heading;
    return "";
  }
  function card(dept) {
    return `<article class="subject-card" data-subject-code="${CODE}" data-notes-href="${esc(notes())}" data-lesson-href="${esc(lesson())}" data-lesson-available="true">
      <div class="subject-top"><span>${revision}</span><strong>${CODE}</strong></div>
      <h3>${NAME}</h3>
      <p>${esc(dept)} / ${semester} / ${type}</p>
      <div class="action-row">
        <a class="action syllabus" href="${esc(syllabus())}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>
        <a class="action lessons" href="${esc(lesson())}">View Lessons</a>
        <a class="action download" href="${esc(notes())}" target="_blank" rel="noopener noreferrer" data-generated-from-lesson="true">Download Notes</a>
        <a class="action qp" href="${esc(qp())}" target="_blank" rel="noopener noreferrer">Sample QP</a>
      </div>
    </article>`;
  }
  function run() {
    const grid = document.getElementById("subjectGrid");
    const dept = departmentName();
    if (!grid || !dept || grid.querySelector('[data-subject-code="3025"]')) return;
    const section = document.createElement("section");
    section.className = "semester-subject-section";
    section.style.cssText = "grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px";
    section.innerHTML = `<div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)"><h3>Semester 3</h3><span>Machine Drawing available</span></div><div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">${card(dept)}</div>`;
    grid.prepend(section);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
})();
