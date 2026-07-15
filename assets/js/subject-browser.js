(() => {
  "use strict";

  const COMMON = "First Year / Common";
  const COMMON_VALUE = "__common__";
  const HOME_LIMIT = 30;
  const LESSONS = new Set(["1001","1002","1003","1004","1005","1006","1007","1008","2001","2002","2003","2021","2022","2028","2029","2031","2032","2038","2039","2041","2049","3021","3022","3023","3024","3025","3031","3032","3041","3042","3043","3044","3045","3046","3047","3048","3049","3132","4001","4021","4022","4023","4024","4031","4041","4042","4043","4101","4102","4103","5031","5041","5042","5043","5043A","6001","6002","6007","6009","6041","6041A","6041B","6041C","6042A","6042B","6042C","6042D","6061A","6061B","6061C","6062A","6062B","6067","6068","6069"]);
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
  const esc = v => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const norm = v => String(v || "").trim().toUpperCase();
  const depKey = v => String(v || "").toLowerCase().replaceAll("&"," and ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
  const semRank = v => Number(String(v || "").match(/\d+/)?.[0] || 999);
  const root = () => { const d = location.pathname.replace(/\/[^/]*$/," ").trim().split("/").filter(Boolean).length; return d ? "../".repeat(d) : ""; };
  const asset = s => String(s.assetCode || s.code || "");
  const key = s => [s.revision,s.department,s.semester,norm(s.code),String(s.name||"").toLowerCase()].join("::");
  const syllabus = s => `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(s.code)}`;
  const qp = s => `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(s.code)}`;
  const sameDept = (a,b) => depKey(a) === depKey(b);
  function unique(list){ const seen = new Set(); return list.filter(s => { const k = key(s); if(seen.has(k)) return false; seen.add(k); return true; }); }
  function parseSubjectsText(text){ const m = String(text || "").match(/\b(?:const|let|var)\s+SUBJECTS\s*=\s*(\[[\s\S]*?\]);/m); if(!m) return []; try { return Function(`"use strict";return (${m[1]});`)(); } catch { return []; } }
  async function getSubjects(){
    let base = Array.isArray(globalThis.SUBJECTS) ? globalThis.SUBJECTS : [];
    if(!base.length){
      const text = await fetch(`${root()}assets/js/subjects.js?v=20260715-revision-aware`, {cache:"no-store"}).then(r => r.ok ? r.text() : "").catch(() => "");
      base = parseSubjectsText(text);
    }
    return unique([...base, ...MANUAL]);
  }
  function hasLesson(s){ return LESSONS.has(norm(asset(s))); }
  function card(s){ const r=root(), ac=asset(s), les=`${r}lessons/lessons-${encodeURIComponent(ac)}.html`, pdf=`${r}notes/downloadable-notes-${encodeURIComponent(ac)}.pdf`, ok=hasLesson(s); return `<article class="subject-card reveal" data-subject-code="${esc(norm(s.code))}" data-revision="${esc(s.revision)}" data-notes-href="${esc(pdf)}" data-lesson-href="${esc(les)}" data-lesson-available="${ok}"><div class="subject-top"><span>Revision ${esc(s.revision)}</span><strong>${esc(s.code)}</strong></div><h3>${esc(s.name)}</h3><p>${esc(s.department)} / ${esc(s.semester)} / ${esc(s.type)}</p><div class="action-row"><a class="action syllabus" href="${esc(syllabus(s))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>${ok?`<a class="action lessons" href="${esc(les)}">View Handbook</a><a class="action download" href="${esc(pdf)}" download>Download Notes</a>`:`<span class="availability-label lessons-status" aria-disabled="true">Handbook unavailable</span><span class="availability-label notes-status" aria-disabled="true">Notes unavailable</span>`}<a class="action qp" href="${esc(qp(s))}" target="_blank" rel="noopener noreferrer">Model Question Paper</a></div></article>`; }
  function group(list){ const map = new Map(); list.forEach(s => { const sem = String(s.semester || "Other subjects"); if(!map.has(sem)) map.set(sem,[]); map.get(sem).push(s); }); return [...map.entries()].map(([sem,items]) => `<section class="semester-subject-section" style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px"><div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)"><h3>${esc(sem)}</h3><span>${items.length} ${items.length===1?"subject":"subjects"}</span></div><div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">${items.map(card).join("")}</div></section>`).join(""); }
  function fillSelect(sel, values, preferred){ if(!sel) return; const old = sel.value || preferred || "all"; sel.replaceChildren(); sel.append(Object.assign(document.createElement("option"),{value:"all",textContent:"All semesters"})); [...new Set(values.filter(Boolean))].sort((a,b)=>semRank(a)-semRank(b)||String(a).localeCompare(String(b))).forEach(v=>sel.append(Object.assign(document.createElement("option"),{value:v,textContent:v}))); sel.value=[...sel.options].some(o=>o.value===old)?old:"all"; }
  function fillDept(sel, list){ if(!sel) return; const old=sel.value||COMMON_VALUE; sel.replaceChildren(); sel.append(Object.assign(document.createElement("option"),{value:COMMON_VALUE,textContent:"Common Subjects"})); [...new Set(list.map(s=>s.department).filter(Boolean).filter(d=>d!==COMMON))].sort().forEach(d=>sel.append(Object.assign(document.createElement("option"),{value:d,textContent:d}))); sel.value=[...sel.options].some(o=>o.value===old)?old:COMMON_VALUE; }
  function fillRevision(sel, subjects){
    if(!sel) return;
    const old = sel.value || "2021";
    const configured = globalThis.CURRICULUM_REVISIONS || {};
    const ids = [...new Set([...Object.keys(configured), ...subjects.map(s=>String(s.revision)).filter(Boolean)])].sort().reverse();
    sel.replaceChildren();
    ids.forEach(id => {
      const cfg = configured[id] || {};
      const published = subjects.some(s => String(s.revision) === id);
      const option = new Option(`${cfg.label || `Revision ${id}`}${published ? "" : " — awaiting verified subjects"}`, id);
      option.disabled = !published;
      sel.add(option);
    });
    sel.value = [...sel.options].some(o=>o.value===old && !o.disabled) ? old : ([...sel.options].find(o=>!o.disabled)?.value || "2021");
  }
  function render(all, grid, mode, fixedRev, dept){
    const q=String($("subjectSearch")?.value||"").trim().toLowerCase();
    const sem=$("semesterFilter")?.value||"all";
    const chosen=$("departmentFilter")?.value||COMMON_VALUE;
    const selectedRev = fixedRev || $("revisionFilter")?.value || "all";
    let list = all.filter(s => selectedRev === "all" || String(s.revision) === selectedRev);
    if(mode === "department") list = list.filter(s => sameDept(s.department, dept) || sameDept(s.department, COMMON));
    else if(mode === "home") list = list.filter(s => chosen === COMMON_VALUE ? sameDept(s.department, COMMON) : sameDept(s.department, COMMON) || sameDept(s.department, chosen));
    if(sem !== "all") list = list.filter(s => String(s.semester) === sem);
    if(q) list = list.filter(s => [s.code,s.name,s.department,s.semester,s.type,s.revision].join(" ").toLowerCase().includes(q));
    list = unique(list).sort((a,b)=>semRank(a.semester)-semRank(b.semester)||String(a.code).localeCompare(String(b.code),undefined,{numeric:true}));
    if(mode === "home") list = list.filter((s,i,a)=>a.findIndex(x=>norm(x.code)===norm(s.code) && String(x.revision)===String(s.revision))===i).slice(0,HOME_LIMIT);
    grid.innerHTML = list.length ? (mode === "home" ? list.map(card).join("") : group(list)) : `<div class="empty-state">No verified subjects found for this revision and filter selection.</div>`;
  }
  async function init(){
    const grid=$("subjectGrid"); if(!grid) return;
    grid.innerHTML = `<div class="empty-state">Loading subjects...</div>`;
    const mode=grid.dataset.mode||"home", fixedRev=grid.dataset.revision, dept=grid.dataset.department;
    const all=await getSubjects();
    fillRevision($("revisionFilter"), all);
    if(mode==="home") fillDept($("departmentFilter"), all);
    const activeRev = fixedRev || $("revisionFilter")?.value || "2021";
    const defaultSem = mode === "home" ? "Semester 1" : "all";
    fillSelect($("semesterFilter"), all.filter(s => activeRev === "all" || String(s.revision) === activeRev).map(s => s.semester), defaultSem);
    if(mode === "home" && $("departmentFilter")) $("departmentFilter").value = COMMON_VALUE;
    let t=0;
    const rr=()=>{ clearTimeout(t); t=setTimeout(()=>render(all,grid,mode,fixedRev,dept),120); };
    $("revisionFilter")?.addEventListener("change", () => {
      const revision = $("revisionFilter").value;
      fillSelect($("semesterFilter"), all.filter(s => String(s.revision) === revision).map(s => s.semester), mode === "home" ? "Semester 1" : "all");
      if(mode === "home") fillDept($("departmentFilter"), all.filter(s => String(s.revision) === revision));
      rr();
    });
    [$("subjectSearch"),$("semesterFilter"),$("departmentFilter")].forEach(x=>{ if(x){ x.addEventListener("input",rr); x.addEventListener("change",rr); } });
    render(all,grid,mode,fixedRev,dept);
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true}); else init();
})();
