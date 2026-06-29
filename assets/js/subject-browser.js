(() => {
  "use strict";

  const COMMON_DEPARTMENT = "First Year / Common";
  const COMMON_VALUE = "__common__";
  const HOME_PAGE_SIZE = 30;
  const SEARCH_DEBOUNCE_MS = 180;
  const LESSON_CODES = new Set(["1001","1002","1003","1004","1005","1006","1008","2001","2002","2003","2031","2032","2038","2041","3023","3031","3032","3041","3042","3043","3044","3045","3046","3047","3132","4001","4031","4041","6002"]);
  const NOTES_CODES = new Set(["1001","1002","1003","1004","1005","1006","1008","2001","2002","2003","2031","2032","2038","2041","3023","3031","3032","3041","3043","3044","3045","3046","3047","3132","4001","6002"]);
  const LOCAL_ASSETS = new Set([
    ...[...LESSON_CODES].map((code) => `/lessons/lessons-${code}.html`),
    ...[...NOTES_CODES].map((code) => `/notes/downloadable-notes-${code}.pdf`)
  ]);

  let subjectsPromise = null;

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "")
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

  function syllabusLinkFor(subject) {
    return typeof globalThis.syllabusLink === "function"
      ? globalThis.syllabusLink(subject.code)
      : `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(subject.code)}`;
  }

  function modelQuestionPaperLinkFor(subject) {
    return typeof globalThis.modelQuestionPaperLink === "function"
      ? globalThis.modelQuestionPaperLink(subject.code)
      : `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(subject.code)}`;
  }

  const lessonLinkFor = (subject) => `${rootPrefix()}lessons/lessons-${encodeURIComponent(subject.code)}.html`;
  const notesLinkFor = (subject) => `${rootPrefix()}notes/downloadable-notes-${encodeURIComponent(subject.code)}.pdf`;

  async function loadSubjects() {
    if (Array.isArray(globalThis.SUBJECTS) && globalThis.SUBJECTS.length) return globalThis.SUBJECTS;
    if (subjectsPromise) return subjectsPromise;

    subjectsPromise = fetch(`${rootPrefix()}assets/js/subjects.js?v=20260626-full-subjects-global`)
      .then((response) => {
        if (!response.ok) throw new Error(`subjects.js request failed: ${response.status}`);
        return response.text();
      })
      .then((text) => {
        const match = text.match(/\b(?:const|let|var)\s+SUBJECTS\s*=\s*(\[[\s\S]*?\]);/m);
        if (!match) throw new Error("SUBJECTS array was not found in subjects.js");
        const parsed = Function(`"use strict"; return (${match[1]});`)();
        if (!Array.isArray(parsed)) throw new Error("SUBJECTS data is not an array");
        globalThis.SUBJECTS = parsed;
        return parsed;
      })
      .catch((error) => {
        console.error("Subject data failed to load:", error);
        return [];
      });

    return subjectsPromise;
  }

  function uniqueSubjects(subjects) {
    const seen = new Set();
    return subjects.filter((subject) => {
      const key = [subject.revision, subject.department, subject.semester, subject.code, subject.name].join(":");
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

  function queryIsIncompleteHomeCode(mode, query) {
    return mode === "home" && (/^\d{1,3}$/i.test(query) || /^[a-z]$/i.test(query));
  }

  function subjectMatchesQuery(subject, query) {
    if (!query) return true;
    const code = String(subject.code || "").toLowerCase();
    if (/^[0-9]{2,5}[a-z]?$/i.test(query)) return code.includes(query);
    return [subject.code, subject.name, subject.department, subject.semester, subject.type]
      .join(" ")
      .toLowerCase()
      .includes(query);
  }

  function unavailable(label) {
    return `<span class="availability-label" aria-disabled="true">${esc(label)}</span>`;
  }

  function subjectCard(subject) {
    const lessonHref = lessonLinkFor(subject);
    const notesHref = notesLinkFor(subject);
    const lessonAvailable = hasAsset(lessonHref);
    const notesAvailable = hasAsset(notesHref);
    return `
      <article class="subject-card reveal">
        <div class="subject-top"><span>${esc(subject.revision)}</span><strong>${esc(subject.code)}</strong></div>
        <h3>${esc(subject.name)}</h3>
        <p>${esc(subject.department)} / ${esc(subject.semester)} / ${esc(subject.type)}</p>
        <div class="action-row">
          <a class="action syllabus" href="${esc(syllabusLinkFor(subject))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>
          ${lessonAvailable ? `<a class="action lessons" href="${esc(lessonHref)}">View Lessons</a>` : unavailable("Lessons unavailable")}
          ${notesAvailable ? `<a class="action download" href="${esc(notesHref)}" download>Download Notes</a>` : unavailable("Notes unavailable")}
          <a class="action qp" href="${esc(modelQuestionPaperLinkFor(subject))}" target="_blank" rel="noopener noreferrer">Sample QP</a>
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
      <section class="semester-subject-section" aria-labelledby="semester-group-heading-${index + 1}" style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px">
        <div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)">
          <h3 id="semester-group-heading-${index + 1}">${esc(semester)}</h3>
          <span>${items.length} ${items.length === 1 ? "subject" : "subjects"}</span>
        </div>
        <div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">
          ${items.map(subjectCard).join("")}
        </div>
      </section>`).join("");
  }

  async function controller(grid) {
    if (!grid || grid.dataset.subjectBrowserInitialized === "true") return;
    grid.dataset.subjectBrowserInitialized = "true";
    grid.classList.add("semester-grouped");
    grid.innerHTML = '<p class="empty">Loading subjects...</p>';

    const mode = grid.dataset.mode || "lessons";
    const fixedRevision = grid.dataset.revision || "";
    const fixedDepartment = grid.dataset.department || "";
    const search = $("subjectSearch");
    const revisionFilter = $("revisionFilter");
    const departmentFilter = $("departmentFilter");
    const semesterFilter = $("semesterFilter");
    const status = $("subjectResultStatus") || document.createElement("p");
    const loadMore = $("subjectLoadMore") || document.createElement("button");
    const params = new URLSearchParams(window.location.search);
    let shown = HOME_PAGE_SIZE;
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

    const subjects = uniqueSubjects(await loadSubjects());
    if (!subjects.length) {
      grid.innerHTML = '<p class="empty">No subjects found. Please try again later.</p>';
      status.textContent = "Subject data failed to load.";
      loadMore.hidden = true;
      return;
    }

    const base = subjects.filter((subject) => {
      if (fixedRevision && String(subject.revision) !== fixedRevision) return false;
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

    function filtered() {
      const query = String(search?.value || "").trim().toLowerCase();
      const revision = fixedRevision || revisionFilter?.value || "all";
      const department = fixedDepartment || departmentFilter?.value || (mode === "home" ? COMMON_VALUE : "all");
      const semester = semesterFilter?.value || "all";
      const list = sortSubjects(base.filter((subject) => {
        if (revision !== "all" && String(subject.revision) !== revision) return false;
        if (semester !== "all" && subject.semester !== semester) return false;
        if (department === COMMON_VALUE) {
          if (mode === "home" && !query && subject.department !== COMMON_DEPARTMENT) return false;
        } else if (department !== "all" && subject.department !== department && subject.department !== COMMON_DEPARTMENT) {
          return false;
        }
        return subjectMatchesQuery(subject, query);
      }));
      return mode === "home" || mode === "lessons" ? uniqueByCode(list) : list;
    }

    function render(reset = true) {
      const query = String(search?.value || "").trim().toLowerCase();
      if (reset) shown = HOME_PAGE_SIZE;

      if (queryIsIncompleteHomeCode(mode, query)) {
        const message = /^\d/.test(query)
          ? "Enter the full 4-digit subject code, for example 1003, 2031 or 3044."
          : "Type at least 2 letters of the subject title, or enter a full subject code.";
        grid.innerHTML = `<p class="empty">${esc(message)}</p>`;
        status.textContent = message;
        loadMore.hidden = true;
        return;
      }

      const visible = filtered();
      const shouldPage = mode === "home" || mode === "lessons" || mode === "model-question-papers" || mode === "syllabus";
      const pageItems = shouldPage ? visible.slice(0, shown) : visible;

      if (!visible.length) {
        grid.innerHTML = '<p class="empty">No subjects match the selected filters.</p>';
        status.textContent = "No matching subjects found.";
        loadMore.hidden = true;
        return;
      }

      grid.innerHTML = groupCards(pageItems);
      loadMore.hidden = !shouldPage || pageItems.length >= visible.length;
      status.textContent = pageItems.length < visible.length
        ? `Showing ${pageItems.length} of ${visible.length} subjects.`
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
      shown += HOME_PAGE_SIZE;
      render(false);
    });

    render(true);
  }

  document.addEventListener("DOMContentLoaded", () => controller($("subjectGrid")));
})();
