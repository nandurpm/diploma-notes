(() => {
  "use strict";
  const M = globalThis.PolyMock1004;
  const { $, esc, mark } = M.ui;
  const key = (kind) => `poly-mock-exam:${M.paperId}:${M.state.user?.id || "unknown"}:${kind}`;

  const fallbackRules = Object.freeze({
    Q1: ["stationary orbit", "angular momentum", "quantised", "transition", "hydrogen spectrum", "multi-electron", "fine structure"],
    Q2: ["principal", "subshell", "orientation", "spin", "aufbau", "pauli", "hund", "1s2", "4s2"],
    Q3: ["electron transfer", "sharing", "coordinate", "donated", "nacl", "nh4", "hydrogen bonding", "boiling point"],
    Q4: ["h/mv", "de broglie", "6.626", "9.11", "2.0", "3.64", "10^-10", "10⁻10", "metre", "meter"],
    Q5: ["mass/molar mass", "4/40", "0.1 mol", "500 ml", "0.5 l", "moles/volume", "0.20", "0.2 m"],
    Q6: ["n1v1", "n2v2", "0.10", "20", "25", "0.08 n", "0.08"],
    Q7: ["sedimentation", "coagulation", "filtration", "chlorination", "sterilisation", "temporary hardness", "permanent hardness", "bicarbonate", "chloride", "sulphate", "ion exchange", "lime soda"],
    Q8: ["thermoplastic", "thermosetting", "soften", "cross-linked", "polythene", "pvc", "nylon-66", "bakelite", "monomer", "uses"],
    Q9: ["nanomaterial", "nanotechnology", "0d", "1d", "2d", "nanoparticle", "nanotube", "graphene", "application"],
    Q10: ["corrosion", "chemical", "electrochemical", "barrier", "anodising", "anti-rust", "sacrificial anode", "cathodic protection"],
    Q11: ["mass proportional to charge", "chemical equivalent", "m =", "eit/f", "2 x 1800", "3600 c", "4.03 g", "4.03", "faraday"]
  });

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
    } catch (error) {
      console.warn("Could not restore mock-exam draft", error);
    }
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

  function isNonAnswer(value) {
    const text = String(value || "").trim().toLowerCase();
    if (text.length < 8) return true;
    return /^(?:i\s+)?(?:do\s*not|don't|dont)\s+know\b|^no idea\b|^not sure\b|^nil\b|^n\/?a\b/.test(text);
  }

  function localFallbackEvaluation(reason) {
    const results = M.questions.map((question) => {
      const answer = String(M.state.answers[question.id] || "").trim();
      const terms = fallbackRules[question.id] || [];
      if (isNonAnswer(answer)) {
        return {
          id: question.id,
          awardedMarks: 0,
          maxMarks: question.marks,
          confidence: 0.99,
          feedback: "No assessable answer was provided for this question.",
          missingPoints: ["Write the relevant concept, law, formula, working and final unit where applicable."]
        };
      }

      const normalised = answer.toLowerCase().replace(/×/g, "x").replace(/\s+/g, " ");
      const matched = terms.filter((term) => normalised.includes(term.toLowerCase()));
      const missing = terms.filter((term) => !normalised.includes(term.toLowerCase()));
      const coverage = terms.length ? matched.length / terms.length : 0;
      const lengthCredit = Math.min(0.2, answer.length / 1200);
      const raw = question.marks * Math.min(1, coverage * 1.15 + lengthCredit);
      const awardedMarks = Math.round(raw * 2) / 2;

      return {
        id: question.id,
        awardedMarks,
        maxMarks: question.marks,
        confidence: 0.5,
        feedback: awardedMarks > 0
          ? `Provisional rubric check detected ${matched.length} relevant point${matched.length === 1 ? "" : "s"}. This result was produced without the AI evaluator.`
          : "The response did not contain enough relevant chemistry content to award marks.",
        missingPoints: missing.slice(0, 5)
      };
    });

    const score = Math.round(results.reduce((sum, item) => sum + item.awardedMarks, 0) * 2) / 2;
    return {
      paperId: M.paperId,
      subjectCode: M.subjectCode,
      title: "Applied Chemistry Mock Examination",
      score,
      totalMarks: M.totalMarks,
      percentage: Math.round(score / M.totalMarks * 1000) / 10,
      status: "published",
      evaluationMode: "automated_rubric_fallback",
      model: "browser-rubric-v1",
      evaluatedAt: new Date().toISOString(),
      results,
      overallFeedback: "The AI evaluation service was temporarily unavailable, so a provisional rubric-based result was published instead. Your result is visible now and can be saved to your account.",
      fallbackReason: String(reason?.message || reason || "AI service unavailable").slice(0, 180)
    };
  }

  async function evaluate() {
    const url = endpoint();
    if (!url) return localFallbackEvaluation(new Error("AI evaluation service is not configured."));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
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
      if (!response.ok) throw new Error(data.error || `Evaluation service returned HTTP ${response.status}.`);
      return data;
    } catch (error) {
      console.error("AI evaluation unavailable; using provisional rubric result.", error);
      return localFallbackEvaluation(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  async function saveResult(result) {
    const now = new Date().toISOString();
    const payload = {
      user_id: M.state.user.id,
      subject_code: M.subjectCode,
      paper_code: M.paperId,
      answers: M.questions.map((q) => ({ id: q.id, answer: String(M.state.answers[q.id] || "").trim() })),
      ai_feedback: result,
      score: Number(result.score || 0),
      max_score: M.totalMarks,
      status: "published",
      submitted_at: now,
      published_at: now,
      updated_at: now
    };
    const { error } = await M.state.client.from("sample_paper_attempts").insert(payload);
    if (error) throw error;
  }

  async function loadHistory() {
    const box = $("attemptHistory");
    const { data, error } = await M.state.client.from("sample_paper_attempts")
      .select("id,score,max_score,ai_feedback,created_at,status")
      .eq("subject_code", M.subjectCode)
      .eq("paper_code", M.paperId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !data?.length) {
      box.innerHTML = `<div class="empty-state">${error ? "Online attempt history is temporarily unavailable." : "No saved mock-exam attempts yet."}</div>`;
      return;
    }

    box.innerHTML = `<table class="data-table"><thead><tr><th>Date</th><th>Score</th><th>Percentage</th><th>Evaluation</th><th>Status</th></tr></thead><tbody>${data.map((row) => {
      const maximum = Number(row.max_score || M.totalMarks);
      const score = Number(row.score || 0);
      const percentage = maximum > 0 ? score / maximum * 100 : 0;
      const mode = row.ai_feedback?.evaluationMode === "openai" ? "AI + Rubric" : "Automated Rubric";
      return `<tr><td>${esc(new Date(row.created_at).toLocaleString("en-IN"))}</td><td class="history-score">${mark(score)}/${mark(maximum)}</td><td>${mark(percentage)}%</td><td>${mode}</td><td>${esc(row.status || "published")}</td></tr>`;
    }).join("")}</tbody></table>`;
  }

  M.service = {
    key,
    loadSupabaseConfig,
    restoreDraft,
    saveDraft,
    startTimer,
    evaluate,
    saveResult,
    loadHistory
  };
})();
