function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    </article>
  `;
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
  if (!printUrl) return;

  if (button.classList.contains("unavailable")) return;

  if (activePrintFrame) activePrintFrame.remove();
  const frame = document.createElement("iframe");
  activePrintFrame = frame;
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.style.opacity = "0";

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

    const enable = () => {
      button.classList.remove("unavailable");
      button.removeAttribute("aria-disabled");
      if (!button.dataset.printUrl) button.removeAttribute("title");
    };

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
      if (exists) enable();
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
  select.innerHTML =
    `<option value="all">${escapeHtml(allLabel || "All")}</option>` +
    sorted.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
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

function setupSubjectBrowser() {
  const pagePath = window.location.pathname.toLowerCase();
  if (pagePath.endsWith("/materials-2015.html") || pagePath.endsWith("materials-2015.html")) {
    document.querySelector("#subject-browser")?.remove();
    return;
  }

  const grid = document.querySelector("#subjectGrid");
  if (!grid || !Array.isArray(SUBJECTS)) return;

  const ALL = dedupeSubjects(SUBJECTS);
  const params = new URLSearchParams(window.location.search);
  const search = document.querySelector("#subjectSearch");
  const revisionFilter = document.querySelector("#revisionFilter");
  const departmentFilter = document.querySelector("#departmentFilter");
  const semesterFilter = document.querySelector("#semesterFilter");
  const fixedRevision = grid.dataset.revision || "";
  const fixedDepartment = grid.dataset.department || "";
  const homepageSearchMode = grid.dataset.mode === "homepage-search";
  const browserSubjects = ALL.filter((subject) => subject.revision !== "2015");

  fillSelect(revisionFilter, [...new Set(browserSubjects.map((s) => s.revision))].sort(), fixedRevision || params.get("revision"), "All revisions");

  function refreshDeptFilter() {
    if (fixedDepartment) {
      fillSelect(departmentFilter, [fixedDepartment], fixedDepartment, "All departments");
      return;
    }
    const activeRevision = fixedRevision || revisionFilter?.value || "all";
    const depts = [
      ...new Set(
        browserSubjects.filter((s) => activeRevision === "all" || s.revision === activeRevision)
           .map((s) => s.department)
      ),
    ];
    fillSelect(departmentFilter, depts, fixedDepartment || params.get("department"), "All departments");
  }

  refreshDeptFilter();
  fillSelect(semesterFilter, [...new Set(browserSubjects.map((s) => s.semester))], params.get("semester"), "All semesters");

  if (fixedRevision && revisionFilter) revisionFilter.disabled = true;
  if (fixedDepartment && departmentFilter) departmentFilter.disabled = true;
  if (params.get("subject") && search) search.value = params.get("subject");

  const render = () => {
    const query = (search?.value || "").trim().toLowerCase();
    const revision = fixedRevision || revisionFilter?.value || "all";
    const department = fixedDepartment || departmentFilter?.value || "all";
    const semester = semesterFilter?.value || "all";

    if (homepageSearchMode && !query) {
      grid.innerHTML = '<p class="empty">Search a 2021 subject name, code, department, or semester to show matching subject cards.</p>';
      return;
    }

    const visible = browserSubjects.filter((subject) => {
      const text = [subject.revision, subject.code, subject.name, subject.department, subject.semester, subject.type]
        .join(" ").toLowerCase();

      if (revision !== "all" && subject.revision !== revision) return false;
      if (semester !== "all" && subject.semester !== semester) return false;
      if (query && !text.includes(query)) return false;

      if (department !== "all") {
        if (subject.department === department) return true;
        if (fixedDepartment && subject.revision === revision) {
          if (revision === "2021" && subject.department === "First Year / Common") return true;
        }
        return false;
      }

      return true;
    });

    grid.innerHTML = visible.length
      ? visible.map(subjectCard).join("")
      : '<p class="empty">No subjects match this filter.</p>';
    setupAssetButtons(grid);
  };

  revisionFilter?.addEventListener("change", () => { refreshDeptFilter(); render(); });
  revisionFilter?.addEventListener("input",  () => { refreshDeptFilter(); render(); });

  [search, departmentFilter, semesterFilter].forEach((c) => c?.addEventListener("input", render));
  [departmentFilter, semesterFilter].forEach((c) => c?.addEventListener("change", render));
  render();
}

function renderMaterialLinks() {
  document.querySelectorAll("[data-link-group]").forEach((container) => {
    const group = MATERIALS_2015?.[container.dataset.linkGroup] || [];
    container.innerHTML = group
      .map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.label)}</a>`)
      .join("");
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

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
  setupMenu();
  renderMaterialLinks();
  setupSubjectBrowser();
  setupHomepageVideoPoster();
});