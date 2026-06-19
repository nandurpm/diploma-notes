(() => {
  "use strict";

  const text = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

  function injectLayoutFix() {
    if (document.getElementById("mock-exam-portal-layout-fix")) return;
    const style = document.createElement("style");
    style.id = "mock-exam-portal-layout-fix";
    style.textContent = `
      .mock-exam-launch {
        display: block !important;
        width: 100% !important;
        margin-top: 14px !important;
        background: linear-gradient(135deg,#fff,#f7f9ff) !important;
      }
      .mock-exam-launch .section-heading {
        display: grid !important;
        grid-template-columns: minmax(220px, 0.8fr) minmax(280px, 1.2fr) !important;
        align-items: end !important;
        gap: 18px !important;
        margin-bottom: 18px !important;
      }
      .mock-exam-launch .section-heading h2 {
        margin: 0 !important;
        max-width: 360px !important;
      }
      .mock-exam-launch .section-heading p:not(.eyebrow) {
        max-width: none !important;
        margin: 0 !important;
        line-height: 1.55 !important;
      }
      .mock-exam-launch .mock-exam-grid {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 14px !important;
        width: 100% !important;
      }
      .mock-exam-launch .subject-card {
        min-height: 255px !important;
      }
      @media (max-width: 1050px) {
        .mock-exam-launch .mock-exam-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }
      @media (max-width: 700px) {
        .mock-exam-launch .section-heading {
          display: block !important;
        }
        .mock-exam-launch .section-heading p:not(.eyebrow) {
          margin-top: 8px !important;
        }
        .mock-exam-launch .mock-exam-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `;
    document.head.append(style);
  }

  document.title = "Mock Exams | Polytechnic Study Hub";
  text(".topbar .brand small", "Mock Exams");
  document.querySelectorAll('a[href$="daily-quiz.html"]').forEach((link) => {
    if (link.closest(".topbar")) link.textContent = "Mock Exams";
  });
  text("#authView h1", "Student Mock Exams Portal");
  text("#authView .auth-intro", "Login once to attend daily quizzes and full mock examinations, save scores and view performance analysis.");
  text("#portalView .dashboard-head .eyebrow", "Mock Exams Dashboard");
  text("#accountSubtitle", "Choose daily practice or a full mock examination.");

  const exams = [
    ["1004", "Applied Chemistry", "CH", "#16a34a", "/mock-exam-1004.html", "Applied Chemistry · Course Code 1004"],
    ["1002", "Mathematics I", "Σ", "#2563eb", "/mock-exam.html?subject=1002", "Complex numbers, straight lines, trigonometry and differentiation"],
    ["1003", "Applied Physics I", "Φ", "#0891b2", "/mock-exam.html?subject=1003", "Mechanics, heat, elasticity and fluid dynamics"],
    ["2001", "Environmental Science", "EV", "#15803d", "/mock-exam.html?subject=2001", "Ecosystem, pollution, energy resources and management"],
    ["2002", "Mathematics II", "M2", "#4f46e5", "/mock-exam.html?subject=2002", "Determinants, matrices, vectors, integration and differential equations"],
    ["2003", "Applied Physics II", "P2", "#0f766e", "/mock-exam.html?subject=2003", "Waves, optics, electricity, semiconductors, LASER and nanoscience"]
  ];

  injectLayoutFix();

  const card = document.querySelector(".future-card");
  if (!card) return;

  const section = card.closest("section") || card.parentElement;
  section.classList.remove("future-card");
  section.classList.add("section-card", "mock-exam-launch");
  section.innerHTML = `<div class="section-heading"><div><p class="eyebrow">Available now</p><h2>Official-Pattern Mock Examinations</h2></div><p>Each paper follows the uploaded official model pattern: Part A 9 × 1, Part B answer any 8 of 10, and Part C choose one from each of 6 OR pairs.</p></div><div class="subject-grid mock-exam-grid">${exams.map(([code, title, icon, color, href, desc]) => `<article class="subject-card" style="--subject-color:${esc(color)}"><div class="subject-icon">${esc(icon)}</div><h3>${esc(title)}</h3><p>${esc(desc)} · 75 marks · 3 hours.</p><div class="subject-status"><span class="status-chip good">Available now</span><span class="status-chip">AI + Rubric</span></div><a class="btn primary full" href="${esc(href)}">Start Exam</a></article>`).join("")}</div>`;
})();
