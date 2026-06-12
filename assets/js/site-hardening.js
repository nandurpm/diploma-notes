(() => {
  "use strict";

  const PUBLIC_ROOT = "https://polypmna.dpdns.org";
  const assetChecks = new Map();
  const knownLocalAssets = new Set(["/lessons/handbook-2031-source.html","/lessons/lessons-1001.html","/lessons/lessons-1002.html","/lessons/lessons-1003.html","/lessons/lessons-1004.html","/lessons/lessons-1005.html","/lessons/lessons-1006.html","/lessons/lessons-2003.html","/lessons/lessons-2031.html","/lessons/lessons-2041.html","/lessons/lessons-3031.html","/lessons/lessons-3041.html","/lessons/lessons-3044.html","/lessons/lessons-3045.html","/lessons/lessons-3046.html","/lessons/lessons-3047.html","/notes/downloadable-notes-1003.pdf","/notes/downloadable-notes-1004.pdf"]);

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
    const path = new URL(url, window.location.href).pathname;
    return knownLocalAssets.has(path);
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

  const fixEmptyMaterialGroups = () => {
    if (normalizedPath() !== "/materials-2015.html") return;
    window.setTimeout(() => {
      document.querySelectorAll("[data-link-group]").forEach((container) => {
        if (!container.querySelector("a") && !container.textContent.trim()) container.append(unavailable());
      });
    }, 0);
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
    const measure = () => { document.body.dataset.layoutOverflow = String(document.documentElement.scrollWidth > window.innerWidth + 1); };
    measure();
    requestAnimationFrame(() => requestAnimationFrame(measure));
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
      fixEmptyMaterialGroups();
      fixFooter();
      layoutProbe();
    } catch (error) {
      console.error("Site hardening initialization failed.", error);
    }
  };

  if (document.readyState === "complete") run();
  else document.addEventListener("DOMContentLoaded", run, { once: true });
})();
