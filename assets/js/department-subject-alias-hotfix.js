(() => {
  "use strict";

  const COMMON = "First Year / Common";
  const LESSONS = new Set(["1001","1002","1003","1004","1005","1006","1007","1008","2001","2002","2003","2031","2032","2038","2039","2041","2049","3021","3022","3023","3024","3025","3031","3032","3041","3042","3043","3044","3045","3046","3047","3048","3049","3132","4001","4022","4023","4024","4031","4041","4042","4043","5031","5041","5042","5043","5043A","6001","6002","6007","6009","6041","6041A","6041B","6041C","6042A","6042B","6042C","6042D","6061A","6061B","6061C","6062A","6062B","6067","6068","6069"]);
  const esc = (value) => String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const code = (value) => String(value || "").trim().toUpperCase();
  const deptKey = (value) => String(value || "").toLowerCase().replaceAll("&"," and ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
  const sameDept = (a, b) => deptKey(a) === deptKey(b);
  const semRank = (value) => Number(String(value || "").match(/\d+/)?.[0] || 999);
  const root = () => {
    const depth = location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth ? "../".repeat(depth) : "";
  };
  const assetCode = (subject) => String(subject.assetCode || subject.code || "");
  const lessonHref = (subject) => `${root()}lessons/lessons-${encodeURIComponent(assetCode(subject))}.html`;
  const notesHref = (subject) => `${root()}notes/downloadable-notes-${encodeURIComponent(assetCode(subject))}.pdf`;
  const syllabusHref = (subject) => typeof globalThis.syllabusLink === "function"
    ? globalThis.syllabusLink(subject.code)
    : `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(subject.code)}`;
  const qpHref = (subject) => typeof globalThis.modelQuestionPaperLink === "function"
    ? globalThis.modelQuestionPaperLink(subject.code)
    : `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(subject.code)}`;

  function readSubjects(text) {
    const match = text.match(/\b(?:const|let|var)\s+SUBJECTS\s*=\s*(\[[\s\S]*?\]);/m);
    if (!match) return [];
    try { return Function(`"use strict";return (${match[1]});`)(); }
    catch { return []; }
  }

  function unique(subjects) {
    const seen = new Set();
    return subjects.filter((subject) => {
      const key = [subject.revision, subject.department, subject.semester, code(subject.code), String(subject.name || "").toLowerCase()].join("::");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function card(subject) {
    const hasLesson = LESSONS.has(code(assetCode(subject)));
    const lesson = lessonHref(subject);
    const notes = notesHref(subject);
    return `<article class="subject-card reveal"><div class="subject-top"><span>${esc(subject.revision)}</span><strong>${esc(subject.code)}</strong></div><h3>${esc(subject.name)}</h3><p>${esc(subject.department)} / ${esc(subject.semester)} / ${esc(subject.type)}</p><div class="action-row"><a class="action syllabus" href="${esc(syllabusHref(subject))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>${hasLesson ? `<a class="action lessons" href="${esc(lesson)}">View Lessons</a>` : `<span class="availability-label">Lessons unavailable</span>`}${hasLesson ? `<a class="action download" href="${esc(notes)}" download>Download Notes</a>` : `<span class="availability-label">Notes unavailable</span>`}<a class="action qp" href="${esc(qpHref(subject))}" target="_blank" rel="noopener noreferrer">Sample QP</a></div></article>`;
  }

  function renderGroups(grid, subjects) {
    const groups = new Map();
    subjects.forEach((subject) => {
      const sem = String(subject.semester || "Other subjects");
      if (!groups.has(sem)) groups.set(sem, []);
      groups.get(sem).push(subject);
    });
    grid.innerHTML = [...groups.entries()].map(([sem, items]) => `<section class="semester-subject-section" style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px"><div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)"><h3>${esc(sem)}</h3><span>${items.length} ${items.length === 1 ? "subject" : "subjects"}</span></div><div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">${items.map(card).join("")}</div></section>`).join("");
  }

  async function run() {
    const grid = document.getElementById("subjectGrid");
    if (!grid || grid.dataset.mode !== "department") return;
    const dept = grid.dataset.department || "";
    const revision = grid.dataset.revision || "2021";
    const semester = document.getElementById("semesterFilter");
    const search = document.getElementById("subjectSearch");
    const text = await fetch(`${root()}assets/js/subjects.js?v=20260630-dept-alias-hotfix1`).then((response) => response.text()).catch(() => "");
    const all = readSubjects(text);
    const render = () => {
      const sem = semester?.value || "all";
      const query = String(search?.value || "").trim().toLowerCase();
      let items = unique(all).filter((subject) => String(subject.revision) === revision && (sameDept(subject.department, COMMON) || sameDept(subject.department, dept)));
      if (sem !== "all") items = items.filter((subject) => String(subject.semester) === sem);
      if (query) items = items.filter((subject) => [subject.code, subject.name, subject.department, subject.semester, subject.type].join(" ").toLowerCase().includes(query));
      items.sort((a, b) => semRank(a.semester) - semRank(b.semester) || String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));
      if (items.length) renderGroups(grid, items);
    };
    let timer = 0;
    const debouncedRender = () => {
      clearTimeout(timer);
      timer = setTimeout(render, 100);
    };
    render();
    search?.addEventListener("input", debouncedRender);
    semester?.addEventListener("change", render);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
})();
