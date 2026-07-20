(() => {
  "use strict";

  const MOCK_EXAM_ASSET_VERSION = "20260720-audit-security-fix1";

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${src}?v=${MOCK_EXAM_ASSET_VERSION}`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.head.append(script);
    });
  }

  Promise.resolve()
    .then(() => loadScript("/assets/js/mock-exam-paper.js"))
    .then(() => loadScript("/assets/js/mock-exam-ui.js"))
    .then(() => loadScript("/assets/js/mock-exam-service.js"))
    .then(start)
    .catch((error) => {
      console.error(error);
      document.getElementById("loadingView")?.classList.add("hidden");
      document.getElementById("authRequired")?.classList.remove("hidden");
    });

  function start() {
    const M = globalThis.PolyMock1004;
    const { $ } = M.ui;
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
      const check = M.ui.validation();
      if (!check.ready) {
        $("examMessage").textContent = check.missing.slice(0, 4).join(" ");
        $("examMessage").className = "status-message error";
        return;
      }
      if (!confirm("Submit the selected 23 answers for evaluation? The paper carries 75 marks.")) return;

      M.state.submitting = true;
      M.ui.updateProgress();
      hide("examView");
      show("evaluatingView");
      scrollTo({ top: 0, behavior: "smooth" });

      try {
        const result = await M.service.evaluate();
        if (result.status === "published") {
          try {
            await M.service.saveResult(result);
            result.savedOnline = true;
          } catch (error) {
            console.error(error);
            result.savedOnline = false;
            result.saveWarning = "The server evaluation is shown below, but verified online history storage was not confirmed. A copy remains in this browser.";
          }
        } else {
          result.savedOnline = false;
          result.saveWarning = "This is a provisional browser-only estimate. It is not an authoritative published score and is not stored online.";
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
      if (!confirm("Start a new attempt? Any verified published result remains in your history.")) return;
      M.state.answers = Object.create(null);
      M.state.selections = { partB: [], partC: Object.create(null) };
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
  }
})();
