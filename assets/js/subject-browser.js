(() => {
  "use strict";

  const COMMON_DEPARTMENT = "First Year / Common";
  const COMMON_VALUE = "__common__";
  const PAGE_SIZE = 30;
  const LESSON_CODES = new Set([
    "1001", "1002", "1003", "1004", "1005", "1006", "2003", "2031", "2041",
    "3023", "3031", "3032", "3041", "3044", "3045", "3046", "3047"
  ]);
  const NOTES_CODES = new Set(["1003", "1004"]);
  const LOCAL_ASSETS = new Set([
    ...[...LESSON_CODES].map((code) => `/lessons/lessons-${code}.html`),
    ...[...NOTES_CODES].map((code) => `/notes/downloadable-notes-${code}.pdf`)
  ]);

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const semesterRank = (value) => Number(String(value || "").match(/\d+/)?.[0] || 999);
  const rootPrefix = () => {
    const depth = window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth > 0 ? "../".repeat(depth) : "";
  };
  const localPath = (url) => new URL(url, window.location.href).pathname;
  const hasAsset = (url) => LOCAL_ASSETS.has(localPath(url));
  const syllabusLinkFor = (subject) => globalThis.syllabusLink
    ? globalThis.syllabusLink(subject.code)
    : `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(subject.code)}`;
  const modelQuestionPaperLinkFor = (subject) => globalThis.modelQuestionPaperLink
    ? globalThis.modelQuestionPaperLink(subject.code)
    : `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(subject.code)}`;
  const lessonLinkFor = (subject) => `${rootPrefix()}lessons/lessons-${encodeURIComponent(subject.code)}.html`;
  const notesLinkFor = (subject) => NOTES_CODES.has(String(subject.code))
    ? `${rootPrefix()}notes/downloadable-notes-${encodeURIComponent(subject.code)}.pdf`
    : lessonLinkFor(subject);

  function uniqueSubjects(subjects) {
    const seen = new Set();
    return subjects.filter((subject) => {
      const key = [subject.revision, subject.department, subject.semester, subject.code].join(":");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function uniqueByCode(subjects) {
    const seen = new Set();
    return subjects.filter((subject) => {
      const code = String(subject.code || "");
      if (seen.has(code)) return false;
      seen.add(code);
      return true;
    });
  }

  function sortSubjects(subjects) {
    return [...subjects].sort((a, b) => {
      const semester = semesterRank(a.semester) - semesterRank(b.semester);
      if (semester) return semester;
      const common = (a.department === COMMON_DEPARTMENT ? 0 : 1) - (b.department === COMMON_DEPARTMENT ? 0 : 1);
      if (common) return common;
      const department = String(a.department || "").localeCompare(String(b.department || ""), undefined, { sensitivity: "base" });
      if (department) return department;
      return String(a.code || "").localeCompare(String(b.code || ""), undefined, { numeric: true, sensitivity: "base" });
    });
  }

  function fillSelect(select, values, allLabel, selected = "all") {
    if (!select) return;
    const options = [...new Set(values.filter(Boolean))]
      .sort((a, b) => semesterRank(a) - semesterRank(b) || String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
    select.replaceChildren();
    const all = document.createElement("option");
    all.value = allLabel === "Common Subjects" ? COMMON_VALUE : "all";
    all.textContent = allLabel;
    select.append(all);
    options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
    select.value = [...select.options].some((option) => option.value === selected) ? selected : all.value;
  }

  function unavailable(text) {
    return `<span class="availability-label" aria-disabled="true">${escapeHtml(text)}</span>`;
  }

  function fullCard(subject) {
    const lessonHref = lessonLinkFor(subject);
    const notesHref = notesLinkFor(subject);
    const lessonAvailable = hasAsset(lessonHref);
    const notesAvailable = hasAsset(notesHref);
    const notesDownload = NOTES_CODES.has(String(subject.code)) && notesAvailable ? ' target="_blank" rel="noopener noreferrer" download' : "";

    return `
      <article class="subject-card reveal">
        <div class="subject-top"><span>${escapeHtml(subject.revision)}</span><strong>${escapeHtml(subject.code)}</strong></div>
        <h3>${escapeHtml(subject.name)}</h3>
        <p>${escapeHtml(subject.department)} / ${escapeHtml(subject.semester)} / ${escapeHtml(subject.type)}</p>
        <div class="action-row">
          <a class="action syllabus" href="${escapeHtml(syllabusLinkFor(subject))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>
          ${lessonAvailable ? `<a class="action lessons" href="${escapeHtml(lessonHref)}">View Lessons</a>` : unavailable("Lessons unavailable")}
          ${notesAvailable ? `<a class="action download" href="${escapeHtml(notesHref)}"${notesDownload}>Download Notes</a>` : unavailable("Notes unavailable")}
          <a class="action qp" href="${escapeHtml(modelQuestionPaperLinkFor(subject))}" target="_blank" rel="noopener noreferrer">Sample QP</a>
        </div>
      </article>
    `;
  }

  function lessonCard(subject) {
    return `
      <article class="subject-card simple-subject-card">
        <div class="subject-top"><span>${escapeHtml(subject.department)}</span><strong>${escapeHtml(subject.code)}</strong></div>
        <h3>${escapeHtml(subject.name)}</h3>
        <p>${escapeHtml(subject.semester)} / ${escapeHtml(subject.type)}</p>
        <div class="action-row"><a class="action lessons" href="${escapeHtml(lessonLinkFor(subject))}">Open Lesson Page</a></div>
      </article>
    `;
  }

  function syllabusCard(subject) {
    return `
      <article class="subject-card simple-subject-card">
        <div class="subject-top"><span>${escapeHtml(subject.semester)}</span><strong>${escapeHtml(subject.code)}</strong></div>
        <h3>${escapeHtml(subject.name)}</h3>
        <p>${escapeHtml(subject.department)}</p>
        <div class="action-row"><a class="action syllabus" href="${escapeHtml(syllabusLinkFor(subject))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a></div>
      </article>
    `;
  }

  function modelQuestionCard(subject) {
    return `
      <article class="subject-card simple-subject-card model-question-card">
        <div class="subject-top"><span>${escapeHtml(subject.semester)}</span><strong>${escapeHtml(subject.code)}</strong></div>
        <h3>${escapeHtml(subject.name)}</h3>
        <p>${escapeHtml(subject.department)}</p>
        <div class="action-row"><a class="action qp" href="${escapeHtml(modelQuestionPaperLinkFor(subject))}" target="_blank" rel="noopener noreferrer">Open Model Question Paper</a></div>
      </article>
    `;
  }

  function groupCards(subjects, renderer) {
    const counts = subjects.reduce((map, subject) => map.set(subject.semester, (map.get(subject.semester) || 0) + 1), new Map());
    let previous = "";
    return subjects.map((subject) => {
      const heading = subject.semester !== previous
        ? `<div class="semester-group-heading"><span>${escapeHtml(subject.semester)}</span><small>${counts.get(subject.semester)} subjects</small></div>`
        : "";
      previous = subject.semester;
      return heading + renderer(subject);
    }).join("");
  }

  function controller(grid) {
    if (grid.dataset.subjectBrowserInitialized === "true") return;
    grid.dataset.subjectBrowserInitialized = "true";

    const mode = grid.dataset.mode || "lessons";
    const fixedRevision = grid.dataset.revision || "";
    const fixedDepartment = grid.dataset.department || "";
    const search = document.getElementById("subjectSearch");
    const revisionFilter = document.getElementById("revisionFilter");
    const departmentFilter = document.getElementById("departmentFilter");
    const semesterFilter = document.getElementById("semesterFilter");
    const subjects = uniqueSubjects(Array.isArray(globalThis.SUBJECTS) ? globalThis.SUBJECTS : []);
    const status = document.getElementById("subjectResultStatus") || document.createElement("p");
    const loadMore = document.getElementById("subjectLoadMore") || document.createElement("button");
    const params = new URLSearchParams(window.location.search);
    let shown = PAGE_SIZE;

    status.id = "subjectResultStatus";
    status.className = "subject-browser-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    if (!status.isConnected) grid.before(status);

    loadMore.id = "subjectLoadMore";
    loadMore.type = "button";
    loadMore.className = "btn ghost subject-load-more";
    loadMore.textContent = "Load More";
    if (!loadMore.isConnected) grid.after(loadMore);

    const base = subjects.filter((subject) => {
      if (fixedRevision && String(subject.revision) !== fixedRevision) return false;
      if (mode !== "home" && String(subject.revision) === "2015" && mode !== "lessons") return false;
      if (mode === "lessons") return String(subject.revision) === "2021" && LESSON_CODES.has(String(subject.code));
      return true;
    });

    if (revisionFilter) fillSelect(revisionFilter, base.map((item) => item.revision), "All revisions", fixedRevision || params.get("revision") || "all");
    if (departmentFilter && mode === "home") {
      const departments = base.map((item) => item.department).filter((department) => department !== COMMON_DEPARTMENT);
      fillSelect(departmentFilter, departments, "Common Subjects", params.get("department") || COMMON_VALUE);
    } else if (departmentFilter) {
      fillSelect(departmentFilter, base.map((item) => item.department), "All departments", fixedDepartment || params.get("department") || "all");
    }
    if (semesterFilter) fillSelect(semesterFilter, base.map((item) => item.semester), "All semesters", params.get("semester") || "all");
    if (fixedRevision && revisionFilter) revisionFilter.disabled = true;
    if (fixedDepartment && departmentFilter) departmentFilter.disabled = true;
    if (params.get("subject") && search) search.value = params.get("subject");

    const renderer = mode === "syllabus"
      ? syllabusCard
      : mode === "model-question-papers"
        ? modelQuestionCard
        : mode === "lessons"
          ? lessonCard
          : fullCard;

    const filtered = () => {
      const query = String(search?.value || "").trim().toLowerCase();
      const revision = fixedRevision || revisionFilter?.value || "all";
      const department = fixedDepartment || departmentFilter?.value || (mode === "home" ? COMMON_VALUE : "all");
      const semester = semesterFilter?.value || "all";

      const matches = sortSubjects(base.filter((subject) => {
        if (revision !== "all" && String(subject.revision) !== revision) return false;
        if (semester !== "all" && subject.semester !== semester) return false;
        if (department === COMMON_VALUE) {
          if (mode === "home" && !query && subject.department !== COMMON_DEPARTMENT) return false;
        } else if (department !== "all" && subject.department !== department && subject.department !== COMMON_DEPARTMENT) {
          return false;
        }
        if (!query) return true;
        return [subject.code, subject.name, subject.department, subject.semester, subject.type, subject.revision]
          .join(" ")
          .toLowerCase()
          .includes(query);
      }));
      return mode === "lessons" ? uniqueByCode(matches) : matches;
    };

    function render(reset = true) {
      if (reset) shown = PAGE_SIZE;
      const visible = filtered();
      const usePaging = ["lessons", "model-question-papers", "syllabus"].includes(mode);
      const slice = usePaging ? visible.slice(0, shown) : visible;

      if (!visible.length) {
        grid.innerHTML = '<p class="empty">No subjects match the selected filters.</p>';
        status.textContent = "No matching subjects found.";
        loadMore.hidden = true;
        return;
      }

      grid.innerHTML = groupCards(slice, renderer);
      loadMore.hidden = !usePaging || slice.length >= visible.length;
      status.textContent = slice.length < visible.length
        ? `Showing ${slice.length} of ${visible.length} subjects.`
        : `${visible.length} ${visible.length === 1 ? "subject" : "subjects"} shown.`;
    }

    [search, revisionFilter, departmentFilter, semesterFilter].forEach((control) => {
      control?.addEventListener("input", () => render(true));
      control?.addEventListener("change", () => render(true));
    });
    loadMore.addEventListener("click", () => {
      shown += PAGE_SIZE;
      render(false);
    });
    render(true);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("subjectGrid");
    if (grid) controller(grid);
  });
})();
