(() => {
  "use strict";

  const COMMON = "First Year / Common";
  const COMMON_VALUE = "__common__";
  const ALL_DEPARTMENTS = "all";
  const HOME_LIMIT = 36;

  // Revision 2021 assets remain in /lessons and /notes.
  const LESSON_CODES = new Set(["1001","1002","1003","1004","1005","1006","1007","1008","2001","2002","2003","2006","2021","2022","2028","2029","2031","2032","2038","2039","2041","2049","3021","3022","3023","3024","3025","3031","3032","3041","3042","3043","3044","3045","3046","3047","3048","3049","3132","4001","4021","4022","4023","4024","4031","4041","4042","4043","4101","4102","4103","5001","5021","5022","5023A","5023B","5023C","5027","5031","5032","5041","5042","5043","5043A","6001","6002","6007","6009","6031A","6031C","6031D","6032A","6032B","6032C","6032D","6041","6041A","6041B","6041C","6042A","6042B","6042C","6042D","6061A","6061B","6061C","6062A","6062B","6067","6068","6069"]);
  const NOTES_CODES = new Set(["1001","1002","1003","1004","1005","1006","1007","1008","2001","2002","2003","2006","2021","2022","2028","2029","2031","2032","2038","2039","2041","2049","3021","3022","3023","3024","3025","3031","3032","3041","3042","3043","3044","3045","3046","3047","3048","3049","3132","4001","4021","4022","4023","4024","4031","4041","4042","4043","4101","4102","4103","5001","5021","5022","5023A","5023B","5023C","5027","5031","5032","5041","5042","5043","5043A","6001","6002","6007","6009","6031A","6031C","6031D","6032A","6032B","6032C","6032D","6041","6041A","6041B","6041C","6042A","6042B","6042C","6042D","6061A","6061B","6061C","6062A","6062B","6067","6068","6069"]);

  // Revision 2026 assets are detected only inside /revision-2026-content.
  const REV2026_LESSON_CODES = new Set(["1001","1002","1003","1008","1031","1041","2002B","2003A","2031","2032"]);
  const REV2026_NOTES_CODES = new Set(["1001","1002","1008","1031","1041","2002B","2003A","2031","2032"]);

  const MANUAL = [
    {revision:"2021",semester:"Semester 1",code:"1001",name:"Communication Skills in English",department:COMMON,type:"Theory",assetCode:"1001"},
    {revision:"2021",semester:"Semester 1",code:"1002",name:"Mathematics I",department:COMMON,type:"Theory",assetCode:"1002"},
    {revision:"2021",semester:"Semester 1",code:"1003",name:"Applied Physics I",department:COMMON,type:"Theory",assetCode:"1003"},
    {revision:"2021",semester:"Semester 1",code:"1004",name:"Applied Chemistry",department:COMMON,type:"Theory",assetCode:"1004"},
    {revision:"2021",semester:"Semester 1",code:"1005",name:"Engineering Graphics",department:COMMON,type:"Drawing",assetCode:"1005"},
    {revision:"2021",semester:"Semester 1",code:"1007",name:"Applied Chemistry Lab",department:COMMON,type:"Lab",assetCode:"1007"},
    {revision:"2021",semester:"Semester 1",code:"1008",name:"Introduction to IT systems Lab",department:COMMON,type:"Lab",assetCode:"1008"},
    {revision:"2021",semester:"Semester 1",code:"1009",name:"Sports and Yoga",department:COMMON,type:"Theory",assetCode:"1009"},
    {revision:"2021",semester:"Semester 2",code:"2001",name:"Environmental Science",department:COMMON,type:"Theory",assetCode:"2001"},
    {revision:"2021",semester:"Semester 2",code:"2002",name:"Mathematics II",department:COMMON,type:"Theory",assetCode:"2002"},
    {revision:"2021",semester:"Semester 2",code:"2003",name:"Applied Physics II",department:COMMON,type:"Theory",assetCode:"2003"},
    {revision:"2021",semester:"Semester 2",code:"2006",name:"Applied Physics Lab",department:COMMON,type:"Lab",assetCode:"2006"},
    {revision:"2021",semester:"Semester 2",code:"2008",name:"Communication Skills in English Lab",department:COMMON,type:"Lab",assetCode:"2008"},
    {revision:"2021",semester:"Semester 2",code:"2009",name:"Engineering Workshop Practice",department:COMMON,type:"Workshop",assetCode:"2009"},
    {revision:"2021",semester:"Semester 2",code:"2022",name:"Manufacturing Technology",department:"Mechanical Engineering",type:"Theory",assetCode:"2022"},
    {revision:"2021",semester:"Semester 2",code:"2022",name:"Manufacturing Technology",department:"Mechatronics",type:"Theory",assetCode:"2022"},
    {revision:"2021",semester:"Semester 2",code:"2028",name:"Basic CAD Lab",department:"Mechanical Engineering",type:"Lab",assetCode:"2028"},
    {revision:"2021",semester:"Semester 2",code:"2028",name:"Basic CAD Lab",department:"Tool and Die Engineering",type:"Lab",assetCode:"2028"},
    {revision:"2021",semester:"Semester 2",code:"2028",name:"Basic CAD Lab",department:"Manufacturing Technology",type:"Lab",assetCode:"2028"},
    {revision:"2021",semester:"Semester 3",code:"3021",name:"Strength of Materials",department:"Mechanical Engineering",type:"Program Core",assetCode:"3021"},
    {revision:"2021",semester:"Semester 3",code:"3021",name:"Strength of Materials",department:"Tool and Die Engineering",type:"Program Core",assetCode:"3021"},
    {revision:"2021",semester:"Semester 3",code:"3021",name:"Strength of Materials",department:"Manufacturing Technology",type:"Program Core",assetCode:"3021"},
    {revision:"2021",semester:"Semester 4",code:"3021",name:"Strength of Materials",department:"Wood and Paper Technology",type:"Program Core",assetCode:"3021"},
    {revision:"2021",semester:"Semester 4",code:"4021",name:"Thermal Engineering",department:"Mechanical Engineering",type:"Program Core",assetCode:"4021"},
    {revision:"2021",semester:"Semester 3",code:"3022",name:"Material Science and Metrology",department:"Mechanical Engineering",type:"Program Core",assetCode:"3022"},
    {revision:"2021",semester:"Semester 3",code:"3022",name:"Material Science and Metrology",department:"Tool and Die Engineering",type:"Program Core",assetCode:"3022"},
    {revision:"2021",semester:"Semester 3",code:"3022",name:"Material Science and Metrology",department:"Manufacturing Technology",type:"Program Core",assetCode:"3022"},
    {revision:"2021",semester:"Semester 4",code:"4022",name:"Fluid Mechanics & Hydraulic Machinery",department:"Mechanical Engineering",type:"Program Core",assetCode:"4022"},
    {revision:"2021",semester:"Semester 4",code:"4022",name:"Fluid Mechanics & Hydraulic Machinery",department:"Manufacturing Technology",type:"Program Core",assetCode:"4022"},
    {revision:"2021",semester:"Semester 4",code:"4101",name:"Mechanism of Printing Machines II",department:"Printing Technology",type:"Program Core",assetCode:"4101"},
    {revision:"2021",semester:"Semester 4",code:"4102",name:"Print Finishing & Conversion Techniques",department:"Printing Technology",type:"Program Core",assetCode:"4102"},
    {revision:"2021",semester:"Semester 4",code:"4103",name:"Digital Imaging Techniques",department:"Printing Technology",type:"Program Core",assetCode:"4103"},
    {revision:"2021",semester:"Semester 6",code:"6041A",name:"Medical Electronics",department:"Electronics Engineering",type:"Program Elective",assetCode:"6041A"},
    {revision:"2021",semester:"Semester 6",code:"6041A",name:"Medical Electronics",department:"Electronics and Communication",type:"Program Elective",assetCode:"6041A"},
    {revision:"2021",semester:"Semester 6",code:"6041A",name:"Medical Electronics",department:"Electronics and Communication Engineering",type:"Program Elective",assetCode:"6041A"},
    {revision:"2021",semester:"Semester 6",code:"6041A",name:"Medical Electronics",department:"Biomedical Engineering",type:"Program Elective",assetCode:"6041A"}
  ];

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const norm = value => String(value || "").trim().toUpperCase();
  const depKey = value => String(value || "").toLowerCase().replaceAll("&", " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  const semRank = value => Number(String(value || "").match(/\d+/)?.[0] || 999);
  const root = () => { const depth = location.pathname.replace(/\/[^/]*$/, " ").trim().split("/").filter(Boolean).length; return depth ? "../".repeat(depth) : ""; };
  const asset = subject => String(subject.assetCode || subject.code || "");
  const sameDept = (a, b) => depKey(a) === depKey(b);
  const key = subject => [subject.revision, subject.department, subject.semester, norm(subject.code), String(subject.name || "").toLowerCase()].join("::");
  const syllabusUrl = subject => subject.syllabusUrl || `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(subject.code)}`;
  const questionPaperUrl = subject => `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(subject.code)}`;

  function unique(list) {
    const seen = new Set();
    return list.filter(subject => { const id = key(subject); if (seen.has(id)) return false; seen.add(id); return true; });
  }

  function parseSubjectsText(text) {
    const match = String(text || "").match(/\b(?:const|let|var)\s+SUBJECTS\s*=\s*(\[[\s\S]*?\]);/m);
    if (!match) return [];
    try { return Function(`"use strict";return (${match[1]});`)(); } catch { return []; }
  }

  function normalize2026(subject) {
    const code = String(subject.code || "").trim();
    const semesterNumber = Number(subject.semesterNumber) || Number(code.match(/^([1-6])/)?.[1]) || semRank(subject.semester);
    return {
      revision: "2026",
      code,
      name: String(subject.name || "Untitled subject").trim(),
      department: String(subject.programme || subject.department || "Revision 2026").trim(),
      semester: semesterNumber >= 1 && semesterNumber <= 6 ? `Semester ${semesterNumber}` : "Other subjects",
      type: String(subject.type || "Course").trim(),
      syllabusUrl: subject.syllabusUrl,
      programmeSlug: subject.programmeSlug,
      programmeCode: subject.programmeCode,
      programmeUrl: subject.programmeUrl
    };
  }

  async function getSubjects() {
    let revision2021 = Array.isArray(globalThis.SUBJECTS) ? globalThis.SUBJECTS : [];
    const [subjectText, revision2026Payload] = await Promise.all([
      revision2021.length ? Promise.resolve("") : fetch(`${root()}assets/js/subjects.js?v=20260716-revision-switch`, { cache: "no-store" }).then(response => response.ok ? response.text() : "").catch(() => ""),
      fetch(`${root()}assets/data/revision-2026-subjects.json?v=20260716-rev2026-content`, { cache: "no-store" }).then(response => response.ok ? response.json() : null).catch(() => null)
    ]);
    if (!revision2021.length) revision2021 = parseSubjectsText(subjectText);
    const revision2026 = Array.isArray(revision2026Payload?.subjects) ? revision2026Payload.subjects.map(normalize2026) : [];
    return unique([...revision2021, ...MANUAL, ...revision2026]);
  }

  function hasLesson(subject) {
    const code = norm(asset(subject));
    return String(subject.revision) === "2026"
      ? REV2026_LESSON_CODES.has(code)
      : LESSON_CODES.has(code);
  }

  function hasNotes(subject) {
    const code = norm(asset(subject));
    return String(subject.revision) === "2026"
      ? REV2026_NOTES_CODES.has(code)
      : NOTES_CODES.has(code);
  }

  function assetPaths(subject) {
    const relativeRoot = root();
    const code = encodeURIComponent(asset(subject));
    if (String(subject.revision) === "2026") {
      return {
        lessonHref: `${relativeRoot}revision-2026-content/lessons/lessons-${code}.html`,
        notesHref: `${relativeRoot}revision-2026-content/notes/downloadable-notes-${code}.pdf`
      };
    }
    return {
      lessonHref: `${relativeRoot}lessons/lessons-${code}.html`,
      notesHref: `${relativeRoot}notes/downloadable-notes-${code}.pdf`
    };
  }

  function card(subject) {
    const { lessonHref, notesHref } = assetPaths(subject);
    const handbookAvailable = hasLesson(subject);
    const notesAvailable = hasNotes(subject);
    const downloadHref = notesAvailable ? notesHref : `${lessonHref}?autoPrintNotes=1`;
    const downloadAttributes = notesAvailable ? " download" : ' target="_blank" rel="noopener noreferrer"';
    const studyActions = handbookAvailable
      ? `<a class="action lessons" href="${esc(lessonHref)}">View Lessons</a><a class="action download" href="${esc(downloadHref)}"${downloadAttributes}>Download Notes</a>`
      : `<span class="availability-label lessons-status" aria-disabled="true">Lessons unavailable</span><span class="availability-label notes-status" aria-disabled="true">Notes unavailable</span>`;
    return `<article class="subject-card reveal" data-subject-code="${esc(norm(subject.code))}" data-revision="${esc(subject.revision)}" data-notes-href="${esc(notesHref)}" data-lesson-href="${esc(lessonHref)}" data-lesson-available="${handbookAvailable}" data-notes-available="${notesAvailable}"><div class="subject-top"><span>${esc(subject.revision)}</span><strong>${esc(subject.code)}</strong></div><h3>${esc(subject.name)}</h3><p>${esc(subject.department)} / ${esc(subject.semester)} / ${esc(subject.type)}</p><div class="action-row"><a class="action syllabus" href="${esc(syllabusUrl(subject))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>${studyActions}<a class="action qp" href="${esc(questionPaperUrl(subject))}" target="_blank" rel="noopener noreferrer">Sample QP</a></div></article>`;
  }

  function group(list) {
    const groups = new Map();
    list.forEach(subject => { const semester = String(subject.semester || "Other subjects"); if (!groups.has(semester)) groups.set(semester, []); groups.get(semester).push(subject); });
    return [...groups.entries()].map(([semester, items]) => `<section class="semester-subject-section" style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px"><div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)"><h3>${esc(semester)}</h3><span>${items.length} ${items.length === 1 ? "subject" : "subjects"}</span></div><div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">${items.map(card).join("")}</div></section>`).join("");
  }

  function fillSemester(select, values, preferred) {
    if (!select) return;
    const old = select.value || preferred || "all";
    select.replaceChildren(new Option("All semesters", "all"));
    [...new Set(values.filter(Boolean))].sort((a, b) => semRank(a) - semRank(b) || String(a).localeCompare(String(b))).forEach(value => select.add(new Option(value, value)));
    select.value = [...select.options].some(option => option.value === old) ? old : ([...select.options].some(option => option.value === preferred) ? preferred : "all");
  }

  function fillDepartment(select, list, preferred) {
    if (!select) return;
    const old = select.value || preferred || ALL_DEPARTMENTS;
    const hasCommon = list.some(subject => sameDept(subject.department, COMMON));
    select.replaceChildren(new Option("All Departments", ALL_DEPARTMENTS));
    if (hasCommon) select.add(new Option("Common Subjects", COMMON_VALUE));
    [...new Set(list.map(subject => subject.department).filter(Boolean).filter(department => !sameDept(department, COMMON)))].sort().forEach(department => select.add(new Option(department, department)));
    select.value = [...select.options].some(option => option.value === old) ? old : (hasCommon && preferred === COMMON_VALUE ? COMMON_VALUE : ALL_DEPARTMENTS);
  }

  function fillRevision(select, subjects, preferred) {
    if (!select) return;
    const old = select.value || preferred || "2026";
    const configured = globalThis.CURRICULUM_REVISIONS || {};
    const ids = [...new Set([...Object.keys(configured), ...subjects.map(subject => String(subject.revision)).filter(Boolean)])].sort().reverse();
    select.replaceChildren();
    ids.forEach(id => {
      const config = configured[id] || {};
      const published = subjects.some(subject => String(subject.revision) === id);
      const option = new Option(`${config.label || `Revision ${id}`}${published ? "" : " — data unavailable"}`, id);
      option.disabled = !published;
      select.add(option);
    });
    select.value = [...select.options].some(option => option.value === old && !option.disabled) ? old : ([...select.options].find(option => !option.disabled)?.value || "2021");
  }

  function emptyMessage(mode, revision) {
    if (mode === "lessons" && revision === "2026") return "No Revision 2026 lesson HTML files are published in the dedicated 2026 folder yet.";
    return "No verified subjects found for this revision and filter selection.";
  }

  function render(all, grid, mode, fixedRevision, department) {
    const query = String($("subjectSearch")?.value || "").trim().toLowerCase();
    const semester = $("semesterFilter")?.value || "all";
    const chosenDepartment = $("departmentFilter")?.value || ALL_DEPARTMENTS;
    const selectedRevision = fixedRevision || $("revisionFilter")?.value || "all";
    let list = all.filter(subject => selectedRevision === "all" || String(subject.revision) === selectedRevision);
    if (mode === "department") list = list.filter(subject => sameDept(subject.department, department) || (String(subject.revision) === "2021" && sameDept(subject.department, COMMON)));
    else if (mode === "home" || mode === "syllabus" || mode === "lessons") {
      if (chosenDepartment === COMMON_VALUE) list = list.filter(subject => sameDept(subject.department, COMMON));
      else if (chosenDepartment !== ALL_DEPARTMENTS) list = list.filter(subject => sameDept(subject.department, chosenDepartment) || (String(subject.revision) === "2021" && sameDept(subject.department, COMMON)));
    }
    if (mode === "lessons") list = list.filter(hasLesson);
    if (semester !== "all") list = list.filter(subject => String(subject.semester) === semester);
    if (query) list = list.filter(subject => [subject.code, subject.name, subject.department, subject.semester, subject.type, subject.revision].join(" ").toLowerCase().includes(query));
    list = unique(list).sort((a, b) => semRank(a.semester) - semRank(b.semester) || String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));
    if (mode === "home") {
      // PERFORMANCE OPTIMIZATION: Replacing O(n^2) array.findIndex loop with O(n) Set lookups.
      // This is crucial on the homepage where 1800+ elements would otherwise trigger millions of iterations.
      const seenHomeCodes = new Set();
      const uniqueHomeList = [];
      for (let i = 0; i < list.length; i++) {
        const subject = list[i];
        const uniqueKey = norm(subject.code) + "::" + String(subject.revision || "");
        if (!seenHomeCodes.has(uniqueKey)) {
          seenHomeCodes.add(uniqueKey);
          uniqueHomeList.push(subject);
        }
      }
      list = uniqueHomeList.slice(0, HOME_LIMIT);
    }
    grid.innerHTML = list.length ? (mode === "home" ? list.map(card).join("") : group(list)) : `<div class="empty-state">${esc(emptyMessage(mode, selectedRevision))}</div>`;
  }

  async function init() {
    const grid = $("subjectGrid");
    if (!grid) return;
    grid.innerHTML = `<div class="empty-state">Loading Revision 2021 and Revision 2026 subjects...</div>`;
    const mode = grid.dataset.mode || "home";
    const fixedRevision = grid.dataset.revision;
    const department = grid.dataset.department;
    const preferredRevision = grid.dataset.defaultRevision || $("revisionFilter")?.value || (mode === "lessons" ? "2021" : "2026");
    const all = await getSubjects();
    fillRevision($("revisionFilter"), all, preferredRevision);
    const activeRevision = fixedRevision || $("revisionFilter")?.value || preferredRevision;
    const activeSubjects = all.filter(subject => activeRevision === "all" || String(subject.revision) === activeRevision);
    const preferredDepartment = activeRevision === "2021" && mode === "home" ? COMMON_VALUE : ALL_DEPARTMENTS;
    if (["home", "syllabus", "lessons"].includes(mode)) fillDepartment($("departmentFilter"), activeSubjects, preferredDepartment);
    fillSemester($("semesterFilter"), activeSubjects.map(subject => subject.semester), mode === "home" ? "Semester 1" : "all");

    let timer = 0;
    const rerender = () => { clearTimeout(timer); timer = setTimeout(() => render(all, grid, mode, fixedRevision, department), 100); };
    $("revisionFilter")?.addEventListener("change", () => {
      const revision = $("revisionFilter").value;
      const revisionSubjects = all.filter(subject => String(subject.revision) === revision);
      fillDepartment($("departmentFilter"), revisionSubjects, revision === "2021" && mode === "home" ? COMMON_VALUE : ALL_DEPARTMENTS);
      fillSemester($("semesterFilter"), revisionSubjects.map(subject => subject.semester), mode === "home" ? "Semester 1" : "all");
      rerender();
    });
    [$("subjectSearch"), $("semesterFilter"), $("departmentFilter")].forEach(control => {
      if (!control) return;
      control.addEventListener("input", rerender);
      control.addEventListener("change", rerender);
    });
    render(all, grid, mode, fixedRevision, department);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
