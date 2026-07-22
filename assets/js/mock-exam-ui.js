/* Purpose: Mock exam ui - Descriptive comment added for clarity */
(() => {
  "use strict";
  const M = globalThis.PolyMock1004;
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
  const mark = (value) => Number.isInteger(Number(value || 0)) ? String(Number(value || 0)) : Number(value || 0).toFixed(1).replace(/\.0$/, "");
  const completeFor = (question, value) => String(value || "").trim().length >= (question.section === "A" ? 1 : 8);
  const evaluationLabel = (mode) => {
    const value = String(mode || "").toLowerCase();
    if (value === "ai_partial") return "AI + Rubric (Partial)";
    if (value === "ai" || value === "openai") return "AI + Rubric";
    return "Automated Rubric";
  };

  function selectedQuestions() {
    const b = new Set(M.state.selections.partB || []);
    const c = new Set(Object.values(M.state.selections.partC || {}));
    return [...M.partA, ...M.partB.filter((q) => b.has(q.id)), ...M.partC.filter((q) => c.has(q.id))];
  }

  function validation() {
    const selectedB = M.state.selections.partB || [];
    const selectedC = M.state.selections.partC || {};
    const missing = [];
    if (selectedB.length !== 8) missing.push(`Select exactly 8 Part B questions (${selectedB.length}/8 selected).`);
    M.pairs.forEach((pair) => {
      if (!selectedC[pair]) missing.push(`Choose one option from Part C pair ${pair.replace("C", "")}.`);
    });
    selectedQuestions().forEach((q) => {
      if (!completeFor(q, M.state.answers[q.id])) missing.push(`${q.section}${q.number}: answer is incomplete.`);
    });
    return { ready: missing.length === 0, missing, selected: selectedQuestions() };
  }

  function updateAnswer(question, value) {
    const text = String(value || "");
    const done = completeFor(question, text);
    const status = $(`status-${question.id}`);
    if (status) {
      status.textContent = done ? "Answered" : text.trim() ? "Needs more detail" : "Not answered";
      status.classList.toggle("complete", done);
    }
    const counter = $(`count-${question.id}`);
    if (counter) counter.textContent = `${text.length} / 4000`;
    $(`nav-${question.id}`)?.classList.toggle("answered", done && selectedQuestions().some((q) => q.id === question.id));
  }

  function syncSelectionControls() {
    const selectedB = new Set(M.state.selections.partB || []);
    document.querySelectorAll('input[data-part-b-select]').forEach((input) => {
      input.checked = selectedB.has(input.value);
      input.disabled = !input.checked && selectedB.size >= 8;
      const box = $(`answer-${input.value}`);
      if (box) box.disabled = !input.checked;
    });

    M.pairs.forEach((pair) => {
      const chosen = M.state.selections.partC?.[pair] || "";
      M.partC.filter((q) => q.pair === pair).forEach((q) => {
        const radio = document.querySelector(`input[name="pair-${pair}"][value="${q.id}"]`);
        if (radio) radio.checked = chosen === q.id;
        const box = $(`answer-${q.id}`);
        if (box) box.disabled = chosen !== q.id;
      });
    });
  }

  function updateProgress() {
    const selected = selectedQuestions();
    const answered = selected.filter((q) => completeFor(q, M.state.answers[q.id])).length;
    const target = 23;
    $("answeredCount").textContent = `${answered}/${target}`;
    $("answerProgress").style.width = `${Math.round(answered / target * 100)}%`;
    const check = validation();
    const ready = check.ready && !M.state.submitting;
    $("submitExam").disabled = !ready;
    $("submitExamSide").disabled = !ready;
    document.querySelectorAll("[data-selection-summary]").forEach((node) => {
      node.textContent = `Part B selected: ${(M.state.selections.partB || []).length}/8 · Part C choices: ${Object.keys(M.state.selections.partC || {}).length}/6`;
    });
  }

  function questionHtml(q, selectionControl = "") {
    const short = q.section === "A";
    return `<article class="mock-question" id="question-${esc(q.id)}" data-section="${q.section}"><div class="mock-question-head"><span class="mock-question-number">${esc(q.number)}</span><div><h3>${esc(q.question).replace(/\n/g, "<br>")}</h3><div class="question-tags"><span>${esc(q.module)}</span><span>${esc(q.type)}</span><span class="marks">${q.marks} mark${q.marks === 1 ? "" : "s"}</span></div>${selectionControl}</div></div><div class="answer-field"><label for="answer-${esc(q.id)}">Your answer</label><textarea id="answer-${esc(q.id)}" data-question-id="${esc(q.id)}" maxlength="4000" rows="${short ? 2 : 6}" spellcheck="true" placeholder="${short ? "Enter one word or one sentence." : "Write a complete answer. Include formulas, steps and units where applicable."}"></textarea><div class="answer-meta"><span id="status-${esc(q.id)}">Not answered</span><span id="count-${esc(q.id)}">0 / 4000</span></div></div></article>`;
  }

  function renderQuestions(onInput) {
    const partA = `<section class="paper-part"><header class="paper-part-title"><p>PART A</p><h2>Answer all questions in one word or one sentence</h2><strong>9 × 1 = 9 Marks</strong></header>${M.partA.map((q) => questionHtml(q)).join("")}</section>`;
    const partB = `<section class="paper-part"><header class="paper-part-title"><p>PART B</p><h2>Answer any eight questions</h2><strong>8 × 3 = 24 Marks</strong><small data-selection-summary></small></header>${M.partB.map((q) => questionHtml(q, `<label class="question-select"><input type="checkbox" data-part-b-select value="${q.id}"> Include this question</label>`)).join("")}</section>`;
    const pairs = M.pairs.map((pair, index) => { const options = M.partC.filter((q) => q.pair === pair); return `<fieldset class="or-pair"><legend>Question ${index + 1}: answer either ${options[0].number} or ${options[1].number}</legend>${options.map((q, optionIndex) => `${optionIndex ? '<div class="or-divider">OR</div>' : ""}${questionHtml(q, `<label class="question-select"><input type="radio" name="pair-${pair}" value="${q.id}"> Answer Question ${q.number}</label>`)}`).join("")}</fieldset>`; }).join("");
    const partC = `<section class="paper-part"><header class="paper-part-title"><p>PART C</p><h2>Answer all six questions by choosing one option from each OR pair</h2><strong>6 × 7 = 42 Marks</strong><small data-selection-summary></small></header>${pairs}</section>`;
    $("questionList").innerHTML = partA + partB + partC;
    $("questionNav").innerHTML = M.questions.map((q) => `<a href="#question-${esc(q.id)}" id="nav-${esc(q.id)}" aria-label="Go to ${q.section}${q.number}">${esc(q.number)}</a>`).join("");
    document.querySelectorAll("textarea[data-question-id]").forEach((box) => { const question = M.questions.find((q) => q.id === box.dataset.questionId); box.value = M.state.answers[question.id] || ""; box.addEventListener("input", () => { M.state.answers[question.id] = box.value; updateAnswer(question, box.value); updateProgress(); onInput(); }); updateAnswer(question, box.value); });
    document.querySelectorAll('input[data-part-b-select]').forEach((input) => { input.addEventListener("change", () => { const current = new Set(M.state.selections.partB || []); if (input.checked) current.add(input.value); else current.delete(input.value); if (current.size > 8) { input.checked = false; alert("Part B allows exactly eight questions."); return; } M.state.selections.partB = [...current]; syncSelectionControls(); updateProgress(); onInput(); }); });
    document.querySelectorAll('input[type="radio"][name^="pair-"]').forEach((radio) => { radio.addEventListener("change", () => { const pair = radio.name.replace("pair-", ""); M.state.selections.partC[pair] = radio.value; syncSelectionControls(); updateProgress(); onInput(); }); });
    syncSelectionControls(); updateProgress();
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
    $("timerNote").textContent = remaining === 0 ? "Practice time completed" : remaining <= 900 ? "Finish and submit soon" : "Official model duration";
    if (!remaining && M.state.timerId) { clearInterval(M.state.timerId); M.state.timerId = null; }
  }

  function renderResult(result) {
    const score = Math.max(0, Math.min(M.totalMarks, Number(result.score || 0)));
    const percent = Math.max(0, Math.min(100, Number(result.percentage ?? score / M.totalMarks * 100)));
    $("resultScore").textContent = `${mark(score)}/${M.totalMarks}`;
    $("resultPercent").textContent = `${mark(percent)}%`;
    $("resultMeta").textContent = `${new Date().toLocaleString("en-IN")} · ${result.savedOnline === false ? "Published on this page" : "Saved to your account"}`;
    $("evaluationMode").textContent = evaluationLabel(result.evaluationMode);
    $("overallFeedback").textContent = `${result.overallFeedback || "Review the question-wise feedback below."}${result.saveWarning ? ` ${result.saveWarning}` : ""}`;
    const questionMap = new Map(M.questions.map((q) => [q.id, q]));
    $("resultDetails").innerHTML = (result.results || []).map((item, index) => { const q = questionMap.get(String(item.id)); if (!q) return ""; const awarded = Math.max(0, Math.min(q.marks, Number(item.awardedMarks || 0))); const confidence = Math.round(Math.max(0, Math.min(1, Number(item.confidence || 0))) * 100); return `<details class="result-question" ${index === 0 ? "open" : ""}><summary><b>${esc(q.section)} ${esc(q.number)}. ${esc(q.question)}</b><span class="question-score">${mark(awarded)}/${q.marks}</span></summary><div class="result-question-body"><p><strong>Feedback:</strong> ${esc(item.feedback || "No additional feedback was returned.")}</p>${Array.isArray(item.missingPoints) && item.missingPoints.length ? `<p><strong>Missing or weak points:</strong> ${esc(item.missingPoints.join("; "))}</p>` : ""}<p class="confidence">Evaluation confidence: ${confidence}%</p></div></details>`; }).join("");
  }

  M.ui = { $, esc, mark, completeFor, selectedQuestions, validation, renderQuestions, updateProgress, updateTimer, renderResult, evaluationLabel };
})();
