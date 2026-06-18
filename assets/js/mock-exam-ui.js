(() => {
  "use strict";
  const M = globalThis.PolyMock1004;
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
  const complete = (value) => String(value || "").trim().length >= 8;
  const mark = (value) => Number.isInteger(Number(value || 0)) ? String(Number(value || 0)) : Number(value || 0).toFixed(1).replace(/\.0$/, "");

  function updateAnswer(id, value) {
    const text = String(value || "");
    const done = complete(text);
    const status = $(`status-${id}`);
    if (status) {
      status.textContent = done ? "Answered" : text.trim() ? "Needs more detail" : "Not answered";
      status.classList.toggle("complete", done);
    }
    const counter = $(`count-${id}`);
    if (counter) counter.textContent = `${text.length} / 4000`;
    $(`nav-${id}`)?.classList.toggle("answered", done);
  }

  function updateProgress() {
    const answered = M.questions.filter((q) => complete(M.state.answers[q.id])).length;
    $("answeredCount").textContent = `${answered}/${M.questions.length}`;
    $("answerProgress").style.width = `${Math.round(answered / M.questions.length * 100)}%`;
    const ready = answered === M.questions.length && !M.state.submitting;
    $("submitExam").disabled = !ready;
    $("submitExamSide").disabled = !ready;
  }

  function renderQuestions(onInput) {
    $("questionList").innerHTML = M.questions.map((q, index) => `
      <article class="mock-question" id="question-${esc(q.id)}">
        <div class="mock-question-head"><span class="mock-question-number">${index + 1}</span><div>
          <h3>${esc(q.question)}</h3><div class="question-tags"><span>${esc(q.module)}</span><span>${esc(q.type)}</span><span class="marks">${q.marks} marks</span></div>
        </div></div>
        <div class="answer-field"><label for="answer-${esc(q.id)}">Your answer</label>
          <textarea id="answer-${esc(q.id)}" data-question-id="${esc(q.id)}" maxlength="4000" spellcheck="true" placeholder="Write a complete answer. Include formulas, steps and units where applicable."></textarea>
          <div class="answer-meta"><span id="status-${esc(q.id)}">Not answered</span><span id="count-${esc(q.id)}">0 / 4000</span></div>
        </div>
      </article>`).join("");
    $("questionNav").innerHTML = M.questions.map((q, i) => `<a href="#question-${esc(q.id)}" id="nav-${esc(q.id)}" aria-label="Go to question ${i + 1}">${i + 1}</a>`).join("");
    document.querySelectorAll("textarea[data-question-id]").forEach((box) => {
      const id = box.dataset.questionId;
      box.value = M.state.answers[id] || "";
      box.addEventListener("input", () => { M.state.answers[id] = box.value; updateAnswer(id, box.value); updateProgress(); onInput(); });
      updateAnswer(id, box.value);
    });
    updateProgress();
  }

  function updateTimer() {
    const elapsed = Math.max(0, Math.floor((Date.now() - M.state.startedAt) / 1000));
    const remaining = Math.max(0, M.durationSeconds - elapsed);
    const h = String(Math.floor(remaining / 3600)).padStart(2, "0");
    const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    $("examTimer").textContent = `${h}:${m}:${s}`;
    const card = $("examTimer").closest(".timer-card");
    card?.classList.toggle("warning", remaining > 0 && remaining <= 900);
    card?.classList.toggle("expired", remaining === 0);
    $("timerNote").textContent = remaining === 0 ? "Practice time completed" : remaining <= 900 ? "Finish and submit soon" : "Practice timer";
    if (!remaining && M.state.timerId) { clearInterval(M.state.timerId); M.state.timerId = null; }
  }

  function renderResult(result) {
    const score = Math.max(0, Math.min(M.totalMarks, Number(result.score || 0)));
    const percent = Math.max(0, Math.min(100, Number(result.percentage ?? score / M.totalMarks * 100)));
    $("resultScore").textContent = `${mark(score)}/${M.totalMarks}`;
    $("resultPercent").textContent = `${mark(percent)}%`;
    $("resultMeta").textContent = `${new Date().toLocaleString("en-IN")} · ${result.savedOnline === false ? "Published on this page" : "Saved to your account"}`;
    $("evaluationMode").textContent = result.evaluationMode === "openai" ? "AI + Rubric" : "Automated Rubric";
    $("overallFeedback").textContent = `${result.overallFeedback || "Review the question-wise feedback below."}${result.saveWarning ? ` ${result.saveWarning}` : ""}`;
    const map = new Map((result.results || []).map((item) => [String(item.id), item]));
    $("resultDetails").innerHTML = M.questions.map((q, index) => {
      const item = map.get(q.id) || {};
      const awarded = Math.max(0, Math.min(q.marks, Number(item.awardedMarks || 0)));
      const confidence = Math.round(Math.max(0, Math.min(1, Number(item.confidence || 0))) * 100);
      return `<details class="result-question" ${index === 0 ? "open" : ""}><summary><b>Q${index + 1}. ${esc(q.question)}</b><span class="question-score">${mark(awarded)}/${q.marks}</span></summary><div class="result-question-body"><p><strong>Feedback:</strong> ${esc(item.feedback || "No additional feedback was returned.")}</p>${Array.isArray(item.missingPoints) && item.missingPoints.length ? `<p><strong>Missing or weak points:</strong> ${esc(item.missingPoints.join("; "))}</p>` : ""}<p class="confidence">Evaluation confidence: ${confidence}%</p></div></details>`;
    }).join("");
  }

  M.ui = { $, esc, complete, mark, renderQuestions, updateProgress, updateTimer, renderResult };
})();
