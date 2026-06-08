function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function subjectCard(subject) {
  const searchText = [subject.revision, subject.code, subject.name, subject.department, subject.semester, subject.type].join(" ").toLowerCase();
  const isMaterial = subject.type === "Material";
  const dl = notesLink(subject);
  const downloadAttrs = subject.notesFile ? ' target="_blank" rel="noopener" download' : "";

  return `
    <article class="subject-card reveal" data-search="${escapeHtml(searchText)}">
      <div class="subject-top"><span>${escapeHtml(subject.revision)}</span><strong>${escapeHtml(subject.code)}</strong></div>
      <h3>${escapeHtml(subject.name)}</h3>
      <p>${escapeHtml(subject.department)} / ${escapeHtml(subject.semester)} / ${escapeHtml(subject.type)}</p>
      <div class="action-row">
        ${!isMaterial ? `<a class="action syllabus" href="${syllabusLink(subject.code)}" target="_blank" rel="noopener">Open Syllabus</a>` : ""}
        <a class="action lessons" href="${lessonLink(subject)}">View Lessons</a>
        <a class="action download" href="${escapeHtml(dl)}"${downloadAttrs}>Download Notes</a>
        ${!isMaterial ? `<a class="action qp" href="${modelQuestionPaperLink(subject.code)}" target="_blank" rel="noopener">Sample QP</a>` : ""}
      </div>
    </article>
  `;
}

// BUG3 FIX: accept descriptive allLabel.
function fillSelect(select, values, selected, allLabel) {
  if (!select) return;
  const current = selected || select.value || "all";
  // BUG6 FIX: numeric sort for "Semester N", locale sort otherwise.
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

// Deduplicate exact repeats only. Some REV2021 subject codes are reused by
// more than one department, so department-specific copies must stay visible.
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
  const grid = document.querySelector("#subjectGrid");
  if (!grid || !Array.isArray(SUBJECTS)) return;

  // Deduplicated master list
  const ALL = dedupeSubjects(SUBJECTS);

  const params = new URLSearchParams(window.location.search);
  const search = document.querySelector("#subjectSearch");
  const revisionFilter = document.querySelector("#revisionFilter");
  const departmentFilter = document.querySelector("#departmentFilter");
  const semesterFilter = document.querySelector("#semesterFilter");
  const fixedRevision = grid.dataset.revision || "";
  const fixedDepartment = grid.dataset.department || "";

  const COMMON_DEPT = "First Year / Common";

  // BUG3 FIX: descriptive all-labels.
  fillSelect(revisionFilter, [...new Set(ALL.map((s) => s.revision))].sort(), fixedRevision || params.get("revision"), "All revisions");

  // BUG4 FIX: refresh dept filter when revision changes.
  function refreshDeptFilter() {
    if (fixedDepartment) return;
    const activeRevision = fixedRevision || revisionFilter?.value || "all";
    const depts = [
      ...new Set(
        ALL.filter((s) => activeRevision === "all" || s.revision === activeRevision)
           .map((s) => s.department)
      ),
    ];
    fillSelect(departmentFilter, depts, fixedDepartment || params.get("department"), "All departments");
  }

  refreshDeptFilter();
  fillSelect(semesterFilter, [...new Set(ALL.map((s) => s.semester))], params.get("semester"), "All semesters");

  if (fixedRevision && revisionFilter) revisionFilter.disabled = true;
  if (fixedDepartment && departmentFilter) departmentFilter.disabled = true;
  if (params.get("subject") && search) search.value = params.get("subject");

  const render = () => {
    const query = (search?.value || "").trim().toLowerCase();
    const revision = fixedRevision || revisionFilter?.value || "all";
    const department = fixedDepartment || departmentFilter?.value || "all";
    const semester = semesterFilter?.value || "all";

    const visible = ALL.filter((subject) => {
      const text = [subject.revision, subject.code, subject.name, subject.department, subject.semester, subject.type]
        .join(" ").toLowerCase();

      // Ensure revision matches
      if (revision !== "all" && subject.revision !== revision) return false;

      // Ensure semester matches
      if (semester !== "all" && subject.semester !== semester) return false;

      // Ensure search query matches
      if (query && !text.includes(query)) return false;

      // Handle department matching
      if (department !== "all") {
        // If it's a direct match, show it
        if (subject.department === department) return true;
        
        // Special case: if we are on a specific department page, also show "Common" subjects for that revision
        if (fixedDepartment && subject.revision === revision) {
           // For 2021, common subjects are marked "First Year / Common"
           if (revision === "2021" && subject.department === "First Year / Common") return true;
           // For 2015, common subjects are in "2015 First Year Materials" or "2015 Study Materials"
           if (revision === "2015" && (subject.department === "2015 First Year Materials" || subject.department === "2015 Study Materials")) return true;
        }
        
        return false;
      }

      return true;
    });

    grid.innerHTML = visible.length
      ? visible.map(subjectCard).join("")
      : '<p class="empty">No subjects match this filter.</p>';
  };

  // BUG4 FIX: cascade dept when revision changes.
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

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
  setupMenu();
  renderMaterialLinks();
  setupSubjectBrowser();
});
