(() => {
  "use strict";
  const M = globalThis.PolyMock1004;
  const { $, esc, mark } = M.ui;
  const key = (kind) => `poly-mock-exam:${M.paperId}:${M.state.user?.id || "unknown"}:${kind}`;

  const exactAnswers = Object.freeze({
    A1: ["orbital"], A2: ["covalent"], A3: ["water"], A4: ["phenolphthalein"],
    A5: ["temporary"], A6: ["brass"], A7: ["borosilicate", "pyrex"],
    A8: ["ion", "ions"], A9: ["oxidation"]
  });

  const keywords = Object.freeze({
    B1: ["lambda", "h/mv", "6.626", "10^-35", "10⁻35", "m"],
    B2: ["hydrogen bond", "boiling", "surface tension", "density", "ice"],
    B3: ["lime", "soda", "calcium", "magnesium", "precipitate", "filtration"],
    B4: ["ph", "-log", "0.005", "2.30"],
    B5: ["normality", "3.95", "31.6", "0.25", "0.5 n", "0.50"],
    B6: ["nanomaterial", "1-100", "nanoparticle", "nanotube", "graphene"],
    B7: ["sulphur", "cross-link", "elastic", "strength", "wear"],
    B8: ["soften", "remould", "cross-link", "thermoplastic", "thermosetting"],
    B9: ["electron", "ion", "chemical change", "temperature", "solid", "solution"],
    B10: ["zn", "zn2+", "cu2+", "cu", "oxidation", "reduction"],
    C1A: ["electron transfer", "sharing", "ionic", "covalent", "pauli", "two electrons", "opposite spin"],
    C1B: ["stationary orbit", "angular momentum", "transition", "hydrogen spectrum", "stability"],
    C2A: ["sedimentation", "coagulation", "filtration", "chlorination", "boiler", "scale", "corrosion"],
    C2B: ["1.825", "36.5", "0.2 n", "n1v1", "40 ml", "buffer", "resist ph"],
    C3A: ["agriculture", "medicine", "soil", "blood", "industry", "equivalent point", "end point", "indicator"],
    C3B: ["soap", "scale", "boiler", "textile", "kw", "h+", "oh-", "10^-14"],
    C4A: ["addition polymer", "condensation polymer", "monomer", "by-product", "polythene", "nylon"],
    C4B: ["refractory", "high temperature", "thermal shock", "chemical resistance", "furnace", "kiln"],
    C5A: ["electrolysis", "nickel", "cathode", "anode", "electrolyte", "clean", "deposit"],
    C5B: ["equivalent mass", "charge", "4", "1500", "6000", "1.825", "faraday"],
    C6A: ["barrier", "paint", "anodising", "anti-rust", "sacrificial anode", "cathodic"],
    C6B: ["electrochemical cell", "spontaneous", "non-spontaneous", "galvanic", "electrolytic", "anode", "cathode"]
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
      if (Array.isArray(saved?.selections?.partB)) M.state.selections.partB = saved.selections.partB.slice(0, 8);
      if (saved?.selections?.partC && typeof saved.selections.partC === "object") M.state.selections.partC = saved.selections.partC;
    } catch (error) {
      console.warn("Could not restore mock-exam draft", error);
    }
  }

  function saveDraft() {
    try {
      localStorage.setItem(key("draft"), JSON.stringify({
        answers: M.state.answers,
        selections: M.state.selections,
        savedAt: new Date().toISOString()
      }));
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
    return !text || /^(?:i\s+)?(?:do\s*not|don't|dont)\s+know\b|^no idea\b|^not sure\b|^nil\b|^n\/?a\b/.test(text);
  }

  function selectedPayload() {
    return M.ui.selectedQuestions().map((q) => ({ id: q.id, answer: String(M.state.answers[q.id] || "").trim() }));
  }

  function localFallbackEvaluation(reason) {
    const results = M.ui.selectedQuestions().map((question) => {
      const answer = String(M.state.answers[question.id] || "").trim();
      if (isNonAnswer(answer)) {
        return { id: question.id, awardedMarks: 0, maxMarks: question.marks, confidence: 0.99, feedback: "No assessable answer was provided.", missingPoints: ["Provide the required chemistry fact, explanation, calculation or reaction."] };
      }

      const normalised = answer.toLowerCase().replace(/×/g, "x").replace(/\s+/g, " ");
      if (question.section === "A") {
        const accepted = exactAnswers[question.id] || [];
        const correct = accepted.some((term) => normalised.includes(term));
        return {
          id: question.id,
          awardedMarks: correct ? 1 : 0,
          maxMarks: 1,
          confidence: 0.95,
          feedback: correct ? "Correct." : "The one-word or one-sentence answer does not match the expected concept.",
          missingPoints: correct ? [] : accepted.slice(0, 2)
        };
      }

      const terms = keywords[question.id] || [];
      const matched = terms.filter((term) => normalised.includes(term.toLowerCase()));
      const missing = terms.filter((term) => !normalised.includes(term.toLowerCase()));
      const coverage = terms.length ? matched.length / terms.length : 0;
      const lengthCredit = Math.min(0.18, answer.length / 1600);
      const awardedMarks = Math.round(question.marks * Math.min(1, coverage * 1.2 + lengthCredit) * 2) / 2;
      return {
        id: question.id,
        awardedMarks,
        maxMarks: question.marks,
        confidence: 0.5,
        feedback: awardedMarks > 0 ? `Provisional rubric check found ${matched.length} relevant point${matched.length === 1 ? "" : "s"}.` : "The response did not contain enough relevant chemistry content to award marks.",
        missingPoints: missing.slice(0, 5)
      };
    });

    const score = Math.round(results.reduce((sum, item) => sum + item.awardedMarks, 0) * 2) / 2;
    return {
      paperId: M.paperId,
      subjectCode: M.subjectCode,
      title: "Applied Chemistry Official-Pattern Mock Examination",
      score,
      totalMarks: M.totalMarks,
      percentage: Math.round(score / M.totalMarks * 1000) / 10,
      status: "published",
      evaluationMode: "automated_rubric_fallback",
      model: "browser-rubric-v2",
      evaluatedAt: new Date().toISOString(),
      results,
      overallFeedback: "The AI service was temporarily unavailable, so a provisional rubric-based result was published. The paper structure and maximum marks follow the official model-question-paper pattern.",
      fallbackReason: String(reason?.message || reason || "AI service unavailable").slice(0, 180)
    };
  }

  async function evaluate() {
    const url = endpoint();
    if (!url) return localFallbackEvaluation(new Error("AI evaluation service is not configured."));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          paperId: M.paperId,
          subjectCode: M.subjectCode,
          selections: M.state.selections,
          answers: selectedPayload()
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
      answers: { selections: M.state.selections, responses: selectedPayload() },
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

  M.service = { key, loadSupabaseConfig, restoreDraft, saveDraft, startTimer, evaluate, saveResult, loadHistory };
})();
