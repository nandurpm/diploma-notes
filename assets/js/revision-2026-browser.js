(() => {
  "use strict";

  const VERSION = "20260716-semester-order2";
  const esc = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const slug = value => String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  async function json(url, timeoutMs = 12000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  const cleanPath = () => location.pathname.replace(/\/+$/, "") || "/";
  const isProgrammeIndex = () => ["/revision-2026.html", "/revision-2026"].includes(cleanPath());

  function departmentSlug() {
    if (document.body?.dataset?.programmeSlug) return document.body.dataset.programmeSlug;
    const querySlug = new URLSearchParams(location.search).get("dept");
    if (querySlug) return querySlug.replace(/\.html$/i, "");
    const match = cleanPath().match(/\/revision-2026\/([^/]+)\.html$/i);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function enhanceProgrammeIndex() {
    const grid = document.getElementById("departmentCards");
    const search = document.getElementById("programmeSearch");
    const empty = document.getElementById("programmeEmptyState");
    if (!grid || !search) return;

    const cards = [...grid.querySelectorAll("[data-programme-card]")];
    const draw = () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach(card => {
        const haystack = [card.dataset.programmeSlug, card.dataset.officialCode, card.textContent]
          .join(" ")
          .toLowerCase();
        const show = !query || haystack.includes(query);
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (empty) empty.hidden = visible !== 0;
    };
    search.addEventListener("input", draw);
    draw();
  }

  function semesterNumber(subject) {
    const explicit = Number(subject.semesterNumber);
    if (explicit >= 1 && explicit <= 6) return explicit;

    // The old scraped dataset contains incorrect semester text. Until it is replaced
    // by the official section-aware sync, the first course-code digit is the stable
    // ordering fallback used by the SITTTR numbering scheme.
    const codeMatch = String(subject.code || "").match(/^([1-6])/);
    if (codeMatch) return Number(codeMatch[1]);

    const textMatch = String(subject.semester || "").match(/\b([1-6])\b/);
    return textMatch ? Number(textMatch[1]) : 99;
  }

  function naturalCodeCompare(left, right) {
    return String(left || "").localeCompare(String(right || ""), undefined, {
      numeric: true,
      sensitivity: "base"
    });
  }

  function subjectCard(subject) {
    const code = esc(subject.code);
    const name = esc(subject.name);
    const semester = semesterNumber(subject);
    const semesterText = semester <= 6 ? `Semester ${semester}` : "Semester not specified";
    const type = esc(subject.type || "Course");
    const syllabus = esc(subject.syllabusUrl ||
      `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(subject.code)}`);
    const handbook = `/lessons/lessons-${encodeURIComponent(subject.code)}_REV2026.html`;

    return `<article class="subject-card reveal">
      <div class="subject-top"><span>REV2026</span><strong>${code}</strong></div>
      <h3>${name}</h3>
      <p>${semesterText} / ${type}</p>
      <div class="action-row">
        <a class="action syllabus" href="${syllabus}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>
        <a class="action lessons" href="${handbook}">View Handbook</a>
      </div>
    </article>`;
  }

  function semesterSection(number, subjects) {
    return `<section class="semester-subject-section" data-semester="${number}" style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px">
      <div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)">
        <h2 style="margin:0">Semester ${number}</h2><span>${subjects.length} ${subjects.length === 1 ? "subject" : "subjects"}</span>
      </div>
      <div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">
        ${subjects.map(subjectCard).join("")}
      </div>
    </section>`;
  }

  async function renderSubjects() {
    const grid = document.getElementById("subjectGrid");
    if (!grid) return;

    const dept = departmentSlug();
    const title = document.getElementById("departmentTitle");
    const crumb = document.getElementById("crumbDepartment");
    const summary = document.getElementById("departmentSummary");
    const semesterSelect = document.getElementById("semesterFilter");
    const search = document.getElementById("subjectSearch");

    if (!dept) {
      grid.innerHTML = '<div class="empty-state">No Revision 2026 department was selected. Return to the department list.</div>';
      if (summary) summary.textContent = "No department was selected.";
      return;
    }

    try {
      const [programmes, data] = await Promise.all([
        json(`/assets/data/revision-2026-programmes.json?v=${VERSION}`),
        json(`/assets/data/revision-2026-subjects.json?v=${VERSION}`, 20000)
      ]);
      const programme = programmes.programmes.find(item => item.slug === dept);
      const programmeName = programme?.name || document.body.dataset.programmeName || "Revision 2026 subjects";
      if (title) title.textContent = programmeName;
      if (crumb) crumb.textContent = programmeName;
      document.title = `${programmeName} Revision 2026 Subjects | POLY PMNA`;

      const all = (data.subjects || [])
        .filter(subject => subject.programmeSlug === dept || slug(subject.programme) === dept)
        .map(subject => ({ ...subject, _semester: semesterNumber(subject) }))
        .filter(subject => subject._semester >= 1 && subject._semester <= 6);

      if (summary) {
        summary.textContent = all.length
          ? `${all.length} official subject records are arranged from Semester 1 to Semester 6 for ${programmeName}.`
          : `No verified Revision 2026 subject records are currently indexed for ${programmeName}.`;
      }

      if (semesterSelect) {
        semesterSelect.replaceChildren(new Option("All semesters", "all"));
        for (let number = 1; number <= 6; number += 1) {
          if (all.some(subject => subject._semester === number)) {
            semesterSelect.append(new Option(`Semester ${number}`, String(number)));
          }
        }
      }

      const draw = () => {
        const query = (search?.value || "").trim().toLowerCase();
        const selected = semesterSelect?.value || "all";
        const filtered = all
          .filter(subject => selected === "all" || subject._semester === Number(selected))
          .filter(subject => [subject.code, subject.name, subject.type].join(" ").toLowerCase().includes(query));

        const sections = [];
        for (let number = 1; number <= 6; number += 1) {
          const items = filtered
            .filter(subject => subject._semester === number)
            .sort((a, b) => naturalCodeCompare(a.code, b.code) || String(a.name).localeCompare(String(b.name)));
          if (items.length) sections.push(semesterSection(number, items));
        }
        grid.innerHTML = sections.length
          ? sections.join("")
          : '<div class="empty-state">No verified Revision 2026 subjects match this filter.</div>';
      };

      search?.addEventListener("input", draw);
      semesterSelect?.addEventListener("change", draw);
      draw();
    } catch (error) {
      console.error("REV2026 subject loading failed", error);
      if (summary) summary.textContent = "The subject dataset could not be loaded. Use the official SITTTR syllabus link below and reload this page later.";
      grid.innerHTML = '<div class="empty-state">Revision 2026 subjects could not be loaded. <a href="https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2026" target="_blank" rel="noopener noreferrer">Open the official SITTTR Revision 2026 page</a>.</div>';
    }
  }

  const start = () => isProgrammeIndex() ? enhanceProgrammeIndex() : renderSubjects();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
