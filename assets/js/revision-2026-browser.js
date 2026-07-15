(() => {
  "use strict";

  const VERSION = "20260716-rev2026-match-2021";
  const esc = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const slug = value => String(value || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const cleanPath = () => location.pathname.replace(/\/+$/, "") || "/";
  const isProgrammeIndex = () => ["/revision-2026.html", "/revision-2026"].includes(cleanPath());

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

  function departmentSlug() {
    if (document.body?.dataset?.programmeSlug) return document.body.dataset.programmeSlug;
    const querySlug = new URLSearchParams(location.search).get("dept");
    if (querySlug) return querySlug.replace(/\.html$/i, "");
    const match = cleanPath().match(/\/revision-2026\/([^/]+)\.html$/i);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function semesterNumber(subject) {
    const explicit = Number(subject.semesterNumber);
    if (explicit >= 1 && explicit <= 6) return explicit;
    const codeMatch = String(subject.code || "").match(/^([1-6])/);
    if (codeMatch) return Number(codeMatch[1]);
    const textMatch = String(subject.semester || "").match(/\b([1-6])\b/);
    return textMatch ? Number(textMatch[1]) : 99;
  }

  function naturalCodeCompare(left, right) {
    return String(left || "").localeCompare(String(right || ""), undefined, { numeric: true, sensitivity: "base" });
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
        const haystack = [card.dataset.programmeSlug, card.dataset.officialCode, card.textContent].join(" ").toLowerCase();
        const show = !query || haystack.includes(query);
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (empty) empty.hidden = visible !== 0;
    };
    search.addEventListener("input", draw);
    draw();
  }

  function subjectCard(subject, programmeName) {
    const code = String(subject.code || "").trim();
    const semester = semesterNumber(subject);
    const semesterText = semester <= 6 ? `Semester ${semester}` : "Other subjects";
    const name = String(subject.name || "Untitled subject").trim();
    const type = String(subject.type || "Course").trim();
    const syllabus = subject.syllabusUrl || `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(code)}`;
    const qp = `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(code)}`;
    const lesson = `/lessons/lessons-${encodeURIComponent(code)}_REV2026.html`;
    const notes = `/notes/downloadable-notes-${encodeURIComponent(code)}_REV2026.pdf`;
    const meta = [programmeName, semesterText, type].filter(Boolean).join(" / ");
    return `<article class="subject-card reveal" data-subject-code="${esc(code.toUpperCase())}" data-revision="2026" data-semester="${esc(semesterText)}" data-search-text="${esc([code, name, programmeName, semesterText, type].join(" ").toLowerCase())}" data-notes-href="${esc(notes)}" data-lesson-href="${esc(lesson)}" data-lesson-available="false"><div class="subject-top"><span>2026</span><strong>${esc(code)}</strong></div><h3>${esc(name)}</h3><p>${esc(meta)}</p><div class="action-row"><a class="action syllabus" href="${esc(syllabus)}" target="_blank" rel="noopener noreferrer">Open Syllabus</a><span class="availability-label lessons-status" aria-disabled="true">Lessons unavailable</span><span class="availability-label notes-status" aria-disabled="true">Notes unavailable</span><a class="action qp" href="${esc(qp)}" target="_blank" rel="noopener noreferrer">Sample QP</a></div></article>`;
  }

  function semesterSection(number, subjects, programmeName) {
    const cards = subjects.map(subject => subjectCard(subject, programmeName)).join("");
    return `<section class="semester-subject-section" data-semester-section="Semester ${number}" style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px"><div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)"><h3>Semester ${number}</h3><span data-semester-count>${subjects.length} ${subjects.length === 1 ? "subject" : "subjects"}</span></div><div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">${cards}</div></section>`;
  }

  function enhanceStaticDepartment() {
    const grid = document.getElementById("subjectGrid");
    const search = document.getElementById("subjectSearch");
    const semester = document.getElementById("semesterFilter");
    const empty = document.getElementById("subjectEmptyState");
    if (!grid || grid.dataset.staticRev2026 !== "true") return false;

    const cards = [...grid.querySelectorAll(".subject-card")];
    const sections = [...grid.querySelectorAll(".semester-subject-section")];
    const draw = () => {
      const query = (search?.value || "").trim().toLowerCase();
      const selected = semester?.value || "all";
      let visibleTotal = 0;

      cards.forEach(card => {
        const matchesSemester = selected === "all" || card.dataset.semester === selected;
        const haystack = card.dataset.searchText || card.textContent.toLowerCase();
        const show = matchesSemester && (!query || haystack.includes(query));
        card.hidden = !show;
        if (show) visibleTotal += 1;
      });

      sections.forEach(section => {
        const visibleCards = [...section.querySelectorAll(".subject-card")].filter(card => !card.hidden);
        section.hidden = visibleCards.length === 0;
        const count = section.querySelector("[data-semester-count]");
        if (count) count.textContent = `${visibleCards.length} ${visibleCards.length === 1 ? "subject" : "subjects"}`;
      });

      if (empty) empty.hidden = visibleTotal !== 0;
    };

    search?.addEventListener("input", draw);
    semester?.addEventListener("change", draw);
    draw();
    return true;
  }

  async function renderCompatibilityPage() {
    const grid = document.getElementById("subjectGrid");
    if (!grid) return;
    const dept = departmentSlug();
    if (!dept) {
      grid.innerHTML = '<div class="empty-state">No Revision 2026 department was selected.</div>';
      return;
    }

    try {
      const [programmes, data] = await Promise.all([
        json(`/assets/data/revision-2026-programmes.json?v=${VERSION}`),
        json(`/assets/data/revision-2026-subjects.json?v=${VERSION}`, 20000)
      ]);
      const programme = programmes.programmes.find(item => item.slug === dept);
      const programmeName = programme?.name || document.body.dataset.programmeName || "Revision 2026";
      const rows = (data.subjects || [])
        .filter(subject => subject.programmeSlug === dept || slug(subject.programme) === dept)
        .map(subject => ({ ...subject, _semester: semesterNumber(subject) }))
        .filter(subject => subject._semester >= 1 && subject._semester <= 6);

      const sections = [];
      for (let number = 1; number <= 6; number += 1) {
        const items = rows
          .filter(subject => subject._semester === number)
          .sort((a, b) => naturalCodeCompare(a.code, b.code) || String(a.name).localeCompare(String(b.name)));
        sections.push(semesterSection(number, items, programmeName));
      }
      grid.dataset.staticRev2026 = "true";
      grid.innerHTML = sections.join("");
      enhanceStaticDepartment();
    } catch (error) {
      console.error("REV2026 subject loading failed", error);
      grid.innerHTML = '<div class="empty-state">Revision 2026 subjects could not be loaded. <a href="https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2026" target="_blank" rel="noopener noreferrer">Open the official SITTTR page</a>.</div>';
    }
  }

  function start() {
    if (isProgrammeIndex()) {
      enhanceProgrammeIndex();
      return;
    }
    if (!enhanceStaticDepartment()) renderCompatibilityPage();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
