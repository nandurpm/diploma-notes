/* Purpose: Daily quiz ui - Descriptive comment added for clarity */
(() => {
  "use strict";

  const DQ = window.DailyQuiz;
  const { state } = DQ;

  DQ.setAuthControlsDisabled = (disabled) => {
    const { elements } = state;
    elements.tabLogin.disabled = disabled;
    elements.tabRegister.disabled = disabled;
    elements.authSubmit.disabled = disabled || state.busy;
  };

  DQ.setAuthMode = (mode, clearMessage = true) => {
    const { elements } = state;
    state.authMode = mode === "register" ? "register" : "login";
    const registering = state.authMode === "register";

    elements.tabLogin.classList.toggle("active", !registering);
    elements.tabRegister.classList.toggle("active", registering);
    elements.tabLogin.setAttribute("aria-selected", String(!registering));
    elements.tabRegister.setAttribute("aria-selected", String(registering));
    elements.usernameField.classList.toggle("hidden", !registering);
    elements.confirmField.classList.toggle("hidden", !registering);
    elements.username.required = registering;
    elements.confirm.required = registering;
    elements.password.autocomplete = registering
      ? "new-password"
      : "current-password";
    elements.authSubmit.textContent = registering
      ? "Create Student Account"
      : "Login";
    elements.authHelp.textContent = registering
      ? "Create an account once using a username, email address and password."
      : "Login with your email address and password.";

    if (!registering) {
      elements.username.value = "";
      elements.confirm.value = "";
    }
    if (clearMessage) DQ.showMessage(elements.authMsg, "");
  };

  DQ.answeredQuestionCount = () =>
    state.questions.filter((question) =>
      document.querySelector(`input[name="q${question.id}"]:checked`),
    ).length;

  DQ.updateSubmitState = () => {
    const complete = state.questions.length === DQ.config.questionsPerDay;
    state.elements.submit.classList.toggle("hidden", !complete);
    state.elements.submit.disabled =
      state.busy ||
      !complete ||
      DQ.answeredQuestionCount() !== DQ.config.questionsPerDay;
  };

  DQ.renderQuestions = (questionList, mode) => {
    const { elements } = state;
    state.questions = Array.isArray(questionList) ? questionList : [];
    state.quizMode = mode || "first";
    elements.quiz.innerHTML = "";

    state.questions.forEach((question, index) => {
      const card = document.createElement("article");
      card.className = "question";
      card.id = `card-${question.id}`;

      const options = question.options
        .map((option, optionIndex) => {
          const inputId = `q${question.id}-${optionIndex}`;
          return `<label for="${inputId}">
            <input id="${inputId}" type="radio" name="q${question.id}"
              value="${DQ.escapeHtml(option)}">
            <span><b>${String.fromCharCode(65 + optionIndex)}.</b>
              ${DQ.escapeHtml(option)}</span>
          </label>`;
        })
        .join("");

      card.innerHTML = `<div class="qhead">
        <span class="qnum">${index + 1}</span>
        <div><div class="qtext">${DQ.escapeHtml(question.question)}</div>
        <div class="topic">Question ID ${question.id} ·
          ${DQ.escapeHtml(question.topic)}</div></div>
      </div>
      <div class="options">${options}</div>
      <div id="ans-${question.id}" class="answer hidden"></div>`;

      elements.quiz.append(card);
    });

    elements.quiz.querySelectorAll('input[type="radio"]').forEach((input) =>
      input.addEventListener("change", DQ.updateSubmitState),
    );

    elements.submit.textContent =
      state.quizMode === "retry" ? "Submit Final Retry" : "Submit Answers";
    DQ.updateSubmitState();
  };

  DQ.displaySubmittedReview = (reviewItems) => {
    const reviewById = new Map(
      (reviewItems || []).map((item) => [String(item.id), item]),
    );

    state.questions.forEach((question) => {
      const item = reviewById.get(String(question.id));
      if (!item) return;

      const card = DQ.byId(`card-${question.id}`);
      const answer = DQ.byId(`ans-${question.id}`);
      card.classList.add(
        item.userAnswer === item.correctAnswer ? "correct" : "wrong",
      );
      answer.classList.remove("hidden");
      answer.textContent = `Correct answer: ${item.correctAnswer}`;

      card.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.disabled = true;
        input.checked = input.value === item.userAnswer;
      });
    });
  };

  DQ.renderPreviousReview = (review) => {
    const { elements } = state;
    if (!review) {
      elements.review.textContent = "No previous-day attempt found.";
      return;
    }

    elements.review.innerHTML = `<p><b>${DQ.escapeHtml(review.date)}</b>
      — Score ${review.score}/10 · Best ${review.bestScore}/10
      · Attempts ${review.attemptCount}</p>
      <div class="review"><table>
      <thead><tr><th>#</th><th>Question</th><th>Your Answer</th>
      <th>Correct Answer</th></tr></thead>
      <tbody>${review.questions.map((question) => `<tr>
        <td>${question.number}</td>
        <td>${DQ.escapeHtml(question.question)}</td>
        <td>${DQ.escapeHtml(question.userAnswer)}</td>
        <td>${DQ.escapeHtml(question.correctAnswer)}</td>
      </tr>`).join("")}</tbody></table></div>`;
  };

  DQ.setPersonalStatsLocked = (locked) => {
    const { elements } = state;
    const title = locked ? "Login to view" : "";
    elements.streak.title = title;
    elements.best.title = title;
    elements.retryStatus.title = title;
    elements.statsHint.classList.toggle("hidden", !locked);
  };

  DQ.showLoggedOutState = (message = "") => {
    const { elements } = state;
    elements.auth.classList.remove("hidden");
    elements.accountBadge.classList.add("hidden");
    elements.quizPanel.classList.add("hidden");
    elements.previous.classList.add("hidden");
    elements.streak.textContent = "—";
    elements.best.textContent = "—";
    elements.retryStatus.textContent = "Login required";
    state.questions = [];
    DQ.setPersonalStatsLocked(true);
    DQ.setAuthMode("login", false);
    if (message) DQ.showMessage(elements.authMsg, message, "success");
  };
})();
