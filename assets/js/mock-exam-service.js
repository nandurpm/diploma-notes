(() => {
  "use strict";
  const M = globalThis.PolyMock1004;
  const { $, esc, mark } = M.ui;
  const key = (kind) => `poly-mock-exam:${M.paperId}:${M.state.user?.id || "unknown"}:${kind}`;

  async function loadSupabaseConfig() {
    const response = await fetch("/daily-quiz.html", { cache: "no-cache" });
    if (!response.ok) throw new Error("The Mock Exams account configuration could not be loaded.");
    const copy = new DOMParser().parseFromString(await response.text(), "text/html");
    const url = copy.querySelector('meta[name="supabase-url"]')?.content || "";
    const publishableKey = copy.querySelector('meta[name="supabase-publishable-key"]')?.content || "";
    if (!url || !publishableKey) throw new Error("The Mock Exams account configuration is incomplete.");
    return { url, publishableKey };
  }

  function restoreDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(key("draft")) || "null");
      if (saved?.answers && typeof saved.answers === "object") M.state.answers = saved.answers;
    } catch (error) { console.warn("Could not restore mock-exam draft", error); }
  }

  function saveDraft() {
    try {
      localStorage.setItem(key("draft"), JSON.stringify({ answers: M.state.answers, savedAt: new Date().toISOString() }));
      $("saveStatus").textContent = "Answers saved in this browser";
      $("saveStatus").className = "save-status saved";
    } catch (error) {
      console.error(error);
      $("saveStatus").textContent = "Browser autosave unavailable";
      $("saveStatus").className = "save-status error";
    }
  }

  function startTimer() {
    const stored = Number(localStorage.getItem(key("started")) || 0);
    M.state.startedAt = stored > 0 ? stored : Date.now();
    if (!stored) localStorage.setItem(key("started"), String(M.state.startedAt));
    M.ui.updateTimer();
    M.state.timerId = setInterval(M.ui.updateTimer, 1000);
  }

  function endpoint() {
    const configured = String(globalThis.ASK_POLY_CONFIG?.endpoint || "").trim();
    if (!configured) return "";
    const url = new URL(configured, location.href);
    url.pathname = "/api/evaluate-mock-exam";
    url.search = "";
    url.hash = "";
    return url.toString();
  }

  async function evaluate() {
    const url = endpoint();
    if (!url) throw new Error("The AI evaluation service is not configured.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 150000);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          paperId: M.paperId,
          subjectCode: M.subjectCode,
          answers: M.questions.map((q) => ({ id: q.id, answer: String(M.state.answers[q.id] || "").trim() }))
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The evaluation service could not complete this attempt.");
      return data;
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("Evaluation took too long. Please submit again.");
      throw error;
    } finally { clearTimeout(timeout); }
  }

  async function saveResult(result) {
    const payload = {
      user_id: M.state.user.id,
      paper_id: M.paperId,
      subject_code: M.subjectCode,
      total_marks: M.totalMarks,
      awarded_marks: Number(result.score || 0),
      percentage: Number(result.percentage || 0),
      status: "published",
      evaluation_mode: String(result.evaluationMode || "openai"),
      model: String(result.model || ""),
      answers: M.questions.map((q) => ({ id: q.id, answer: String(M.state.answers[q.id] || "").trim() })),
      evaluation: result
    };
    const { error } = await M.state.client.from("mock_exam_submissions").insert(payload);
    if (error) throw error;
  }

  async function loadHistory() {
    const box = $("attemptHistory");
    const { data, error } = await M.state.client.from("mock_exam_submissions")
      .select("id,awarded_marks,total_marks,percentage,evaluation_mode,created_at,status")
      .eq("subject_code", M.subjectCode).order("created_at", { ascending: false }).limit(10);
    if (error || !data?.length) {
      box.innerHTML = `<div class="empty-state">${error ? "Online attempt history is not available yet." : "No saved mock-exam attempts yet."}</div>`;
      return;
    }
    box.innerHTML = `<table class="data-table"><thead><tr><th>Date</th><th>Score</th><th>Percentage</th><th>Evaluation</th><th>Status</th></tr></thead><tbody>${data.map((row) => `<tr><td>${esc(new Date(row.created_at).toLocaleString("en-IN"))}</td><td class="history-score">${mark(row.awarded_marks)}/${mark(row.total_marks)}</td><td>${mark(row.percentage)}%</td><td>${row.evaluation_mode === "openai" ? "AI + Rubric" : "Automated Rubric"}</td><td>${esc(row.status || "published")}</td></tr>`).join("")}</tbody></table>`;
  }

  M.service = { key, loadSupabaseConfig, restoreDraft, saveDraft, startTimer, evaluate, saveResult, loadHistory };
})();
