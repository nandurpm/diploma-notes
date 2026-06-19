(() => {
  "use strict";

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[c]);

  const exams = [
    ["1001", "Communication Skills in English", "EN", "#7c3aed", "/mock-exam.html?subject=1001", "Reading, grammar, vocabulary, workplace communication and writing"],
    ["1002", "Mathematics I", "Σ", "#2563eb", "/mock-exam.html?subject=1002", "Complex numbers, straight lines, trigonometry, limits and differentiation"],
    ["1003", "Applied Physics I", "Φ", "#0891b2", "/mock-exam.html?subject=1003", "Mechanics, heat, elasticity and fluid dynamics"],
    ["1004", "Applied Chemistry", "CH", "#16a34a", "/mock-exam-1004.html", "Atomic structure, bonding, water, materials, electrochemistry and corrosion"],
    ["2002", "Mathematics II", "M2", "#4f46e5", "/mock-exam.html?subject=2002", "Determinants, matrices, vectors, integration and differential equations"],
    ["2003", "Applied Physics II", "P2", "#0f766e", "/mock-exam.html?subject=2003", "Waves, optics, electricity, semiconductors, LASER and nanoscience"],
  ];

  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };

  function injectStyle() {
    if (document.getElementById("mock-exam-portal-restore-style")) return;
    const style = document.createElement("style");
    style.id = "mock-exam-portal-restore-style";
    style.textContent = `
      .service-warning,
      #serviceWarning {
        display: none !important;
      }

      .mock-exam-launch,
      .mock-exam-restore-panel {
        display: block !important;
        width: 100% !important;
        margin-top: 16px !important;
        background: linear-gradient(135deg, #ffffff, #f7f9ff) !important;
        border: 1px solid #dfe5ef !important;
        border-radius: 22px !important;
        box-shadow: 0 12px 30px rgba(30, 55, 90, .10) !important;
        padding: clamp(16px, 2.5vw, 24px) !important;
      }

      .mock-exam-launch .section-heading,
      .mock-exam-restore-panel .section-heading {
        display: grid !important;
        grid-template-columns: minmax(210px, .8fr) minmax(260px, 1.2fr) !important;
        align-items: end !important;
        gap: 18px !important;
        margin-bottom: 18px !important;
      }

      .mock-exam-launch .section-heading h2,
      .mock-exam-restore-panel .section-heading h2 {
        margin: 0 !important;
        color: #101828 !important;
      }

      .mock-exam-launch .section-heading p:not(.eyebrow),
      .mock-exam-restore-panel .section-heading p:not(.eyebrow) {
        margin: 0 !important;
        color: #475467 !important;
        line-height: 1.55 !important;
      }

      .mock-exam-grid-restored {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 14px !important;
        width: 100% !important;
      }

      .mock-exam-grid-restored .subject-card {
        min-height: 245px !important;
        color: #101828 !important;
        background: #ffffff !important;
        border: 1px solid #dfe5ef !important;
        border-radius: 18px !important;
        padding: 18px !important;
        box-shadow: 0 8px 24px rgba(30, 55, 90, .08) !important;
      }

      .mock-exam-grid-restored .subject-card h3 {
        color: #101828 !important;
      }

      .mock-exam-grid-restored .subject-card p {
        color: #475467 !important;
      }

      .mock-exam-grid-restored .subject-icon {
        width: 48px !important;
        height: 48px !important;
        border-radius: 16px !important;
        display: grid !important;
        place-items: center !important;
        color: #fff !important;
        background: var(--subject-color, #315efb) !important;
        font-weight: 900 !important;
      }

      .mock-exam-grid-restored .subject-status {
        display: flex !important;
        gap: 8px !important;
        flex-wrap: wrap !important;
        margin: 12px 0 !important;
      }

      .mock-exam-grid-restored .status-chip {
        border-radius: 999px !important;
        background: #eef2ff !important;
        color: #263ea8 !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        padding: 5px 9px !important;
      }

      .mock-exam-grid-restored .status-chip.good {
        background: #dcfae6 !important;
        color: #067647 !important;
      }

      #recentResults,
      #previousReview,
      .result-details,
      .attempt-history,
      .table-wrap,
      .history-list {
        color: #101828 !important;
        background: transparent !important;
      }

      #recentResults table,
      #previousReview table,
      .table-wrap table {
        width: 100% !important;
        border-collapse: separate !important;
        border-spacing: 0 10px !important;
      }

      #recentResults tr,
      #previousReview tr,
      .table-wrap tr {
        background: #ffffff !important;
        color: #101828 !important;
        box-shadow: 0 4px 14px rgba(30,55,90,.06) !important;
      }

      #recentResults th,
      #recentResults td,
      #previousReview th,
      #previousReview td,
      .table-wrap th,
      .table-wrap td {
        color: #101828 !important;
        background: #ffffff !important;
        border-bottom: 1px solid #dfe5ef !important;
        padding: 12px !important;
        line-height: 1.45 !important;
        vertical-align: top !important;
      }

      .result-card,
      .history-card,
      .attempt-card,
      .question-result,
      .review-card {
        background: #ffffff !important;
        color: #101828 !important;
        border: 1px solid #dfe5ef !important;
        border-radius: 16px !important;
        box-shadow: 0 8px 22px rgba(30,55,90,.08) !important;
      }

      .correct-answer,
      .your-answer,
      .answer-text,
      .student-answer {
        color: #101828 !important;
        background: #f8fafc !important;
        border: 1px solid #d0d5dd !important;
        border-radius: 12px !important;
        padding: 10px !important;
        display: block !important;
        margin-top: 6px !important;
      }

      @media (max-width: 1050px) {
        .mock-exam-grid-restored { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      }

      @media (max-width: 700px) {
        .mock-exam-launch .section-heading,
        .mock-exam-restore-panel .section-heading { display: block !important; }
        .mock-exam-launch .section-heading p:not(.eyebrow),
        .mock-exam-restore-panel .section-heading p:not(.eyebrow) { margin-top: 8px !important; }
        .mock-exam-grid-restored { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.append(style);
  }

  function mockExamMarkup() {
    return `<div class="section-heading"><div><p class="eyebrow">Mock Exams</p><h2>Official-Pattern Mock Examinations</h2></div><p>Select a subject first. The Mock Exams button should never open Chemistry directly unless Chemistry is selected here.</p></div><div class="subject-grid mock-exam-grid-restored">${exams.map(([code, title, icon, color, href, desc]) => `<article class="subject-card" style="--subject-color:${esc(color)}"><div class="subject-icon">${esc(icon)}</div><h3>${esc(title)}</h3><p>${esc(desc)} · 75 marks · 3 hours.</p><div class="subject-status"><span class="status-chip good">Available now</span><span class="status-chip">AI + Rubric</span></div><a class="btn primary full" href="${esc(href)}">Start ${esc(title)}</a></article>`).join("")}</div>`;
  }

  function restoreMockExamCards() {
    let card = document.querySelector(".future-card");
    if (!card) {
      const chemistryOnly = [...document.querySelectorAll("section, article, div")].find((node) => /Applied Chemistry Official-Pattern Mock Examination/i.test(node.textContent || ""));
      card = chemistryOnly?.closest("section") || chemistryOnly;
    }

    if (card) {
      const section = card.closest("section") || card;
      section.classList.remove("future-card");
      section.classList.add("section-card", "mock-exam-launch");
      section.innerHTML = mockExamMarkup();
      return;
    }

    const dashboard = document.querySelector("#dashboardView") || document.querySelector("#portalView") || document.querySelector("main");
    if (dashboard && !document.querySelector(".mock-exam-grid-restored")) {
      const section = document.createElement("section");
      section.className = "section-card mock-exam-restore-panel";
      section.innerHTML = mockExamMarkup();
      dashboard.append(section);
    }
  }

  function normalizeText() {
    document.title = "Mock Exams | Polytechnic Study Hub";
    setText(".topbar .brand small", "Mock Exams");
    document.querySelectorAll('a[href$="daily-quiz.html"]').forEach((link) => {
      if (link.closest(".topbar")) link.textContent = "Mock Exams";
    });
    setText("#authView h1", "Student Mock Exams Portal");
    setText("#authView .auth-intro", "Login once to attend daily quizzes and full mock examinations, save scores and view performance analysis.");
    setText("#portalView .dashboard-head .eyebrow", "Mock Exams Dashboard");
    setText("#accountSubtitle", "Choose daily practice or a full mock examination.");
  }

  function applyFixes() {
    injectStyle();
    normalizeText();
    restoreMockExamCards();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyFixes, { once: true });
  } else {
    applyFixes();
  }

  [100, 600, 1500, 3000].forEach((delay) => setTimeout(applyFixes, delay));

  const observer = new MutationObserver(() => applyFixes());
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
