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
  "/lessons/handbook-2031-source.html",
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

  // main.js is the only subject-browser owner. site-hardening.js checks this flag and exits.
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
  notice.href = "https://nandakumarm.dpdns.org/about.html#contact";
  notice.target = "_blank";
  notice.rel = "noopener";
  notice.textContent = "This website is in its initial stage. For suggestions or content changes, contact the developer.";
  brand.insertAdjacentElement("afterend", notice);
}

function setupSiteAssistant() {
  if (window.location.pathname.includes("/lessons/") || document.querySelector(".poly-ai-button")) return;
  const prefix = rootPrefix();
  if (!document.getElementById("polySiteAssistant")) {
    const mount = document.createElement("div");
    mount.id = "polySiteAssistant";
    document.body.append(mount);
  }
  if (!document.querySelector('script[src*="assets/js/site-assistant.js"]')) {
    const script = document.createElement("script");
    script.src = `${prefix}assets/js/site-assistant.js?v=20260613-2`;
    script.defer = true;
    document.body.append(script);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupSiteNotice();
  document.querySelectorAll("[data-year]").forEach((item) => { item.textContent = new Date().getFullYear(); });
  setupMenu();
  renderMaterialLinks();
  setupSubjectBrowser();
  setupHomepageVideoPoster();
  setupSiteAssistant();
});
