// ── Subject Card Renderer ──────────────────────────────────────────────────
// Renders subject cards with: View Lessons, Download Notes, or "Site updation in progress" notice

function renderSubjectCard(subject) {
  const card = document.createElement("div");
  card.className = "subject-card";

  const codeEl = document.createElement("span");
  codeEl.className = "subject-code";
  codeEl.textContent = subject.code;

  const nameEl = document.createElement("h3");
  nameEl.className = "subject-name";
  nameEl.textContent = subject.name;

  const actions = document.createElement("div");
  actions.className = "subject-actions";

  if (subject.hasLessons) {
    // ── View Lessons button ──
    const lessonsBtn = document.createElement("button");
    lessonsBtn.className = "btn btn-primary";
    lessonsBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> View Lessons`;
    lessonsBtn.addEventListener("click", () => openLessonsViewer(subject));

    // ── Download Notes button ──
    const dlBtn = document.createElement("a");
    dlBtn.className = "btn btn-outline";
    dlBtn.href = subject.notesFile;
    dlBtn.download = "";
    dlBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Download Notes`;

    actions.appendChild(lessonsBtn);
    actions.appendChild(dlBtn);
  } else {
    // ── Updation notice ──
    const notice = document.createElement("p");
    notice.className = "updation-notice";
    notice.innerHTML = `🔄 Site updation in progress — <a href="mailto:nandurpm@gmail.com">contact the author</a>`;
    actions.appendChild(notice);
  }

  card.appendChild(codeEl);
  card.appendChild(nameEl);
  card.appendChild(actions);
  return card;
}

// ── Lessons Viewer ─────────────────────────────────────────────────────────
// Opens an overlay iframe with the lesson HTML file; includes download button inside

function openLessonsViewer(subject) {
  // Remove existing overlay if any
  const existing = document.getElementById("lessons-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "lessons-overlay";
  overlay.className = "lessons-overlay";

  // Header
  const header = document.createElement("div");
  header.className = "lessons-overlay-header";

  const title = document.createElement("div");
  title.className = "lessons-overlay-title";
  title.innerHTML = `<span class="subject-code">${subject.code}</span><span>${subject.name}</span>`;

  // Download button inside viewer
  const dlBtn = document.createElement("a");
  dlBtn.className = "btn btn-primary btn-sm";
  dlBtn.href = subject.notesFile;
  dlBtn.download = "";
  dlBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Download PDF`;

  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-ghost btn-sm lessons-close-btn";
  closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
  closeBtn.addEventListener("click", () => overlay.remove());

  const headerActions = document.createElement("div");
  headerActions.className = "lessons-overlay-actions";
  headerActions.appendChild(dlBtn);
  headerActions.appendChild(closeBtn);

  header.appendChild(title);
  header.appendChild(headerActions);

  // iframe for lesson HTML
  const frame = document.createElement("iframe");
  frame.className = "lessons-iframe";
  frame.src = subject.lessonFile;
  frame.title = `${subject.code} - ${subject.name} Lessons`;

  overlay.appendChild(header);
  overlay.appendChild(frame);
  document.body.appendChild(overlay);

  // Close on Escape
  const escHandler = (e) => {
    if (e.key === "Escape") { overlay.remove(); document.removeEventListener("keydown", escHandler); }
  };
  document.addEventListener("keydown", escHandler);
}

// ── Render sections ────────────────────────────────────────────────────────

function renderSection(container, subjects) {
  const grid = document.createElement("div");
  grid.className = "subjects-grid";
  subjects.forEach(s => grid.appendChild(renderSubjectCard(s)));
  container.appendChild(grid);
}

// Expose for use in main scripts
window.SubjectRenderer = { renderSubjectCard, renderSection, openLessonsViewer };
