(() => {
  "use strict";
  const COMMON = "First Year / Common";
  const COMMON_VALUE = "__common__";
  const LESSONS = new Set(["1001","1002","1003","1004","1005","1006","1007","1008","2001","2002","2003","2031","2032","2038","2039","2041","2049","3021","3022","3023","3024","3025","3031","3032","3041","3042","3043","3044","3045","3046","3047","3048","3049","3132","4001","4022","4023","4024","4031","4041","4042","4043","5031","5041","5042","5043","5043A","6001","6002","6007","6009","6041","6041A","6041B","6041C","6042A","6042B","6042C","6042D","6061A","6061B","6061C","6062A","6062B","6067","6068","6069"]);
  const manual = [
    {revision:"2021",semester:"Semester 3",code:"3022",name:"Material Science and Metrology",department:"Mechanical Engineering",type:"Program Core",assetCode:"3022"},
    {revision:"2021",semester:"Semester 3",code:"3022",name:"Material Science and Metrology",department:"Tool and Die Engineering",type:"Program Core",assetCode:"3022"},
    {revision:"2021",semester:"Semester 3",code:"3022",name:"Material Science and Metrology",department:"Manufacturing Technology",type:"Program Core",assetCode:"3022"},
    {revision:"2021",semester:"Semester 4",code:"4022",name:"Fluid Mechanics & Hydraulic Machinery",department:"Mechanical Engineering",type:"Program Core",assetCode:"4022"},
    {revision:"2021",semester:"Semester 4",code:"4022",name:"Fluid Mechanics & Hydraulic Machinery",department:"Manufacturing Technology",type:"Program Core",assetCode:"4022"},
    {revision:"2021",semester:"Semester 6",code:"6041A",name:"Medical Electronics",department:"Electronics Engineering",type:"Program Elective",assetCode:"6041A"},
    {revision:"2021",semester:"Semester 6",code:"6041A",name:"Medical Electronics",department:"Electronics and Communication",type:"Program Elective",assetCode:"6041A"},
    {revision:"2021",semester:"Semester 6",code:"6041A",name:"Medical Electronics",department:"Electronics and Communication Engineering",type:"Program Elective",assetCode:"6041A"},
    {revision:"2021",semester:"Semester 6",code:"6041A",name:"Medical Electronics",department:"Biomedical Engineering",type:"Program Elective",assetCode:"6041A"},
    {revision:"2021",semester:"Semester 6",code:"6041B",name:"Verilog HDL and Programmable Logic Devices",department:"Electronics Engineering",type:"Program Elective",assetCode:"6041B"},
    {revision:"2021",semester:"Semester 6",code:"6041C",name:"Consumer Electronics",department:"Electronics Engineering",type:"Program Elective",assetCode:"6041C"},
    {revision:"2021",semester:"Semester 6",code:"6042A",name:"Concepts of IoT",department:"Electronics Engineering",type:"Open Elective",assetCode:"6042A"},
    {revision:"2021",semester:"Semester 6",code:"6042B",name:"Contemporary Electronics",department:"Electronics Engineering",type:"Open Elective",assetCode:"6042B"},
    {revision:"2021",semester:"Semester 6",code:"6042C",name:"Introduction to Hybrid and Electric Vehicles",department:"Electronics Engineering",type:"Open Elective",assetCode:"6042C"},
    {revision:"2021",semester:"Semester 6",code:"6042D",name:"Introduction to Multimedia",department:"Electronics Engineering",type:"Open Elective",assetCode:"6042D"}
  ];
  const pdfCache = new Map();
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const code = v => String(v || "").trim().toUpperCase();
  const semRank = v => Number(String(v || "").match(/\d+/)?.[0] || 999);
  const root = () => { const d = location.pathname.replace(/\/[^/]*$/,"").split("/").filter(Boolean).length; return d ? "../".repeat(d) : ""; };
  const key = s => [s.revision,s.department,s.semester,code(s.code),String(s.name||"").toLowerCase()].join("::");
  const asset = s => String(s.assetCode || s.code || "");
  const lesson = s => `${root()}lessons/lessons-${encodeURIComponent(asset(s))}.html`;
  const notes = s => `${root()}notes/downloadable-notes-${encodeURIComponent(asset(s))}.pdf`;
  const syllabus = s => typeof globalThis.syllabusLink === "function" ? globalThis.syllabusLink(s.code) : `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(s.code)}`;
  const qp = s => typeof globalThis.modelQuestionPaperLink === "function" ? globalThis.modelQuestionPaperLink(s.code) : `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(s.code)}`;
  function hasLesson(s){ return LESSONS.has(code(asset(s))); }
  async function pdfExists(url){
    const href = new URL(url, location.href).href;
    if (pdfCache.has(href)) return pdfCache.get(href);
    const p = fetch(href,{method:"HEAD",cache:"no-store"}).then(r => r.ok && !/html/i.test(r.headers.get("content-type") || "")).catch(() => false);
    pdfCache.set(href,p); const ok = await p; pdfCache.set(href,ok); return ok;
  }
  function unique(list){ const seen = new Set(); return list.filter(s => { const k = key(s); if (seen.has(k)) return false; seen.add(k); return true; }); }
  function fixSubjects(list){
    const cleaned = (Array.isArray(list) ? list : []).filter(s => !(["Electronics Engineering","Electronics and Communication","Electronics and Communication Engineering","Biomedical Engineering"].includes(String(s.department || "")) && ["6041","6042","6043","6049"].includes(code(s.code))));
    return unique([...cleaned, ...manual]);
  }
  async function loadSubjects(){
    if (Array.isArray(globalThis.SUBJECTS) && globalThis.SUBJECTS.length) return fixSubjects(globalThis.SUBJECTS);
    try {
      const text = await fetch(`${root()}assets/js/subjects.js?v=20260630-3022-manual1`).then(r => r.text());
      const m = text.match(/\b(?:const|let|var)\s+SUBJECTS\s*=\s*(\[[\s\S]*?\]);/m);
      return fixSubjects(m ? Function(`"use strict";return (${m[1]});`)() : []);
    } catch (e) { console.error("Subject data failed to load",e); return fixSubjects([]); }
  }
  function card(s){
    const lh = lesson(s), nh = notes(s), ok = hasLesson(s);
    return `<article class="subject-card reveal" data-notes-href="${esc(nh)}" data-lesson-href="${esc(lh)}" data-lesson-available="${ok}"><div class="subject-top"><span>${esc(s.revision)}</span><strong>${esc(s.code)}</strong></div><h3>${esc(s.name)}</h3><p>${esc(s.department)} / ${esc(s.semester)} / ${esc(s.type)}</p><div class="action-row"><a class="action syllabus" href="${esc(syllabus(s))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>${ok ? `<a class="action lessons" href="${esc(lh)}">View Lessons</a><span class="availability-label notes-status">Preparing notes…</span>` : `<span class="availability-label">Lessons unavailable</span><span class="availability-label notes-status">Notes unavailable</span>`}<a class="action qp" href="${esc(qp(s))}" target="_blank" rel="noopener noreferrer">Sample QP</a></div></article>`;
  }
  function group(list){
    const groups = new Map();
    list.forEach(s => { const g = String(s.semester || "Other subjects"); if (!groups.has(g)) groups.set(g,[]); groups.get(g).push(s); });
    return [...groups.entries()].map(([sem,items],i) => `<section class="semester-subject-section" style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px"><div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)"><h3>${esc(sem)}</h3><span>${items.length} ${items.length===1?"subject":"subjects"}</span></div><div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">${items.map(card).join("")}</div></section>`).join("");
  }
  async function wireNotes(grid){
    [...grid.querySelectorAll(".subject-card")].forEach(async c => {
      const row = c.querySelector(".action-row"), status = c.querySelector(".notes-status"), lh = c.dataset.lessonHref, nh = c.dataset.notesHref;
      if (!row || !status) return;
      const qpLink = row.querySelector(".action.qp"), pdf = await pdfExists(nh);
      status.remove();
      if (c.dataset.lessonAvailable === "true") {
        const a = document.createElement("a"); a.className = "action download"; a.textContent = "Download Notes";
        a.href = pdf ? nh : `${lh}?autoPrintNotes=1`; if (pdf) a.download = ""; else { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        row.insertBefore(a, qpLink || null);
      }
    });
  }
  function fillSelect(sel, values){ if(!sel)return; const old = sel.value || "all"; sel.replaceChildren(); sel.append(Object.assign(document.createElement("option"),{value:"all",textContent:"All semesters"})); [...new Set(values.filter(Boolean))].sort((a,b)=>semRank(a)-semRank(b)||String(a).localeCompare(String(b))).forEach(v=>sel.append(Object.assign(document.createElement("option"),{value:v,textContent:v}))); sel.value = [...sel.options].some(o=>o.value===old)?old:"all"; }
  function fillDept(sel, list){ if(!sel)return; const old = sel.value || COMMON_VALUE; sel.replaceChildren(); sel.append(Object.assign(document.createElement("option"),{value:COMMON_VALUE,textContent:"Common Subjects"})); [...new Set(list.map(s=>s.department).filter(Boolean).filter(d=>d!==COMMON))].sort().forEach(d=>sel.append(Object.assign(document.createElement("option"),{value:d,textContent:d}))); sel.value=[...sel.options].some(o=>o.value===old)?old:COMMON_VALUE; }
  function render(all, grid, mode, rev, dept){
    const q = String($("subjectSearch")?.value || "").trim().toLowerCase(), sem = $("semesterFilter")?.value || "all", selectedDept = $("departmentFilter")?.value || COMMON_VALUE;
    let list = all.filter(s => (!rev || String(s.revision)===rev));
    if (mode === "department") list = list.filter(s => String(s.department)===dept || String(s.department)===COMMON);
    else if (mode === "home") list = list.filter(s => selectedDept===COMMON_VALUE ? String(s.department)===COMMON : String(s.department)===COMMON || String(s.department)===selectedDept);
    if (sem !== "all") list = list.filter(s => String(s.semester)===sem);
    if (q) list = list.filter(s => [s.code,s.name,s.department,s.semester,s.type].join(" ").toLowerCase().includes(q));
    list = unique(list).sort((a,b)=>semRank(a.semester)-semRank(b.semester)||String(a.code).localeCompare(String(b.code),undefined,{numeric:true}));
    if (mode === "home") list = list.filter((s,i,a)=>a.findIndex(x=>code(x.code)===code(s.code))===i).slice(0,30);
    grid.innerHTML = list.length ? (mode === "home" ? list.map(card).join("") : group(list)) : `<div class="empty-state">No subjects found. Try a different search or semester.</div>`;
    wireNotes(grid);
  }
  async function init(){
    const grid = $("subjectGrid"); if(!grid)return;
    const all = await loadSubjects();
    const mode = grid.dataset.mode || "home", rev = grid.dataset.revision, dept = grid.dataset.department;
    fillSelect($("semesterFilter"), all.filter(s=>!rev || String(s.revision)===rev).map(s=>s.semester));
    if (mode === "home") fillDept($("departmentFilter"), all);
    let t=0; const rerender=()=>{ clearTimeout(t); t=setTimeout(()=>render(all,grid,mode,rev,dept),180); };
    [$("subjectSearch"),$("semesterFilter"),$("departmentFilter")].forEach(x=>x&&x.addEventListener("input",rerender));
    $("semesterFilter")?.addEventListener("change",rerender); $("departmentFilter")?.addEventListener("change",rerender);
    render(all,grid,mode,rev,dept);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true}); else init();
})();