/* Purpose: Sitttr rev2021 browser - Descriptive comment added for clarity */
(() => {
  "use strict";
  const VERSION = "20260706-sitttr-complete1";
  const COMMON = "First Year / Common";
  const LESSONS = new Set(["1001","1002","1003","1004","1005","1006","1007","1008","2001","2002","2003","2006","2021","2022","2028","2029","2031","2032","2038","2039","2041","2049","3021","3022","3023","3024","3025","3031","3032","3041","3042","3043","3044","3045","3046","3047","3048","3049","3132","4001","4021","4022","4023","4024","4031","4041","4042","4043","4101","4102","4103","5031","5041","5042","5043","5043A","6001","6002","6007","6009","6041","6041A","6041B","6041C","6042A","6042B","6042C","6042D","6061A","6061B","6061C","6062A","6062B","6067","6068","6069"]);
  // REV2021 course codes with NO matching REV2026 code (see subject-browser.js
  // for the derivation notes). Direct-link only these; every other REV2021
  // code falls back to the scheme index since the government site can't
  // disambiguate a code shared with a REV2026 course.
  const REV2021_SAFE_CODES = new Set(["1005","1007","1257","1258","1471","1472","1473","1474","1477","1478","1479","2001","2002","2003","2006","2008","2009","2181","2254","2255","2291","2301","2371","2379","2411","2471","2472","2473","2474","2475","2477","2478","2479","2701","3015","3016","3025","3026","3027","3035","3036","3045","3046","3055","3057","3065","3066","3075","3076","3085","3086","3095","3096","3105","3106","3116","3125","3126","3135","3136","3146","3151","3152","3157","3158","3159","3243","3248","3255","3256","3264","3265","3266","3267","3271","3272","3273","3274","3275","3276","3277","3278","3279","3288","3291","3292","3293","3297","3298","3299","3302","3303","3304","3307","3321","3322","3323","3324","3325","3326","3327","3328","3329","3335","3336","3344","3345","3346","3347","3348","3351","3352","3356","3357","3358","3359","3361","3362","3366","3367","3368","3369","3372","3377","3378","3379","3425","3426","3465","3466","3467","3471","3472","3473","3474","3475","3476","3477","3478","3479","3498","3509","4006","4007","4008","4009","4016","4024","4036","4046","4057","4064","4077","4084","4094","4106","4124","4136","4144","4151","4152","4157","4158","4159","4184","4185","4242","4254","4266","4267","4271","4272","4276","4277","4278","4279","4287","4291","4292","4293","4296","4297","4298","4299","4302","4303","4308","4321","4322","4323","4326","4327","4328","4329","4336","4346","4347","4352","4353","4356","4357","4358","4359","4368","4369","4372","4373","4377","4378","4392","4398","4399","4424","4464","4468","4471","4472","4473","4474","4477","4478","4479","4492","4498","4701","4702","4709","5001","5002","5019","5023A","5023B","5023C","5027","5029","5036","5039","5039C","5043","5043E","5049","5079","5096","5109C","5112A","5112B","5119","5133A","5133B","5133C","5143A","5143B","5143C","5146","5148A","5148B","5148C","5149","5151","5152A","5152B","5157","5158","5159A","5159B","5182A","5182B","5182C","5189","5202","5209","5247","5249","5263","5269","5271","5272","5273A","5273B","5273C","5277","5278","5279A","5279B","5279C","5289C","5291","5292","5293A","5293B","5293C","5297","5298","5299A","5299B","5299C","5308","5309C","5321","5322A","5322B","5322C","5323","5327","5328","5329A","5329B","5329C","5339C","5342","5343A","5343B","5351","5352A","5352B","5352C","5358","5359","5372A","5372B","5379B","5389","5391","5399","5401","5402A","5408","5409A","5411","5418","5419A","5429","5439","5469","5471","5472","5473","5474A","5474B","5474C","5477","5478","5479A","5479B","5479C","5493D","5499B","5509","5709","6001","6002","6008","6011A","6011B","6011C","6012A","6012B","6012C","6012D","6017","6019","6021A","6021B","6022A","6022B","6022C","6022D","6027","6029","6031","6031A","6031C","6031D","6032A","6032B","6032C","6032D","6036","6037","6039","6041","6041A","6041B","6042A","6042B","6042C","6042D","6043","6046","6047","6049","6051A","6051B","6051C","6052A","6052B","6052C","6052D","6057","6061A","6061B","6061C","6062A","6062B","6067","6069","6071A","6071B","6071C","6072A","6072B","6072C","6072D","6077","6079","6081A","6081B","6081C","6082A","6082B","6082C","6082D","6087","6089","6091A","6091B","6091C","6092A","6092B","6092C","6092D","6097","6099","6101A","6101B","6101C","6102A","6102B","6102C","6102D","6107","6109C","6111","6118","6119","6121A","6121B","6121C","6122A","6122B","6122C","6127","6131A","6131B","6131C","6131D","6132A","6132B","6132C","6132D","6137","6141","6149","6151A","6151B","6152","6157","6158","6159A","6159B","6181A","6181B","6181C","6182A","6182B","6182C","6182D","6187","6201A","6201B","6241A","6241B","6241C","6242A","6242B","6242C","6242D","6249","6251A","6251B","6251C","6252A","6252B","6252C","6252D","6257","6259","6261","6262A","6262B","6262C","6267","6269","6271A","6271B","6271C","6272A","6272B","6272C","6272D","6277","6278","6279A","6279B","6279C","6281A","6281B","6281C","6282A","6282B","6282C","6288","6289A","6289B","6291A","6291B","6292A","6292B","6292C","6292D","6298","6299A","6299B","6299C","6301A","6301B","6301C","6302A","6302B","6302C","6302D","6309C","6321A","6321B","6321C","6322A","6322B","6322C","6322D","6327","6328","6329A","6329B","6329C","6331A","6331B","6331C","6332A","6332B","6332C","6332D","6337","6341A","6341B","6341C","6349B","6349C","6351C","6352A","6352B","6352C","6352D","6359","6369","6371C","6377","6378","6379B","6389","6391A","6391B","6398","6399","6401A","6407","6408","6409A","6411A","6412A","6417","6418","6419A","6421A","6421B","6421C","6422A","6422B","6422C","6422D","6427","6429","6431A","6439","6461A","6461B","6461C","6461D","6462A","6462B","6462C","6462D","6467","6469","6471A","6471B","6471C","6477","6478","6479","6491B","6491C","6491D","6492D","6497","6498","6499B","6501B","6501C","6701","IP301"]);
  const eee = "Electrical & Electronics Engineering";
  const supplemental = [
    sub("Semester 1","1001","Communication Skills in English",COMMON,"Theory","1001"),sub("Semester 1","1002","Mathematics I",COMMON,"Theory","1002"),sub("Semester 1","1003","Applied Physics I",COMMON,"Theory","1003"),sub("Semester 1","1004","Applied Chemistry",COMMON,"Theory","1004"),sub("Semester 1","1005","Engineering Graphics",COMMON,"Drawing","1005"),sub("Semester 1","1007","Applied Chemistry Lab",COMMON,"Lab","1007"),sub("Semester 1","1008","Introduction to IT systems Lab",COMMON,"Lab","1008"),sub("Semester 1","1009","Sports and Yoga",COMMON,"Theory","1009"),sub("Semester 2","2001","Environmental Science",COMMON,"Theory","2001"),sub("Semester 2","2002","Mathematics II",COMMON,"Theory","2002"),sub("Semester 2","2003","Applied Physics II",COMMON,"Theory","2003"),sub("Semester 2","2006","Applied Physics Lab",COMMON,"Lab","2006"),sub("Semester 2","2008","Communication Skills in English Lab",COMMON,"Lab","2008"),sub("Semester 2","2009","Engineering Workshop Practice",COMMON,"Workshop","2009"),
    sub("Semester 6","6001","Entrepreneurship and Startup",eee,"Humanities & Social Sciences","6001",{courseCategory:"Humanities & Social Sciences",L:3,T:1,P:0,totalContactHours:4,CA:50,ESA:75,totalMarks:125,examType:"T",courseType:"I",credits:4}),
    sub("Semester 6","6031A","Energy Conservation & Audit (EE)",eee,"Program Elective course","6031A",{electiveGroup:"Program Elective 1",L:3,T:1,P:0,totalContactHours:4,CA:50,ESA:75,totalMarks:125,examType:"T",courseType:"B",credits:4}),
    sub("Semester 6","6031C","Microcontroller & PLC",eee,"Program Elective course","6031C",{electiveGroup:"Program Elective 1",L:3,T:1,P:0,totalContactHours:4,CA:50,ESA:75,totalMarks:125,examType:"T",courseType:"B",credits:4}),
    sub("Semester 6","6031D","Electric Vehicles",eee,"Program Elective course","6031D",{electiveGroup:"Program Elective 1",L:3,T:1,P:0,totalContactHours:4,CA:50,ESA:75,totalMarks:125,examType:"T",courseType:"B",credits:4}),
    sub("Semester 6","6032A","Solar Power Technologies",eee,"Open Elective course","6032A",{electiveGroup:"Open Elective",L:4,T:0,P:0,totalContactHours:4,CA:50,ESA:75,totalMarks:125,examType:"T",courseType:"I",credits:4}),
    sub("Semester 6","6032B","Energy Conservation & Management",eee,"Open Elective course","6032B",{electiveGroup:"Open Elective",L:4,T:0,P:0,totalContactHours:4,CA:50,ESA:75,totalMarks:125,examType:"T",courseType:"I",credits:4}),
    sub("Semester 6","6032C","Electrification of Residential Buildings",eee,"Open Elective course","6032C",{electiveGroup:"Open Elective",L:4,T:0,P:0,totalContactHours:4,CA:50,ESA:75,totalMarks:125,examType:"T",courseType:"I",credits:4}),
    sub("Semester 6","6032D","Electric Vehicles & Traction",eee,"Open Elective course","6032D",{electiveGroup:"Open Elective",L:4,T:0,P:0,totalContactHours:4,CA:50,ESA:75,totalMarks:125,examType:"T",courseType:"I",credits:4}),
    sub("Semester 6","6002","Indian Constitution",eee,"Common Courses","6002",{L:2,T:0,P:0,totalContactHours:2,CA:50,ESA:75,totalMarks:125,examType:"T",courseType:"I",credits:0}),
    sub("Semester 6","6037","Electrical Computer Aided Drafting Lab",eee,"Programme core course","6037",{L:0,T:0,P:3,totalContactHours:3,CA:75,ESA:50,totalMarks:125,examType:"P",courseType:"I",credits:1.5}),
    sub("Semester 6","6038","Industrial Automation Lab",eee,"Programme core course","6038",{L:0,T:1,P:3,totalContactHours:4,CA:75,ESA:50,totalMarks:125,examType:"P",courseType:"I",credits:2.5}),
    sub("Semester 6","6039A","Applied Electrical Testing Lab",eee,"Program Elective course","6039A",{electiveGroup:"Program Elective Lab",L:0,T:0,P:3,totalContactHours:3,CA:75,ESA:50,totalMarks:125,examType:"P",courseType:"B",credits:1.5}),
    sub("Semester 6","6039B","Modelling and simulation Lab",eee,"Program Elective course","6039B",{electiveGroup:"Program Elective Lab",L:0,T:0,P:3,totalContactHours:3,CA:75,ESA:50,totalMarks:125,examType:"P",courseType:"B",credits:1.5}),
    sub("Semester 6","6039C","Advanced Solar Photovoltaic Lab",eee,"Program Elective course","6039C",{electiveGroup:"Program Elective Lab",L:0,T:0,P:3,totalContactHours:3,CA:75,ESA:50,totalMarks:125,examType:"P",courseType:"B",credits:1.5}),
    sub("Semester 6","6009","Major Project",eee,"Major Project","6009",{L:0,T:0,P:6,totalContactHours:6,CA:75,ESA:50,totalMarks:125,examType:"P",courseType:"I",credits:4}),
    sub("Semester 6","6041A","Medical Electronics","Electronics Engineering","Program Elective","6041A"),sub("Semester 6","6041B","Verilog HDL and Programmable Logic Devices","Electronics Engineering","Program Elective","6041B"),sub("Semester 6","6041C","Consumer Electronics","Electronics Engineering","Program Elective","6041C"),sub("Semester 6","6041A","Medical Electronics","Electronics and Communication","Program Elective","6041A"),sub("Semester 6","6041B","Verilog HDL and Programmable Logic Devices","Electronics and Communication","Program Elective","6041B"),sub("Semester 6","6041C","Consumer Electronics","Electronics and Communication","Program Elective","6041C"),sub("Semester 6","6041A","Medical Electronics","Biomedical Engineering","Program Elective","6041A")
  ];
  const exact = new Map([[`${keyDept(eee)}::Semester 6`, new Set(["6001","6031A","6031C","6031D","6032A","6032B","6032C","6032D","6002","6037","6038","6039A","6039B","6039C","6009"])]]);
  const canonical = new Map([[keyDept("Electrical and Electronics Engineering"),eee],[keyDept(eee),eee],[keyDept("Civil and Environmental Engineering"),"Civil & Environmental Engineering"],[keyDept("Civil & Environmental Engineering"),"Civil & Environmental Engineering"],[keyDept("Communication and Computer Networking"),"Communication & Computer Networking"],[keyDept("Communication & Computer Networking"),"Communication & Computer Networking"],[keyDept("Computer Application and Business Management"),"Computer Application & Business Management"],[keyDept("Computer Application & Business Management"),"Computer Application & Business Management"],[keyDept("Computer Science and Engineering"),"Computer Science & Engineering"],[keyDept("Computer Science & Engineering"),"Computer Science & Engineering"],[keyDept("Tool and Die Engineering"),"Tool & Die Engineering"],[keyDept("Tool & Die Engineering"),"Tool & Die Engineering"],[keyDept("Artificial Intelligence and Machine Learning"),"Artificial Intelligence & Machine Learning"],[keyDept("Artificial Intelligence & Machine Learning"),"Artificial Intelligence & Machine Learning"]]);
  const $ = id => document.getElementById(id);
  function sub(semester, code, name, department, type, assetCode, extra = {}) { return { revision:"2021", semester, code, name, department, type, assetCode, courseCode:code, courseName:name, ...extra }; }
  function esc(v) { return window.PolyUtils?.escapeHtml ? window.PolyUtils.escapeHtml(v) : String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
  function norm(v) { return String(v || "").trim().toUpperCase(); }
  function keyDept(v) { return String(v || "").toLowerCase().replaceAll("&"," and ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," "); }
  function sameDept(a,b) { return keyDept(a) === keyDept(b); }
  function displayDept(v) { return canonical.get(keyDept(v)) || v; }
  function semRank(v) { return Number(String(v || "").match(/\d+/)?.[0] || 999); }
  function root() { const d = location.pathname.replace(/\/[^/]*$/,"").split("/").filter(Boolean).length; return d ? "../".repeat(d) : ""; }
  function asset(s) { return String(s.assetCode || s.code || ""); }
  function uniq(list) { const seen = new Set(); return list.filter(s => { const k = [s.revision,keyDept(s.department),s.semester,norm(s.code),String(s.name||"").toLowerCase()].join("::"); if (seen.has(k)) return false; seen.add(k); return true; }); }
  function parse(text) { const m = String(text || "").match(/\b(?:const|let|var)\s+SUBJECTS\s*=\s*(\[[\s\S]*?\]);/m); if (!m) return []; try { return Function(`"use strict";return (${m[1]});`)(); } catch { return []; } }
  async function data() { let base = Array.isArray(globalThis.SUBJECTS) ? globalThis.SUBJECTS : []; if (!base.length) { const text = await fetch(`${root()}assets/js/subjects.js?v=${VERSION}`, {cache:"no-store"}).then(r => r.ok ? r.text() : "").catch(()=>""); base = parse(text); } const merged = uniq([...base, ...supplemental]); /* PERFORMANCE OPTIMIZATION: Pre-compute and cache search text for each subject to avoid redundant string joins and lowercase conversions on every keystroke. */ merged.forEach(s => { s._searchText = [s.code, s.name, s.department, s.semester, s.type].join(" ").toLowerCase(); }); return merged; }
  function hasLesson(s) { const m = globalThis.POLY_ASSET_MANIFEST; if (m && Array.isArray(m.lessonCodes)) return m.lessonCodes.map(norm).includes(norm(asset(s))); return LESSONS.has(norm(asset(s))); }
  // Always include the selected REV2021 scheme in the per-course URL so shared
  // course codes (for example 3024) do not resolve through an unscoped lookup.
  function syllabus(s) { return `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(asset(s))}&scheme=REV2021`; }
  function qp(s) { return `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(s.code)}`; }
  function card(s) { const r = root(), ac = asset(s), lesson = `${r}lessons/lessons-${encodeURIComponent(ac)}.html`, pdf = `${r}notes/downloadable-notes-${encodeURIComponent(ac)}.pdf`, ok = hasLesson(s), meta = [displayDept(s.department), s.semester, s.type].filter(Boolean).join(" / "); return `<article class="subject-card" data-subject-code="${esc(norm(s.code))}" data-notes-href="${esc(pdf)}" data-lesson-href="${esc(lesson)}" data-lesson-available="${ok}"><div class="subject-top"><span>${esc(s.revision)}</span><strong>${esc(s.code)}</strong></div><h3>${esc(s.name)}</h3><p>${esc(meta)}</p><div class="action-row"><a class="action syllabus" href="${esc(syllabus(s))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>${ok ? `<a class="action lessons" href="${esc(lesson)}">View Lessons</a><a class="action download" href="${esc(pdf)}" download>Download Notes</a>` : `<span class="availability-label lessons-status" aria-disabled="true">Lessons unavailable</span><span class="availability-label notes-status" aria-disabled="true">Notes unavailable</span>`}<a class="action qp" href="${esc(qp(s))}" target="_blank" rel="noopener noreferrer">Sample QP</a></div></article>`; }
  function groups(list) { const map = new Map(); list.forEach(s => { const sem = String(s.semester || "Other subjects"); if (!map.has(sem)) map.set(sem, []); map.get(sem).push(s); }); return [...map.entries()].map(([sem,items]) => `<section class="semester-subject-section" style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px"><div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)"><h3>${esc(sem)}</h3><span>${items.length} ${items.length === 1 ? "subject" : "subjects"}</span></div><div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">${items.map(card).join("")}</div></section>`).join(""); }
  function fillSem(sel, list) { const old = sel.value || "all"; sel.replaceChildren(); sel.append(Object.assign(document.createElement("option"),{value:"all",textContent:"All semesters"})); [...new Set(list.map(s=>s.semester).filter(Boolean))].sort((a,b)=>semRank(a)-semRank(b)||String(a).localeCompare(String(b))).forEach(v=>sel.append(Object.assign(document.createElement("option"),{value:v,textContent:v}))); sel.value = [...sel.options].some(o=>o.value===old) ? old : "all"; }
  function preferDeptRows(list, dept) { const departmentRows = new Set(list.filter(s=>sameDept(s.department,dept)).map(s=>`${s.semester}::${norm(s.code)}`)); return list.filter(s => !(sameDept(s.department,COMMON) && departmentRows.has(`${s.semester}::${norm(s.code)}`))); }
  function applyExact(list, dept) { const dk = keyDept(dept); return list.filter(s => { const set = exact.get(`${dk}::${s.semester}`); return !set || set.has(norm(s.code)); }); }
  function filtered(all, dept) { return applyExact(preferDeptRows(all.filter(s => String(s.revision)==="2021" && (sameDept(s.department,dept) || sameDept(s.department,COMMON))), dept), dept); }
  function render(all, grid, dept) {
    const q = String($("subjectSearch")?.value || "").trim().toLowerCase(), sem = $("semesterFilter")?.value || "all";
    let list = filtered(all, dept);
    if (sem !== "all") list = list.filter(s=>String(s.semester)===sem);
    if (q) {
      list = list.filter(s => {
        if (!s._searchText) {
          s._searchText = [s.code, s.name, s.department, s.semester, s.type].join(" ").toLowerCase();
        }
        return s._searchText.includes(q);
      });
    }
    // PERFORMANCE OPTIMIZATION: Removed redundant uniq() call inside the render loop.
    // The master dataset is already unique and deduplicated at load time.
    list = list.sort((a,b)=>semRank(a.semester)-semRank(b.semester)||String(a.code).localeCompare(String(b.code),undefined,{numeric:true}));
    grid.innerHTML = list.length ? groups(list) : `<div class="empty-state">No subjects found. Try a different search or semester.</div>`;

    let announcer = $("subjectBrowserAnnouncer");
    if (!announcer && grid.parentNode) {
      announcer = document.createElement("div");
      announcer.id = "subjectBrowserAnnouncer";
      announcer.className = "sr-only";
      announcer.setAttribute("role", "status");
      announcer.setAttribute("aria-live", "polite");
      grid.parentNode.insertBefore(announcer, grid);
    }
    if (announcer) {
      announcer.textContent = list.length === 0 ? "No subjects found." : (list.length === 1 ? "1 subject found." : `${list.length} subjects found.`);
    }
  }
  async function init() {
    const grid = $("subjectGrid");
    if (!grid) return;
    grid.innerHTML = `<div class="empty-state">Loading subjects...</div>`;
    const dept = grid.dataset.department || "";
    const all = await data();

    // PERFORMANCE OPTIMIZATION: Precompute and cache the normalized/lowercase search text
    // to avoid expensive array joins and case conversions on every keypress inside the render loop.
    all.forEach(s => {
      s._searchText = [s.code, s.name, s.department, s.semester, s.type].join(" ").toLowerCase();
    });

    const searchInput = $("subjectSearch");
    if (searchInput) {
      searchInput.setAttribute("aria-controls", "subjectGrid");
      searchInput.setAttribute("aria-describedby", "subjectBrowserAnnouncer");
    }

    fillSem($("semesterFilter"), filtered(all, dept));
    const rr = () => render(all, grid, dept);
    $("subjectSearch")?.addEventListener("input", rr);
    $("semesterFilter")?.addEventListener("change", rr);
    rr();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true}); else init();
})();
