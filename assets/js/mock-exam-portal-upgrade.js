/* Purpose: Mock exam portal upgrade - Descriptive comment added for clarity */
(() => {
  "use strict";

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);

  const exams = [
    ["1004", "Applied Chemistry", "CH", "#16a34a", "/mock-exam-1004.html", "Applied Chemistry · Course Code 1004"],
    ["1002", "Mathematics I", "Σ", "#2563eb", "/mock-exam.html?subject=1002", "Complex numbers, straight lines, trigonometry and differentiation"],
    ["1003", "Applied Physics I", "Φ", "#0891b2", "/mock-exam.html?subject=1003", "Mechanics, heat, elasticity and fluid dynamics"],
    ["1001", "Communication Skills in English", "EN", "#7c3aed", "/mock-exam.html?subject=1001", "Reading, grammar, vocabulary and workplace communication"],
    ["2002", "Mathematics II", "M2", "#4f46e5", "/mock-exam.html?subject=2002", "Determinants, matrices, vectors, integration and differential equations"],
    ["2003", "Applied Physics II", "P2", "#0f766e", "/mock-exam.html?subject=2003", "Waves, optics, electricity, semiconductors, LASER and nanoscience"],
  ];

  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };

  function injectStyle() {
    const old = document.getElementById("mock-exam-portal-restore-style");
    old?.remove();

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
        max-width: none !important;
        margin-top: 16px !important;
        padding: clamp(16px, 2.5vw, 26px) !important;
        border: 1px solid #dfe5ef !important;
        border-radius: 22px !important;
        background: linear-gradient(135deg, #ffffff, #f7f9ff) !important;
        box-shadow: 0 12px 30px rgba(30, 55, 90, .10) !important;
      }

      .mock-exam-launch.future-card,
      .mock-exam-restore-panel.future-card {
        display: block !important;
      }

      .mock-exam-launch .section-heading,
      .mock-exam-restore-panel .section-heading {
        display: block !important;
        width: 100% !important;
        max-width: 920px !important;
        margin: 0 0 18px !important;
      }

      .mock-exam-launch .section-heading h2,
      .mock-exam-restore-panel .section-heading h2 {
        margin: 4px 0 8px !important;
        max-width: 620px !important;
        color: #101828 !important;
        font-size: clamp(26px, 3vw, 40px) !important;
        line-height: 1.08 !important;
        letter-spacing: -.035em !important;
      }

      .mock-exam-launch .section-heading p:not(.eyebrow),
      .mock-exam-restore-panel .section-heading p:not(.eyebrow) {
        margin: 0 !important;
        max-width: 880px !important;
        color: #475467 !important;
        line-height: 1.6 !important;
        font-size: clamp(15px, 1.25vw, 18px) !important;
      }

      .mock-exam-grid-restored {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 16px !important;
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .mock-exam-grid-restored .subject-card {
        min-height: 252px !important;
        color: #101828 !important;
        background: #ffffff !important;
        border: 1px solid #dfe5ef !important;
        border-radius: 18px !important;
        padding: 18px !important;
        box-shadow: 0 8px 24px rgba(30, 55, 90, .08) !important;
      }

      .mock-exam-grid-restored .subject-card h3 {
        margin: 12px 0 8px !important;
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

      @media (max-width: 1120px) {
        .mock-exam-grid-restored {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 700px) {
        .mock-exam-grid-restored {
          grid-template-columns: 1fr !important;
        }
        .mock-exam-launch,
        .mock-exam-restore-panel {
          padding: 15px !important;
          border-radius: 18px !important;
        }
      }
    `;
    document.head.append(style);
  }

  function mockExamMarkup() {
    return `<div class="section-heading"><div><p class="eyebrow">Available now</p><h2>Official-Pattern Mock Examinations</h2></div><p>Each paper follows the uploaded official model pattern: Part A 9 × 1, Part B answer any 8 of 10, and Part C choose one from each OR pair. Select a subject below to start.</p></div><div class="subject-grid mock-exam-grid-restored">${exams.map(([code, title, icon, color, href, desc]) => `<article class="subject-card" style="--subject-color:${esc(color)}"><div class="subject-icon">${esc(icon)}</div><h3>${esc(title)}</h3><p>${esc(desc)} · 75 marks · 3 hours.</p><div class="subject-status"><span class="status-chip good">Available now</span><span class="status-chip">AI + Rubric</span></div><a class="btn primary full" href="${esc(href)}">Start Exam</a></article>`).join("")}</div>`;
  }

  function restoreMockExamCards() {
    let card = document.querySelector(".future-card");
    if (!card) {
      const chemistryOnly = [...document.querySelectorAll("section, article, div")]
        .find((node) => /Applied Chemistry Official-Pattern Mock Examination/i.test(node.textContent || ""));
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
})();
