/* Purpose: Quiz dashboard - Descriptive comment added for clarity */
(() => {
  "use strict";
  const Q = window.PolyQuiz;

  Q.loadAuthenticatedDashboard = async () => {
    const dashboard = await Q.callApi("dashboard");
    Q.state.dashboard = dashboard;
    Q.state.profile = dashboard.profile;
    Q.renderDashboard(dashboard);
  };

  Q.guestDashboardData = () => {
    const results = Object.values(Q.state.guestResults);
    const completed = results.filter((item) => item.attemptCount > 0);
    const totalAttempts = completed.reduce((sum, item) => sum + item.attemptCount, 0);
    const bestPercent = completed.length
      ? Math.max(...completed.map((item) => Q.percent(item.bestScore, Q.config.questionsPerDay)))
      : 0;
    const averagePercent = completed.length
      ? Math.round(completed.reduce((sum, item) => sum + Q.percent(item.bestScore, Q.config.questionsPerDay), 0) / completed.length)
      : 0;

    const subjects = Object.values(Q.subjects).map((subject) => {
      const result = Q.state.guestResults[subject.code] || null;
      const scorePercent = result ? Q.percent(result.bestScore, Q.config.questionsPerDay) : 0;
      return {
        ...subject,
        today: result ? {
          attemptCount: result.attemptCount,
          bestScore: result.bestScore,
          totalQuestions: Q.config.questionsPerDay,
          retryStarted: result.retryStarted,
        } : null,
        stats: { quizzes: result?.attemptCount ? 1 : 0, averagePercent: scorePercent, bestPercent: scorePercent },
      };
    });

    const recentResults = completed.map((result) => ({
      date: Q.dateKeyIST(),
      subjectCode: result.subjectCode,
      subjectTitle: Q.subjects[result.subjectCode].title,
      bestScore: result.bestScore,
      totalQuestions: Q.config.questionsPerDay,
      attemptCount: result.attemptCount,
    }));

    return {
      profile: { username: "Guest", email: "", role: "guest" },
      analytics: {
        totalQuizzes: completed.length,
        totalAttempts,
        averagePercent,
        bestPercent,
        streak: 0,
        completedToday: completed.length,
      },
      subjects,
      recentResults,
    };
  };

  Q.renderGuestDashboard = () => {
    const dashboard = Q.guestDashboardData();
    Q.state.dashboard = dashboard;
    Q.state.profile = dashboard.profile;
    Q.renderDashboard(dashboard);
  };

  Q.subjectButtonText = (today) => {
    if (!today) return "Start Quiz";
    if (today.attemptCount >= 2) return "Review Answers";
    if (today.attemptCount === 1 && today.retryStarted) return "Continue Final Retry";
    return "Review / Start Retry";
  };

  Q.subjectStatusHtml = (today) => {
    if (!today) return '<span class="status-chip">Not attempted today</span>';
    if (today.attemptCount >= 2) {
      return `<span class="status-chip good">Completed</span><span class="status-chip">Best ${Q.escape(today.bestScore)}/${Q.escape(today.totalQuestions)}</span>`;
    }
    if (today.attemptCount === 1 && today.retryStarted) {
      return `<span class="status-chip warn">Final retry active</span><span class="status-chip">Best ${Q.escape(today.bestScore)}/${Q.escape(today.totalQuestions)}</span>`;
    }
    return '<span class="status-chip good">First attempt submitted</span><span class="status-chip warn">1 retry available</span>';
  };

  Q.renderDashboard = (dashboard) => {
    const E = Q.elements;
    const guest = Q.state.mode === "guest";
    const { profile, analytics, subjects, recentResults } = dashboard;

    E.welcomeTitle.textContent = guest ? "Guest Dashboard" : `Welcome, ${profile.username}`;
    E.accountSubtitle.textContent = guest
      ? "Choose a subject. Nothing in this guest session is saved."
      : `${profile.email} · ${profile.role === "admin" ? "Administrator" : "Student"}`;
    E.guestBanner.classList.toggle("hidden", !guest);
    E.accountButton.textContent = guest ? "Guest Info" : "Account";
    E.adminButton.classList.toggle("hidden", profile.role !== "admin");
    E.logoutButton.textContent = guest ? "Exit Guest" : "Logout";

    const summary = [
      ["Quizzes", analytics.totalQuizzes ?? 0],
      ["Attempts", analytics.totalAttempts ?? 0],
      ["Average", `${analytics.averagePercent ?? 0}%`],
      ["Best", `${analytics.bestPercent ?? 0}%`],
      ["Streak", guest ? "Not saved" : `${analytics.streak ?? 0} day${analytics.streak === 1 ? "" : "s"}`],
      ["Completed Today", analytics.completedToday ?? 0],
    ];
    E.summaryCards.innerHTML = summary.map(([label, value]) =>
      `<article class="summary-card"><span>${Q.escape(label)}</span><b>${Q.escape(value)}</b></article>`
    ).join("");

    E.subjectGrid.innerHTML = subjects.map((subject) => `
      <article class="subject-card" style="--subject-color:${Q.escape(subject.color)}">
        <div class="subject-icon">${Q.escape(subject.icon)}</div>
        <h3>${Q.escape(subject.title)}</h3>
        <p>${Q.escape(subject.description)}</p>
        <div class="subject-status">${Q.subjectStatusHtml(subject.today)}</div>
        <button class="btn primary start-subject" type="button" data-subject="${Q.escape(subject.code)}">
          ${Q.escape(Q.subjectButtonText(subject.today))}
        </button>
      </article>`).join("");

    E.subjectGrid.querySelectorAll(".start-subject").forEach((button) => {
      button.addEventListener("click", () => Q.openSubject(button.dataset.subject));
    });

    E.subjectAnalysis.innerHTML = subjects.map((subject) => {
      const average = subject.stats?.averagePercent ?? 0;
      const quizzes = subject.stats?.quizzes ?? 0;
      return `<div class="analysis-row">
        <div class="analysis-label"><b>${Q.escape(subject.title)}</b><span>${quizzes} saved quiz${quizzes === 1 ? "" : "zes"}</span></div>
        <div class="analysis-track"><div class="analysis-fill" style="--bar-width:${Math.min(100, average)}%;--bar-color:${Q.escape(subject.color)}"></div></div>
        <span class="analysis-score">${average}%</span>
      </div>`;
    }).join("");

    E.recentResults.innerHTML = recentResults?.length ? `
      <table class="data-table">
        <thead><tr><th>Date</th><th>Subject</th><th>Best Score</th><th>Attempts</th></tr></thead>
        <tbody>${recentResults.map((result) => `<tr>
          <td>${Q.escape(result.date)}</td><td>${Q.escape(result.subjectTitle)}</td>
          <td><b>${Q.escape(result.bestScore)}/${Q.escape(result.totalQuestions)}</b></td>
          <td>${Q.escape(result.attemptCount)}</td>
        </tr>`).join("")}</tbody>
      </table>` : '<div class="empty-state">No quiz results yet.</div>';

    Q.showView("dashboardView");
  };

  Q.guestSubjectState = (subjectCode) => {
    const existing = Q.state.guestResults[subjectCode] || {
      subjectCode,
      attemptCount: 0,
      retryStarted: false,
      bestScore: 0,
      firstScore: null,
      retryScore: null,
      mode: "first",
      currentReview: null,
    };
    Q.state.guestResults[subjectCode] = existing;
    const mode = existing.attemptCount === 1 && existing.retryStarted ? "retry" : "first";
    const canSubmit = existing.attemptCount === 0 || (existing.attemptCount === 1 && existing.retryStarted);
    return {
      subject: Q.subjects[subjectCode],
      date: Q.dateKeyIST(),
      attemptCount: existing.attemptCount,
      retryStarted: existing.retryStarted,
      mode,
      canStartRetry: existing.attemptCount === 1 && !existing.retryStarted,
      canSubmit,
      questions: canSubmit
        ? window.QuizGuestBank.questions(subjectCode, Q.dateKeyIST(), mode).map(({ answer, ...question }) => question)
        : [],
      currentReview: existing.currentReview,
    };
  };

  Q.openSubject = async (subjectCode) => {
    const E = Q.elements;
    const subject = Q.state.dashboard.subjects.find((item) => item.code === subjectCode) || Q.subjects[subjectCode];
    if (!subject) return;
    Q.state.activeSubject = subject;
    E.quizSubjectCode.textContent = subject.subtitle;
    E.quizTitle.textContent = subject.title;
    E.quizMessage.textContent = "";
    E.questionContainer.innerHTML = '<div class="empty-state">Loading questions…</div>';
    E.submitQuiz.classList.add("hidden");
    E.retryQuiz.classList.add("hidden");
    Q.showView("quizView");
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const quiz = Q.state.mode === "guest"
        ? Q.guestSubjectState(subjectCode)
        : await Q.callApi("subject_state", { subject: subjectCode });
      Q.state.activeQuiz = quiz;
      Q.renderQuizState(quiz);
    } catch (error) {
      E.questionContainer.innerHTML = `<div class="empty-state">${Q.escape(error.message || "Quiz could not be loaded.")}</div>`;
    }
  };
})();
