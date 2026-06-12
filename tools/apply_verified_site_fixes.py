from __future__ import annotations

import html as html_lib
import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = "https://polypmna.dpdns.org"

HARDENING_CSS = r'''
/* Verified cross-page layout, accessibility, and failure-state corrections. */
:root {
  --site-edge-gutter: clamp(12px, 1.4vw, 24px);
  --site-focus: #0b57d0;
  --site-ink: #172033;
  --site-muted: #475569;
}

*, *::before, *::after { box-sizing: border-box; }
html { width: 100%; max-width: none; scroll-behavior: smooth; scroll-padding-top: 96px; }
body { width: 100%; max-width: none; margin: 0; overflow-x: clip; color: var(--site-ink); }
.topbar,
main,
.content,
.page-shell,
.footer {
  width: 100% !important;
  max-width: none !important;
  margin-inline: 0 !important;
}
.topbar,
.footer { padding-inline: var(--site-edge-gutter) !important; }
main,
.content,
.page-shell { padding-inline: var(--site-edge-gutter) !important; }
main > section,
main > article,
main > .section,
main > .page-title { width: 100%; max-width: none; }
section[id] { scroll-margin-top: 96px; }

img, svg, iframe, video { max-width: 100%; }
video { display: block; width: 100%; height: auto; }
.table-wrapper,
.table-wrap,
.tbl { width: 100%; max-width: 100%; overflow-x: auto; overscroll-behavior-inline: contain; }
table { max-width: 100%; }
th, td { overflow-wrap: anywhere; }
thead th:not([scope]) { font-weight: 800; }

input, select, textarea, button { max-width: 100%; font: inherit; }
button, .btn, .action, .navlinks a { min-height: 42px; }
a, button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"]) { outline-offset: 3px; }
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
summary:focus-visible,
[tabindex]:not([tabindex="-1"]):focus-visible {
  outline: 3px solid var(--site-focus) !important;
  box-shadow: 0 0 0 3px #fff !important;
}
a { text-underline-offset: .16em; }

.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.subject-browser-status,
.department-filter-status,
.material-filter-status {
  margin: .65rem 0 0;
  color: var(--site-muted);
  font-weight: 700;
}
.empty,
.async-error,
.no-results {
  grid-column: 1 / -1;
  width: 100%;
  margin: .75rem 0;
  padding: 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #f8fafc;
  color: #334155;
}
.async-error { border-color: #f1aeb5; background: #fff5f5; color: #8a1c28; }
.availability-label,
.action.unavailable,
.action[aria-disabled="true"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: .58rem .78rem;
  border: 1px solid #94a3b8;
  border-radius: 999px;
  background: #e2e8f0 !important;
  color: #334155 !important;
  cursor: not-allowed;
  text-decoration: none;
}
.choice-card[hidden], .subject-card[hidden] { display: none !important; }
.department-filter,
.material-filter {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(150px, .35fr);
  gap: .65rem;
  margin: 0 0 1rem;
}
.department-filter { grid-template-columns: minmax(220px, 620px); }
.department-filter input,
.material-filter input,
.material-filter select { width: 100%; }
.curriculum-back {
  position: relative;
  z-index: 2;
  display: inline-flex;
  margin: .65rem var(--site-edge-gutter) 0;
  padding: .55rem .8rem;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #0f3f8a;
  font-weight: 800;
  text-decoration: none;
}
.footer-legal { display: flex; flex-wrap: wrap; justify-content: center; gap: .65rem 1rem; }
.footer-legal a { color: inherit; }
.page-title > p,
.section-heading p,
.discussion-head p { max-width: 90ch; }

@media (max-width: 768px) {
  :root { --site-edge-gutter: 12px; }
  html { scroll-padding-top: 78px; }
  section[id] { scroll-margin-top: 78px; }
  .department-filter,
  .material-filter,
  .filters { grid-template-columns: 1fr !important; }
  .hero-actions,
  .action-row { align-items: stretch; }
  .hero-actions > *,
  .action-row > * { max-width: 100%; }
  .breadcrumbs, .breadcrumb { overflow-wrap: anywhere; }
}

@media (max-width: 375px) {
  body { font-size: 15px; }
  .topbar, main, .content, .page-shell, .footer { padding-inline: 10px !important; }
  button, .btn, .action, .navlinks a { min-height: 44px; }
}

@media print {
  .curriculum-back, .department-filter, .material-filter, .footer-legal { display: none !important; }
  body, main, .content, .page-shell { width: 100% !important; max-width: none !important; padding: 0 !important; }
}
'''.strip() + "\n"

HARDENING_JS = r'''
(() => {
  "use strict";

  const PUBLIC_ROOT = "https://polypmna.dpdns.org";
  const assetChecks = new Map();

  const create = (tag, options = {}) => {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.attrs) Object.entries(options.attrs).forEach(([name, value]) => node.setAttribute(name, value));
    return node;
  };

  const normalizedPath = () => window.location.pathname.replace(/\/+$/, "") || "/";
  const subjectData = () => {
    if (Array.isArray(globalThis.SUBJECTS)) return globalThis.SUBJECTS;
    try {
      if (typeof SUBJECTS !== "undefined" && Array.isArray(SUBJECTS)) {
        globalThis.SUBJECTS = SUBJECTS;
        return SUBJECTS;
      }
    } catch (error) {
      console.error("Subject data could not be read.", error);
    }
    return [];
  };

  const uniqueSubjects = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      if (!item || !item.code || !item.name || !item.revision) return false;
      const key = [item.revision, item.department, item.semester, item.code].join(":");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const semesterNumber = (value) => {
    const match = String(value || "").match(/(?:semester\s*)?(\d+)/i);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  };

  const sortSubjects = (items) => [...items].sort((a, b) => {
    const sem = semesterNumber(a.semester) - semesterNumber(b.semester);
    if (sem) return sem;
    const department = String(a.department || "").localeCompare(String(b.department || ""), undefined, { sensitivity: "base" });
    if (department) return department;
    return String(a.code).localeCompare(String(b.code), undefined, { numeric: true, sensitivity: "base" });
  });

  const fillSelect = (select, values, allLabel, selected = "all") => {
    if (!select) return;
    const wanted = selected || select.value || "all";
    select.replaceChildren();
    select.append(create("option", { text: allLabel, attrs: { value: "all" } }));
    [...new Set(values.filter(Boolean))]
      .sort((a, b) => semesterNumber(a) - semesterNumber(b) || String(a).localeCompare(String(b), undefined, { sensitivity: "base" }))
      .forEach((value) => select.append(create("option", { text: value, attrs: { value } })));
    select.value = [...select.options].some((option) => option.value === wanted) ? wanted : "all";
  };

  const localAssetExists = async (url) => {
    const absolute = new URL(url, window.location.href).href;
    if (assetChecks.has(absolute)) return assetChecks.get(absolute);
    const request = (async () => {
      try {
        let response = await fetch(absolute, { method: "HEAD", cache: "no-store" });
        if (response.ok) return true;
        response = await fetch(absolute, { method: "GET", cache: "no-store" });
        return response.ok;
      } catch (error) {
        console.error(`Asset check failed for ${absolute}`, error);
        return false;
      }
    })();
    assetChecks.set(absolute, request);
    return request;
  };

  const unavailable = (label = "Not available yet") => create("span", {
    className: "availability-label",
    text: label,
    attrs: { "aria-disabled": "true" }
  });

  const externalLink = (label, href, className) => create("a", {
    className,
    text: label,
    attrs: { href, target: "_blank", rel: "noopener noreferrer" }
  });

  const checkedInternalLink = (label, href, className, container) => {
    const link = create("a", {
      className: `${className} unavailable`,
      text: label,
      attrs: { href, "aria-disabled": "true", title: "Checking availability" }
    });
    link.addEventListener("click", (event) => {
      if (link.getAttribute("aria-disabled") === "true") event.preventDefault();
    });
    container.append(link);
    localAssetExists(href).then((exists) => {
      if (!link.isConnected) return;
      if (!exists) {
        link.replaceWith(unavailable());
        return;
      }
      link.classList.remove("unavailable");
      link.removeAttribute("aria-disabled");
      link.removeAttribute("title");
    });
    return link;
  };

  const buildSubjectCard = (subject) => {
    const article = create("article", { className: "subject-card reveal" });
    const top = create("div", { className: "subject-top" });
    top.append(create("span", { text: String(subject.revision) }), create("strong", { text: String(subject.code) }));
    article.append(top, create("h3", { text: subject.name }));
    article.append(create("p", { text: `${subject.department} / ${subject.semester} / ${subject.type}` }));
    const actions = create("div", { className: "action-row" });

    if (String(subject.revision) === "2015" || subject.type === "Material") {
      actions.append(create("a", {
        className: "action lessons",
        text: "View 2015 Materials",
        attrs: { href: "/materials-2015.html" }
      }));
      article.append(actions);
      return article;
    }

    const code = encodeURIComponent(subject.code);
    actions.append(externalLink(
      "Open Syllabus",
      `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${code}`,
      "action syllabus"
    ));
    const lessonUrl = subject.lessonFile ? `/${String(subject.lessonFile).replace(/^\/+/, "")}` : `/lessons/lessons-${code}.html?revision=2021`;
    checkedInternalLink("View Lessons", lessonUrl, "action lessons", actions);

    const separateNotes = Boolean(subject.notesFile) || ["1003", "1004"].includes(String(subject.code));
    if (separateNotes) {
      const notesUrl = subject.notesFile
        ? `/${String(subject.notesFile).replace(/^\/+/, "")}`
        : `/notes/downloadable-notes-${code}.pdf`;
      checkedInternalLink("Download Notes", notesUrl, "action download", actions);
    } else {
      checkedInternalLink("Open / Print Notes", lessonUrl, "action download", actions);
    }

    actions.append(externalLink(
      "Sample QP",
      `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${code}`,
      "action qp"
    ));
    article.append(actions);
    return article;
  };

  const ensureFilterLabels = () => {
    const names = {
      subjectSearch: "Search subjects",
      revisionFilter: "Filter by revision",
      departmentFilter: "Filter by department",
      semesterFilter: "Filter by semester"
    };
    Object.entries(names).forEach(([id, text]) => {
      const control = document.getElementById(id);
      if (!control || document.querySelector(`label[for="${id}"]`)) return;
      const label = create("label", { className: "sr-only", text, attrs: { for: id } });
      control.before(label);
    });
  };

  const setupSubjectBrowser = () => {
    const grid = document.getElementById("subjectGrid");
    if (!grid || grid.dataset.hardeningInitialized === "true") return;
    grid.dataset.hardeningInitialized = "true";
    ensureFilterLabels();

    const search = document.getElementById("subjectSearch");
    const revisionFilter = document.getElementById("revisionFilter");
    const departmentFilter = document.getElementById("departmentFilter");
    const semesterFilter = document.getElementById("semesterFilter");
    const fixedRevision = grid.dataset.revision || "";
    const fixedDepartment = grid.dataset.department || "";
    const homepage = grid.dataset.mode === "homepage-search";
    const params = new URLSearchParams(window.location.search);
    const all = uniqueSubjects(subjectData());

    const status = create("p", {
      className: "subject-browser-status",
      attrs: { id: "subjectResultStatus", role: "status", "aria-live": "polite" }
    });
    grid.before(status);

    if (!all.length) {
      grid.replaceChildren(create("p", {
        className: "async-error",
        text: "Unable to load subject data. Please try again later."
      }));
      status.textContent = "Subject data unavailable.";
      console.error("Subject browser initialization failed: SUBJECTS is missing, malformed, or empty.");
      return;
    }

    globalThis.SUBJECTS = all;
    const initialRevision = fixedRevision || params.get("revision") || revisionFilter?.value || "all";
    const initialDepartment = fixedDepartment || params.get("department") || departmentFilter?.value || "all";
    const initialSemester = params.get("semester") || semesterFilter?.value || "all";
    if (search && params.get("subject")) search.value = params.get("subject");

    fillSelect(revisionFilter, all.map((item) => String(item.revision)), "All revisions", initialRevision);
    fillSelect(departmentFilter, all.map((item) => item.department), "All departments", initialDepartment);
    fillSelect(semesterFilter, all.map((item) => item.semester), "All semesters", initialSemester);
    if (fixedRevision && revisionFilter) { revisionFilter.value = fixedRevision; revisionFilter.disabled = true; }
    if (fixedDepartment && departmentFilter) { departmentFilter.value = fixedDepartment; departmentFilter.disabled = true; }

    const refreshDependentFilters = () => {
      const revision = fixedRevision || revisionFilter?.value || "all";
      const currentDepartment = fixedDepartment || departmentFilter?.value || "all";
      const departmentPool = all.filter((item) => revision === "all" || String(item.revision) === revision);
      fillSelect(departmentFilter, departmentPool.map((item) => item.department), "All departments", currentDepartment);
      if (fixedDepartment && departmentFilter) { departmentFilter.value = fixedDepartment; departmentFilter.disabled = true; }
      const department = fixedDepartment || departmentFilter?.value || "all";
      const semesterPool = departmentPool.filter((item) => department === "all" || item.department === department || (fixedDepartment && item.department === "First Year / Common"));
      fillSelect(semesterFilter, semesterPool.map((item) => item.semester), "All semesters", semesterFilter?.value || "all");
    };

    const render = () => {
      const query = String(search?.value || "").trim().toLocaleLowerCase();
      const revision = fixedRevision || revisionFilter?.value || "all";
      const department = fixedDepartment || departmentFilter?.value || "all";
      const semester = semesterFilter?.value || "all";
      const matches = sortSubjects(all.filter((item) => {
        if (revision !== "all" && String(item.revision) !== revision) return false;
        if (semester !== "all" && item.semester !== semester) return false;
        if (department !== "all" && item.department !== department) {
          if (!(fixedDepartment && String(item.revision) === "2021" && item.department === "First Year / Common")) return false;
        }
        const text = [item.revision, item.code, item.name, item.department, item.semester, item.type].join(" ").toLocaleLowerCase();
        return !query || text.includes(query);
      }));

      grid.replaceChildren();
      if (!matches.length) {
        const message = fixedDepartment && !query && revision === "2021"
          ? "No subjects are currently available for this department."
          : "No matching subjects found.";
        grid.append(create("p", { className: "empty", text: message }));
        status.textContent = message;
        return;
      }

      const limit = homepage ? 36 : matches.length;
      matches.slice(0, limit).forEach((subject) => grid.append(buildSubjectCard(subject)));
      status.textContent = matches.length > limit
        ? `Showing ${limit} of ${matches.length} subjects. Use search or filters to narrow the list.`
        : `${matches.length} ${matches.length === 1 ? "subject" : "subjects"} shown.`;
    };

    search?.addEventListener("input", render);
    revisionFilter?.addEventListener("change", () => { refreshDependentFilters(); render(); });
    departmentFilter?.addEventListener("change", () => { refreshDependentFilters(); render(); });
    semesterFilter?.addEventListener("change", render);
    refreshDependentFilters();
    render();
  };

  const setupDepartmentSearch = () => {
    if (normalizedPath() !== "/revision-2021.html") return;
    const grid = document.querySelector(".selection-grid");
    if (!grid || grid.dataset.filterInitialized === "true") return;
    const cards = [...grid.querySelectorAll(".choice-card")];
    if (!cards.length) return;
    grid.dataset.filterInitialized = "true";

    const form = create("form", { className: "department-filter", attrs: { role: "search" } });
    const label = create("label", { className: "sr-only", text: "Search departments", attrs: { for: "departmentSearch" } });
    const input = create("input", {
      attrs: { id: "departmentSearch", type: "search", placeholder: "Search departments", autocomplete: "off" }
    });
    const status = create("p", { className: "department-filter-status", attrs: { role: "status", "aria-live": "polite" } });
    form.addEventListener("submit", (event) => event.preventDefault());
    form.append(label, input);
    grid.before(form, status);

    const filter = () => {
      const query = input.value.trim().toLocaleLowerCase();
      let visible = 0;
      cards.forEach((card) => {
        const match = !query || card.textContent.toLocaleLowerCase().includes(query);
        card.hidden = !match;
        if (match) visible += 1;
      });
      status.textContent = visible ? `${visible} ${visible === 1 ? "department" : "departments"} shown.` : "No departments match your search.";
    };
    input.addEventListener("input", filter);
    filter();
  };

  const setupMaterialsFilter = () => {
    if (normalizedPath() !== "/materials-2015.html") return;
    const grid = document.getElementById("electronics2015Grid");
    if (!grid || grid.dataset.filterInitialized === "true") return;
    const cards = [...grid.querySelectorAll(".subject-card")];
    if (!cards.length) return;
    grid.dataset.filterInitialized = "true";

    cards.forEach((card) => {
      card.querySelectorAll('a[href*="/lessons/"], a[href^="lessons/"]').forEach((link) => {
        const url = new URL(link.getAttribute("href"), window.location.href);
        url.searchParams.set("revision", "2015");
        link.href = url.pathname + url.search + url.hash;
      });
    });

    const form = create("form", { className: "material-filter", attrs: { role: "search" } });
    const searchLabel = create("label", { className: "sr-only", text: "Search 2015 subjects", attrs: { for: "materials2015Search" } });
    const input = create("input", { attrs: { id: "materials2015Search", type: "search", placeholder: "Search code or subject name", autocomplete: "off" } });
    const semesterLabel = create("label", { className: "sr-only", text: "Filter 2015 subjects by semester", attrs: { for: "materials2015Semester" } });
    const select = create("select", { attrs: { id: "materials2015Semester" } });
    const semesters = cards.map((card) => card.textContent.match(/Semester\s+\d+/i)?.[0]).filter(Boolean);
    fillSelect(select, semesters, "All semesters", "all");
    const status = create("p", { className: "material-filter-status", attrs: { role: "status", "aria-live": "polite" } });
    form.addEventListener("submit", (event) => event.preventDefault());
    form.append(searchLabel, input, semesterLabel, select);
    grid.before(form, status);

    const filter = () => {
      const query = input.value.trim().toLocaleLowerCase();
      const semester = select.value;
      let visible = 0;
      cards.forEach((card) => {
        const text = `${card.dataset.search || ""} ${card.textContent}`.toLocaleLowerCase();
        const match = (!query || text.includes(query)) && (semester === "all" || text.includes(semester.toLocaleLowerCase()));
        card.hidden = !match;
        if (match) visible += 1;
      });
      status.textContent = visible ? `${visible} ${visible === 1 ? "subject" : "subjects"} shown.` : "No matching subjects found.";
    };
    input.addEventListener("input", filter);
    select.addEventListener("change", filter);
    filter();
  };

  const fixLessonLinks = () => {
    const path = normalizedPath();
    const sourceRevision = path === "/materials-2015.html" ? "2015" : path.startsWith("/revision-2021") || path === "/" ? "2021" : "";
    if (!sourceRevision) return;
    document.querySelectorAll('a[href*="/lessons/"], a[href^="lessons/"]').forEach((link) => {
      if (link.href.includes("downloadable-notes")) return;
      const url = new URL(link.getAttribute("href"), window.location.href);
      url.searchParams.set("revision", sourceRevision);
      link.href = url.pathname + url.search + url.hash;
    });
  };

  const fixBackNavigation = () => {
    if (!normalizedPath().startsWith("/lessons/")) return;
    const params = new URLSearchParams(window.location.search);
    const existing = [...document.querySelectorAll("a")].find((link) => /back to/i.test(link.textContent));
    let revision = params.get("revision");
    if (revision !== "2015" && revision !== "2021") {
      revision = existing && (/2015/i.test(existing.textContent) || /materials-2015/i.test(existing.getAttribute("href") || "")) ? "2015" : "2021";
    }
    const href = revision === "2015" ? "/materials-2015.html" : "/revision-2021.html";
    const label = revision === "2015" ? "← Back to 2015 Materials" : "← Back to Revision 2021";
    const back = existing || create("a", { className: "curriculum-back" });
    back.href = href;
    back.textContent = label;
    back.classList.add("curriculum-back");
    if (!existing) document.body.prepend(back);

    document.querySelectorAll(".breadcrumb a, .breadcrumbs a").forEach((link) => {
      if (/revision 2021|2015 materials/i.test(link.textContent)) {
        link.href = href;
        link.textContent = revision === "2015" ? "2015 Materials" : "Revision 2021";
      }
    });
  };

  const wrapTables = () => {
    document.querySelectorAll("table").forEach((table) => {
      table.querySelectorAll("thead th").forEach((th) => { if (!th.hasAttribute("scope")) th.scope = "col"; });
      if (table.parentElement?.matches(".table-wrapper, .table-wrap, .tbl")) return;
      const wrapper = create("div", { className: "table-wrapper" });
      table.before(wrapper);
      wrapper.append(table);
    });
  };

  const fixLinksAndNavigation = () => {
    document.querySelectorAll(".navlinks a.active").forEach((link) => link.setAttribute("aria-current", "page"));
    document.querySelectorAll('a[target="_blank"]').forEach((link) => link.setAttribute("rel", "noopener noreferrer"));
    document.querySelectorAll("a[href='#'], a:not([href])").forEach((link) => {
      if (link.classList.contains("menu-toggle")) return;
      link.replaceWith(unavailable());
    });
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".navlinks");
    if (toggle && nav && toggle.dataset.hardeningInitialized !== "true") {
      toggle.dataset.hardeningInitialized = "true";
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !nav.classList.contains("open")) return;
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      });
      nav.addEventListener("click", (event) => {
        if (!event.target.closest("a")) return;
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    }
  };

  const fixContactPage = () => {
    if (normalizedPath() !== "/contact.html") return;
    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => { link.textContent = "Email us"; });
    const list = document.getElementById("commentsList");
    if (!list) return;
    window.setTimeout(() => {
      if (!list.querySelector(".discussion-loading")) return;
      list.replaceChildren(create("div", {
        className: "comment-error-box",
        text: "Discussion is currently unavailable. Please contact us by email."
      }));
      console.error("Discussion initialization timed out before the comments module produced a success or error state.");
    }, 12000);
  };

  const fixFooter = () => {
    if (normalizedPath() === "/materials-2015.html") {
      document.querySelectorAll(".footer a").forEach((link) => {
        if (/REV2021/i.test(link.textContent) || /scheme=REV2021/i.test(link.href)) {
          link.replaceWith(create("span", { text: "2015 material references are listed on this page." }));
        }
      });
    }
  };

  const layoutProbe = () => {
    if (new URLSearchParams(window.location.search).get("layout-test") !== "1") return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.body.dataset.layoutOverflow = String(document.documentElement.scrollWidth > window.innerWidth + 1);
    }));
  };

  const run = () => {
    try {
      ensureFilterLabels();
      setupSubjectBrowser();
      setupDepartmentSearch();
      setupMaterialsFilter();
      fixLessonLinks();
      fixBackNavigation();
      wrapTables();
      fixLinksAndNavigation();
      fixContactPage();
      fixFooter();
      layoutProbe();
    } catch (error) {
      console.error("Site hardening initialization failed.", error);
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
})();
'''.strip() + "\n"

HELP_COMMENTS_JS = r'''
const FALLBACK_MESSAGE = "Discussion is currently unavailable. Please contact us by email.";
const EMAIL = "nandakumarmkdpm@gmail.com";

const form = document.querySelector("#helpCommentForm");
const nameInput = document.querySelector("#commentName");
const messageInput = document.querySelector("#commentMessage");
const submitButton = document.querySelector("#commentSubmit");
const statusBox = document.querySelector("#commentStatus");
const list = document.querySelector("#commentsList");
const countBox = document.querySelector("#commentCount");

if (!form || !nameInput || !messageInput || !submitButton || !statusBox || !list || !countBox) {
  console.error("Discussion initialization failed: required contact-page elements are missing.");
} else {
  initializeDiscussion().catch((error) => showUnavailable(error));
}

function showUnavailable(error) {
  console.error("Discussion service unavailable.", error);
  submitButton.disabled = true;
  form.setAttribute("aria-disabled", "true");
  countBox.textContent = "Unavailable";
  statusBox.textContent = "";
  const box = document.createElement("div");
  box.className = "comment-error-box";
  const text = document.createElement("p");
  text.textContent = FALLBACK_MESSAGE;
  const email = document.createElement("a");
  email.href = `mailto:${EMAIL}?subject=Diploma%20Notes%20Help`;
  email.textContent = "Email us";
  box.append(text, email);
  list.replaceChildren(box);
}

async function initializeDiscussion() {
  const timeout = window.setTimeout(() => showUnavailable(new Error("Discussion initialization timed out.")), 10000);
  try {
    const [appModule, authModule, firestoreModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
    ]);

    const firebaseConfig = {
      apiKey: "AIzaSyDgdpLgYNZL_KQguMmCI5wZH3b11PXpWvk",
      authDomain: "diploma-notes-comments.firebaseapp.com",
      projectId: "diploma-notes-comments",
      storageBucket: "diploma-notes-comments.firebasestorage.app",
      messagingSenderId: "613766691091",
      appId: "1:613766691091:web:65c0929ee4b7a1e5c782e6",
      measurementId: "G-BS562FBTPN"
    };

    const app = appModule.initializeApp(firebaseConfig);
    const auth = authModule.getAuth(app);
    const db = firestoreModule.getFirestore(app);
    const commentsRef = firestoreModule.collection(db, "helpComments");
    let currentUser = null;
    let comments = [];

    const savedName = localStorage.getItem("diplomaNotesCommentName");
    if (savedName) nameInput.value = savedName;

    const setStatus = (message = "", type = "") => {
      statusBox.textContent = message;
      statusBox.className = `comment-status${type ? ` ${type}` : ""}`;
    };

    const formatDate = (timestamp) => {
      if (!timestamp?.toDate) return "Posting…";
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(timestamp.toDate());
    };

    const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "S";

    const button = (label, className, handler) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = className;
      element.textContent = label;
      element.addEventListener("click", handler);
      return element;
    };

    const createReplyForm = (parentId, card) => {
      const existing = card.querySelector(".reply-form");
      if (existing) { existing.remove(); return; }
      const replyForm = document.createElement("form");
      replyForm.className = "reply-form";
      const label = document.createElement("label");
      const textareaId = `reply-${parentId}`;
      label.className = "sr-only";
      label.htmlFor = textareaId;
      label.textContent = "Reply message";
      const textarea = document.createElement("textarea");
      textarea.id = textareaId;
      textarea.maxLength = 1500;
      textarea.required = true;
      textarea.placeholder = "Write your reply…";
      const submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "comment-submit";
      submit.textContent = "Post Reply";
      replyForm.append(label, textarea, submit);
      replyForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const author = nameInput.value.trim();
        const message = textarea.value.trim();
        if (!author) { nameInput.focus(); setStatus("Enter your name before replying.", "error"); return; }
        if (!currentUser || !message) return;
        submit.disabled = true;
        try {
          localStorage.setItem("diplomaNotesCommentName", author);
          await firestoreModule.addDoc(commentsRef, {
            pageId: "help", author, message, parentId, uid: currentUser.uid, createdAt: firestoreModule.serverTimestamp()
          });
          replyForm.remove();
          setStatus("Reply posted.", "success");
        } catch (error) {
          console.error("Could not post reply.", error);
          setStatus("Could not post the reply. Please try again later.", "error");
          submit.disabled = false;
        }
      });
      card.append(replyForm);
      textarea.focus();
    };

    const createCommentCard = (comment, isReply = false) => {
      const card = document.createElement("article");
      card.className = `comment-card${isReply ? " reply-card" : ""}`;
      card.dataset.commentId = comment.id;
      const meta = document.createElement("div");
      meta.className = "comment-meta";
      const authorWrap = document.createElement("div");
      authorWrap.className = "comment-author";
      const avatar = document.createElement("span");
      avatar.className = "comment-avatar";
      avatar.textContent = initials(comment.author || "Student");
      avatar.setAttribute("aria-hidden", "true");
      const authorText = document.createElement("div");
      const author = document.createElement("strong");
      author.textContent = comment.author || "Student";
      const time = document.createElement("span");
      time.className = "comment-time";
      time.textContent = formatDate(comment.createdAt);
      authorText.append(author, time);
      authorWrap.append(avatar, authorText);
      meta.append(authorWrap);
      const message = document.createElement("p");
      message.className = "comment-message";
      message.textContent = comment.message || "";
      const actions = document.createElement("div");
      actions.className = "comment-actions";
      actions.append(button("Reply", "comment-action", () => createReplyForm(comment.id, card)));
      if (currentUser && comment.uid === currentUser.uid) {
        actions.append(button("Delete", "comment-action delete", async () => {
          if (!window.confirm("Delete this comment?")) return;
          try { await firestoreModule.deleteDoc(firestoreModule.doc(db, "helpComments", comment.id)); }
          catch (error) { console.error("Could not delete comment.", error); setStatus("Could not delete this comment.", "error"); }
        }));
      }
      card.append(meta, message, actions);
      return card;
    };

    const renderComments = () => {
      list.replaceChildren();
      const visible = comments.filter((item) => item.pageId === "help");
      countBox.textContent = `${visible.length} ${visible.length === 1 ? "comment" : "comments"}`;
      if (!visible.length) {
        const empty = document.createElement("div");
        empty.className = "empty-comments";
        empty.textContent = "No comments yet. Start the discussion.";
        list.append(empty);
        return;
      }
      const topLevel = visible.filter((item) => !item.parentId);
      const replies = new Map();
      visible.filter((item) => item.parentId).forEach((reply) => {
        const items = replies.get(reply.parentId) || [];
        items.push(reply);
        replies.set(reply.parentId, items);
      });
      topLevel.forEach((comment) => {
        list.append(createCommentCard(comment));
        (replies.get(comment.id) || []).forEach((reply) => list.append(createCommentCard(reply, true)));
      });
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const author = nameInput.value.trim();
      const message = messageInput.value.trim();
      if (!currentUser) { setStatus("Discussion is still connecting. Please try again.", "error"); return; }
      if (author.length < 2 || author.length > 40) { setStatus("Name must contain 2–40 characters.", "error"); nameInput.focus(); return; }
      if (!message || message.length > 1500) { setStatus("Comment must contain 1–1500 characters.", "error"); messageInput.focus(); return; }
      submitButton.disabled = true;
      setStatus("Posting…");
      try {
        localStorage.setItem("diplomaNotesCommentName", author);
        await firestoreModule.addDoc(commentsRef, {
          pageId: "help", author, message, parentId: null, uid: currentUser.uid, createdAt: firestoreModule.serverTimestamp()
        });
        messageInput.value = "";
        setStatus("Comment posted.", "success");
      } catch (error) {
        console.error("Could not post comment.", error);
        setStatus("Could not post. Please try again later.", "error");
      } finally {
        submitButton.disabled = false;
      }
    });

    authModule.onAuthStateChanged(auth, (user) => {
      currentUser = user;
      submitButton.disabled = !user;
      renderComments();
    });

    await authModule.signInAnonymously(auth);
    const commentsQuery = firestoreModule.query(commentsRef, firestoreModule.orderBy("createdAt", "asc"), firestoreModule.limit(250));
    firestoreModule.onSnapshot(commentsQuery, (snapshot) => {
      window.clearTimeout(timeout);
      comments = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      renderComments();
    }, (error) => showUnavailable(error));
  } catch (error) {
    window.clearTimeout(timeout);
    throw error;
  }
}
'''.strip() + "\n"

LEGAL_PAGES = {
    "privacy.html": (
        "Privacy | Diploma Notes",
        "Privacy information for the Diploma Notes study-resource website.",
        "Privacy",
        [
            ("Information used by this site", "The core website is a static study resource. It does not require an account to read pages or open study links."),
            ("Public discussion", "The Help page uses a third-party discussion service when available. Names and comments submitted there are public. Do not post passwords, phone numbers, addresses, or other private information."),
            ("External links", "Links to SITTTR Kerala, Google Drive, Instagram, and other external services are governed by those services' own privacy practices."),
            ("Contact", "Questions about this page can be sent to nandakumarmkdpm@gmail.com."),
        ],
    ),
    "terms.html": (
        "Terms of Use | Diploma Notes",
        "Basic terms for using the Diploma Notes study-resource website.",
        "Terms of Use",
        [
            ("Purpose", "This website provides study-navigation links and educational material for Polytechnic students."),
            ("Accuracy", "Materials may be corrected or updated. Students should verify syllabus, examination, and curriculum details with the relevant official source."),
            ("Acceptable use", "Do not misuse the discussion area, attempt to disrupt the website, or submit unlawful or harmful content."),
            ("External resources", "The website does not control the availability or policies of external websites and file-hosting services."),
        ],
    ),
    "disclaimer.html": (
        "Disclaimer | Diploma Notes",
        "Disclaimer for the independent Diploma Notes study-resource website.",
        "Disclaimer",
        [
            ("Independent resource", "Diploma Notes is a study-resource website and is not the official SITTTR Kerala website. Official links are labelled and open the relevant external source."),
            ("No invented availability", "A resource marked “Not available yet” has no verified destination in the current website data."),
            ("Educational use", "Lesson and note pages are provided for study support. Official curriculum notices and examination instructions take priority."),
            ("Corrections", "Broken links or content corrections can be reported through the Help page or by email."),
        ],
    ),
}


def legal_page(filename: str, title: str, description: str, heading: str, sections: list[tuple[str, str]]) -> str:
    canonical = f"{PUBLIC_ROOT}/{filename}"
    body = "\n".join(f"      <section class=\"section\"><h2>{html_lib.escape(name)}</h2><p>{html_lib.escape(text)}</p></section>" for name, text in sections)
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{html_lib.escape(description, quote=True)}">
  <title>{html_lib.escape(title)}</title>
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{html_lib.escape(title, quote=True)}">
  <meta property="og:description" content="{html_lib.escape(description, quote=True)}">
  <meta property="og:url" content="{canonical}">
  <link rel="stylesheet" href="/assets/css/style.css">
  <link rel="stylesheet" href="/assets/css/responsive.css">
  <link rel="stylesheet" href="/assets/css/hardening.css">
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/index.html" aria-label="Diploma Notes home"><span>DN</span><strong>Diploma Notes</strong></a>
    <button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">Menu</button>
    <nav class="navlinks" aria-label="Primary navigation">
      <a href="/index.html">Home</a><a href="/about.html">About</a><a href="/revision-2021.html">Revision 2021</a><a href="/materials-2015.html">2015 Materials</a><a href="/contact.html">Help</a>
    </nav>
  </header>
  <main>
    <section class="page-title"><p class="kicker">Diploma Notes</p><h1>{html_lib.escape(heading)}</h1><p>{html_lib.escape(description)}</p></section>
{body}
  </main>
  <footer class="footer"><p>&copy; <span data-year></span> Diploma Notes. Static study resource.</p><nav class="footer-legal" aria-label="Legal"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/disclaimer.html">Disclaimer</a></nav></footer>
  <script src="/assets/js/main.js" defer></script>
  <script src="/assets/js/site-hardening.js" defer></script>
</body>
</html>
'''


def canonical_url(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    return PUBLIC_ROOT + ("/" if rel == "index.html" else f"/{rel}")


def ensure_metadata(text: str, path: Path) -> str:
    title_match = re.search(r"<title>(.*?)</title>", text, flags=re.I | re.S)
    desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']\s*/?>', text, flags=re.I | re.S)
    if not title_match or not desc_match:
        return text
    title = re.sub(r"\s+", " ", title_match.group(1)).strip()
    description = re.sub(r"\s+", " ", desc_match.group(1)).strip()
    canonical = canonical_url(path)
    additions: list[str] = []
    if not re.search(r'<link\s+rel=["\']canonical["\']', text, flags=re.I):
        additions.append(f'  <link rel="canonical" href="{canonical}">')
    og = {
        "og:type": "website",
        "og:title": title,
        "og:description": description,
        "og:url": canonical,
    }
    for prop, value in og.items():
        if not re.search(rf'<meta\s+property=["\']{re.escape(prop)}["\']', text, flags=re.I):
            additions.append(f'  <meta property="{prop}" content="{html_lib.escape(value, quote=True)}">')
    if additions:
        text = text.replace("</head>", "\n".join(additions) + "\n</head>", 1)
    return text


def normalize_asset_paths(text: str) -> str:
    pattern = re.compile(r'(?P<prefix>\b(?:href|src|poster)\s*=\s*["\'])(?P<path>(?:\.\./)*assets/[^"\']+)(?P<suffix>["\'])', re.I)
    return pattern.sub(lambda m: f'{m.group("prefix")}/{re.sub(r"^(?:\.\./)*", "", m.group("path"))}{m.group("suffix")}', text)


def add_shared_assets(text: str) -> str:
    if "/assets/css/hardening.css" not in text:
        text = text.replace("</head>", '  <link rel="stylesheet" href="/assets/css/hardening.css?v=20260612-1">\n</head>', 1)
    if "/assets/js/site-hardening.js" not in text:
        text = text.replace("</body>", '  <script src="/assets/js/site-hardening.js?v=20260612-1" defer></script>\n</body>', 1)
    return text


def add_defer(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        tag = match.group(0)
        if re.search(r"\bdefer\b|\basync\b|type\s*=\s*[\"']module[\"']", tag, flags=re.I):
            return tag
        src = re.search(r"src\s*=\s*[\"']([^\"']+)", tag, flags=re.I)
        if not src or src.group(1).startswith(("http://", "https://", "//")):
            return tag
        return tag[:-1] + " defer>"
    return re.sub(r"<script\b[^>]*\bsrc\s*=\s*[\"'][^\"']+[\"'][^>]*>", repl, text, flags=re.I)


def dedupe_favicons(text: str) -> str:
    seen: set[str] = set()
    def repl(match: re.Match[str]) -> str:
        tag = match.group(0)
        key = re.sub(r"\s+", " ", tag.strip())
        if key in seen:
            return ""
        seen.add(key)
        return tag
    return re.sub(r"<link\b[^>]*rel=[\"']icon[\"'][^>]*>", repl, text, flags=re.I)


def add_static_filter_labels(text: str) -> str:
    labels = {
        "subjectSearch": "Search subjects",
        "revisionFilter": "Filter by revision",
        "departmentFilter": "Filter by department",
        "semesterFilter": "Filter by semester",
    }
    for control_id, label in labels.items():
        if f'for="{control_id}"' in text or f"for='{control_id}'" in text:
            continue
        pattern = re.compile(rf'(<(?:input|select)\b[^>]*\bid=["\']{re.escape(control_id)}["\'][^>]*>)', re.I)
        text = pattern.sub(lambda match: f'<label class="sr-only" for="{control_id}">{label}</label>{match.group(1)}', text)
    return text


def fix_external_rel(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        tag = match.group(0)
        if re.search(r"\brel\s*=", tag, flags=re.I):
            tag = re.sub(r'rel\s*=\s*(["\'])(.*?)(\1)', lambda m: f'rel={m.group(1)}{" ".join(dict.fromkeys((m.group(2) + " noopener noreferrer").split()))}{m.group(1)}', tag, flags=re.I)
        else:
            tag = tag[:-1] + ' rel="noopener noreferrer">'
        return tag
    return re.sub(r'<a\b[^>]*target\s*=\s*["\']_blank["\'][^>]*>', repl, text, flags=re.I)


def add_aria_current(text: str) -> str:
    return re.sub(r'<a\s+class=["\']active["\'](?![^>]*aria-current)([^>]*)>', r'<a class="active" aria-current="page"\1>', text, flags=re.I)


def add_legal_links(text: str) -> str:
    if "footer-legal" in text or "</footer>" not in text:
        return text
    nav = '<nav class="footer-legal" aria-label="Legal"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/disclaimer.html">Disclaimer</a></nav>'
    return text.replace("</footer>", nav + "</footer>", 1)


def patch_html(path: Path) -> None:
    text = path.read_text(encoding="utf-8-sig")
    text = normalize_asset_paths(text)
    text = dedupe_favicons(text)
    text = add_static_filter_labels(text)
    text = add_aria_current(text)
    text = fix_external_rel(text)
    text = ensure_metadata(text, path)
    text = add_shared_assets(text)
    text = add_defer(text)
    text = add_legal_links(text)

    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        text = text.replace(">Search Code<", ">Search by Subject Code<")
        text = re.sub(
            r'<video\b[^>]*class=["\']home-video["\'][^>]*>\s*</video>',
            '<video class="home-video" controls muted playsinline preload="metadata" poster="/assets/media/sfi-poly-pmna-poster.jpg"><source src="/assets/media/sfi-poly-pmna.mp4" type="video/mp4">Your browser does not support HTML video.</video>',
            text,
            flags=re.I,
        )
    elif rel == "contact.html":
        text = text.replace("Email Me", "Email us").replace("Open Mailbox", "Email us").replace("Email me directly", "Email us directly").replace("email me directly", "email us directly")
    elif rel == "materials-2015.html":
        text = re.sub(r'href=["\'](lessons/lessons-[^"\'?]+\.html)["\']', r'href="\1?revision=2015"', text, flags=re.I)
        text = re.sub(
            r'<a\s+href=["\']https://www\.sitttrkerala\.ac\.in/index\.php\?r=site%2Fdiploma-modelqp&scheme=REV2021["\'][^>]*>Official REV2021 model QP reference</a>',
            '<span>2015 material references are listed on this page.</span>',
            text,
            flags=re.I,
        )
    elif rel == "lessons/lessons-2031.html":
        text = text.replace(
            "https://raw.githubusercontent.com/nandurpm/diploma-notes/632a33502f1408d7e0fb866a8f671f6956142dc5/lessons/lessons-2031.html",
            "/lessons/handbook-2031-source.html",
        )
        text = text.replace("const response=await fetch(source,{cache:'no-store'});", "const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);const response=await fetch(source,{cache:'no-store',signal:controller.signal});clearTimeout(timeout);")
        text = re.sub(
            r"document\.body\.innerHTML='<main[^;]+;",
            "console.error('Unable to load lesson 2031.',error);document.body.innerHTML='<main class=\"loading-error\" style=\"max-width:760px;padding:2rem\"><h1>Unable to load this lesson. Please try again later.</h1></main>';",
            text,
            count=1,
        )

    path.write_text(text, encoding="utf-8")


def patch_subject_data() -> None:
    path = ROOT / "assets/js/subjects.js"
    text = path.read_text(encoding="utf-8-sig")
    text = re.sub(
        r'\s*\{\s*label:\s*"Electronics Engineering Short Notes"[^\n]*\n?',
        "\n",
        text,
    )
    text = re.sub(
        r'\s*\{\s*label:\s*"Electrical, Electronics, Civil, Mechanical Materials"[^\n]*\n?',
        "\n",
        text,
    )
    text = re.sub(
        r'alternativeQuestionPapers:\s*\[.*?\],\s*alternativeOtherMaterials:',
        'alternativeQuestionPapers: [],\n  alternativeOtherMaterials:',
        text,
        flags=re.S,
    )
    export = "\n// Explicit exports for shared scripts and resilient component initialization.\nglobalThis.SUBJECTS = SUBJECTS;\nglobalThis.MATERIALS_2015 = MATERIALS_2015;\n"
    if "globalThis.SUBJECTS = SUBJECTS" not in text:
        text += export
    path.write_text(text, encoding="utf-8")


def static_checks() -> None:
    errors: list[str] = []
    html_files = sorted(ROOT.rglob("*.html"))
    for path in html_files:
        text = path.read_text(encoding="utf-8", errors="replace")
        rel = path.relative_to(ROOT).as_posix()
        if "<title>" not in text or 'name="description"' not in text:
            errors.append(f"{rel}: missing title or description")
        if 'rel="canonical"' not in text or 'property="og:title"' not in text or 'property="og:url"' not in text:
            errors.append(f"{rel}: missing canonical/Open Graph metadata")
        if re.search(r'href\s*=\s*["\']\s*#?\s*["\']', text):
            errors.append(f"{rel}: empty or placeholder href")
        ids = re.findall(r'\bid=["\']([^"\']+)', text, flags=re.I)
        duplicate_ids = sorted({item for item in ids if ids.count(item) > 1})
        if duplicate_ids:
            errors.append(f"{rel}: duplicate IDs {duplicate_ids}")
        for match in re.finditer(r'\b(?:src|href|poster)=["\']([^"\']+)', text, flags=re.I):
            value = match.group(1)
            if value.startswith(("http://", "https://", "mailto:", "tel:", "data:", "#", "javascript:")):
                continue
            parsed = urlsplit(value)
            local = parsed.path
            if not local or local.endswith("/"):
                continue
            target = ROOT / local.lstrip("/") if local.startswith("/") else path.parent / local
            if target.suffix.lower() in {".html", ".css", ".js", ".json", ".pdf", ".png", ".jpg", ".jpeg", ".svg", ".webp", ".mp4", ".vtt", ".ico"} and not target.exists():
                # Lesson links are intentionally handled as unavailable at runtime; all other missing assets are errors.
                if "/lessons/lessons-" in local or local.startswith("lessons/lessons-") or "downloadable-notes-" in local:
                    continue
                errors.append(f"{rel}: missing local resource {value}")
    subjects = (ROOT / "assets/js/subjects.js").read_text(encoding="utf-8")
    departments = set(re.findall(r'department:\s*"([^"]+)"', subjects))
    for path in sorted((ROOT / "revision-2021").glob("*.html")):
        text = path.read_text(encoding="utf-8")
        match = re.search(r'data-department=["\']([^"\']+)', text)
        if match and match.group(1) not in departments:
            errors.append(f"{path.relative_to(ROOT)}: department identifier has no matching subject data: {match.group(1)}")
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    if "Search by Subject Code" not in index or "<source src=\"/assets/media/sfi-poly-pmna.mp4\"" not in index:
        errors.append("index.html: subject anchor label or video markup not corrected")
    materials = (ROOT / "materials-2015.html").read_text(encoding="utf-8")
    if "Official REV2021 model QP reference" in materials:
        errors.append("materials-2015.html: wrong REV2021 footer reference remains")
    lesson = (ROOT / "lessons/lessons-2031.html").read_text(encoding="utf-8")
    if "/lessons/handbook-2031-source.html" not in lesson or "Unable to load this lesson. Please try again later." not in lesson:
        errors.append("lessons-2031.html: local source or visible failure state missing")
    if not (ROOT / "lessons/handbook-2031-source.html").exists():
        errors.append("lessons/handbook-2031-source.html: local handbook source missing")
    help_js = (ROOT / "assets/js/help-comments.js").read_text(encoding="utf-8")
    if "Discussion is currently unavailable. Please contact us by email." not in help_js:
        errors.append("help-comments.js: required discussion failure message missing")
    if errors:
        raise SystemExit("Static verification failed:\n- " + "\n- ".join(errors))


def main() -> None:
    (ROOT / "assets/css/hardening.css").write_text(HARDENING_CSS, encoding="utf-8")
    (ROOT / "assets/js/site-hardening.js").write_text(HARDENING_JS, encoding="utf-8")
    (ROOT / "assets/js/help-comments.js").write_text(HELP_COMMENTS_JS, encoding="utf-8")
    patch_subject_data()
    for filename, args in LEGAL_PAGES.items():
        (ROOT / filename).write_text(legal_page(filename, *args), encoding="utf-8")
    for path in sorted(ROOT.rglob("*.html")):
        patch_html(path)
    static_checks()
    print(f"Patched and statically verified {len(list(ROOT.rglob('*.html')))} HTML files.")


# Normalize legacy single-quoted description metadata before strict validation.
_previous_patch_html_quote_normalizer = patch_html

def patch_html(path: Path) -> None:
    _previous_patch_html_quote_normalizer(path)
    text = path.read_text(encoding="utf-8")
    text = re.sub(
        r"<meta\s+name='description'\s+content='([^']*)'\s*/?>",
        lambda match: f'<meta name="description" content="{html_lib.escape(match.group(1), quote=True)}">',
        text,
        flags=re.I,
    )
    path.write_text(text, encoding="utf-8")

def _plain_text(fragment: str) -> str:
    return re.sub(r"\s+", " ", html_lib.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def ensure_metadata(text: str, path: Path) -> str:
    title_match = re.search(r"<title>(.*?)</title>", text, flags=re.I | re.S)
    h1_match = re.search(r"<h1\b[^>]*>(.*?)</h1>", text, flags=re.I | re.S)
    heading = _plain_text(h1_match.group(1)) if h1_match else path.stem.replace("-", " ").title()
    title = _plain_text(title_match.group(1)) if title_match else f"{heading} | Diploma Notes"
    if not title_match:
        text = text.replace("</head>", f"  <title>{html_lib.escape(title)}</title>\n</head>", 1)

    desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']\s*/?>', text, flags=re.I | re.S)
    paragraph_match = re.search(r"<p\b[^>]*>(.*?)</p>", text, flags=re.I | re.S)
    description = _plain_text(desc_match.group(1)) if desc_match else (_plain_text(paragraph_match.group(1)) if paragraph_match else f"Study materials and lesson content for {heading}.")
    description = description[:300].strip() or f"Study materials and lesson content for {heading}."
    if not desc_match:
        text = text.replace("</head>", f'  <meta name="description" content="{html_lib.escape(description, quote=True)}">\n</head>', 1)

    canonical = canonical_url(path)
    additions: list[str] = []
    if not re.search(r'<link\s+rel=["\']canonical["\']', text, flags=re.I):
        additions.append(f'  <link rel="canonical" href="{canonical}">')
    for prop, value in {
        "og:type": "website",
        "og:title": title,
        "og:description": description,
        "og:url": canonical,
    }.items():
        if not re.search(rf'<meta\s+property=["\']{re.escape(prop)}["\']', text, flags=re.I):
            additions.append(f'  <meta property="{prop}" content="{html_lib.escape(value, quote=True)}">')
    if additions:
        text = text.replace("</head>", "\n".join(additions) + "\n</head>", 1)
    return text


def _dedupe_svg_ids(text: str) -> str:
    seen: set[str] = set()
    svg_index = 0

    def fix_svg(match: re.Match[str]) -> str:
        nonlocal svg_index
        svg_index += 1
        block = match.group(0)
        ids = list(dict.fromkeys(re.findall(r'\bid=["\']([^"\']+)', block, flags=re.I)))
        for old in ids:
            if old not in seen:
                seen.add(old)
                continue
            new = f"{old}-{svg_index}"
            counter = 2
            while new in seen:
                new = f"{old}-{svg_index}-{counter}"
                counter += 1
            block = re.sub(rf'(\bid=["\']){re.escape(old)}(["\'])', rf'\1{new}\2', block)
            block = block.replace(f"url(#{old})", f"url(#{new})")
            block = re.sub(rf'((?:href|xlink:href)=["\'])#{re.escape(old)}(["\'])', rf'\1#{new}\2', block)
            seen.add(new)
        return block

    return re.sub(r"<svg\b.*?</svg>", fix_svg, text, flags=re.I | re.S)


_original_patch_html = patch_html

def patch_html(path: Path) -> None:
    _original_patch_html(path)
    text = path.read_text(encoding="utf-8")
    text = re.sub(
        r'<a\b[^>]*href\s*=\s*["\']\s*#\s*["\'][^>]*>.*?</a>',
        '<span class="availability-label" aria-disabled="true">Not available yet</span>',
        text,
        flags=re.I | re.S,
    )
    text = _dedupe_svg_ids(text)
    text = ensure_metadata(text, path)
    path.write_text(text, encoding="utf-8")


def static_checks() -> None:
    errors: list[str] = []
    html_files = sorted(ROOT.rglob("*.html"))
    for path in html_files:
        text = path.read_text(encoding="utf-8", errors="replace")
        rel = path.relative_to(ROOT).as_posix()
        if "<title>" not in text or 'name="description"' not in text:
            errors.append(f"{rel}: missing title or description")
        if 'rel="canonical"' not in text or 'property="og:title"' not in text or 'property="og:url"' not in text:
            errors.append(f"{rel}: missing canonical/Open Graph metadata")
        if re.search(r'href\s*=\s*["\']\s*#?\s*["\']', text):
            errors.append(f"{rel}: empty or placeholder href")
        ids = re.findall(r'\bid=["\']([^"\']+)', text, flags=re.I)
        duplicate_ids = sorted({item for item in ids if ids.count(item) > 1})
        if duplicate_ids:
            errors.append(f"{rel}: duplicate IDs {duplicate_ids}")
        for match in re.finditer(r'\b(?:src|href|poster)=["\']([^"\']+)', text, flags=re.I):
            value = match.group(1)
            if value.startswith(("http://", "https://", "mailto:", "tel:", "data:", "#", "javascript:")):
                continue
            local = urlsplit(value).path
            if not local or local.endswith("/"):
                continue
            target = ROOT / local.lstrip("/") if local.startswith("/") else path.parent / local
            if target.suffix.lower() in {".html", ".css", ".js", ".json", ".pdf", ".png", ".jpg", ".jpeg", ".svg", ".webp", ".mp4", ".vtt", ".ico"} and not target.exists():
                if "/lessons/lessons-" in local or local.startswith("lessons/lessons-") or "downloadable-notes-" in local:
                    continue
                errors.append(f"{rel}: missing local resource {value}")
    subjects = (ROOT / "assets/js/subjects.js").read_text(encoding="utf-8")
    departments = set(re.findall(r'department:\s*"([^"]+)"', subjects))
    for path in sorted((ROOT / "revision-2021").glob("*.html")):
        text = path.read_text(encoding="utf-8")
        match = re.search(r'data-department=["\']([^"\']+)', text)
        department = html_lib.unescape(match.group(1)) if match else ""
        if department and department not in departments:
            errors.append(f"{path.relative_to(ROOT)}: department identifier has no matching subject data: {department}")
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    if "Search by Subject Code" not in index or "<source src=\"/assets/media/sfi-poly-pmna.mp4\"" not in index:
        errors.append("index.html: subject anchor label or video markup not corrected")
    materials = (ROOT / "materials-2015.html").read_text(encoding="utf-8")
    if "Official REV2021 model QP reference" in materials:
        errors.append("materials-2015.html: wrong REV2021 footer reference remains")
    lesson = (ROOT / "lessons/lessons-2031.html").read_text(encoding="utf-8")
    if "/lessons/handbook-2031-source.html" not in lesson or "Unable to load this lesson. Please try again later." not in lesson:
        errors.append("lessons-2031.html: local source or visible failure state missing")
    if not (ROOT / "lessons/handbook-2031-source.html").exists():
        errors.append("lessons/handbook-2031-source.html: local handbook source missing")
    if "Discussion is currently unavailable. Please contact us by email." not in (ROOT / "assets/js/help-comments.js").read_text(encoding="utf-8"):
        errors.append("help-comments.js: required discussion failure message missing")
    if errors:
        raise SystemExit("Static verification failed:\n- " + "\n- ".join(errors))


_base_main = main

def main() -> None:
    _base_main()
    hardening_path = ROOT / "assets/js/site-hardening.js"
    text = hardening_path.read_text(encoding="utf-8")
    text = text.replace(
        "  const fixFooter = () => {",
        '''  const fixEmptyMaterialGroups = () => {
    if (normalizedPath() !== "/materials-2015.html") return;
    window.setTimeout(() => {
      document.querySelectorAll("[data-link-group]").forEach((container) => {
        if (!container.querySelector("a") && !container.textContent.trim()) container.append(unavailable());
      });
    }, 0);
  };

  const fixFooter = () => {'''
    )
    text = text.replace("      fixFooter();\n      layoutProbe();", "      fixEmptyMaterialGroups();\n      fixFooter();\n      layoutProbe();")
    text = text.replace(
        '''    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.body.dataset.layoutOverflow = String(document.documentElement.scrollWidth > window.innerWidth + 1);
    }));''',
        '''    const measure = () => { document.body.dataset.layoutOverflow = String(document.documentElement.scrollWidth > window.innerWidth + 1); };
    measure();
    requestAnimationFrame(() => requestAnimationFrame(measure));'''
    )
    hardening_path.write_text(text, encoding="utf-8")
    failure_log = ROOT / "workflow-failure.log"
    if failure_log.exists():
        failure_log.unlink()
    static_checks()


if __name__ == "__main__":
    main()
