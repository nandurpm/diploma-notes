/* Purpose: Subject browser 3024 visible - Descriptive comment added for clarity */
(()=>{
  'use strict';
  const COMMON='First Year / Common';
  const LESSONS=new Set(['1001','1002','1003','1004','1005','1006','1007','1008','2001','2002','2003','2022','2031','2032','2038','2039','2041','2049','3021','3022','3023','3024','3025','3031','3032','3041','3042','3043','3044','3045','3046','3047','3048','3049','3132','4001','4022','4023','4024','4031','4041','4042','4043','5031','5041','5042','5043','5043A','6001','6002','6007','6009','6041','6041A','6041B','6041C','6042A','6042B','6042C','6042D','6061A','6061B','6061C','6062A','6062B','6067','6068','6069']);
  const manual=[
    {revision:'2021',semester:'Semester 2',code:'2022',name:'Manufacturing Technology',department:'Mechanical Engineering',type:'Program Core',assetCode:'2022'},
    {revision:'2021',semester:'Semester 2',code:'2022',name:'Manufacturing Technology',department:'Mechatronics',type:'Program Core',assetCode:'2022'},
    {revision:'2021',semester:'Semester 3',code:'3022',name:'Material Science and Metrology',department:'Mechanical Engineering',type:'Program Core',assetCode:'3022'},
    {revision:'2021',semester:'Semester 3',code:'3022',name:'Material Science and Metrology',department:'Tool and Die Engineering',type:'Program Core',assetCode:'3022'},
    {revision:'2021',semester:'Semester 3',code:'3022',name:'Material Science and Metrology',department:'Manufacturing Technology',type:'Program Core',assetCode:'3022'},
    {revision:'2021',semester:'Semester 3',code:'3024',name:'Fundamentals of Electrical Engineering',department:'Mechanical Engineering',type:'Program Core',assetCode:'3024'},
    {revision:'2021',semester:'Semester 3',code:'3024',name:'Fundamentals of Electrical Engineering',department:'Manufacturing Technology',type:'Program Core',assetCode:'3024'},
    {revision:'2021',semester:'Semester 3',code:'3025',name:'Machine Drawing',department:'Mechanical Engineering',type:'Program Core / Drawing',assetCode:'3025'},
    {revision:'2021',semester:'Semester 3',code:'3025',name:'Machine Drawing',department:'Manufacturing Technology',type:'Program Core / Drawing',assetCode:'3025'},
    {revision:'2021',semester:'Semester 4',code:'4022',name:'Fluid Mechanics & Hydraulic Machinery',department:'Mechanical Engineering',type:'Program Core',assetCode:'4022'},
    {revision:'2021',semester:'Semester 4',code:'4022',name:'Fluid Mechanics & Hydraulic Machinery',department:'Manufacturing Technology',type:'Program Core',assetCode:'4022'},
    {revision:'2021',semester:'Semester 4',code:'4024',name:'Industrial Engineering',department:'Mechanical Engineering',type:'Program Core',assetCode:'4024'},
    {revision:'2021',semester:'Semester 4',code:'4024',name:'Industrial Engineering',department:'Tool and Die Engineering',type:'Program Core',assetCode:'4024'},
    {revision:'2021',semester:'Semester 4',code:'4024',name:'Industrial Engineering',department:'Manufacturing Technology',type:'Program Core',assetCode:'4024'},
    {revision:'2021',semester:'Semester 6',code:'6041A',name:'Medical Electronics',department:'Electronics Engineering',type:'Program Elective',assetCode:'6041A'},
    {revision:'2021',semester:'Semester 6',code:'6041A',name:'Medical Electronics',department:'Electronics and Communication',type:'Program Elective',assetCode:'6041A'},
    {revision:'2021',semester:'Semester 6',code:'6041A',name:'Medical Electronics',department:'Electronics and Communication Engineering',type:'Program Elective',assetCode:'6041A'},
    {revision:'2021',semester:'Semester 6',code:'6041A',name:'Medical Electronics',department:'Biomedical Engineering',type:'Program Elective',assetCode:'6041A'},
    {revision:'2021',semester:'Semester 6',code:'6041B',name:'Verilog HDL and Programmable Logic Devices',department:'Electronics Engineering',type:'Program Elective',assetCode:'6041B'},
    {revision:'2021',semester:'Semester 6',code:'6041C',name:'Consumer Electronics',department:'Electronics Engineering',type:'Program Elective',assetCode:'6041C'},
    {revision:'2021',semester:'Semester 6',code:'6042A',name:'Concepts of IoT',department:'Electronics Engineering',type:'Open Elective',assetCode:'6042A'},
    {revision:'2021',semester:'Semester 6',code:'6042B',name:'Contemporary Electronics',department:'Electronics Engineering',type:'Open Elective',assetCode:'6042B'},
    {revision:'2021',semester:'Semester 6',code:'6042C',name:'Introduction to Hybrid and Electric Vehicles',department:'Electronics Engineering',type:'Open Elective',assetCode:'6042C'},
    {revision:'2021',semester:'Semester 6',code:'6042D',name:'Introduction to Multimedia',department:'Electronics Engineering',type:'Open Elective',assetCode:'6042D'}
  ];
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const code=v=>String(v||'').trim().toUpperCase();
  const depkey=v=>String(v||'').toLowerCase().replaceAll('&',' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  const same=(a,b)=>depkey(a)===depkey(b);
  const semrank=v=>Number(String(v||'').match(/\d+/)?.[0]||999);
  const root=()=>{const x=location.pathname.replace(/\/[^/]*$/,'').split('/').filter(Boolean).length;return x?'../'.repeat(x):''};
  const asset=s=>String(s.assetCode||s.code||'');
  const key=s=>[s.revision,s.department,s.semester,code(s.code),String(s.name||'').toLowerCase()].join('::');
  const syllabus=s=>String(s.revision)==='2021'?'https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2021':(typeof globalThis.syllabusLink==='function'?globalThis.syllabusLink(s.code, s.revision):`https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(s.code)}`);
  const qp=s=>String(s.revision)==='2021'?(typeof globalThis.modelQuestionPaperLink==='function'?globalThis.modelQuestionPaperLink(s.code,s.revision):`https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(s.code)}`):'';
  const syllabus=s=>typeof globalThis.syllabusLink==='function'?globalThis.syllabusLink(s.code, s.revision):`https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(s.code)}&scheme=REV${encodeURIComponent(s.revision)}`;
  const qp=s=>typeof globalThis.modelQuestionPaperLink==='function'?globalThis.modelQuestionPaperLink(s.code):`https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(s.code)}`;
  function unique(list){const seen=new Set();return list.filter(s=>{const k=key(s);if(seen.has(k))return false;seen.add(k);return true})}
  function parse(text){const m=text.match(/\b(?:const|let|var)\s+SUBJECTS\s*=\s*(\[[\s\S]*?\]);/m);try{return m?Function(`'use strict';return (${m[1]});`)():[]}catch{return[]}}
  function card(s){const r=root(),ac=asset(s),les=`${r}lessons/lessons-${encodeURIComponent(ac)}.html`,pdf=`${r}notes/downloadable-notes-${encodeURIComponent(ac)}.pdf`,has=LESSONS.has(code(ac));return `<article class='subject-card' data-subject-code='${esc(code(s.code))}' data-revision='${esc(s.revision)}'><div class='subject-top'><span>${esc(s.revision)}</span><strong>${esc(s.code)}</strong></div><h3>${esc(s.name)}</h3><p>${esc(s.department)} / ${esc(s.semester)} / ${esc(s.type)}</p><div class='action-row'><a class='action syllabus' href='${esc(syllabus(s))}' target='_blank' rel='noopener noreferrer'>Open Syllabus</a>${has?`<a class='action lessons' href='${esc(les)}'>View Lessons</a><a class='action download' href='${esc(pdf)}' download>Download Notes</a>`:`<span class='availability-label'>Lessons unavailable</span><span class='availability-label'>Notes unavailable</span>`}${qp(s)?`<a class='action qp' href='${esc(qp(s))}' target='_blank' rel='noopener noreferrer' data-model-paper-revision='${esc(s.revision)}' data-model-paper-course='${esc(code(s.code))}'>Sample QP</a>`:`<button class='action qp' type='button' data-model-paper-unavailable='true' data-model-paper-revision='${esc(s.revision)}' data-model-paper-course='${esc(code(s.code))}' aria-label='Model Question Paper not available for Revision ${esc(s.revision)} for course ${esc(s.code)}.' title='Model Question Paper not available for Revision ${esc(s.revision)} for course ${esc(s.code)}.' onclick='window.alert(this.title)'>Sample QP</button>`}</div></article>`}
  function groups(grid,list){const map=new Map();list.forEach(s=>{const sem=String(s.semester||'Other subjects');if(!map.has(sem))map.set(sem,[]);map.get(sem).push(s)});grid.innerHTML=[...map.entries()].map(([sem,items])=>`<section class='semester-subject-section' style='grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px'><div class='semester-group-heading' style='display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)'><h3>${esc(sem)}</h3><span>${items.length} ${items.length===1?'subject':'subjects'}</span></div><div class='semester-card-grid' style='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%'>${items.map(card).join('')}</div></section>`).join('')}
  async function start(){
    const grid=document.getElementById('subjectGrid');
    if(!grid||grid.dataset.mode!=='department')return;
    const dep=grid.dataset.department||'';
    const rev=grid.dataset.revision||'2021';
    const text=await fetch(`${root()}assets/js/subjects.js?v=20260630-2022-lesson1`).then(r=>r.text()).catch(()=>'');
    const all=unique([...parse(text),...manual]);

    // PERFORMANCE OPTIMIZATION: Pre-compute and cache search text for each subject
    // to avoid redundant string joins and lowercase conversions on every keystroke.
    all.forEach(s => {
      s._searchText = [s.code, s.name, s.department, s.semester, s.type].join(' ').toLowerCase();
    });

    const render=()=>{
      const sem=document.getElementById('semesterFilter')?.value||'all';
      const q=String(document.getElementById('subjectSearch')?.value||'').trim().toLowerCase();
      let list=all.filter(s=>String(s.revision)===rev&&(same(s.department,COMMON)||same(s.department,dep)));
      if(sem!=='all')list=list.filter(s=>String(s.semester)===sem);
      if(q)list=list.filter(s=>s._searchText && s._searchText.includes(q));
      list.sort((a,b)=>semrank(a.semester)-semrank(b.semester)||String(a.code).localeCompare(String(b.code),undefined,{numeric:true}));
      if(list.length)groups(grid,list)
    };
    render();
    ['subjectSearch','semesterFilter'].forEach(id=>{
      const el=document.getElementById(id);
      if(el){
        el.addEventListener('input',render);
        el.addEventListener('change',render)
      }
    })
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();