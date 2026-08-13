/* Purpose: Mock exam mode label fix - Descriptive comment added for clarity */
(() => {
  "use strict";
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const M = globalThis.PolyMock1004;
    if (!M?.ui?.renderResult) {
      if (attempts > 200) clearInterval(timer);
      return;
    }
    if (M.ui.renderResult.__modeLabelFixed) {
      clearInterval(timer);
      return;
    }
    const original = M.ui.renderResult;
    const wrapped = function renderResultWithMode(result) {
      original(result);
      const mode = String(result?.evaluationMode || "").toLowerCase();
      const label = document.getElementById("evaluationMode");
      if (!label) return;
      if (mode === "ai" || mode === "openai") label.textContent = "AI + Rubric";
      else if (mode === "ai_partial") label.textContent = "AI + Rubric (Partial fallback)";
      else label.textContent = "Automated Rubric";
      label.dataset.evaluationMode = mode;
    };
    wrapped.__modeLabelFixed = true;
    M.ui.renderResult = wrapped;
    clearInterval(timer);
  }, 50);
})();
