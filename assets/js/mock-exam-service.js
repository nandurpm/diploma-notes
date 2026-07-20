(() => {
  "use strict";
  const M = globalThis.PolyMock1004;
  const { $, esc, mark } = M.ui;
  const DEFAULT_SUPABASE_URL = "https://hwobooljdvynsajtrvnk.supabase.co";
  const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "";
  const DEFAULT_TIMEOUT_MS = 30000;
  const key = (kind) => `poly-mock-exam:${M.paperId}:${M.state.user?.id || "unknown"}:${kind}`;

  const chemistryExact = Object.freeze({
    A1: ["orbital"], A2: ["covalent"], A3: ["water"], A4: ["phenolphthalein"],
    A5: ["temporary"], A6: ["brass"], A7: ["borosilicate", "pyrex"], A8: ["ion", "ions"], A9: ["oxidation"]
  });
  const exactAnswers = Object.freeze(M.exactAnswers || chemistryExact);
  const keywords = Object.freeze(M.keywords || {});

  async function loadSupabaseConfig() {
    try {
      const response = await fetch(`/daily-quiz.html?auth_config=${Date.now()}`, { cache: "no-store" });
      if (response.ok) {
        const copy = new DOMParser().parseFromString(await response.text(), "text/html");
        const url = copy.querySelector('meta[name="supabase-url"]')?.content || "";
        const publishableKey = copy.querySelector('meta[name="supabase-publishable-key"]')?.content || "";
        if (url && publishableKey) return { url, publishableKey };
      }
    } catch (error) {
      console.warn("Could not read account config from daily-quiz.html; using built-in Mock Exams config.", error);
    }
    return { url: DEFAULT_SUPABASE_URL, publishableKey: DEFAULT_SUPABASE_PUBLISHABLE_KEY };
  }

  function restoreDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(key("draft")) || "null");
      if (saved?.answers && typeof saved.answers === "object") M.state.answers = saved.answers;
      if (Array.isArray(saved?.selections?.partB)) M.state.selections.partB = saved.selections.partB.slice(0, 8);
      if (saved?.selections?.partC && typeof saved.selections.partC === "object") M.state.selections.partC = saved.selections.partC;
    } catch (error) { console.warn("Could not restore mock-exam draft", error); }
  }

  function saveDraft() {
    try {
      localStorage.setItem(key("draft"), JSON.stringify({ answers: M.state.answers, selections: M.state.selections, savedAt: new Date().toISOString() }));
      $("saveStatus").textContent = "Answers and choices saved in this browser";
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
    const configured = String(globalThis.ASK_POLY_CONFIG?.mockExamEndpoint || "").trim();
    if (!configured) return "";
    const url = new URL(configured, location.href);
    if (!/^https:$/.test(url.protocol) && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return "";
    return url.toString();
  }

  function isNonAnswer(value) {
    const text = String(value || "").trim().toLowerCase();
    return !text || /^(?:i\s+)?(?:do\s*not|don't|dont)\s+know\b|^no idea\b|^not sure\b|^nil\b|^n\/?a\b/.test(text);
  }

  function selectedPayload() {
    return M.ui.selectedQuestions().map((q) => ({ id: q.id, answer: String(M.state.answers[q.id] || "").trim() }));
  }

  function norm(value) {
    return String(value || "").toLowerCase().replace(/×/g, "x").replace(/\s+/g, " ").trim();
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function canUseRubricFallback(error) {
    if (globalThis.ASK_POLY_CONFIG?.mockExamRubricFallback === false) return false;
    if (error?.name === "AbortError") return true;
    if (!navigator.onLine) return true;
    if (!error?.status) return true;
    return error.status === 429 || error.status >= 500;
  }

  function localFallbackEvaluation(reason) {
    const results = M.ui.selectedQuestions().map((question) => {
      const answer = String(M.state.answers[question.id] || "").trim();
      if (isNonAnswer(answer)) {
        return { id: question.id, awardedMarks: 0, maxMarks: question.marks, confidence: 0.99, feedback: "No assessable answer was provided.", missingPoints: ["Provide the required fact, explanation, formula, steps or final value."] };
      }
      const normalised = norm(answer);
      if (question.section === "A") {
        const accepted = exactAnswers[question.id] || [];
        const correct = accepted.some((term) => normalised.includes(norm(term)));
        return { id: question.id, awardedMarks: correct ? 1 : 0, maxMarks: 1, confidence: 0.7, feedback: correct ? "Keyword matched." : "The answer did not match the expected key concept.", missingPoints: correct ? [] : accepted.slice(0, 2) };
      }
      const terms = keywords[question.id] || [];
      const matched = terms.filter((term) => normalised.includes(norm(term)));
      const missing = terms.filter((term) => !normalised.includes(norm(term)));
      const coverage = terms.length ? matched.length / terms.length : 0;
      const lengthCredit = Math.min(0.18, answer.length / 1600);
      const awardedMarks = Math.round(question.marks * Math.min(1, coverage * 1.2 + lengthCredit) * 2) / 2;
      return { id: question.id, awardedMarks, maxMarks: question.marks, confidence: 0.35, feedback: awardedMarks > 0 ? `Provisional keyword check found ${matched.length} relevant point${matched.length === 1 ? "" : "s"}.` : "The browser rubric did not find enough relevant content.", missingPoints: missing.slice(0, 5) };
    });
    const score = Math.round(results.reduce((sum, item) => sum + item.awardedMarks, 0) * 2) / 2;
    return {
      paperId: M.paperId,
      subjectCode: M.subjectCode,
      title: M.examTitle || M.displayName || "Official-Pattern Mock Examination",
      score,
      totalMarks: M.totalMarks,
      percentage: Math.round(score / M.totalMarks * 1000) / 10,
      status: "provisional",
      evaluationMode: "browser-rubric-provisional",
      model: "browser-rubric-v7",
      evaluatedAt: new Date().toISOString(),
      results,
      overallFeedback: "This is a provisional browser-only estimate because the server evaluator was unavailable. It is not an official or authoritative score and is not saved to online history.",
      fallbackReason: String(reason?.message || reason || "AI service unavailable").slice(0, 180),
      savedOnline: false
    };
  }

  async function accessToken() {
    try {
      const { data } = await M.state.client?.auth?.getSession?.();
      return data?.session?.access_token || "";
    } catch (_) {
      return "";
    }
  }

  async function evaluate() {
    const url = endpoint();
    if (!url) throw new Error("The mock-exam evaluation endpoint is not configured correctly.");
    const controller = new AbortController();
    const timeoutMs = Number(globalThis.ASK_POLY_CONFIG?.mockExamTimeoutMs || DEFAULT_TIMEOUT_MS);
    const timeout = setTimeout(() => controller.abort(), Math.max(8000, timeoutMs));
    try {
      const token = await accessToken();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          paperId: M.paperId,
          subjectCode: M.subjectCode,
          title: M.examTitle || M.displayName,
          selections: M.state.selections,
          answers: selectedPayload()
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.error || `Evaluation service returned HTTP ${response.status}.`);
        error.status = response.status;
        throw error;
      }
      if (!data || data.paperId !== M.paperId || !Array.isArray(data.results)) throw new Error("The evaluator returned an invalid result.");
      return data;
    } catch (error) {
      console.error("Server evaluation unavailable.", error);
      if (canUseRubricFallback(error)) return localFallbackEvaluation(error);
      throw new Error(error.message || "Evaluation is temporarily unavailable. Your answers remain saved; please submit again.");
    } finally {
      clearTimeout(timeout);
    }
  }

  async function saveResult(result) {
    if (result?.status !== "published" || result?.evaluationMode === "browser-rubric-provisional") {
      throw new Error("Provisional browser results are not stored as authoritative online scores.");
    }
    if (result?.savedOnline === true || result?.serverSaved === true) return;
    throw new Error("The evaluator did not confirm server-side result storage. The result remains available only in this browser.");
  }

  async function loadHistory() {
    const box = $("attemptHistory");
    const { data, error } = await M.state.client.from("sample_paper_attempts").select("id,score,max_score,ai_feedback,created_at,status").eq("user_id", M.state.user.id).eq("subject_code", M.subjectCode).eq("paper_code", M.paperId).order("created_at", { ascending: false }).limit(10);
    if (error || !data?.length) {
      box.innerHTML = `<div class="empty-state">${error ? "Verified online attempt history is temporarily unavailable." : "No verified online mock-exam attempts yet."}</div>`;
      return;
    }
    box.innerHTML = `<table class="data-table"><thead><tr><th>Date</th><th>Score</th><th>Percentage</th><th>Evaluation</th><th>Status</th></tr></thead><tbody>${data.map((row) => {
      const maximum = Number(row.max_score || M.totalMarks);
      const score = Number(row.score || 0);
      const percentage = maximum > 0 ? score / maximum * 100 : 0;
      const mode = M.ui.evaluationLabel ? M.ui.evaluationLabel(row.ai_feedback?.evaluationMode) : "Server evaluation";
      return `<tr><td>${esc(new Date(row.created_at).toLocaleString("en-IN"))}</td><td class="history-score">${mark(score)}/${mark(maximum)}</td><td>${mark(percentage)}%</td><td>${esc(mode)}</td><td>${esc(row.status || "published")}</td></tr>`;
    }).join("")}</tbody></table>`;
  }

  M.service = { key, loadSupabaseConfig, restoreDraft, saveDraft, startTimer, evaluate, saveResult, loadHistory };
})();
