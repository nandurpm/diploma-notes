(() => {
  "use strict";

  const COMMON_DEPARTMENT = "First Year / Common";
  const COMMON_VALUE = "__common__";
  const PAGE_SIZE = 30;
  const SUBJECT_JSON_URL = "/assets/data/subjects.json";
  const MIN_EXPECTED_DEPARTMENT_SUBJECTS = 18;
  const LESSON_CODES = new Set(["1001","1002","1003","1004","1005","1006","1008","2001","2002","2003","2031","2032","2038","2041","3023","3031","3032","3041","3043","3044","3045","3046","3047","3132","4001","6002"]);
  const NOTES_CODES = new Set(["1001","1002","1003","1004","1005","1006","1008","2001","2002","2003","2031","2032","2038","2041","3023","3031","3032","3041","3043","3044","3045","3046","3047","3132","4001","6002"]);

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[char]);
  const rank = (value) => Number(String(value || "").match(/\d+/)?.[0] || 999);
  const rootPrefix = () => window.location.pathname.split("/").filter(Boolean).length > 1 ? "../" : "";
  const syllabus = (code) => `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(code)}`;
  const qp = (code) => `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(code)}`;
  const lesson = (code) => `${rootPrefix()}lessons/lessons-${encodeURIComponent(code)}.html`;
  const notes = (code) => `${rootPrefix()}notes/downloadable-notes-${encodeURIComponent(code)}.pdf`;

  function getGlobalSubjects() {
    try {
      if (typeof SUBJECTS !== "undefined" && Array.isArray(SUBJECTS)) return SUBJECTS;
    } catch {}
    return Array.isArray(window.SUBJECTS) ? window.SUBJECTS : [];
  }

  function normalizeSubject(subject) {
    return {
      revision: String(subject.revision || "2021"),
      code: String(subject.code || subject.course_code || "").trim(),
      name: String(subject.name || subject.title || subject.subject || "").trim(),
      department: String(subject.department || subject.programme || subject.program || "").trim(),
      semester: String(subject.semester || subject.sem || "").trim(),
      type: String(subject.type || subject.category || "Theory").trim(),
    };
  }

  function validSubjects(subjects) {
    return subjects.map(normalizeSubject).filter((subject) => subject.code && subject.name && subject.department);
  }

  async function waitForGlobalSubjects() {
    for (let i = 0; i < 20; i += 1) {
      const subjects = getGlobalSubjects();
      if (subjects.length) return validSubjects(subjects);
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
    return [];
  }

  async function fetchJsonSubjects() {
    try {
      const response = await fetch(SUBJECT_JSON_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`Subject JSON request failed: ${response.status}`);
      const data = await response.json();
      return validSubjects(Array.isArray(data) ? data : data.subjects || []);
    } catch (error) {
      console.warn("Subject JSON unavailable; falling back to subjects.js", error);
      return [];
    }
  }

  async function loadSubjects() {
    const globalSubjects = await waitForGlobalSubjects();
    if (globalSubjects.length) return globalSubjects;
    const jsonSubjects = await fetchJsonSubjects();
    if (jsonSubjects.length) return jsonSubjects;
    return [];
  }

  function uniqueByDepartmentCode(items) {
    const seen = new Set();
    return items.filter((subject) => {
      const key = `${subject.revision}|${subject.department}|${subject.semester}|${subject.code}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function uniqueByCode(items) {
    const seen = new Set();
    return items.filter((subject) => {
      const key = String(subject.code || "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function sortItems(items) {
    return [...items].sort((a, b) => (
      rank(a.semester) - rank(b.semester)
      || String(a.department || "").localeCompare(String(b.department || ""))
      || String(a.code || "").localeCompare(String(b.code || ""), undefined, { numeric: true })
    ));
  }

  function unavailable(text) {
    return `<span class="availability-label" aria-disabled="true">${esc(text)}</span>`;
  }

  function card(subject, mode) {
    const code = String(subject.code || "");
    if (mode === "syllabus") {
      return `<article class="subject-card simple-subject-card"><div class="subject-top"><span>${esc(subject.semester)}</span><strong>${esc(code)}</strong></div><h3>${esc(subject.name)}</h3><p>${esc(subject.department)}</p><div class="action-row"><a class="action syllabus" href="${esc(syllabus(code))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a></div></article>`;
    }
    if (mode === "model-question-papers") {
      return `<article class="subject-card simple-subject-card model-question-card"><div class="subject-top"><span>${esc(subject.semester)}</span><strong>${esc(code)}</strong></div><h3>${esc(subject.name)}</h3><p>${esc(subject.department)}</p><div class="action-row"><a class="action qp" href="${esc(qp(code))}" target="_blank" rel="noopener noreferrer">Open Model Question Paper</a></div></article>`;
    }
    if (mode === "lessons") {
      return `<article class="subject-card simple-subject-card"><div class="subject-top"><span>${esc(subject.department)}</span><strong>${esc(code)}</strong></div><h3>${esc(subject.name)}</h3><p>${esc(subject.semester)} / ${esc(subject.type)}</p><div class="action-row"><a class="action lessons" href="${esc(lesson(code))}">Open Lesson Page</a></div></article>`;
    }
    return `<article class="subject-card reveal"><div class="subject-top"><span>${esc(subject.revision)}</span><strong>${esc(code)}</strong></div><h3>${esc(subject.name)}</h3><p>${esc(subject.department)} / ${esc(subject.semester)} / ${esc(subject.type)}</p><div class="action-row"><a class="action syllabus" href="${esc(syllabus(code))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>${LESSON_CODES.has(code) ? `<a class="action lessons" href="${esc(lesson(code))}">View Lessons</a>` : unavailable("Lessons unavailable")}${NOTES_CODES.has(code) ? `<a class="action download" href="${esc(notes(code))}" download>Download Notes</a>` : unavailable("Notes unavailable")}<a class="action qp" href="${esc(qp(code))}" target="_blank" rel="noopener noreferrer">Sample QP</a></div></article>`;
  }

  function groups(items, mode) {
    const map = new Map();
    items.forEach((subject) => {
      const semester = String(subject.semester || "Other subjects");
      if (!map.has(semester)) map.set(semester, []);
      map.get(semester).push(subject);
    });
    return [...map.entries()].map(([semester, list], i) => `<section class="semester-subject-section" aria-labelledby="semester-group-heading-${i + 1}" style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px"><div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)"><h3 id="semester-group-heading-${i + 1}">${esc(semester)}</h3><span>${list.length} ${list.length === 1 ? "subject" : "subjects"}</span></div><div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">${list.map((subject) => card(subject, mode)).join("")}</div></section>`).join("");
  }

  function fillSelect(select, values, label, selected) {
    if (!select) return;
    select.replaceChildren();
    const first = document.createElement("option");
    first.value = label === "Common Subjects" ? COMMON_VALUE : "all";
    first.textContent = label;
    select.append(first);
    [...new Set(values.filter(Boolean))].sort((a, b) => rank(a) - rank(b) || String(a).localeCompare(String(b))).forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
    select.value = [...select.options].some((option) => option.value === selected) ? selected : first.value;
  }

  function ensureStatusAndLoadMore(grid) {
    const status = document.getElementById("subjectResultStatus") || document.createElement("p");
    const loadMore = document.getElementById("subjectLoadMore") || document.createElement("button");
    status.id = "subjectResultStatus";
    status.className = "subject-browser-status";
    if (!status.isConnected) grid.before(status);
    loadMore.id = "subjectLoadMore";
    loadMore.type = "button";
    loadMore.className = "btn ghost subject-load-more";
    loadMore.textContent = "Load More";
    if (!loadMore.isConnected) grid.after(loadMore);
    return { status, loadMore };
  }

  function officialNotice(fixedDepartment, departmentSpecificCount) {
    if (!fixedDepartment || departmentSpecificCount >= MIN_EXPECTED_DEPARTMENT_SUBJECTS) return "";
    return `<div class="notice subject-data-warning" style="grid-column:1/-1;margin-bottom:16px"><strong>Subject data is incomplete for ${esc(fixedDepartment)}.</strong> Only ${departmentSpecificCount} department-specific subject${departmentSpecificCount === 1 ? "" : "s"} are available in the current data file. Use the syllabus buttons and the official SITTTR Revision 2021 source while this department list is being completed.</div>`;
  }

  async function init() {
    const grid = document.getElementById("subjectGrid");
    if (!grid || grid.dataset.subjectBrowserInitialized === "true") return;
    grid.dataset.subjectBrowserInitialized = "true";
    grid.classList.add("semester-grouped");

    const mode = grid.dataset.mode || "home";
    const fixedRevision = grid.dataset.revision || "";
    const fixedDepartment = grid.dataset.department || "";
    const search = document.getElementById("subjectSearch");
    const revisionFilter = document.getElementById("revisionFilter");
    const departmentFilter = document.getElementById("departmentFilter");
    const semesterFilter = document.getElementById("semesterFilter");
    const { status, loadMore } = ensureStatusAndLoadMore(grid);
    let shown = PAGE_SIZE;
    let timer = 0;

    status.textContent = "Loading subjects…";
    loadMore.hidden = true;

    const all = uniqueByDepartmentCode(await loadSubjects());
    if (!all.length) {
      grid.innerHTML = '<p class="empty">No subjects found. Please try again later.</p>';
      status.textContent = "No subjects found. Please try again later.";
      return;
    }

    const base = all.filter((subject) => {
      if (fixedRevision && String(subject.revision) !== fixedRevision) return false;
      if (fixedDepartment && subject.department !== fixedDepartment && subject.department !== COMMON_DEPARTMENT) return false;
      if (mode === "lessons") return String(subject.revision) === "2021" && LESSON_CODES.has(String(subject.code));
      return true;
    });
    const departmentSpecificCount = fixedDepartment ? base.filter((subject) => subject.department === fixedDepartment).length : 0;

    if (revisionFilter) fillSelect(revisionFilter, base.map((subject) => subject.revision), "All revisions", fixedRevision || "all");
    if (departmentFilter && mode === "home") fillSelect(departmentFilter, base.map((subject) => subject.department).filter((department) => department !== COMMON_DEPARTMENT), "Common Subjects", COMMON_VALUE);
    if (departmentFilter && mode !== "home") fillSelect(departmentFilter, base.map((subject) => subject.department), "All departments", fixedDepartment || "all");
    if (semesterFilter) fillSelect(semesterFilter, base.map((subject) => subject.semester), "All semesters", "all");

    function getVisible() {
      const q = String(search?.value || "").trim().toLowerCase();
      const rev = fixedRevision || revisionFilter?.value || "all";
      const dep = fixedDepartment || departmentFilter?.value || (mode === "home" ? COMMON_VALUE : "all");
      const sem = semesterFilter?.value || "all";
      let items = base.filter((subject) => {
        if (rev !== "all" && String(subject.revision) !== rev) return false;
        if (sem !== "all" && subject.semester !== sem) return false;
        if (dep === COMMON_VALUE && mode === "home" && !q && subject.department !== COMMON_DEPARTMENT) return false;
        if (dep !== COMMON_VALUE && dep !== "all" && subject.department !== dep && subject.department !== COMMON_DEPARTMENT) return false;
        if (!q) return true;
        return [subject.code, subject.name, subject.department, subject.semester, subject.type].join(" ").toLowerCase().includes(q);
      });
      items = mode === "home" || mode === "lessons" ? uniqueByCode(items) : uniqueByDepartmentCode(items);
      return sortItems(items);
    }

    function render(reset = true) {
      if (reset) shown = PAGE_SIZE;
      const q = String(search?.value || "").trim().toLowerCase();
      if (mode === "home" && /^\d{1,3}$/.test(q)) {
        grid.innerHTML = '<p class="empty">Enter the full 4-digit subject code, for example 1003, 2031 or 3044.</p>';
        status.textContent = "Enter the full 4-digit subject code.";
        loadMore.hidden = true;
        return;
      }
      const visible = getVisible();
      const slice = mode === "department" ? visible : visible.slice(0, shown);
      if (!visible.length) {
        grid.innerHTML = '<p class="empty">No subjects match the selected filters.</p>';
        status.textContent = "No matching subjects found.";
        loadMore.hidden = true;
        return;
      }
      const notice = mode === "department" ? officialNotice(fixedDepartment, departmentSpecificCount) : "";
      grid.innerHTML = notice + groups(slice, mode);
      loadMore.hidden = mode === "department" || slice.length >= visible.length;
      status.textContent = slice.length < visible.length ? `Showing ${slice.length} of ${visible.length} subjects.` : `${visible.length} ${visible.length === 1 ? "subject" : "subjects"} shown.`;
    }

    search?.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => render(true), 220);
    });
    search?.addEventListener("change", () => render(true));
    [revisionFilter, departmentFilter, semesterFilter].forEach((control) => {
      control?.addEventListener("change", () => render(true));
      control?.addEventListener("input", () => render(true));
    });
    loadMore.addEventListener("click", () => {
      shown += PAGE_SIZE;
      render(false);
    });
    render(true);
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((error) => {
      console.error("Subject browser failed:", error);
      const grid = document.getElementById("subjectGrid");
      const status = document.getElementById("subjectResultStatus");
      if (grid) grid.innerHTML = '<p class="empty">No subjects found. Please try again later.</p>';
      if (status) status.textContent = "No subjects found. Please try again later.";
    });
  });
})();
