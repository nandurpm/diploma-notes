(() => {
  "use strict";
  const text = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };

  document.title = "Mock Exams | Polytechnic Study Hub";
  text(".topbar .brand small", "Mock Exams");
  document.querySelectorAll('a[href$="daily-quiz.html"]').forEach((link) => {
    if (link.closest(".topbar")) link.textContent = "Mock Exams";
  });
  text("#authView h1", "Student Mock Exams Portal");
  text("#authView .auth-intro", "Login once to attend daily quizzes and full mock examinations, save scores and view performance analysis.");
  text("#portalView .dashboard-head .eyebrow", "Mock Exams Dashboard");
  text("#accountSubtitle", "Choose daily practice or a full mock examination.");

  const card = document.querySelector(".future-card");
  if (!card) return;
  card.classList.add("mock-exam-launch");
  text(".future-card .eyebrow", "Available now");
  text(".future-card h2", "Applied Chemistry Official-Pattern Mock Examination");
  text(".future-card p:not(.eyebrow)", "Course Code 1004 · English · 75 marks · 3 hours. Part A: 9 × 1, Part B: answer any 8 of 10, and Part C: choose one from each of 6 OR pairs. Results are published with rubric-based feedback.");
  const oldBadge = card.querySelector(".coming-soon");
  if (oldBadge) {
    const link = document.createElement("a");
    link.className = oldBadge.className;
    link.href = "/mock-exam-1004.html";
    link.textContent = "Start Exam";
    oldBadge.replaceWith(link);
  }
})();
