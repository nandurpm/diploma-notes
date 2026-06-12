function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rootPrefix() {
  const depth = window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
  return depth > 0 ? "../".repeat(depth) : "";
}

function hasSeparateNotesPdf(subject) {
  const code = String(subject.code || "").toUpperCase();
  return Boolean(subject.notesFile) || code === "1003" || code === "1004";
}

function subjectCard(subject) {
  const searchText = [subject.revision, subject.code, subject.name, subject.department, subject.semester, subject.type].join(" ").toLowerCase();
  const isMaterial = subject.type === "Material";
  const lessonHref = lessonLink(subject);
  const separatePdf = hasSeparateNotesPdf(subject);
  const downloadHref = separatePdf ? notesLink(subject) : lessonHref;
  const downloadAsset = separatePdf ? downloadHref : lessonHref;
  const downloadTitle = separatePdf ? "Download uploaded notes PDF" : "Open the lesson PDF/download dialog";
  const printAttrs = separatePdf ? "" : ` data-print-url="${escapeHtml(lessonHref)}"`;
  const targetAttrs = separatePdf ? ` target="_blank" rel="noopener" download` : "";

  return `
    <article class="subject-card reveal" data-search="${escapeHtml(searchText)}">
      <div class="subject-top"><span>${escapeHtml(subject.revision)}</span><strong>${escapeHtml(subject.code)}</strong></div>
      <h3>${escapeHtml(subject.name)}</h3>
      <p>${escapeHtml(subject.department)} / ${escapeHtml(subject.semester)} / ${escapeHtml(subject.type)}</p>
      <div class="action-row">
        ${!isMaterial ? `<a class="action syllabus" href="${syllabusLink(subject.code)}" target="_blank" rel="noopener">Open Syllabus</a>` : ""}
        <a class="action lessons unavailable asset-check" href="${escapeHtml(lessonHref)}" data-asset-url="${escapeHtml(lessonHref)}" aria-disabled="true" title="Lesson file not uploaded yet">View Lessons</a>
        <a class="action download unavailable asset-check" href="${escapeHtml(downloadHref)}" data-asset-url="${escapeHtml(downloadAsset)}" aria-disabled="true" title="${escapeHtml(downloadTitle)}"${printAttrs}${targetAttrs}>Download Notes</a>
        ${!isMaterial ? `<a class="action qp" href="${modelQuestionPaperLink(subject.code)}" target="_blank" rel="noopener">Sample QP</a>` : ""}
      </div>
    </article>`;
}

const assetAvailability = new Map();
let activePrintFrame = null;

function resolveAssetUrl(url) {
  return new URL(url, window.location.href).href;
}

async function assetExists(url) {
  const absolute = resolveAssetUrl(url);
  if (assetAvailability.has(absolute)) return assetAvailability.get(absolute);
  const check = fetch(absolute, { method: "HEAD", cache: "no-store" })
    .then((response) => response.ok)
    .catch(() => fetch(absolute, { method: "GET", cache: "no-store" }).then((response) => response.ok).catch(() => false));
  assetAvailability.set(absolute, check);
  return check;
}

function printLessonFromButton(button) {
  const printUrl = button.dataset.printUrl;
  if (!printUrl || button.classList.contains("unavailable")) return;
  if (activePrintFrame) activePrintFrame.remove();

  const frame = document.createElement("iframe");
  activePrintFrame = frame;
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0", opacity: "0" });
  frame.addEventListener("load", () => {
    window.setTimeout(() => {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch (error) {
        window.open(resolveAssetUrl(printUrl), "_blank", "noopener");
      }
    }, 350);
  }, { once: true });
  frame.src = resolveAssetUrl(printUrl);
  document.body.append(frame);
}

function setupAssetButtons(root) {
  const buttons = [...root.querySelectorAll(".asset-check")];
  const checkButton = (button) => {
    const assetUrl = button.dataset.assetUrl;
    if (!assetUrl) return;
    button.addEventListener("click", (event) => {
      if (button.classList.contains("unavailable")) {
        event.preventDefault();
        return;
      }
      if (button.dataset.printUrl) {
        event.preventDefault();
        printLessonFromButton(button);
      }
    });
    assetExists(assetUrl).then((exists) => {
      if (!exists) return;
      button.classList.remove("unavailable");
      button.removeAttribute("aria-disabled");
      if (!button.dataset.printUrl) button.removeAttribute("title");
    });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        checkButton(entry.target);
      });
    }, { rootMargin: "300px" });
    buttons.forEach((button) => observer.observe(button));
    return;
  }
  buttons.forEach(checkButton);
}

function fillSelect(select, values, selected, allLabel) {
  if (!select) return;
  const current = selected || select.value || "all";
  const sorted = [...values].sort((a, b) => {
    const ma = a.match(/^Semester\s+(\d+)$/i);
    const mb = b.match(/^Semester\s+(\d+)$/i);
    if (ma && mb) return Number(ma[1]) - Number(mb[1]);
    return a.localeCompare(b);
  });
  select.innerHTML = `<option value="all">${escapeHtml(allLabel || "All")}</option>` + sorted.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  select.value = sorted.includes(current) ? current : "all";
}

function dedupeSubjects(subjects) {
  const seen = new Map();
  const out = [];
  for (const s of subjects) {
    const key = [s.revision, s.department, s.semester, s.code].join(":");
    if (!seen.has(key)) {
      seen.set(key, true);
      out.push(s);
    }
  }
  return out;
}

function semesterRank(value) {
  const text = String(value || "");
  const match = text.match(/semester\s*(\d+)/i);
  if (match) return Number(match[1]);
  if (/first\s*year/i.test(text)) return 1;
  return Number.MAX_SAFE_INTEGER;
}

function compareSubjectCodes(a, b) {
  return String(a || "").localeCompare(String(b || ""), undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

function sortSubjectsSemesterWise(subjects, fixedDepartment = "") {
  return [...subjects].sort((a, b) => {
    const semesterDifference = semesterRank(a.semester) - semesterRank(b.semester);
    if (semesterDifference) return semesterDifference;

    if (fixedDepartment) {
      const aCommon = a.department === "First Year / Common" ? 0 : 1;
      const bCommon = b.department === "First Year / Common" ? 0 : 1;
      if (aCommon !== bCommon) return aCommon - bCommon;
    } else {
      const aDepartment = a.department === "First Year / Common" ? "" : String(a.department || "");
      const bDepartment = b.department === "First Year / Common" ? "" : String(b.department || "");
      const departmentDifference = aDepartment.localeCompare(bDepartment, undefined, { sensitivity: "base" });
      if (departmentDifference) return departmentDifference;
    }

    const codeDifference = compareSubjectCodes(a.code, b.code);
    if (codeDifference) return codeDifference;
    return String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" });
  });
}

function ensureSemesterGroupStyles() {
  if (document.getElementById("semesterGroupStyles")) return;
  const style = document.createElement("style");
  style.id = "semesterGroupStyles";
  style.textContent = `
    .semester-group-heading {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      min-height: 64px;
      margin-top: 12px;
      padding: 14px 18px;
      border: 1px solid rgba(29,78,216,.14);
      border-radius: 22px;
      background: linear-gradient(135deg, rgba(219,234,254,.96), rgba(236,253,245,.96));
      box-shadow: 0 12px 28px rgba(20,45,90,.08);
    }
    .semester-group-heading:first-child { margin-top: 0; }
    .semester-group-heading span {
      color: #0f3f8a;
      font-family: "Space Grotesk", Inter, sans-serif;
      font-size: clamp(1.2rem, 2vw, 1.65rem);
      font-weight: 950;
      letter-spacing: -.03em;
    }
    .semester-group-heading small {
      flex: 0 0 auto;
      padding: 7px 11px;
      border-radius: 999px;
      color: #047857;
      background: rgba(255,255,255,.88);
      font-size: .78rem;
      font-weight: 900;
    }
    @media (max-width: 560px) {
      .semester-group-heading { min-height: 56px; padding: 12px 14px; }
    }
  `;
  document.head.append(style);
}

function renderSemesterGroups(subjects) {
  const totals = subjects.reduce((map, subject) => {
    const semester = subject.semester || "Other subjects";
    map.set(semester, (map.get(semester) || 0) + 1);
    return map;
  }, new Map());

  let previousSemester = "";
  return subjects.map((subject) => {
    const semester = subject.semester || "Other subjects";
    const count = totals.get(semester);
    const heading = semester !== previousSemester
      ? `<div class="semester-group-heading"><span>${escapeHtml(semester)}</span><small>${count} ${count === 1 ? "subject" : "subjects"}</small></div>`
      : "";
    previousSemester = semester;
    return heading + subjectCard(subject);
  }).join("");
}

function setupSubjectBrowser() {
  const pagePath = window.location.pathname.toLowerCase();
  if (pagePath.endsWith("/materials-2015.html") || pagePath.endsWith("materials-2015.html")) {
    document.querySelector("#subject-browser")?.remove();
    return;
  }

  const grid = document.querySelector("#subjectGrid");
  if (!grid || !Array.isArray(SUBJECTS)) return;
  ensureSemesterGroupStyles();

  const subjects = dedupeSubjects(SUBJECTS).filter((subject) => subject.revision !== "2015");
  const params = new URLSearchParams(window.location.search);
  const search = document.querySelector("#subjectSearch");
  const revisionFilter = document.querySelector("#revisionFilter");
  const departmentFilter = document.querySelector("#departmentFilter");
  const semesterFilter = document.querySelector("#semesterFilter");
  const fixedRevision = grid.dataset.revision || "";
  const fixedDepartment = grid.dataset.department || "";
  const homepageSearchMode = grid.dataset.mode === "homepage-search";

  fillSelect(revisionFilter, [...new Set(subjects.map((s) => s.revision))], fixedRevision || params.get("revision"), "All revisions");

  function refreshDeptFilter() {
    if (fixedDepartment) {
      fillSelect(departmentFilter, [fixedDepartment], fixedDepartment, "All departments");
      return;
    }
    const activeRevision = fixedRevision || revisionFilter?.value || "all";
    const depts = [...new Set(subjects.filter((s) => activeRevision === "all" || s.revision === activeRevision).map((s) => s.department))];
    fillSelect(departmentFilter, depts, params.get("department"), "All departments");
  }

  refreshDeptFilter();
  fillSelect(semesterFilter, [...new Set(subjects.map((s) => s.semester))], params.get("semester"), "All semesters");
  if (fixedRevision && revisionFilter) revisionFilter.disabled = true;
  if (fixedDepartment && departmentFilter) departmentFilter.disabled = true;
  if (params.get("subject") && search) search.value = params.get("subject");

  const render = () => {
    const query = (search?.value || "").trim().toLowerCase();
    const revision = fixedRevision || revisionFilter?.value || "all";
    const department = fixedDepartment || departmentFilter?.value || "all";
    const semester = semesterFilter?.value || "all";

    if (homepageSearchMode && !query) {
      grid.innerHTML = '<p class="empty">Search a subject code, title, department, or semester to show matching Kerala Polytechnic subject cards.</p>';
      return;
    }

    const visible = sortSubjectsSemesterWise(subjects.filter((subject) => {
      const text = [subject.revision, subject.code, subject.name, subject.department, subject.semester, subject.type].join(" ").toLowerCase();
      if (revision !== "all" && subject.revision !== revision) return false;
      if (semester !== "all" && subject.semester !== semester) return false;
      if (query && !text.includes(query)) return false;
      if (department !== "all") {
        if (subject.department === department) return true;
        if (fixedDepartment && subject.revision === revision && revision === "2021" && subject.department === "First Year / Common") return true;
        return false;
      }
      return true;
    }), fixedDepartment);

    grid.innerHTML = visible.length ? renderSemesterGroups(visible) : '<p class="empty">No subjects match this filter.</p>';
    setupAssetButtons(grid);
  };

  revisionFilter?.addEventListener("change", () => { refreshDeptFilter(); render(); });
  revisionFilter?.addEventListener("input", () => { refreshDeptFilter(); render(); });
  [search, departmentFilter, semesterFilter].forEach((control) => control?.addEventListener("input", render));
  [departmentFilter, semesterFilter].forEach((control) => control?.addEventListener("change", render));
  render();
}

function renderMaterialLinks() {
  document.querySelectorAll("[data-link-group]").forEach((container) => {
    const group = MATERIALS_2015?.[container.dataset.linkGroup] || [];
    container.innerHTML = group.map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.label)}</a>`).join("");
  });
}

function setupMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".navlinks");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function setupHomepageVideoPoster() {
  document.querySelectorAll(".home-video[poster]").forEach((video) => {
    video.addEventListener("ended", () => {
      video.pause();
      video.currentTime = 0;
      video.load();
    });
  });
}

function forcePremiumStylesheet() {
  const prefix = rootPrefix();
  const versionedHref = `${prefix}assets/css/style.css?v=20260611-portal1`;
  const compactHref = `${prefix}assets/css/home-compact.css?v=20260611-compact3`;
  const responsiveHref = `${prefix}assets/css/responsive.css?v=20260611-portal1`;
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.includes("assets/css/style.css")) link.remove();
    if (href.includes("assets/css/home-compact.css")) link.remove();
    if (href.includes("assets/css/responsive.css")) link.remove();
  });
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = versionedHref;
  document.head.prepend(css);
  const compact = document.createElement("link");
  compact.rel = "stylesheet";
  compact.href = compactHref;
  document.head.append(compact);
  const responsive = document.createElement("link");
  responsive.rel = "stylesheet";
  responsive.href = responsiveHref;
  document.head.append(responsive);
}

function setupSiteNotice() {
  if (document.querySelector(".site-notice")) return;
  const brand = document.querySelector(".topbar .brand");
  if (!brand) return;
  const notice = document.createElement("a");
  notice.className = "site-notice";
  notice.href = "https://nandakumarm.dpdns.org/about.html#contact";
  notice.target = "_blank";
  notice.rel = "noopener";
  notice.setAttribute("aria-label", "Contact the developer for suggestions or content changes");
  notice.innerHTML = '<span>This website is in its initial stage. For suggestions or content changes, please contact the developer.</span>';
  brand.insertAdjacentElement("afterend", notice);
}

function setupSiteAssistant() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("/lessons/") || document.querySelector(".poly-ai-button")) return;
  const prefix = rootPrefix();
  if (!document.querySelector('link[href*="assets/css/site-assistant.css"]')) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `${prefix}assets/css/site-assistant.css?v=20260611-portal1`;
    document.head.append(css);
  }
  if (!document.getElementById("polySiteAssistant")) {
    const mount = document.createElement("div");
    mount.id = "polySiteAssistant";
    document.body.append(mount);
  }
  if (!document.querySelector('script[src*="assets/js/site-assistant.js"]')) {
    const script = document.createElement("script");
    script.src = `${prefix}assets/js/site-assistant.js?v=20260611-portal1`;
    script.defer = true;
    document.body.append(script);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  forcePremiumStylesheet();
  setupSiteNotice();
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
  setupMenu();
  renderMaterialLinks();
  setupSubjectBrowser();
  setupHomepageVideoPoster();
  setupSiteAssistant();
});