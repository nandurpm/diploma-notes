(() => {
  "use strict";

  const COMMON_DEPARTMENT = "First Year / Common";
  const COMMON_VALUE = "__common__";
  const PAGE_SIZE = 30;
  const SEARCH_DEBOUNCE_MS = 220;
  const LESSON_CODES = new Set(["1001","1002","1003","1004","1005","1006","1008","2001","2002","2003","2031","2032","2038","2041","3023","3031","3032","3041","3043","3044","3045","3046","3047","3132","4001","6002"]);
  const NOTES_CODES = new Set(["1001","1002","1003","1004","1005","1006","1008","2001","2002","2003","2031","2032","2038","2041","3023","3031","3032","3041","3043","3044","3045","3046","3047","3132","4001","6002"]);
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
  const notesLinkFor = (subject) => `${rootPrefix()}notes/downloadable-notes-${encodeURIComponent(subject.code)}.pdf`;

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

  function isIncompleteHomepageQuery(mode, query) {
    if (mode !== "home" || !query) return false;
    if (/^\d{1,3}$/i.test(query)) return true;
    if (/^[a-z]$/i.test(query)) return true;
    return false;
  }

  function incompleteQueryMessage(query) {
    return /^\d/.test(query)
      ? "Enter the full 4-digit subject code, for example 1003, 2031 or 3044."
      : "Type at least 2 letters of the subject title, or enter a full subject code.";
  }

  function subjectMatchesQuery(subject, query) {
    if (!query) return true;

    const numericLikeQuery = /^[0-9]{2,5}[a-z]?$/i.test(query);
    const code = String(subject.code || "").toLowerCase();

    if (numericLikeQuery) {
      return code.includes(query);
    }

    return [subject.code, subject.name, subject.department, subject.semester, subject.type]
      .join(" ")
      .toLowerCase()
      .includes(query);
  }

  function fullCard(subject) {
    const lessonHref = lessonLinkFor(subject);
    const notesHref = notesLinkFor(subject);
    const lessonAvailable = hasAsset(lessonHref);
    const notesAvailable = hasAsset(notesHref);
    const notesDownload = notesAvailable ? " download" : "";

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
    const groups = new Map();
    subjects.forEach((subject) => {
      const semester = String(subject.semester || "Other subjects");
      if (!groups.has(semester)) groups.set(semester, []);
      groups.get(semester).push(subject);
    });

    return Array.from(groups.entries()).map(([semester, semesterSubjects], index) => {
      const headingId = `semester-group-heading-${index + 1}`;
      const count = semesterSubjects.length;
      return `
        <section class="semester-subject-section" aria-labelledby="${headingId}" style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px">
          <div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)">
            <h3 id="${headingId}">${escapeHtml(semester)}</h3>
            <span>${count} ${count === 1 ? "subject" : "subjects"}</span>
          </div>
          <div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">
            ${semesterSubjects.map(renderer).join("")}
          </div>
        </section>
      `;
    }).join("");
  }

  function controller(grid) {
    if (grid.dataset.subjectBrowserInitialized === "true") return;
    grid.dataset.subjectBrowserInitialized = "true";
    grid.classList.add("semester-grouped");

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
    let renderTimer = 0;

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
        return subjectMatchesQuery(subject, query);
      }));
      return (mode === "lessons" || mode === "home") ? uniqueByCode(matches) : matches;
    };

    function render(reset = true) {
      const query = String(search?.value || "").trim().toLowerCase();
      if (reset) shown = PAGE_SIZE;

      if (isIncompleteHomepageQuery(mode, query)) {
        const message = incompleteQueryMessage(query);
        grid.innerHTML = `<p class="empty">${escapeHtml(message)}</p>`;
        status.textContent = message;
        loadMore.hidden = true;
        return;
      }

      const visible = filtered();
      const usePaging = mode === "home" || ["lessons", "model-question-papers", "syllabus"].includes(mode);
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

    function scheduleRender() {
      window.clearTimeout(renderTimer);
      renderTimer = window.setTimeout(() => render(true), SEARCH_DEBOUNCE_MS);
    }

    search?.addEventListener("input", scheduleRender);
    search?.addEventListener("change", () => render(true));

    [revisionFilter, departmentFilter, semesterFilter].forEach((control) => {
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