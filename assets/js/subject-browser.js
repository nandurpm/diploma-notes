(() => {
  "use strict";

  const COMMON_DEPARTMENT = "First Year / Common";
  const COMMON_VALUE = "__common__";
  const HOME_PAGE_SIZE = 30;
  const SEARCH_DEBOUNCE_MS = 180;

  // Important: this list must match actual files in /lessons exactly.
  // Examples: 5043A -> /lessons/lessons-5043A.html, not /lessons/lessons-5043.html.
  const LESSON_CODES = new Set(["1001","1002","1003","1004","1005","1006","1007","1008","2001","2002","2003","2031","2032","2038","2039","2041","2049","3023","3031","3032","3041","3042","3043","3044","3045","3046","3047","3048","3049","3132","4001","4031","4041","4042","4043","5031","5041","5042","5043","5043A","6002","6041","6041A","6041B","6041C","6042A","6042B","6042C","6042D"]);
  const NOTES_CODES = new Set(["1001","1002","1003","1004","1005","1006","1008","2001","2002","2003","2031","2032","2038","2041","3023","3031","3032","3041","3043","3044","3045","3046","3047","3132","4001","6002"]);

  const ELECTRONICS_ELECTIVES = [
    { revision: "2021", semester: "Semester 6", code: "6041A", name: "Medical Electronics", type: "Program Elective", assetCode: "6041A" },
    { revision: "2021", semester: "Semester 6", code: "6041B", name: "Verilog HDL and Programmable Logic Devices", type: "Program Elective", assetCode: "6041B" },
    { revision: "2021", semester: "Semester 6", code: "6041C", name: "Consumer Electronics", type: "Program Elective", assetCode: "6041C" },
    { revision: "2021", semester: "Semester 6", code: "6042A", name: "Concepts of IoT", type: "Open Elective", assetCode: "6042A" },
    { revision: "2021", semester: "Semester 6", code: "6042B", name: "Contemporary Electronics", type: "Open Elective", assetCode: "6042B" },
    { revision: "2021", semester: "Semester 6", code: "6042C", name: "Introduction to Hybrid and Electric Vehicles", type: "Open Elective", assetCode: "6042C" },
    { revision: "2021", semester: "Semester 6", code: "6042D", name: "Introduction to Multimedia", type: "Open Elective", assetCode: "6042D" }
  ];
  const ELECTRONICS_DEPARTMENTS = ["Electronics Engineering", "Electronics and Communication", "Electronics and Communication Engineering", "Biomedical Engineering"];
  const LEGACY_ELECTRONICS_CODES = new Set(["6041", "6042", "6043", "6049"]);

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const normalizeCode = (code) => String(code || "").trim().toUpperCase();
  const semesterRank = (value) => Number(String(value || "").match(/\d+/)?.[0] || 999);
  const rootPrefix = () => {
    const depth = window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth > 0 ? "../".repeat(depth) : "";
  };
  const localPath = (url) => new URL(url, window.location.href).pathname;
  const hasAsset = (url) => {
    const path = localPath(url);
    const match = path.match(/\/lessons\/lessons-([^/]+)\.html$/i);
    if (match) return LESSON_CODES.has(normalizeCode(decodeURIComponent(match[1])));
    const notesMatch = path.match(/\/notes\/downloadable-notes-([^/]+)\.pdf$/i);
    if (notesMatch) return NOTES_CODES.has(normalizeCode(decodeURIComponent(notesMatch[1])));
    return false;
  };
  const assetCodeFor = (subject, kind) => String(subject?.[`${kind}Code`] || subject?.assetCode || subject?.code || "");
  const recordKey = (subject) => [subject.revision, subject.department, subject.semester, normalizeCode(subject.code), String(subject.name || "").trim().toLowerCase()].join("::");

  function applyOfficialSubjectCorrections(subjects) {
    if (!Array.isArray(subjects)) return [];
    const cleaned = subjects.filter((subject) => {
      const dept = String(subject.department || "").trim();
      const code = normalizeCode(subject.code);
      return !(ELECTRONICS_DEPARTMENTS.includes(dept) && LEGACY_ELECTRONICS_CODES.has(code));
    });
    const seen = new Set(cleaned.map(recordKey));
    ELECTRONICS_DEPARTMENTS.forEach((department) => {
      ELECTRONICS_ELECTIVES.forEach((item) => {
        const subject = { ...item, department };
        const key = recordKey(subject);
        if (!seen.has(key)) {
          cleaned.push(subject);
          seen.add(key);
        }
      });
    });
    return cleaned;
  }

  let subjectsPromise;
  async function loadSubjects() {
    if (Array.isArray(globalThis.SUBJECTS) && globalThis.SUBJECTS.length) {
      globalThis.SUBJECTS = applyOfficialSubjectCorrections(globalThis.SUBJECTS);
      return globalThis.SUBJECTS;
    }
    if (subjectsPromise) return subjectsPromise;
    subjectsPromise = fetch(`${rootPrefix()}assets/js/subjects.js?v=20260629-all-lessons-visible`)
      .then((response) => {
        if (!response.ok) throw new Error(`subjects.js request failed: ${response.status}`);
        return response.text();
      })
      .then((text) => {
        const match = text.match(/\b(?:const|let|var)\s+SUBJECTS\s*=\s*(\[[\s\S]*?\]);/m);
        if (!match) throw new Error("SUBJECTS array was not found in subjects.js");
        const parsed = Function(`"use strict"; return (${match[1]});`)();
        if (!Array.isArray(parsed)) throw new Error("SUBJECTS data is not an array");
        globalThis.SUBJECTS = applyOfficialSubjectCorrections(parsed);
        return globalThis.SUBJECTS;
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
      const key = recordKey(subject);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function uniqueByCode(subjects) {
    const seen = new Set();
    return subjects.filter((subject) => {
      const code = normalizeCode(subject.code);
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
    const options = [...new Set(values.filter(Boolean))].sort((a, b) => semesterRank(a) - semesterRank(b) || String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
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
    return [subject.code, subject.name, subject.department, subject.semester, subject.type].join(" ").toLowerCase().includes(query);
  }
  function unavailable(label) {
    return `<span class="availability-label" aria-disabled="true">${esc(label)}</span>`;
  }
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
  const lessonLinkFor = (subject) => `${rootPrefix()}lessons/lessons-${encodeURIComponent(assetCodeFor(subject, "lesson"))}.html`;
  const notesLinkFor = (subject) => `${rootPrefix()}notes/downloadable-notes-${encodeURIComponent(assetCodeFor(subject, "notes"))}.pdf`;
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
  function renderSubjects(subjects, mode, grid, query = "", semester = "all") {
    let items = uniqueSubjects(subjects);
    if (mode === "home") items = uniqueByCode(items);
    items = sortSubjects(items).filter((subject) => subjectMatchesQuery(subject, query));
    if (semester !== "all") items = items.filter((subject) => String(subject.semester) === semester);
    if (queryIsIncompleteHomeCode(mode, query)) items = [];
    if (!items.length) {
      grid.innerHTML = `<div class="empty-state">No subjects found. Try a different search or semester.</div>`;
      return;
    }
    grid.innerHTML = mode === "home" ? items.slice(0, HOME_PAGE_SIZE).map(subjectCard).join("") : groupCards(items);
  }
  async function initSubjectBrowser() {
    const grid = $("subjectGrid");
    if (!grid) return;
    const mode = grid.dataset.mode || "home";
    const revision = grid.dataset.revision;
    const department = grid.dataset.department;
    const search = $("subjectSearch");
    const semester = $("semesterFilter");
    const subjects = (await loadSubjects()).filter((subject) => (!revision || String(subject.revision) === revision) && (!department || String(subject.department) === department));
    fillSelect(semester, subjects.map((subject) => subject.semester), mode === "home" ? "Common Subjects" : "All semesters");
    let timer = 0;
    const rerender = () => {
      clearTimeout(timer);
      timer = setTimeout(() => renderSubjects(subjects, mode, grid, String(search?.value || "").trim().toLowerCase(), semester?.value || "all"), SEARCH_DEBOUNCE_MS);
    };
    search?.addEventListener("input", rerender);
    semester?.addEventListener("change", rerender);
    renderSubjects(subjects, mode, grid, "", semester?.value || "all");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initSubjectBrowser, { once: true });
  else initSubjectBrowser();
})();
