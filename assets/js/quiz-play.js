/* Purpose: Quiz play - Descriptive comment added for clarity */
(() => {
  "use strict";
  const Q = window.PolyQuiz;

  Q.renderQuizState = (quiz) => {
    const E = Q.elements;
    const attempts = Number(quiz.attemptCount || 0);
    const retryActive = Boolean(quiz.retryStarted);
    E.quizAttemptBadge.textContent = attempts >= 2
      ? "Completed"
      : attempts === 1 && retryActive
        ? "Final retry"
        : attempts === 1 ? "Retry available" : "First attempt";
    E.retryQuiz.classList.toggle("hidden", !quiz.canStartRetry);
    E.submitQuiz.classList.add("hidden");

    if (quiz.questions?.length) {
      Q.renderEditableQuestions(quiz.questions);
      E.quizInstruction.textContent = retryActive
        ? "This is the final retry. Answer all 10 questions before submitting."
        : "Answer all 10 questions before submitting.";
      E.submitQuiz.textContent = retryActive ? "Submit Final Retry" : "Submit Answers";
      E.submitQuiz.classList.remove("hidden");
      Q.updateSubmitButton();
      return;
    }

    if (quiz.currentReview?.length) {
      Q.renderReadOnlyReview(quiz.currentReview);
      E.quizInstruction.textContent = attempts >= 2
        ? "Both attempts are complete. Questions, your answers and correct answers are shown below and cannot be edited."
        : "Your submitted questions and answers are shown below and cannot be edited. One final retry is available.";
      return;
    }

    E.questionContainer.innerHTML = '<div class="empty-state">No questions are available.</div>';
  };

  Q.renderEditableQuestions = (questions) => {
    const E = Q.elements;
    Q.state.activeQuiz.questions = questions;
    E.questionContainer.innerHTML = questions.map((question, index) => {
      const name = `question-${question.id}`;
      const options = question.options.map((option, optionIndex) => {
        const id = `${name}-${optionIndex}`;
        return `<label class="option-label" for="${Q.escape(id)}">
          <input id="${Q.escape(id)}" type="radio" name="${Q.escape(name)}" value="${Q.escape(option)}">
          <span><b>${String.fromCharCode(65 + optionIndex)}.</b> ${Q.escape(option)}</span>
        </label>`;
      }).join("");
      return `<article class="question-card" id="question-card-${Q.escape(question.id)}">
        <div class="question-head"><span class="question-number">${index + 1}</span>
          <div><div class="question-text">${Q.escape(question.question)}</div>
          <div class="question-topic">${Q.escape(question.topic)}</div></div>
        </div><div class="options">${options}</div><div class="answer-slot"></div>
      </article>`;
    }).join("");
    E.questionContainer.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.addEventListener("change", Q.updateSubmitButton);
    });
  };

  Q.selectedAnswers = () => {
    const answers = {};
    for (const question of Q.state.activeQuiz?.questions || []) {
      const selected = document.querySelector(`input[name="question-${question.id}"]:checked`);
      if (!selected) return null;
      answers[String(question.id)] = selected.value;
    }
    return answers;
  };

  Q.updateSubmitButton = () => {
    const answers = Q.selectedAnswers();
    Q.elements.submitQuiz.disabled = Q.state.busy
      || !answers
      || Object.keys(answers).length !== Q.config.questionsPerDay;
  };

  Q.applyReview = (review) => {
    const byId = new Map(review.map((item) => [String(item.id), item]));
    for (const question of Q.state.activeQuiz.questions || []) {
      const item = byId.get(String(question.id));
      const card = Q.byId(`question-card-${question.id}`);
      if (!item || !card) continue;
      card.classList.add(item.userAnswer === item.correctAnswer ? "correct" : "wrong");
      card.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.disabled = true;
        input.checked = input.value === item.userAnswer;
        input.closest("label")?.classList.add("disabled");
      });
      card.querySelector(".answer-slot").innerHTML = `
        <div class="user-answer">Your answer: <b>${Q.escape(item.userAnswer)}</b></div>
        <div class="answer-review">Correct answer: ${Q.escape(item.correctAnswer)}</div>`;
    }
  };

  Q.renderReadOnlyReview = (review) => {
    Q.elements.questionContainer.innerHTML = review.map((item, index) => `
      <article class="question-card ${item.userAnswer === item.correctAnswer ? "correct" : "wrong"}">
        <div class="question-head"><span class="question-number">${index + 1}</span>
          <div><div class="question-text">${Q.escape(item.question)}</div>
          <div class="question-topic">${Q.escape(item.topic)}</div></div>
        </div>
        <div class="user-answer">Your answer: <b>${Q.escape(item.userAnswer)}</b></div>
        <div class="answer-review">Correct answer: ${Q.escape(item.correctAnswer)}</div>
      </article>`).join("");
  };

  Q.submitGuestQuiz = (answers) => {
    const code = Q.state.activeSubject.code;
    const result = Q.state.guestResults[code];
    const mode = result.attemptCount === 0 ? "first" : "retry";
    const graded = window.QuizGuestBank.grade(code, Q.dateKeyIST(), mode, answers);
    if (result.attemptCount === 0) {
      result.attemptCount = 1;
      result.firstScore = graded.score;
      result.bestScore = graded.score;
      result.retryStarted = false;
    } else {
      result.attemptCount = 2;
      result.retryScore = graded.score;
      result.bestScore = Math.max(result.bestScore, graded.score);
      result.retryStarted = true;
    }
    result.currentReview = graded.review;
    return {
      score: graded.score,
      bestScore: result.bestScore,
      attemptCount: result.attemptCount,
      canRetry: result.attemptCount === 1,
      review: graded.review,
    };
  };

  Q.submitActiveQuiz = async () => {
    const E = Q.elements;
    const answers = Q.selectedAnswers();
    if (!answers) {
      Q.message(E.quizMessage, "Answer all 10 questions before submitting.", "error");
      return;
    }
    Q.state.busy = true;
    Q.updateSubmitButton();
    E.retryQuiz.disabled = true;
    try {
      const response = Q.state.mode === "guest"
        ? Q.submitGuestQuiz(answers)
        : await Q.callApi("submit", { subject: Q.state.activeSubject.code, answers });
      Q.applyReview(response.review);
      Object.assign(Q.state.activeQuiz, {
        currentReview: response.review,
        attemptCount: response.attemptCount,
        questions: [],
      });
      E.submitQuiz.classList.add("hidden");
      E.retryQuiz.classList.toggle("hidden", !response.canRetry);
      E.quizAttemptBadge.textContent = response.canRetry ? "Retry available" : "Completed";
      E.quizInstruction.textContent = response.canRetry
        ? "The submitted questions and answers are shown below and cannot be edited. One final retry is available."
        : "Both attempts are complete. The submitted questions and answers are shown below and cannot be edited.";
      Q.message(E.quizMessage,
        `Score: ${response.score}/10. ${Q.state.mode === "guest" ? "This guest result is not saved." : "Saved securely online."}`,
        "success");
      if (Q.state.mode === "guest") Q.state.dashboard = Q.guestDashboardData();
      else Q.state.dashboard = await Q.callApi("dashboard");
    } catch (error) {
      Q.message(E.quizMessage, error.message || "The result could not be saved.", "error");
    } finally {
      Q.state.busy = false;
      E.retryQuiz.disabled = false;
      Q.updateSubmitButton();
    }
  };

  Q.startRetry = async () => {
    if (!window.confirm("This is your one final retry for today. No additional retry will be available. Continue?")) return;
    const E = Q.elements;
    Q.state.busy = true;
    E.retryQuiz.disabled = true;
    try {
      let response;
      if (Q.state.mode === "guest") {
        const result = Q.state.guestResults[Q.state.activeSubject.code];
        if (!result || result.attemptCount !== 1 || result.retryStarted) throw new Error("The final retry is not available.");
        result.retryStarted = true;
        response = {
          questions: window.QuizGuestBank.questions(Q.state.activeSubject.code, Q.dateKeyIST(), "retry")
            .map(({ answer, ...question }) => question),
          mode: "retry", retryStarted: true, attemptCount: 1,
        };
      } else {
        response = await Q.callApi("start_retry", { subject: Q.state.activeSubject.code });
      }
      Q.state.activeQuiz = { ...Q.state.activeQuiz, ...response, currentReview: null };
      Q.renderQuizState(Q.state.activeQuiz);
      Q.message(E.quizMessage, "Final retry started. Submit all answers to complete it.", "success");
    } catch (error) {
      Q.message(E.quizMessage, error.message || "Retry could not be started.", "error");
    } finally {
      Q.state.busy = false;
      E.retryQuiz.disabled = false;
    }
  };

  Q.backToDashboard = () => {
    if (Q.state.mode === "guest") Q.renderGuestDashboard();
    else if (Q.state.dashboard) Q.renderDashboard(Q.state.dashboard);
  };
})();
