(() => {
  "use strict";
  const M = globalThis.PolyMock1004;
  const { $, complete } = M.ui;
  let saveTimer = null;
  const show = (id) => $(id)?.classList.remove("hidden");
  const hide = (id) => $(id)?.classList.add("hidden");

  function scheduleSave() {
    clearTimeout(saveTimer);
    $("saveStatus").textContent = "Saving…";
    saveTimer = setTimeout(M.service.saveDraft, 350);
  }

  async function submit() {
    if (M.state.submitting) return;
    const missing = M.questions.filter((q) => !complete(M.state.answers[q.id]));
    if (missing.length) {
      $("examMessage").textContent = `Complete all answers before submission. Incomplete: ${missing.map((q) => q.id).join(", ")}.`;
      $("examMessage").className = "status-message error";
      $(`question-${missing[0].id}`)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (!confirm("Submit all 11 answers for evaluation? The current attempt will be published after evaluation.")) return;
    M.state.submitting = true;
    M.ui.updateProgress();
    hide("examView");
    show("evaluatingView");
    scrollTo({ top: 0, behavior: "smooth" });
    try {
      const result = await M.service.evaluate();
      try {
        await M.service.saveResult(result);
        result.savedOnline = true;
      } catch (error) {
        console.error(error);
        result.savedOnline = false;
        result.saveWarning = "The score was published on this page, but online history storage is temporarily unavailable.";
      }
      localStorage.setItem(M.service.key("latest-result"), JSON.stringify(result));
      localStorage.removeItem(M.service.key("draft"));
      localStorage.removeItem(M.service.key("started"));
      M.ui.renderResult(result);
      hide("evaluatingView");
      show("resultView");
      await M.service.loadHistory();
      scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      hide("evaluatingView");
      show("examView");
      $("examMessage").textContent = error.message || "Evaluation failed. Your answers remain saved; please submit again.";
      $("examMessage").className = "status-message error";
    } finally {
      M.state.submitting = false;
      M.ui.updateProgress();
    }
  }

  function newAttempt() {
    if (!confirm("Start a new attempt? The published result remains in your history.")) return;
    M.state.answers = Object.create(null);
    ["draft", "started", "latest-result"].forEach((name) => localStorage.removeItem(M.service.key(name)));
    M.state.startedAt = Date.now();
    localStorage.setItem(M.service.key("started"), String(M.state.startedAt));
    M.ui.renderQuestions(scheduleSave);
    hide("resultView");
    show("examView");
    if (!M.state.timerId) M.state.timerId = setInterval(M.ui.updateTimer, 1000);
    M.ui.updateTimer();
    scrollTo({ top: 0, behavior: "smooth" });
  }

  async function initialize() {
    document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = String(new Date().getFullYear()); });
    $("submitExam").addEventListener("click", submit);
    $("submitExamSide").addEventListener("click", submit);
    $("newAttempt").addEventListener("click", newAttempt);
    if (!window.supabase?.createClient) {
      hide("loadingView");
      show("authRequired");
      return;
    }
    try {
      const config = await M.service.loadSupabaseConfig();
      M.state.client = window.supabase.createClient(config.url, config.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      const { data: { session }, error } = await M.state.client.auth.getSession();
      if (error) throw error;
      if (!session?.user) {
        hide("loadingView");
        show("authRequired");
        return;
      }
      M.state.user = session.user;
      $("studentName").textContent = session.user.user_metadata?.username || session.user.email || "Authenticated student";
      M.service.restoreDraft();
      M.ui.renderQuestions(scheduleSave);
      M.service.startTimer();
      hide("loadingView");
      show("examView");
    } catch (error) {
      console.error(error);
      hide("loadingView");
      show("authRequired");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
