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

  return `
    <article class="subject-card reveal" data-search="${escapeHtml(searchText)}">
      <div class="subject-top"><span>${escapeHtml(subject.revision)}</span><strong>${escapeHtml(subject.code)}</strong></div>
      <h3>${escapeHtml(subject.name)}</h3>
      <p>${escapeHtml(subject.department)} / ${escapeHtml(subject.semester)} / ${escapeHtml(subject.type)}</p>
      <div class="action-row">
        ${!isMaterial ? `<a class="action syllabus" href="${syllabusLink(subject.code)}" target="_blank" rel="noopener">Open Syllabus</a>` : ""}
        <a class="action lessons" href="${lessonLink(subject)}">View Lessons</a>
        ${dl ? `<a class="action download" href="${escapeHtml(dl)}" target="_blank" rel="noopener" download>Download Notes</a>` : ""}
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

// Deduplicate subjects: same code within same revision → keep only first entry
// and mark it as "First Year / Common". This handles subjects that appear in
// multiple department lists with the same code.
function dedupeSubjects(subjects) {
  const seen = new Map(); // key: revision+code
  const out = [];
  for (const s of subjects) {
    const key = s.revision + ":" + s.code;
    if (!seen.has(key)) {
      seen.set(key, true);
      out.push(s);
    }
    // If same code seen again → already added; skip.
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

      // BUG2 FIX: when a dept page is fixed, also show First Year / Common subjects
      // for the same revision so students see all subjects they actually study.
      const deptMatch =
        department === "all" ||
        subject.department === department ||
        (fixedDepartment && subject.department === COMMON_DEPT && subject.revision === revision);

      return (
        (!query || text.includes(query)) &&
        (revision === "all" || subject.revision === revision) &&
        deptMatch &&
        (semester === "all" || subject.semester === semester)
      );
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
