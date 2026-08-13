/* Purpose: Quiz init - Descriptive comment added for clarity */
(() => {
  "use strict";
  const Q = window.PolyQuiz;
  Q.config.functionName = "quiz-portal-api";

  const ASSET_VERSION = "20260620-nospace1";

  function loadStyle(href) {
    if (document.querySelector(`link[href^="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${href}?v=${ASSET_VERSION}`;
    document.head.append(link);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src^="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = `${src}?v=${ASSET_VERSION}`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.head.append(script);
    });
  }

  function finishBoot() {
    const reveal = () => {
      document.body.classList.remove("quiz-booting");
      document.getElementById("quiz-boot-guard")?.remove();
      document.querySelectorAll("[data-quiz-loader], .quiz-loading-screen, .quiz-loading-overlay")
        .forEach((loader) => loader.remove());
    };

    if (document.readyState === "complete") requestAnimationFrame(reveal);
    else window.addEventListener("load", () => requestAnimationFrame(reveal), { once: true });
  }

  Q.initialize = async () => {
    loadStyle("/assets/css/quiz-portal-fixes.css");
    document.querySelector(".topbar .brand > span:last-child")?.classList.add("brand-copy");

    try {
      await loadScript("/assets/js/quiz-admin-actions.js");
    } catch (error) {
      console.error(error);
    }

    const ids = [
      "serviceWarning", "authView", "portalView", "loginTab", "registerTab", "authForm",
      "usernameField", "username", "email", "password", "confirmField", "confirmPassword",
      "authSubmit", "guestLogin", "authMessage", "welcomeTitle", "accountSubtitle",
      "accountButton", "adminButton", "logoutButton", "guestBanner", "dashboardView",
      "summaryCards", "subjectGrid", "subjectAnalysis", "recentResults", "quizView",
      "quizSubjectCode", "quizTitle", "quizAttemptBadge", "quizInstruction",
      "questionContainer", "submitQuiz", "retryQuiz", "quizMessage", "accountView",
      "accountGuestOnly", "accountControls", "usernameForm", "newUsername",
      "usernameMessage", "passwordForm", "newPassword", "newPasswordConfirm",
      "passwordMessage", "deleteConfirm", "deleteAccount", "deleteMessage", "adminView",
      "adminSummary", "adminUsers", "adminUserResults", "adminMessage", "refreshAdmin",
    ];
    ids.forEach((id) => { Q.elements[id] = Q.byId(id); });

    document.querySelectorAll("[data-year]").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });

    Q.elements.loginTab.addEventListener("click", () => Q.setAuthMode("login"));
    Q.elements.registerTab.addEventListener("click", () => Q.setAuthMode("register"));
    Q.elements.authForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!Q.elements.authForm.reportValidity()) return;
      if (Q.state.authMode === "register") await Q.register();
      else await Q.login();
    });
    Q.elements.guestLogin.addEventListener("click", Q.enterGuest);
    Q.elements.logoutButton.addEventListener("click", Q.logout);
    Q.elements.accountButton.addEventListener("click", Q.openAccount);
    Q.elements.adminButton.addEventListener("click", Q.openAdmin);
    Q.elements.submitQuiz.addEventListener("click", Q.submitActiveQuiz);
    Q.elements.retryQuiz.addEventListener("click", Q.startRetry);
    document.querySelectorAll(".back-dashboard").forEach((button) =>
      button.addEventListener("click", Q.backToDashboard));
    Q.elements.usernameForm.addEventListener("submit", Q.saveUsername);
    Q.elements.passwordForm.addEventListener("submit", Q.changePassword);
    Q.elements.deleteConfirm.addEventListener("input", () => {
      Q.elements.deleteAccount.disabled = Q.elements.deleteConfirm.value !== "DELETE";
    });
    Q.elements.deleteAccount.addEventListener("click", Q.deleteAccount);
    Q.elements.refreshAdmin.addEventListener("click", Q.loadAdminUsers);

    if (!window.supabase?.createClient || !Q.config.supabaseUrl || !Q.config.publishableKey) {
      Q.elements.serviceWarning.classList.remove("hidden");
      finishBoot();
      return;
    }

    Q.state.client = window.supabase.createClient(Q.config.supabaseUrl, Q.config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });

    Q.setBusy(true);
    try {
      const { data: { session }, error } = await Q.state.client.auth.getSession();
      if (error) throw error;
      if (session?.user) await Q.enterAuthenticated(session.user);
      else Q.showAuth();
    } catch (error) {
      console.error(error);
      Q.showAuth();
      Q.elements.serviceWarning.classList.remove("hidden");
    } finally {
      Q.setBusy(false);
      finishBoot();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", Q.initialize);
  } else {
    Q.initialize();
  }
})();
