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
  const code = String(subject.code || "");
  return Boolean(subject.notesFile) || code === "1003" || code === "1004";
}

const knownLocalAssets = new Set([
  "/lessons/lessons-1001.html", "/lessons/lessons-1002.html", "/lessons/lessons-1003.html",
  "/lessons/lessons-1004.html", "/lessons/lessons-1005.html", "/lessons/lessons-1006.html",
  "/lessons/lessons-2003.html", "/lessons/lessons-2031.html", "/lessons/lessons-2041.html",
  "/lessons/lessons-3023.html", "/lessons/lessons-3031.html", "/lessons/lessons-3032.html",
  "/lessons/lessons-3041.html", "/lessons/lessons-3044.html", "/lessons/lessons-3045.html",
  "/lessons/lessons-3046.html", "/lessons/lessons-3047.html",
  "/notes/downloadable-notes-1003.pdf", "/notes/downloadable-notes-1004.pdf"
]);

let activePrintFrame = null;

function assetExists(url) {
  return knownLocalAssets.has(new URL(url, window.location.href).pathname);
}

function printLessonFromButton(button) {
  const printUrl = button.dataset.printUrl;
  if (!printUrl || button.classList.contains("unavailable")) return;
  activePrintFrame?.remove();
  const frame = document.createElement("iframe");
  activePrintFrame = frame;
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, { position: "fixed", width: "0", height: "0", border: "0", opacity: "0" });
  frame.addEventListener("load", () => {
    window.setTimeout(() => {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch (_) {
        window.open(new URL(printUrl, window.location.href).href, "_blank", "noopener");
      }
    }, 350);
  }, { once: true });
  frame.src = new URL(printUrl, window.location.href).href;
  document.body.append(frame);
}

function setupAssetButtons(root) {
  root.querySelectorAll(".asset-check").forEach((button) => {
    if (button.dataset.assetInitialized === "true") return;
    button.dataset.assetInitialized = "true";
    const exists = assetExists(button.dataset.assetUrl || "");
    if (exists) {
      button.classList.remove("unavailable");
      button.removeAttribute("aria-disabled");
      if (!button.dataset.printUrl) button.removeAttribute("title");
    }
    button.addEventListener("click", (event) => {
      if (!exists) {
        event.preventDefault();
        return;
      }
      if (button.dataset.printUrl) {
        event.preventDefault();
        printLessonFromButton(button);
      }
    });
  });
}

function subjectCard(subject) {
  const lessonHref = typeof lessonLink === "function"
    ? lessonLink(subject)
    : `${rootPrefix()}lessons/lessons-${encodeURIComponent(subject.code)}.html`;
  const separatePdf = hasSeparateNotesPdf(subject);
  const notesHref = separatePdf
    ? (typeof notesLink === "function" ? notesLink(subject) : `${rootPrefix()}notes/downloadable-notes-${encodeURIComponent(subject.code)}.pdf`)
    : lessonHref;
  const lessonAvailable = assetExists(lessonHref);
  const notesAvailable = assetExists(notesHref);
  const lessonAttrs = lessonAvailable ? "" : ' aria-disabled="true" title="Lesson not available yet"';
  const notesAttrs = notesAvailable ? "" : ' aria-disabled="true" title="Notes not available yet"';
  const printAttrs = !separatePdf && notesAvailable ? ` data-print-url="${escapeHtml(lessonHref)}"` : "";
  const pdfAttrs = separatePdf && notesAvailable ? ' target="_blank" rel="noopener" download' : "";
  const searchText = [subject.revision, subject.code, subject.name, subject.department, subject.semester, subject.type].join(" ").toLowerCase();

  return `
    <article class="subject-card reveal" data-search="${escapeHtml(searchText)}">
      <div class="subject-top"><span>${escapeHtml(subject.revision)}</span><strong>${escapeHtml(subject.code)}</strong></div>
      <h3>${escapeHtml(subject.name)}</h3>
      <p>${escapeHtml(subject.department)} / ${escapeHtml(subject.semester)} / ${escapeHtml(subject.type)}</p>
      <div class="action-row">
        <a class="action syllabus" href="${syllabusLink(subject.code)}" target="_blank" rel="noopener">Open Syllabus</a>
        <a class="action lessons asset-check${lessonAvailable ? "" : " unavailable"}" href="${escapeHtml(lessonHref)}" data-asset-url="${escapeHtml(lessonHref)}"${lessonAttrs}>View Lessons</a>
        <a class="action download asset-check${notesAvailable ? "" : " unavailable"}" href="${escapeHtml(notesHref)}" data-asset-url="${escapeHtml(notesHref)}"${printAttrs}${pdfAttrs}${notesAttrs}>Download Notes</a>
        <a class="action qp" href="${modelQuestionPaperLink(subject.code)}" target="_blank" rel="noopener">Sample QP</a>
      </div>
    </article>`;
}

function fillSelect(select, values, selected, allLabel) {
  if (!select) return;
  const wanted = selected || select.value || "all";
  const sorted = [...new Set(values.filter(Boolean))].sort((a, b) => {
    const an = Number(String(a).match(/\d+/)?.[0] || 999);
    const bn = Number(String(b).match(/\d+/)?.[0] || 999);
    return an - bn || String(a).localeCompare(String(b));
  });
  select.innerHTML = `<option value="all">${escapeHtml(allLabel || "All")}</option>` +
    sorted.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  select.value = sorted.includes(wanted) ? wanted : "all";
}

function dedupeSubjects(subjects) {
  const seen = new Set();
  return subjects.filter((subject) => {
    const key = [subject.revision, subject.department, subject.semester, subject.code].join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function semesterRank(value) {
  return Number(String(value || "").match(/\d+/)?.[0] || 999);
}

function sortSubjects(subjects, fixedDepartment) {
  return [...subjects].sort((a, b) => {
    const semester = semesterRank(a.semester) - semesterRank(b.semester);
    if (semester) return semester;
    if (!fixedDepartment) {
      const department = String(a.department || "").localeCompare(String(b.department || ""));
      if (department) return department;
    }
    return String(a.code).localeCompare(String(b.code), undefined, { numeric: true });
  });
}

function renderSemesterGroups(subjects) {
  const totals = subjects.reduce((map, subject) => {
    const semester = subject.semester || "Other subjects";
    map.set(semester, (map.get(semester) || 0) + 1);
    return map;
  }, new Map());
  let previous = "";
  return subjects.map((subject) => {
    const semester = subject.semester || "Other subjects";
    const heading = semester !== previous
      ? `<div class="semester-group-heading"><span>${escapeHtml(semester)}</span><small>${totals.get(semester)} subjects</small></div>`
      : "";
    previous = semester;
    return heading + subjectCard(subject);
  }).join("");
}

function setupSubjectBrowser() {
  const grid = document.getElementById("subjectGrid");
  if (!grid || !Array.isArray(SUBJECTS)) return;

  grid.dataset.hardeningInitialized = "true";
  grid.dataset.subjectBrowserOwner = "main";

  const subjects = dedupeSubjects(SUBJECTS).filter((subject) => subject.revision !== "2015");
  const params = new URLSearchParams(window.location.search);
  const search = document.getElementById("subjectSearch");
  const revisionFilter = document.getElementById("revisionFilter");
  const departmentFilter = document.getElementById("departmentFilter");
  const semesterFilter = document.getElementById("semesterFilter");
  const fixedRevision = grid.dataset.revision || "";
  const fixedDepartment = grid.dataset.department || "";
  const homepage = grid.dataset.mode === "homepage-search";

  fillSelect(revisionFilter, subjects.map((item) => item.revision), fixedRevision || params.get("revision"), "All revisions");
  fillSelect(departmentFilter, subjects.map((item) => item.department), fixedDepartment || params.get("department"), "All departments");
  fillSelect(semesterFilter, subjects.map((item) => item.semester), params.get("semester"), "All semesters");
  if (fixedRevision && revisionFilter) revisionFilter.disabled = true;
  if (fixedDepartment && departmentFilter) departmentFilter.disabled = true;
  if (params.get("subject") && search) search.value = params.get("subject");

  const render = () => {
    const query = String(search?.value || "").trim().toLowerCase();
    const revision = fixedRevision || revisionFilter?.value || "all";
    const department = fixedDepartment || departmentFilter?.value || "all";
    const semester = semesterFilter?.value || "all";

    if (homepage && !query) {
      grid.innerHTML = '<p class="empty">Search a subject code, title, department, or semester to show matching subjects.</p>';
      return;
    }

    const visible = sortSubjects(subjects.filter((subject) => {
      const text = [subject.revision, subject.code, subject.name, subject.department, subject.semester, subject.type].join(" ").toLowerCase();
      if (revision !== "all" && subject.revision !== revision) return false;
      if (semester !== "all" && subject.semester !== semester) return false;
      if (query && !text.includes(query)) return false;
      if (department !== "all" && subject.department !== department) {
        return Boolean(fixedDepartment && revision === "2021" && subject.department === "First Year / Common");
      }
      return true;
    }), fixedDepartment);

    grid.innerHTML = visible.length ? renderSemesterGroups(visible) : '<p class="empty">No subjects match this filter.</p>';
    setupAssetButtons(grid);
  };

  [search, revisionFilter, departmentFilter, semesterFilter].forEach((control) => {
    control?.addEventListener("input", render);
    control?.addEventListener("change", render);
  });
  render();
}

function renderMaterialLinks() {
  document.querySelectorAll("[data-link-group]").forEach((container) => {
    const group = typeof MATERIALS_2015 !== "undefined" ? MATERIALS_2015?.[container.dataset.linkGroup] || [] : [];
    container.innerHTML = group.map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.label)}</a>`).join("");
  });
}

function setupMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".navlinks");
  if (!toggle || !nav || toggle.dataset.mainInitialized === "true") return;
  toggle.dataset.mainInitialized = "true";
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

function setupSiteNotice() {
  if (document.querySelector(".site-notice")) return;
  const brand = document.querySelector(".topbar .brand");
  if (!brand) return;
  const notice = document.createElement("a");
  notice.className = "site-notice";
  notice.href = "https://nandakumarm.dpdns.org/about.html";
  notice.textContent = "This website is in its initial stage. For suggestions or content changes, contact the developer.";
  brand.insertAdjacentElement("afterend", notice);
}

function setupCompactSectionHeading() {
  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, "");
  const compactPages = ["/revision-2021.html", "/materials-2015.html", "/contact.html"];
  if (!compactPages.some((page) => pathname.endsWith(page))) return;

  const pageTitle = document.querySelector(".page-title");
  if (!pageTitle) return;
  pageTitle.classList.add("compact-section-heading");

  if (document.getElementById("compactSectionHeadingStyles")) return;
  const style = document.createElement("style");
  style.id = "compactSectionHeadingStyles";
  style.textContent = `
    .page-title.compact-section-heading {
      min-height: 230px !important;
      padding: clamp(24px, 3.2vw, 44px) !important;
      border-radius: 30px !important;
      margin-top: 16px !important;
    }
    .page-title.compact-section-heading h1 {
      max-width: 850px !important;
      margin-bottom: 10px !important;
      font-size: clamp(1.95rem, 3vw, 3.1rem) !important;
      line-height: 1.06 !important;
      letter-spacing: -0.045em !important;
    }
    .page-title.compact-section-heading > p:not(.kicker) {
      max-width: 760px !important;
      margin-bottom: 12px !important;
      font-size: 0.98rem !important;
      line-height: 1.55 !important;
    }
    .page-title.compact-section-heading .kicker {
      min-height: 29px !important;
      margin-bottom: 9px !important;
      padding: 6px 10px !important;
      font-size: 0.68rem !important;
    }
    .page-title.compact-section-heading::before {
      top: 22px !important;
      right: 28px !important;
      padding: 7px 11px !important;
      font-size: 0.64rem !important;
    }
    .page-title.compact-section-heading::after {
      right: 34px !important;
      bottom: 24px !important;
      width: 72px !important;
      height: 72px !important;
      border-radius: 22px !important;
      font-size: 2.2rem !important;
      opacity: 0.54 !important;
    }
    .page-title.compact-section-heading .hero-actions {
      gap: 8px !important;
    }
    .page-title.compact-section-heading .btn {
      min-height: 42px !important;
      padding: 9px 14px !important;
      border-radius: 14px !important;
      font-size: 0.88rem !important;
    }
    @media (max-width: 700px) {
      .page-title.compact-section-heading {
        min-height: 190px !important;
        padding: 18px 14px !important;
        border-radius: 20px !important;
      }
      .page-title.compact-section-heading h1 {
        max-width: calc(100% - 58px) !important;
        font-size: clamp(1.5rem, 7vw, 2rem) !important;
        line-height: 1.1 !important;
      }
      .page-title.compact-section-heading > p:not(.kicker) {
        max-width: 100% !important;
        font-size: 0.9rem !important;
      }
      .page-title.compact-section-heading::before {
        position: static !important;
        display: inline-flex !important;
        width: fit-content !important;
        margin-bottom: 8px !important;
      }
      .page-title.compact-section-heading::after {
        right: 14px !important;
        bottom: 14px !important;
        width: 50px !important;
        height: 50px !important;
        border-radius: 16px !important;
        font-size: 1.55rem !important;
      }
    }
  `;
  document.head.append(style);
}

function setupSiteAssistant() {
  if (window.location.pathname.includes("/lessons/") || document.querySelector(".poly-ai-button")) return;

  const prefix = rootPrefix();
  const version = "20260613-assistant4";

  if (!document.getElementById("polyAssistantLoaderStyles")) {
    const fallback = document.createElement("style");
    fallback.id = "polyAssistantLoaderStyles";
    fallback.textContent = `
      #polySiteAssistant {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483000;
        width: max-content;
        height: max-content;
      }
      #polySiteAssistant .poly-ai-panel[hidden] { display: none !important; }
      @media (max-width: 620px) {
        #polySiteAssistant { right: 10px; bottom: 10px; }
      }
    `;
    document.head.append(fallback);
  }

  if (!document.querySelector('link[href*="assets/css/site-assistant.css"]')) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = new URL(`${prefix}assets/css/site-assistant.css?v=${version}`, document.baseURI).href;
    document.head.append(css);
  }

  let mount = document.getElementById("polySiteAssistant");
  if (!mount) {
    mount = document.createElement("div");
    mount.id = "polySiteAssistant";
    mount.setAttribute("aria-live", "polite");
    document.body.append(mount);
  }

  if (!document.querySelector('script[src*="assets/js/site-assistant.js"]')) {
    const script = document.createElement("script");
    script.src = new URL(`${prefix}assets/js/site-assistant.js?v=${version}`, document.baseURI).href;
    script.async = true;
    document.body.append(script);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupSiteNotice();
  setupCompactSectionHeading();
  document.querySelectorAll("[data-year]").forEach((item) => { item.textContent = new Date().getFullYear(); });
  setupMenu();
  renderMaterialLinks();
  setupSubjectBrowser();
  setupHomepageVideoPoster();
  setupSiteAssistant();
});