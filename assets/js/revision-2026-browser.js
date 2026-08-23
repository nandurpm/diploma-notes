/* =========================================================
   REVISION 2026 BROWSER — Department and Programme Navigator
   ---------------------------------------------------------
   This script powers the Revision 2026 department listing page
   (/revision-2026.html) and individual department pages
   (/revision-2026/[department].html). It renders department
   cards, programme listings, and subject grids from JSON data.

   Responsibilities:
   - Renders the Revision 2026 programme index page with
     all department cards and search/filter functionality
   - Renders individual department pages with semester-wise
     subject grids (course code, title, lessons, notes, syllabus)
   - Configures Syllabus and Model QP links to SITTTR website
   - Applies department-specific colour gradients and artwork
   - Handles search filtering across all departments

   Related files:
   - assets/data/revision-2026-programmes.json
   - assets/data/revision-2026-subjects.json
   - assets/data/rev2026-programme-status.json
   - assets/css/revision-2026-department-themes.css
   - assets/css/revision-2026-directory.css
   - assets/media/departments/rev2026/

   Warning: Changes to data loading or rendering affect
   the entire Revision 2026 experience.
   ========================================================= */
(() => {
  "use strict";

  const VERSION = "20260823-pdf-alias1";
  let PDF_LINKS = {};
  let LESSON_CODES = new Set();
  const PDF_BASE = "https://github.com/nandurpm/poly-pmna-pdf-files/raw/refs/heads/main/";
  const SITTTR_BASE = "https://www.sitttrkerala.ac.in/index.php?";
  const PROGRAMME_ART = {
    "architecture": ["#0f5ea8", "#0e7490"],
    "artificial-intelligence": ["#4f46e5", "#7c3aed"],
    "artificial-intelligence-and-machine-learning": ["#4338ca", "#2563eb"],
    "automation-and-robotics": ["#334155", "#0f766e"],
    "automobile-engineering": ["#b91c1c", "#f97316"],
    "biomedical-engineering": ["#0f766e", "#06b6d4"],
    "chemical-engineering": ["#b45309", "#d97706"],
    "civil-and-environmental-engineering": ["#15803d", "#0891b2"],
    "civil-and-rural-engineering": ["#4d7c0f", "#0e7490"],
    "civil-engineering": ["#1d4ed8", "#0891b2"],
    "civil-engineering-and-planning": ["#1e40af", "#6366f1"],
    "civil-engineering-construction-technology": ["#b91c1c", "#f59e0b"],
    "commercial-practice": ["#9a3412", "#d97706"],
    "computer-application-and-business-management": ["#6d28d9", "#2563eb"],
    "computer-engineering": ["#1e3a8a", "#2563eb"],
    "computer-science-and-engineering": ["#4f46e5", "#7c3aed"],
    "computer-science-and-technology": ["#0f766e", "#0891b2"],
    "cyber-forensics-and-information-security": ["#0f172a", "#2563eb"],
    "electrical-and-electronics-engineering": ["#c2410c", "#2563eb"],
    "electrical-engineering": ["#1e3a8a", "#0e7490"],
    "electrical-engineering-and-electric-vehicles-technology": ["#15803d", "#84cc16"],
    "electronics-and-communication": ["#0369a1", "#06b6d4"],
    "electronics-and-computer-engineering": ["#4338ca", "#2563eb"],
    "electronics-engineering": ["#b45309", "#1d4ed8"],
    "fire-technology-and-safety": ["#b91c1c", "#f97316"],
    "food-processing-technology": ["#166534", "#65a30d"],
    "information-technology": ["#1d4ed8", "#0284c7"],
    "instrumentation-engineering": ["#0f5c6e", "#2563eb"],
    "integrated-circuit-design-and-fabrication": ["#6d28d9", "#2563eb"],
    "interior-design": ["#7c2d12", "#a16207"],
    "mechanical-engineering": ["#334155", "#0891b2"],
    "mechatronics": ["#0f766e", "#2563eb"],
    "micro-electronics": ["#5b21b6", "#7c3aed"],
    "polymer-technology": ["#1d4ed8", "#2563eb"],
    "printing-technology": ["#be123c", "#f59e0b"],
    "robotic-process-automation": ["#4f46e5", "#06b6d4"],
    "textile-technology": ["#92400e", "#0f766e"],
    "tool-and-die-engineering": ["#334155", "#d97706"],
    "wood-and-paper-technology": ["#854d0e", "#65a30d"],
    "computer-science-and-engineering-artificial-intelligence-and-machine-learning": ["#4338ca", "#7c3aed"],
    "electronics-engineering-embedded-systems": ["#c2410c", "#0f766e"],
    "mechanical-engineering-automobile-engineering": ["#334155", "#2563eb"]
  };
  const esc = value => window.PolyUtils?.escapeHtml
    ? window.PolyUtils.escapeHtml(value)
    : String(value ?? "")
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
  // Page labels use ampersands, while some repository folders omit the
  // punctuation-derived `and`. Resolve both forms against the manifest.
  const slugCandidates = value => {
    const text = String(value || "");
    return [...new Set([
      slug(text),
      text.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    ].filter(Boolean))];
  };
  const cleanPath = () => location.pathname.replace(/\/+$/, "") || "/";
  const isProgrammeIndex = () => ["/revision-2026.html", "/revision-2026"].includes(cleanPath());
  const normaliseSearch = value => String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

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
    return String(left || "").localeCompare(String(right || ""), undefined, {
      numeric: true,
      sensitivity: "base"
    });
  }

  function ensureModelPaperAccess() {
    document.querySelectorAll("a.action.qp:not(.external-fallback)").forEach(link => {
      link.textContent = "Download Model Question Paper";
      link.removeAttribute("target");
      link.setAttribute("download", link.getAttribute("download") || "");
      link.removeAttribute("rel");
    });
    if (document.getElementById("rev2026-model-qp-access")) return;
    const title = document.querySelector("main .page-title");
    if (!title) return;
    const section = document.createElement("section");
    section.className = "section notice";
    section.id = "rev2026-model-qp-access";
    section.innerHTML = `<strong>Revision 2026 PDF resources:</strong> Syllabus and available model question papers are downloaded directly from the POLY PMNA PDF repository; missing files open the corresponding official SITTTR course page.`;
    title.after(section);
  }

  function enhanceProgrammeIndex() {
    const grid = document.getElementById("departmentCards");
    const search = document.getElementById("programmeSearch");
    const resultCount = document.getElementById("programmeResultCount");
    const clearButton = document.getElementById("programmeSearchClear");
    const empty = document.getElementById("programmeEmptyState");
    const emptyClear = document.getElementById("programmeEmptyClear");
    if (!grid || !search) return;

    const cards = [...grid.querySelectorAll("[data-programme-card]")];
    const total = cards.length;

    cards.forEach(card => {
      const programmeSlug = card.dataset.programmeSlug || "";
      const colors = PROGRAMME_ART[programmeSlug];
      if (!colors) {
        card.classList.add("department-art-missing");
        return;
      }
      card.classList.add("department-visual-card");
      card.style.setProperty("--dept-accent", colors[0]);
      card.style.setProperty("--dept-accent-2", colors[1]);
      card.style.setProperty(
        "--department-art",
        `url("/assets/media/departments/rev2026/${programmeSlug}.webp?v=${VERSION}")`
      );
      // PERFORMANCE OPTIMIZATION: Pre-compute and cache the normalized search text
      // to avoid expensive dataset access and Unicode normalization on every keystroke.
      card._searchText = normaliseSearch(
        card.dataset.searchText ||
        [card.dataset.programmeSlug, card.dataset.officialCode, card.textContent].join(" ")
      );
    });

    const updateUrl = query => {
      try {
        const url = new URL(location.href);
        if (query) url.searchParams.set("q", query);
        else url.searchParams.delete("q");
        history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      } catch {
        // URL persistence is optional; filtering still works without it.
      }
    };

    const draw = ({ persist = true } = {}) => {
      const rawQuery = search.value.trim();
      const query = normaliseSearch(rawQuery);
      let visible = 0;

      cards.forEach(card => {
        const haystack = card._searchText || "";
        const show = !query || haystack.includes(query);
        card.hidden = !show;
        card.setAttribute("aria-hidden", String(!show));
        if (show) visible += 1;
      });

      if (resultCount) {
        resultCount.textContent = query
          ? `Showing ${visible} of ${total} departments`
          : `${total} departments available`;
      }
      if (clearButton) clearButton.hidden = !rawQuery;
      if (empty) empty.hidden = visible !== 0;
      if (persist) updateUrl(rawQuery);
    };

    const clear = () => {
      if (!search.value) return;
      search.value = "";
      draw();
      search.focus();
    };

    const initialQuery = new URLSearchParams(location.search).get("q") || "";
    if (initialQuery) search.value = initialQuery;

    search.addEventListener("input", () => draw());
    search.addEventListener("keydown", event => {
      if (event.key === "Escape" && search.value) {
        event.preventDefault();
        clear();
      }
    });
    clearButton?.addEventListener("click", clear);
    emptyClear?.addEventListener("click", clear);
    draw({ persist: false });
  }

  function pdfFilename(href) { return href.split("/").pop() || "resource.pdf"; }

  function repositoryPdfHref(programmeSlug, code, kind) {
    const revisionLinks = PDF_LINKS || {};
    const normalizedCode = String(code || "").trim().toUpperCase();
    for (const normalizedSlug of slugCandidates(programmeSlug)) {
      const direct = revisionLinks[`2026|${normalizedSlug}|${normalizedCode}`]?.[kind];
      if (direct) return `${PDF_BASE}${direct}`;
    }
    return "";
  }

  async function applyStaticPdfLinks() {
    const grid = document.getElementById("subjectGrid");
    if (!grid) return;
    try {
      const manifest = await json(`/assets/data/sitttr-pdf-links.json?v=20260823-pdf-alias1`);
      PDF_LINKS = manifest?.links?.["2026"] || {};
    } catch (_) {
      return;
    }
    const programmeSlug = departmentSlug();
    const programmeName = document.body?.dataset?.programmeName || programmeSlug;
    grid.querySelectorAll(".subject-card").forEach(card => {
      const code = card.dataset.subjectCode || "";
      const syllabus = repositoryPdfHref(programmeName, code, "syllabus");
      const model = repositoryPdfHref(programmeName, code, "modelQuestionPaper");
      const update = (selector, href, label, fallbackHref, fallbackLabel) => {
        const link = card.querySelector(selector);
        if (!link) return;
        if (href) {
          link.href = href;
          link.textContent = label;
          link.classList.remove("external-fallback");
          link.removeAttribute("target");
          link.removeAttribute("rel");
          link.setAttribute("download", pdfFilename(href));
          return;
        }
        // Static HTML can contain a stale direct link from another revision. Never
        // leave that URL active when the exact Revision 2026 file is unavailable.
        if (link.href.includes("poly-pmna-pdf-files")) {
          link.href = fallbackHref;
          link.textContent = fallbackLabel;
          link.classList.add("external-fallback");
          link.removeAttribute("download");
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        }
      };
      update("a.action.syllabus", syllabus, "Download Syllabus", sitttrHref(code, "syllabus"), "Open SITTTR Syllabus");
      update("a.action.qp", model, "Download Model Question Paper", sitttrHref(code, "modelQuestionPaper"), "Open SITTTR Model Question Paper");
    });
    document.getElementById("pdfAvailabilityFilter")?.dispatchEvent(new Event("change"));
  }

  function sitttrHref(code, kind) {
    const value = encodeURIComponent(String(code || "").trim().toUpperCase());
    return kind === "modelQuestionPaper"
      ? `${SITTTR_BASE}r=site%2Fdiploma-modelqp-courses-show&course=${value}`
      : `${SITTTR_BASE}r=site%2Fdiploma-syllabus-course-contents&course=${value}&scheme=REV2026`;
  }

  async function loadLessonCodes() {
    if (LESSON_CODES.size) return;
    const existing = globalThis.POLY_ASSET_MANIFEST?.lessonCodes;
    if (Array.isArray(existing)) {
      LESSON_CODES = new Set(existing.map(code => String(code).toUpperCase()));
      return;
    }
    try {
      const text = await fetch(`/assets/js/asset-manifest.js?v=${VERSION}`, { cache: "no-store" }).then(response => response.ok ? response.text() : "");
      const match = text.match(/lessonCodes:\s*Object\.freeze\((\[[\s\S]*?\])\)/);
      LESSON_CODES = new Set(match ? JSON.parse(match[1]).map(code => String(code).toUpperCase()) : []);
    } catch (_) {
      LESSON_CODES = new Set();
    }
  }

  function subjectCard(subject, programmeName) {
      const code = String(subject.code || "").trim().toUpperCase();
      const semester = semesterNumber(subject);
    const semesterText = semester <= 6 ? `Semester ${semester}` : "Other subjects";
    const name = String(subject.name || "Untitled subject").trim();
    const type = String(subject.type || "Course").trim();
    const programmeSlug = String(subject.programmeSlug || slug(programmeName));
    const pdf = slugCandidates(programmeName)
      .map(candidate => PDF_LINKS[`2026|${candidate}|${code}`])
      .find(Boolean) || {};
    const syllabus = pdf.syllabus ? `${PDF_BASE}${pdf.syllabus}` : "";
    const qp = pdf.modelQuestionPaper ? `${PDF_BASE}${pdf.modelQuestionPaper}` : "";
    const lesson = `/revision-2026-content/lessons/lessons-${encodeURIComponent(code)}.html`;
    const notes = `${lesson}?autoPrintNotes=1`;
    const lessonOk = LESSON_CODES.has(code);
    const syllabusAction = syllabus
      ? `<a class="action syllabus" href="${esc(syllabus)}" download="${esc(pdfFilename(syllabus))}">Download Syllabus</a>`
      : `<a class="action syllabus external-fallback" href="${esc(sitttrHref(code, "syllabus"))}" target="_blank" rel="noopener noreferrer">Open SITTTR Syllabus</a>`;
    const qpAction = qp
      ? `<a class="action qp" href="${esc(qp)}" download="${esc(pdfFilename(qp))}">Download Model Question Paper</a>`
      : `<a class="action qp external-fallback" href="${esc(sitttrHref(code, "modelQuestionPaper"))}" target="_blank" rel="noopener noreferrer">Open SITTTR Model Question Paper</a>`;
    const study = lessonOk
      ? `<a class="action lessons" href="${esc(lesson)}">View Lessons</a><a class="action download" href="${esc(notes)}">Download Notes</a>`
      : `<span class="availability-label lessons-status" aria-disabled="true">Lessons unavailable</span><span class="availability-label notes-status" aria-disabled="true">Notes unavailable</span>`;
    const meta = [programmeName, semesterText, type].filter(Boolean).join(" / ");
    return `<article class="subject-card" data-subject-code="${esc(code)}" data-revision="2026" data-semester="${esc(semesterText)}" data-search-text="${esc([code, name, programmeName, semesterText, type].join(" ").toLowerCase())}" data-notes-href="${esc(notes)}" data-lesson-href="${esc(lesson)}" data-lesson-available="${String(lessonOk)}" data-notes-available="${String(lessonOk)}"><div class="subject-top"><span>2026</span><strong>${esc(code)}</strong></div><h3>${esc(name)}</h3><p>${esc(meta)}</p><div class="action-row">${syllabusAction}${study}${qpAction}</div></article>`;
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

    // PERFORMANCE OPTIMIZATION: Cache the normalized search text for each subject card
    // at initialization time to avoid repeating Unicode normalization/regex replace on every keystroke.
    cards.forEach(card => {
      card._searchText = normaliseSearch(card.dataset.searchText || card.textContent);
    });

    const draw = () => {
      const query = normaliseSearch(search?.value || "");
      const selected = semester?.value || "all";
      const pdfAvailability = document.getElementById("pdfAvailabilityFilter")?.value || "all";
      let visibleTotal = 0;
      cards.forEach(card => {
        const matchesSemester = selected === "all" || card.dataset.semester === selected;
        const hasDownloadablePdf = Boolean(card.querySelector("a.action.syllabus:not(.external-fallback), a.action.qp:not(.external-fallback)"));
        const matchesPdfAvailability = pdfAvailability !== "downloadable" || hasDownloadablePdf;
        const haystack = card._searchText || "";
        const show = matchesSemester && matchesPdfAvailability && (!query || haystack.includes(query));
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

      let announcer = document.getElementById("subjectBrowserAnnouncer");
      if (!announcer && grid.parentNode) {
        announcer = document.createElement("div");
        announcer.id = "subjectBrowserAnnouncer";
        announcer.className = "sr-only";
        announcer.setAttribute("role", "status");
        announcer.setAttribute("aria-live", "polite");
        grid.parentNode.insertBefore(announcer, grid);
      }
      if (announcer) {
        announcer.textContent = visibleTotal === 0 ? "No subjects found." : (visibleTotal === 1 ? "1 subject found." : `${visibleTotal} subjects found.`);
      }
    };
    if (search) {
      search.setAttribute("aria-controls", "subjectGrid");
      search.setAttribute("aria-describedby", "subjectBrowserAnnouncer");
    }
    search?.addEventListener("input", draw);
    semester?.addEventListener("change", draw);
    document.getElementById("pdfAvailabilityFilter")?.addEventListener("change", draw);
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
    // If the page already has static subject cards (individual department HTML pages),
    // do NOT fetch JSON and replace them. Just enhance the existing cards with search/filter.
    // This prevents the "flash and disappear" bug where static cards are replaced by
    // dynamically loaded cards that have a "reveal" animation class.
    if (grid.dataset.staticRev2026 === "true" && grid.querySelector(".subject-card")) {
      ensureModelPaperAccess();
      enhanceStaticDepartment();
      applyStaticPdfLinks();
      return;
    }
    try {
      await loadLessonCodes();
      const [programmes, data, pdfManifest] = await Promise.all([
        json(`/assets/data/revision-2026-programmes.json?v=${VERSION}`),
        json(`/assets/data/revision-2026-subjects.json?v=${VERSION}`, 20000),
        json(`/assets/data/sitttr-pdf-links.json?v=${VERSION}`)
      ]);
      PDF_LINKS = pdfManifest?.links?.["2026"] || {};
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
      ensureModelPaperAccess();
      enhanceStaticDepartment();
    } catch (error) {
      console.error("REV2026 subject loading failed", error);
      if (grid.querySelector(".subject-card")) {
        enhanceStaticDepartment();
        return;
      }
      grid.innerHTML = '<div class="empty-state">Revision 2026 subjects could not be loaded. Please retry after the subject archive is available; archived syllabus PDFs are served from the POLY PMNA PDF repository.</div>';
    }
  }

  function start() {
    ensureModelPaperAccess();
    if (isProgrammeIndex()) {
      enhanceProgrammeIndex();
      return;
    }
    renderCompatibilityPage();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
