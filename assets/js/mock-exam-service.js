/* Purpose: Mock exam service - Descriptive comment added for clarity */
(() => {
  "use strict";
  const M = globalThis.PolyMock1004;
  const { $, esc, mark } = M.ui;
  const DEFAULT_SUPABASE_URL = "https://hwobooljdvynsajtrvnk.supabase.co";
  const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "";
  const DEFAULT_TIMEOUT_MS = 30000;
  const GUEST_RESULTS_KEY = "polypmna_guest_mock_exam_results";
  const key = (kind) => `poly-mock-exam:${M.paperId}:${M.state.user?.id || "unknown"}:${kind}`;

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

  function selectedPayload() {
    return M.ui.selectedQuestions().map((q) => ({ id: q.id, answer: String(M.state.answers[q.id] || "").trim() }));
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
      throw new Error(error.message || "Server evaluation is temporarily unavailable. Your answers remain saved; please submit again.");
    } finally {
      clearTimeout(timeout);
    }
  }

  async function saveResult(result) {
    if (M.state.guest) {
      try {
        const results = JSON.parse(localStorage.getItem(GUEST_RESULTS_KEY) || "[]");
        const entry = {
          attemptId: `guest-${Date.now()}`,
          paperId: M.paperId,
          subjectCode: M.subjectCode,
          title: result.title || M.displayName,
          score: result.score,
          totalMarks: result.totalMarks || M.totalMarks,
          percentage: result.percentage,
          evaluationMode: result.evaluationMode,
          status: result.status,
          evaluatedAt: result.evaluatedAt || new Date().toISOString(),
          overallFeedback: result.overallFeedback,
          attemptedCount: (result.results || []).length,
          timeTakenSeconds: Math.floor((Date.now() - M.state.startedAt) / 1000),
          revision: M.heroEyebrow || "",
        };
        results.unshift(entry);
        localStorage.setItem(GUEST_RESULTS_KEY, JSON.stringify(results.slice(0, 100)));
        return;
      } catch (error) {
        console.error("Guest result storage failed", error);
        throw new Error("Could not save result to browser history.");
      }
    }

    if (result?.status !== "published") {
      throw new Error("Only server-published results can be stored as authoritative online scores.");
    }
    if (result?.savedOnline === true || result?.serverSaved === true) return;
    throw new Error("The evaluator did not confirm server-side result storage. The result remains available only in this browser.");
  }

  async function loadHistory() {
    const box = $("attemptHistory");
    let history = [];
    let isGuest = M.state.guest;

    if (isGuest) {
      try {
        const all = JSON.parse(localStorage.getItem(GUEST_RESULTS_KEY) || "[]");
        history = all.filter(r => r.paperId === M.paperId);
      } catch (error) {
        console.error("Failed to load guest history", error);
      }
    } else {
      const { data, error } = await M.state.client.from("sample_paper_attempts").select("id,score,max_score,ai_feedback,created_at,status").eq("user_id", M.state.user.id).eq("subject_code", M.subjectCode).eq("paper_code", M.paperId).order("created_at", { ascending: false }).limit(10);
      if (error) {
        box.innerHTML = `<div class="empty-state">Verified online attempt history is temporarily unavailable.</div>`;
        return;
      }
      history = (data || []).map(row => ({
        evaluatedAt: row.created_at,
        score: row.score,
        totalMarks: row.max_score || M.totalMarks,
        evaluationMode: row.ai_feedback?.evaluationMode || "Server evaluation",
        status: row.status || "published"
      }));
    }

    if (!history.length) {
      box.innerHTML = `<div class="empty-state">${isGuest ? "No local guest attempts yet." : "No verified online mock-exam attempts yet."}</div>`;
      return;
    }

    box.innerHTML = `<table class="data-table"><thead><tr><th>Date</th><th>Score</th><th>Percentage</th><th>Evaluation</th><th>Status</th></tr></thead><tbody>${history.map((row) => {
      const maximum = Number(row.totalMarks || M.totalMarks);
      const score = Number(row.score || 0);
      const percentage = maximum > 0 ? score / maximum * 100 : 0;
      const mode = M.ui.evaluationLabel ? M.ui.evaluationLabel(row.evaluationMode) : (row.evaluationMode || "Evaluation");
      return `<tr><td>${esc(new Date(row.evaluatedAt).toLocaleString("en-IN"))}</td><td class="history-score">${mark(score)}/${mark(maximum)}</td><td>${mark(percentage.toFixed(1))}%</td><td>${esc(mode)}</td><td>${esc(row.status)}</td></tr>`;
    }).join("")}</tbody></table>`;
    
    if (isGuest) {
      const notice = document.createElement("p");
      notice.className = "info";
      notice.style.marginTop = "12px";
      notice.textContent = "Guest Result: Your Mock Exam history is saved only on this device/browser. Logging in may provide account-based result storage.";
      box.appendChild(notice);
      
      const clearBtn = $("clearGuestHistory");
      if (clearBtn) {
        clearBtn.classList.remove("hidden");
        clearBtn.onclick = () => {
          if (confirm("Clear all guest mock exam history from this browser? This cannot be undone.")) {
            localStorage.removeItem(GUEST_RESULTS_KEY);
            loadHistory();
          }
        };
      }
    } else {
      $("clearGuestHistory")?.classList.add("hidden");
    }
  }

  M.service = { key, loadSupabaseConfig, restoreDraft, saveDraft, startTimer, evaluate, saveResult, loadHistory };
})();
