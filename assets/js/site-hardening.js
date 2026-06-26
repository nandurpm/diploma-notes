(() => {
  "use strict";

  const currentPath = () => window.location.pathname.replace(/\/+$/, "") || "/";
  const isRevisionDepartmentPage = () => /^\/revision-2021\/.+\.html$/i.test(currentPath());
  const isLessonPage = () => /\/lessons\/lessons-\d+[a-z]?\.html$/i.test(currentPath());
  const COMMON_DEPARTMENT = "First Year / Common";
  const DEPARTMENT_ALIASES = new Map([
    ["electrical engineering", "electrical and electronics engineering"],
    ["civil public health and environment engineering", "civil and environmental engineering"]
  ]);

  const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const semesterRank = (value) => Number(String(value || "").match(/\d+/)?.[0] || 999);

  function rootPrefix() {
    const depth = window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth > 0 ? "../".repeat(depth) : "";
  }

  function normalizeDepartment(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/\+/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\band\b/g, " and ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function normalizeLinks() {
    document.querySelectorAll(".navlinks a.active").forEach((link) => link.setAttribute("aria-current", "page"));
    document.querySelectorAll('a[target="_blank"]').forEach((link) => link.setAttribute("rel", "noopener noreferrer"));
    document.querySelectorAll('a[href="departments.html"], a[href="/departments.html"]').forEach((link) => {
      link.href = link.getAttribute("href")?.startsWith("/") ? "/revision-2021.html" : "revision-2021.html";
      if (/departments/i.test(link.textContent || "")) link.textContent = "Revision 2021";
    });
  }

  function blockHeavyDepartmentScripts() {
    if (!isRevisionDepartmentPage()) return;
    window.POLY_DISABLE_ASSISTANT = true;
    document.querySelectorAll('script[src*="site-assistant-loader"], script[src*="visitor-popup"]').forEach((script) => script.remove());
    document.getElementById("polySiteAssistant")?.remove();
    document.querySelectorAll(".poly-ai-button,.poly-visitor-popup").forEach((element) => element.remove());
  }

  async function loadSubjectsSafely() {
    if (Array.isArray(window.SUBJECTS) && window.SUBJECTS.length) return window.SUBJECTS;
    try {
      const response = await fetch(`${rootPrefix()}assets/js/subjects.js?v=20260626-department-emergency-renderer`, { cache: "reload" });
      if (!response.ok) throw new Error(`subjects.js failed: ${response.status}`);
      const text = await response.text();
      const match = text.match(/\b(?:const|let|var)\s+SUBJECTS\s*=\s*(\[[\s\S]*?\]);/m);
      if (!match) throw new Error("SUBJECTS array missing");
      const parsed = Function(`"use strict"; return (${match[1]});`)();
      if (!Array.isArray(parsed)) throw new Error("SUBJECTS is not an array");
      window.SUBJECTS = parsed;
      return parsed;
    } catch (error) {
      console.error("Emergency subject load failed", error);
      return [];
    }
  }

  function sortSubjects(subjects) {
    return [...subjects].sort((a, b) => {
      const semester = semesterRank(a.semester) - semesterRank(b.semester);
      if (semester) return semester;
      const common = (a.department === COMMON_DEPARTMENT ? 0 : 1) - (b.department === COMMON_DEPARTMENT ? 0 : 1);
      if (common) return common;
      return String(a.code || "").localeCompare(String(b.code || ""), undefined, { numeric: true, sensitivity: "base" });
    });
  }

  function linkFor(kind, subject) {
    const code = encodeURIComponent(subject.code || "");
    if (kind === "syllabus") return `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${code}`;
    if (kind === "qp") return `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${code}`;
    if (kind === "lesson") return `${rootPrefix()}lessons/lessons-${code}.html`;
    return `${rootPrefix()}notes/downloadable-notes-${code}.pdf`;
  }

  function subjectCard(subject) {
    return `
      <article class="subject-card reveal">
        <div class="subject-top"><span>${esc(subject.revision)}</span><strong>${esc(subject.code)}</strong></div>
        <h3>${esc(subject.name)}</h3>
        <p>${esc(subject.department)} / ${esc(subject.semester)} / ${esc(subject.type)}</p>
        <div class="action-row">
          <a class="action syllabus" href="${esc(linkFor("syllabus", subject))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>
          <a class="action lessons" href="${esc(linkFor("lesson", subject))}">View Lessons</a>
          <a class="action download" href="${esc(linkFor("notes", subject))}" download>Download Notes</a>
          <a class="action qp" href="${esc(linkFor("qp", subject))}" target="_blank" rel="noopener noreferrer">Sample QP</a>
        </div>
      </article>`;
  }

  function groupCards(subjects) {
    const groups = new Map();
    subjects.forEach((subject) => {
      const semester = String(subject.semester || "Other subjects");
      if (!groups.has(semester)) groups.set(semester, []);
      groups.get(semester).push(subject);
    });
    return Array.from(groups.entries()).map(([semester, items], index) => `
      <section class="semester-subject-section" aria-labelledby="semester-emergency-heading-${index + 1}" style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px">
        <div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)">
          <h3 id="semester-emergency-heading-${index + 1}">${esc(semester)}</h3>
          <span>${items.length} ${items.length === 1 ? "subject" : "subjects"}</span>
        </div>
        <div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">
          ${items.map(subjectCard).join("")}
        </div>
      </section>`).join("");
  }

  function pickDepartmentSubjects(subjects, fixedRevision, fixedDepartmentKey) {
    const aliasDepartmentKey = DEPARTMENT_ALIASES.get(fixedDepartmentKey) || "";
    const exact = subjects.filter((subject) => {
      if (String(subject.revision) !== fixedRevision) return false;
      const subjectDepartmentKey = normalizeDepartment(subject.department);
      return subjectDepartmentKey === fixedDepartmentKey || subject.department === COMMON_DEPARTMENT;
    });

    const exactSpecialCount = exact.filter((subject) => subject.department !== COMMON_DEPARTMENT).length;
    if (exactSpecialCount >= 8 || !aliasDepartmentKey) return exact;

    const alias = subjects.filter((subject) => {
      if (String(subject.revision) !== fixedRevision) return false;
      const subjectDepartmentKey = normalizeDepartment(subject.department);
      return subjectDepartmentKey === aliasDepartmentKey || subject.department === COMMON_DEPARTMENT;
    });
    return alias.length > exact.length ? alias : exact;
  }

  async function emergencyRenderDepartmentSubjects(force = false) {
    if (!isRevisionDepartmentPage()) return;
    const grid = document.getElementById("subjectGrid");
    if (!grid) return;
    if (!force && grid.querySelector(".subject-card")) return;

    const fixedRevision = grid.dataset.revision || "2021";
    const fixedDepartment = grid.dataset.department || document.querySelector("h1")?.textContent || "";
    const fixedDepartmentKey = normalizeDepartment(fixedDepartment);
    const semesterFilter = document.getElementById("semesterFilter");
    const search = document.getElementById("subjectSearch");
    const status = document.getElementById("subjectResultStatus") || document.createElement("p");

    status.id = "subjectResultStatus";
    status.className = "subject-browser-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    if (!status.isConnected) grid.before(status);

    const subjects = await loadSubjectsSafely();
    if (!subjects.length) {
      grid.innerHTML = '<p class="empty">No subjects found. Please try again later.</p>';
      status.textContent = "Subject data failed to load.";
      return;
    }

    const departmentSubjects = pickDepartmentSubjects(subjects, fixedRevision, fixedDepartmentKey);

    const semesters = [...new Set(departmentSubjects.map((subject) => subject.semester).filter(Boolean))]
      .sort((a, b) => semesterRank(a) - semesterRank(b));
    if (semesterFilter && semesterFilter.options.length <= 1) {
      semesterFilter.replaceChildren();
      const all = document.createElement("option");
      all.value = "all";
      all.textContent = "All semesters";
      semesterFilter.append(all);
      semesters.forEach((semester) => {
        const option = document.createElement("option");
        option.value = semester;
        option.textContent = semester;
        semesterFilter.append(option);
      });
    }

    function render() {
      const query = String(search?.value || "").trim().toLowerCase();
      const semester = semesterFilter?.value || "all";
      const visible = sortSubjects(departmentSubjects.filter((subject) => {
        if (semester !== "all" && subject.semester !== semester) return false;
        if (!query) return true;
        return [subject.code, subject.name, subject.department, subject.semester, subject.type]
          .join(" ")
          .toLowerCase()
          .includes(query);
      }));
      grid.innerHTML = visible.length ? groupCards(visible) : '<p class="empty">No subjects match the selected filters.</p>';
      status.textContent = visible.length ? `${visible.length} ${visible.length === 1 ? "subject" : "subjects"} shown.` : "No matching subjects found.";
    }

    if (grid.dataset.emergencyRendererBound !== "true") {
      grid.dataset.emergencyRendererBound = "true";
      search?.addEventListener("input", render);
      semesterFilter?.addEventListener("change", render);
    }
    render();
  }

  function basicLessonFixes() {
    if (!isLessonPage()) return;
    document.querySelectorAll("details").forEach((detail) => {
      if (new URLSearchParams(window.location.search).get("print") === "1") detail.open = true;
    });
  }

  blockHeavyDepartmentScripts();

  document.addEventListener("DOMContentLoaded", () => {
    normalizeLinks();
    blockHeavyDepartmentScripts();
    basicLessonFixes();
    if (isRevisionDepartmentPage()) {
      emergencyRenderDepartmentSubjects(false);
      window.setTimeout(() => emergencyRenderDepartmentSubjects(false), 500);
      window.setTimeout(() => emergencyRenderDepartmentSubjects(true), 1800);
    }
  });
})();