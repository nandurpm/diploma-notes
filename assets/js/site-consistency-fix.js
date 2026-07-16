(() => {
  "use strict";
  const SITE = "POLY PMNA";
  const VERSION = "20260716-revision-switch1";
  const path = () => location.pathname.replace(/\/+$/, "") || "/";
  const isLesson = /\/lessons\//i.test(path());
  const navItems = [
    ["Home", "/index.html", p => p === "/" || p.endsWith("/index.html")],
    ["About", "/about.html", p => p.endsWith("/about.html")],
    ["Revision 2021", "/revision-2021.html", p => p.endsWith("/revision-2021.html") || p.includes("/revision-2021/")],
    ["Revision 2026", "/revision-2026.html", p => p.endsWith("/revision-2026.html") || p.includes("/revision-2026/")],
    ["Mock Exams", "/daily-quiz.html", p => p.endsWith("/daily-quiz.html") || /\/mock-exam(?:-|\.html)/i.test(p)],
    ["Ask POLY AI", "/ask-poly.html", p => /\/ask-poly(?:-v2)?\.html$/i.test(p)],
    ["2015 Materials", "/materials-2015.html", p => p.endsWith("/materials-2015.html")],
    ["Tools", "/tools.html", p => /\/tools(?:-v2|-v2-original)?\.html$/i.test(p)],
    ["Help", "/contact.html", p => p.endsWith("/contact.html")]
  ];
  const pageNames = [
    [/^\/$|\/index\.html$/i, "Kerala Polytechnic Revision 2026 & 2021 Study Hub"],
    [/\/about\.html$/i, "About"],
    [/\/revision-2021\.html$/i, "Revision 2021"],
    [/\/revision-2021\//i, "Revision 2021 Department Subjects"],
    [/\/revision-2026\.html$/i, "Revision 2026 Diploma Departments"],
    [/\/revision-2026\//i, "Revision 2026 Department Subjects"],
    [/\/syllabus\.html$/i, "Kerala Polytechnic Syllabus Browser"],
    [/\/lessons\.html$/i, "Kerala Polytechnic Lesson Pages"],
    [/\/daily-quiz\.html$/i, "Mock Exams"],
    [/\/ask-poly(?:-v2)?\.html$/i, "Ask POLY AI"],
    [/\/materials-2015\.html$/i, "2015 Materials"],
    [/\/tools(?:-v2|-v2-original)?\.html$/i, "Student Tools"],
    [/\/contact\.html$/i, "Help"]
  ];
  const ONLY_2021 = new Set([
    "civil-public-health-and-environment-engineering",
    "cloud-computing-and-big-data",
    "communication-and-computer-networking",
    "computer-hardware-engineering",
    "hotel-management-and-catering-technology",
    "manufacturing-technology",
    "renewable-energy"
  ]);
  const ONLY_2026 = new Set(["computer-science-and-technology", "interior-design"]);
  const SLUG_MAP = {
    "2021:electrical-electronics-engineering": "electrical-and-electronics-engineering",
    "2026:electrical-and-electronics-engineering": "electrical-electronics-engineering"
  };

  function pageTitle() {
    return pageNames.find(([rx]) => rx.test(path()))?.[1] || (document.title || SITE).split("|")[0].trim() || SITE;
  }

  function ensureStyle() {
    if (document.getElementById("poly-consistency-style")) return;
    const style = document.createElement("style");
    style.id = "poly-consistency-style";
    style.textContent = '.nav-badge{display:inline-flex;align-items:center;justify-content:center;margin-left:.45rem;padding:.12rem .45rem;border-radius:999px;background:linear-gradient(135deg,#f97316,#facc15);color:#111827;font-size:.68rem;font-weight:950;line-height:1}.site-breadcrumbs ol{display:flex;gap:.45rem;flex-wrap:wrap;list-style:none;padding:0;margin:0}.site-breadcrumbs li:not(:last-child)::after{content:"/";margin-left:.45rem;color:#94a3b8}.curriculum-switcher{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:14px 0 20px;padding:7px;border:1px solid rgba(29,78,216,.16);border-radius:999px;background:rgba(255,255,255,.78);width:max-content;max-width:100%;box-shadow:0 8px 22px rgba(15,23,42,.06)}.curriculum-switcher a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:8px 15px;border-radius:999px;text-decoration:none;font-weight:900;color:#334155}.curriculum-switcher a.active{background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;box-shadow:0 8px 18px rgba(29,78,216,.22)}.curriculum-switcher .switch-label{padding-left:8px;font-size:.78rem;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#64748b}@media(max-width:560px){.curriculum-switcher{width:100%;border-radius:18px}.curriculum-switcher .switch-label{width:100%;padding:2px 8px}.curriculum-switcher a{flex:1}}';
    document.head.append(style);
  }

  function ensureHeader() {
    if (isLesson) return;
    let header = document.querySelector("header.topbar");
    if (!header) { header = document.createElement("header"); header.className = "topbar"; document.body.prepend(header); }
    let brand = header.querySelector(".brand");
    if (!brand) { brand = document.createElement("a"); header.prepend(brand); }
    brand.className = "brand";
    brand.href = "/index.html";
    brand.setAttribute("aria-label", `${SITE} home`);
    brand.innerHTML = '<span class="brand-symbol" aria-hidden="true">📚</span><strong>POLY PMNA</strong>';
    let button = header.querySelector(".menu-toggle");
    if (!button) { button = document.createElement("button"); brand.after(button); }
    button.className = "menu-toggle";
    button.type = "button";
    button.textContent = "Menu";
    button.setAttribute("aria-label", "Toggle navigation");
    let nav = header.querySelector(".navlinks");
    if (!nav) { nav = document.createElement("nav"); header.append(nav); }
    const wasOpen = nav.classList.contains("open") || header.classList.contains("open");
    const current = path().toLowerCase();
    nav.className = wasOpen ? "navlinks open" : "navlinks";
    nav.setAttribute("aria-label", "Primary navigation");
    nav.innerHTML = navItems.map(([label, href, match]) => `<a href="${href}"${match(current) ? ' class="active" aria-current="page"' : ""}>${label}${label === "Tools" ? ' <span class="nav-badge">New</span>' : ""}</a>`).join("");
    button.setAttribute("aria-expanded", String(wasOpen));
    if (button.dataset.fixedHeaderBound !== "true" && button.dataset.polyNavBound !== "true") {
      button.dataset.polyNavBound = "true";
      button.addEventListener("click", () => { const open = !nav.classList.contains("open"); nav.classList.toggle("open", open); header.classList.toggle("open", open); button.setAttribute("aria-expanded", String(open)); });
    }
  }

  function counterpartHref(targetRevision) {
    const current = path();
    const match = current.match(/^\/revision-(2021|2026)(?:\/([^/]+)\.html)?$/i);
    if (!match) return `/revision-${targetRevision}.html`;
    const currentRevision = match[1];
    const slug = match[2];
    if (!slug) return `/revision-${targetRevision}.html`;
    if ((targetRevision === "2026" && ONLY_2021.has(slug)) || (targetRevision === "2021" && ONLY_2026.has(slug))) return `/revision-${targetRevision}.html`;
    const mapped = SLUG_MAP[`${currentRevision}:${slug}`] || slug;
    return `/revision-${targetRevision}/${mapped}.html`;
  }

  function ensureRevisionSwitcher() {
    if (document.querySelector(".revision-directory-switch")) return;
    const match = path().match(/^\/revision-(2021|2026)(?:\/[^/]+\.html)?$/i);
    if (!match) return;
    const activeRevision = match[1];
    let switcher = document.querySelector(".curriculum-switcher");
    if (!switcher) {
      switcher = document.createElement("nav");
      switcher.className = "curriculum-switcher";
      switcher.setAttribute("aria-label", "Curriculum revision switcher");
      const breadcrumbs = document.querySelector(".site-breadcrumbs");
      const title = document.querySelector(".page-title");
      if (breadcrumbs) breadcrumbs.after(switcher);
      else if (title) title.before(switcher);
      else document.querySelector("main")?.prepend(switcher);
    }
    switcher.innerHTML = `<span class="switch-label">Switch revision</span><a href="${counterpartHref("2021")}"${activeRevision === "2021" ? ' class="active" aria-current="page"' : ""}>Revision 2021</a><a href="${counterpartHref("2026")}"${activeRevision === "2026" ? ' class="active" aria-current="page"' : ""}>Revision 2026</a>`;
  }

  function normalizeBrandMeta() {
    document.querySelectorAll(".brand strong").forEach(node => { node.textContent = SITE; });
    document.querySelectorAll('.brand[aria-label]').forEach(node => { node.setAttribute("aria-label", `${SITE} home`); });
    if (!isLesson) document.title = `${pageTitle()} | ${SITE}`;
    document.querySelectorAll('meta[property="og:title"],meta[name="twitter:title"]').forEach(meta => { meta.content = document.title; });
    document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]').forEach(meta => { meta.content = (meta.content || "").replace(/Polytechnic Study Hub|Diploma Notes|DN Diploma Notes/g, SITE); });
  }

  function normalizeFooter() {
    if (isLesson) return;
    let footer = document.querySelector("footer.footer");
    if (!footer) { footer = document.createElement("footer"); footer.className = "footer"; document.body.append(footer); }
    let text = footer.querySelector("p");
    if (!text) { text = document.createElement("p"); footer.prepend(text); }
    text.innerHTML = '&copy; <span data-year></span> POLY PMNA.';
    if (!footer.querySelector('a[href*="nandakumarm.dpdns.org"]')) {
      const link = document.createElement("a");
      link.href = "https://nandakumarm.dpdns.org/about.html";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Connect to Developer";
      footer.append(link);
    }
    let legal = footer.querySelector(".footer-legal");
    if (!legal) { legal = document.createElement("nav"); legal.className = "footer-legal"; legal.setAttribute("aria-label", "Legal"); footer.append(legal); }
    legal.innerHTML = '<a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/disclaimer.html">Disclaimer</a>';
    document.querySelectorAll("[data-year],#year").forEach(year => { year.textContent = new Date().getFullYear(); });
  }

  function normalizeBreadcrumbs() {
    const map = {
      "/ask-poly.html": [["Home", "/index.html"], ["Ask POLY AI", null]],
      "/ask-poly-v2.html": [["Home", "/index.html"], ["Ask POLY AI", null]],
      "/daily-quiz.html": [["Home", "/index.html"], ["Mock Exams", null]],
      "/tools.html": [["Home", "/index.html"], ["Student Tools", null]],
      "/contact.html": [["Home", "/index.html"], ["Help", null]]
    };
    const items = map[path()];
    if (!items) return;
    let breadcrumbs = document.querySelector(".site-breadcrumbs");
    if (!breadcrumbs) {
      const main = document.getElementById("main-content") || document.querySelector("main");
      if (!main) return;
      breadcrumbs = document.createElement("nav");
      breadcrumbs.className = "site-breadcrumbs";
      breadcrumbs.setAttribute("aria-label", "Breadcrumb");
      main.prepend(breadcrumbs);
    }
    breadcrumbs.innerHTML = `<ol>${items.map(([label, href]) => `<li>${href ? `<a href="${href}">${label}</a>` : `<span aria-current="page">${label}</span>`}</li>`).join("")}</ol>`;
  }

  function loadingFallbacks() {
    const title = document.querySelector("[data-important-title]");
    if (title && /loading today/i.test(title.textContent || "")) title.textContent = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    if (/\/daily-quiz\.html$/i.test(path())) {
      const message = document.getElementById("authMessage");
      if (message && /secure quiz service is unavailable|unavailable/i.test(message.textContent || "")) { message.textContent = "Online login is optional. Use Continue as Guest if cloud login is unavailable."; message.className = "status ok"; }
      const countdown = document.getElementById("countdown");
      if (countdown && countdown.textContent.trim() === "—") countdown.textContent = "Practice anytime";
    }
    if (/\/tools(?:-v2|-v2-original)?\.html$/i.test(path())) {
      const shown = document.getElementById("shown");
      const grid = document.getElementById("grid");
      if (shown && grid && !grid.children.length && /loading|0 of 0|0 tools/i.test(shown.textContent || "")) shown.textContent = "Loading tools. If this remains empty, hard refresh once with Ctrl+F5.";
    }
  }

  function run() {
    ensureStyle();
    ensureHeader();
    ensureRevisionSwitcher();
    normalizeBrandMeta();
    normalizeFooter();
    normalizeBreadcrumbs();
    loadingFallbacks();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
  setTimeout(run, 400);
  setTimeout(run, 1400);
  setTimeout(run, 3000);
})();
