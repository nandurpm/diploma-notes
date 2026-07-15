(() => {
  "use strict";
  const SITE = "POLY PMNA";
  const VERSION = "20260715-mobile-menu1";
  const path = () => location.pathname.replace(/\/+$/, "") || "/";
  const isLesson = /\/lessons\//i.test(path());
  const navItems = [
    ["Home", "/index.html", p => p === "/" || p.endsWith("/index.html")],
    ["About", "/about.html", p => p.endsWith("/about.html")],
    ["Revision 2021", "/revision-2021.html", p => p.endsWith("/revision-2021.html") || p.includes("/revision-2021/")],
    ["Mock Exams", "/daily-quiz.html", p => p.endsWith("/daily-quiz.html") || /\/mock-exam(?:-|\.html)/i.test(p)],
    ["Ask POLY AI", "/ask-poly.html", p => /\/ask-poly(?:-v2)?\.html$/i.test(p)],
    ["2015 Materials", "/materials-2015.html", p => p.endsWith("/materials-2015.html")],
    ["Tools", "/tools.html", p => /\/tools(?:-v2|-v2-original)?\.html$/i.test(p)],
    ["Help", "/contact.html", p => p.endsWith("/contact.html")]
  ];
  const pageNames = [
    [/^\/$|\/index\.html$/i, "Kerala Polytechnic Diploma Notes & Study Materials"],
    [/\/about\.html$/i, "About"],
    [/\/revision-2021\.html$/i, "Revision 2021"],
    [/\/revision-2021\//i, "Revision 2021 Department Subjects"],
    [/\/daily-quiz\.html$/i, "Mock Exams"],
    [/\/ask-poly(?:-v2)?\.html$/i, "Ask POLY AI"],
    [/\/materials-2015\.html$/i, "2015 Materials"],
    [/\/tools(?:-v2|-v2-original)?\.html$/i, "Student Tools"],
    [/\/contact\.html$/i, "Help"]
  ];
  function pageTitle(){ return (pageNames.find(([rx]) => rx.test(path()))?.[1] || (document.title || SITE).split("|")[0].trim() || SITE); }
  function ensureStyle(){
    if(document.getElementById("poly-consistency-style")) return;
    const s=document.createElement("style"); s.id="poly-consistency-style";
    s.textContent='.nav-badge{display:inline-flex;align-items:center;justify-content:center;margin-left:.45rem;padding:.12rem .45rem;border-radius:999px;background:linear-gradient(135deg,#f97316,#facc15);color:#111827;font-size:.68rem;font-weight:950;line-height:1}.site-breadcrumbs ol{display:flex;gap:.45rem;flex-wrap:wrap;list-style:none;padding:0;margin:0}.site-breadcrumbs li:not(:last-child)::after{content:"/";margin-left:.45rem;color:#94a3b8}';
    document.head.append(s);
  }
  function ensureHeader(){
    if(isLesson) return;
    let h=document.querySelector("header.topbar");
    if(!h){ h=document.createElement("header"); h.className="topbar"; document.body.prepend(h); }
    let brand=h.querySelector(".brand");
    if(!brand){ brand=document.createElement("a"); h.prepend(brand); }
    brand.className="brand"; brand.href="/index.html"; brand.setAttribute("aria-label",`${SITE} home`);
    brand.innerHTML='<span class="brand-symbol" aria-hidden="true">📚</span><strong>POLY PMNA</strong>';
    let btn=h.querySelector(".menu-toggle");
    if(!btn){ btn=document.createElement("button"); brand.after(btn); }
    btn.className="menu-toggle"; btn.type="button"; btn.textContent="Menu"; btn.setAttribute("aria-label","Toggle navigation");
    let nav=h.querySelector(".navlinks");
    if(!nav){ nav=document.createElement("nav"); h.append(nav); }
    const wasOpen = nav.classList.contains("open") || h.classList.contains("open");
    const p=path().toLowerCase();
    nav.className=wasOpen ? "navlinks open" : "navlinks";
    nav.setAttribute("aria-label","Primary navigation");
    nav.innerHTML=navItems.map(([label,href,match])=>`<a href="${href}"${match(p)?' class="active" aria-current="page"':''}>${label}${label==="Tools"?' <span class="nav-badge">New</span>':''}</a>`).join("");
    btn.setAttribute("aria-expanded", String(wasOpen));
    if(btn.dataset.fixedHeaderBound !== "true" && btn.dataset.polyNavBound !== "true"){
      btn.dataset.polyNavBound="true";
      btn.addEventListener("click",()=>{ const open=!nav.classList.contains("open"); nav.classList.toggle("open",open); h.classList.toggle("open",open); btn.setAttribute("aria-expanded",String(open)); });
    }
  }
  function normalizeBrandMeta(){
    document.querySelectorAll(".brand strong").forEach(x=>x.textContent=SITE);
    document.querySelectorAll('.brand[aria-label]').forEach(x=>x.setAttribute('aria-label',`${SITE} home`));
    if(!isLesson){ document.title=`${pageTitle()} | ${SITE}`; }
    document.querySelectorAll('meta[property="og:title"],meta[name="twitter:title"]').forEach(m=>m.content=document.title);
    document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]').forEach(m=>{ m.content=(m.content||"").replace(/Polytechnic Study Hub|Diploma Notes|DN Diploma Notes/g,SITE); });
  }
  function normalizeFooter(){
    if(isLesson) return;
    let footer=document.querySelector("footer.footer");
    if(!footer){ footer=document.createElement("footer"); footer.className="footer"; document.body.append(footer); }
    let p=footer.querySelector("p"); if(!p){ p=document.createElement("p"); footer.prepend(p); }
    p.innerHTML='&copy; <span data-year></span> POLY PMNA.';
    if(!footer.querySelector('a[href*="nandakumarm.dpdns.org"]')){
      const a=document.createElement("a"); a.href="https://nandakumarm.dpdns.org/about.html"; a.target="_blank"; a.rel="noopener noreferrer"; a.textContent="Connect to Developer"; footer.append(a);
    }
    let legal=footer.querySelector(".footer-legal"); if(!legal){ legal=document.createElement("nav"); legal.className="footer-legal"; legal.setAttribute("aria-label","Legal"); footer.append(legal); }
    legal.innerHTML='<a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/disclaimer.html">Disclaimer</a>';
    document.querySelectorAll("[data-year],#year").forEach(y=>y.textContent=new Date().getFullYear());
  }
  function normalizeBreadcrumbs(){
    const map = {
      "/ask-poly.html": [["Home","/index.html"],["Ask POLY AI",null]],
      "/ask-poly-v2.html": [["Home","/index.html"],["Ask POLY AI",null]],
      "/daily-quiz.html": [["Home","/index.html"],["Mock Exams",null]],
      "/tools.html": [["Home","/index.html"],["Student Tools",null]],
      "/contact.html": [["Home","/index.html"],["Help",null]]
    };
    const items=map[path()]; if(!items) return;
    let bc=document.querySelector(".site-breadcrumbs");
    if(!bc){ const main=document.getElementById("main-content")||document.querySelector("main"); if(!main) return; bc=document.createElement("nav"); bc.className="site-breadcrumbs"; bc.setAttribute("aria-label","Breadcrumb"); main.prepend(bc); }
    bc.innerHTML=`<ol>${items.map(([label,href])=>`<li>${href?`<a href="${href}">${label}</a>`:`<span aria-current="page">${label}</span>`}</li>`).join("")}</ol>`;
  }
  function loadingFallbacks(){
    const title=document.querySelector('[data-important-title]');
    if(title && /loading today/i.test(title.textContent||"")) title.textContent=new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
    if(/\/daily-quiz\.html$/i.test(path())){
      const msg=document.getElementById("authMessage");
      if(msg && /secure quiz service is unavailable|unavailable/i.test(msg.textContent||"")){ msg.textContent="Online login is optional. Use Continue as Guest if cloud login is unavailable."; msg.className="status ok"; }
      const cd=document.getElementById("countdown"); if(cd && cd.textContent.trim()==="—") cd.textContent="Practice anytime";
    }
    if(/\/tools(?:-v2|-v2-original)?\.html$/i.test(path())){
      const shown=document.getElementById("shown"), grid=document.getElementById("grid");
      if(shown && grid && !grid.children.length && /loading|0 of 0|0 tools/i.test(shown.textContent||"")) shown.textContent="Loading tools. If this remains empty, hard refresh once with Ctrl+F5.";
    }
    const sg=document.getElementById("subjectGrid");
    if(sg && !sg.querySelector(".subject-card") && !sg.dataset.polyChecked){ sg.dataset.polyChecked="true"; setTimeout(()=>{ if(!sg.querySelector(".subject-card") && !/loading/i.test(sg.textContent||"")) sg.innerHTML='<div class="empty-state">No subjects loaded. Use Revision 2021 from the top menu and open the department viewer.</div>'; },1800); }
  }
  function run(){ ensureStyle(); ensureHeader(); normalizeBrandMeta(); normalizeFooter(); normalizeBreadcrumbs(); loadingFallbacks(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",run,{once:true}); else run();
  setTimeout(run,400); setTimeout(run,1400); setTimeout(run,3000);
})();