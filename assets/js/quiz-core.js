/* Purpose: Quiz core - Descriptive comment added for clarity */
(() => {
  "use strict";

  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || "";
  const Q = (window.PolyQuiz = window.PolyQuiz || {});
  const CONFIRMATION_REDIRECT_URL = "https://polypmna.dpdns.org/daily-quiz.html";

  Q.config = {
    supabaseUrl: meta("supabase-url"),
    publishableKey: meta("supabase-publishable-key"),
    functionName: "daily-quiz-api",
    questionsPerDay: 10,
  };

  Q.subjects = {
    "1001": { code: "1001", title: "English Quiz", subtitle: "Communication Skills in English · Course Code 1001", icon: "EN", description: "Reading, grammar, vocabulary, workplace communication and writing.", color: "#7c3aed" },
    "1002": { code: "1002", title: "Maths Quiz", subtitle: "Mathematics I · Course Code 1002", icon: "Σ", description: "Complex numbers, straight lines, trigonometry, limits and differentiation.", color: "#2563eb" },
    "1003": { code: "1003", title: "Physics Quiz", subtitle: "Applied Physics-I · Course Code 1003", icon: "Φ", description: "Measurements, vectors, momentum, circular motion, rotation, energy, heat, elasticity and fluids.", color: "#0891b2" },
    "1004": { code: "1004", title: "Chemistry Quiz", subtitle: "Applied Chemistry · Course Code 1004", icon: "CH", description: "Atomic structure, bonding, solutions, water, materials, electrochemistry and corrosion.", color: "#059669" },
    "2001": { code: "2001", title: "Environmental Science Quiz", subtitle: "Environmental Science · Course Code 2001", icon: "EV", description: "Ecosystems, pollution, renewable energy, solid waste, laws and environmental management.", color: "#15803d" },
    "2002": { code: "2002", title: "Mathematics II Quiz", subtitle: "Mathematics II · Course Code 2002", icon: "M2", description: "Determinants, matrices, vectors, integral calculus, applications and differential equations.", color: "#4f46e5" },
    "2003": { code: "2003", title: "Applied Physics II Quiz", subtitle: "Applied Physics-II · Course Code 2003", icon: "P2", description: "Wave motion, optics, electricity, semiconductors, photoelectric effect, LASER and nanoscience.", color: "#0f766e" },
    "GK": { code: "GK", title: "General Knowledge Quiz", subtitle: "General Knowledge · Daily Practice", icon: "GK", description: "India, Kerala, science, technology, safety and current fundamentals.", color: "#ea580c" },
  };

  Q.state = {
    client: null,
    mode: "none",
    authMode: "login",
    busy: false,
    user: null,
    profile: null,
    dashboard: null,
    activeSubject: null,
    activeQuiz: null,
    guestResults: Object.create(null),
    guestBankPromise: null,
    serviceError: null,
  };

  Q.elements = {};
  Q.byId = (id) => document.getElementById(id);
  Q.escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[char]);

  Q.message = (element, text, type = "") => {
    if (!element) return;
    element.textContent = text;
    element.classList.remove("success", "error");
    if (type) element.classList.add(type);
  };

  Q.showServiceWarning = (text = "Quiz service is temporarily down. Guest mode still works. Try again later.") => {
    const E = Q.elements;
    Q.state.serviceError = text;
    if (E.serviceWarningText) E.serviceWarningText.textContent = text;
    E.serviceWarning?.classList.remove("hidden");
  };

  Q.hideServiceWarning = () => {
    Q.state.serviceError = null;
    Q.elements.serviceWarning?.classList.add("hidden");
  };

  let cachedFallbackFormatter = null;
  Q.dateKeyIST = () => {
    if (window.PolyUtils && typeof window.PolyUtils.formatDateKey === "function") {
      return window.PolyUtils.formatDateKey();
    }
    if (!cachedFallbackFormatter) {
      cachedFallbackFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
      });
    }
    const parts = cachedFallbackFormatter.formatToParts(new Date());
    const pick = (type) => parts.find((part) => part.type === type)?.value || "";
    return `${pick("year")}-${pick("month")}-${pick("day")}`;
  };

  Q.percent = (score, total) => total ? Math.round((Number(score || 0) / Number(total)) * 100) : 0;

  Q.setBusy = (busy) => {
    Q.state.busy = busy;
    ["authSubmit", "guestLogin", "loginTab", "registerTab", "retryService"].forEach((id) => {
      if (Q.elements[id]) Q.elements[id].disabled = busy;
    });
  };

  Q.callApi = async (action, extra = {}) => {
    if (!Q.state.client) throw new Error("The secure quiz connection is not initialized.");
    const { data, error } = await Q.state.client.functions.invoke(Q.config.functionName, {
      body: { action, ...extra },
    });
    if (error) {
      let text = error.message || "Request failed.";
      try { text = (await error.context.json()).error || text; } catch {}
      throw new Error(text);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  };

  Q.setAuthMode = (mode) => {
    const E = Q.elements;
    Q.state.authMode = mode === "register" ? "register" : "login";
    const register = Q.state.authMode === "register";
    E.loginTab.classList.toggle("active", !register);
    E.registerTab.classList.toggle("active", register);
    E.loginTab.setAttribute("aria-selected", String(!register));
    E.registerTab.setAttribute("aria-selected", String(register));
    E.usernameField.classList.toggle("hidden", !register);
    E.confirmField.classList.toggle("hidden", !register);
    E.username.required = register;
    E.confirmPassword.required = register;
    E.password.autocomplete = register ? "new-password" : "current-password";
    E.authSubmit.textContent = register ? "Create Account" : "Login";
    if (!register) {
      E.username.value = "";
      E.confirmPassword.value = "";
    }
    Q.message(E.authMessage, "");
  };

  Q.showAuth = (notice = "", noticeType = "success") => {
    const E = Q.elements;
    Object.assign(Q.state, {
      mode: "none", user: null, profile: null, dashboard: null,
      activeSubject: null, activeQuiz: null,
    });
    Q.hideServiceWarning();
    E.portalView.classList.add("hidden");
    E.authView.classList.remove("hidden");
    Q.setAuthMode("login");
    if (notice) Q.message(E.authMessage, notice, noticeType);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  Q.showPortal = () => {
    Q.elements.authView.classList.add("hidden");
    Q.elements.portalView.classList.remove("hidden");
    Q.showView("dashboardView");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  Q.showView = (target) => {
    ["dashboardView", "quizView", "accountView", "adminView"].forEach((id) => {
      Q.elements[id].classList.toggle("hidden", id !== target);
    });
  };

  Q.renderServiceFailure = (error) => {
    const E = Q.elements;
    const text = error?.message || "Quiz service is temporarily down. Guest mode still works. Try again later.";
    Q.showPortal();
    E.welcomeTitle.textContent = Q.state.user?.email ? `Signed in as ${Q.state.user.email}` : "Signed in";
    E.accountSubtitle.textContent = "Your login is active, but the dashboard could not be loaded.";
    E.adminButton.classList.add("hidden");
    E.summaryCards.innerHTML = "";
    E.subjectAnalysis.innerHTML = "";
    E.recentResults.innerHTML = '<div class="empty-state">Dashboard data is unavailable until the secure service reconnects.</div>';
    E.subjectGrid.innerHTML = '<div class="service-recovery-card"><b>Quiz service is temporarily down.</b><p>Guest mode still works. Use Retry Service above or try again later.</p></div>';
    Q.showServiceWarning(text);
  };

  Q.login = async () => {
    const E = Q.elements;
    Q.setBusy(true);
    Q.hideServiceWarning();
    E.authSubmit.textContent = "Logging in…";
    try {
      const { data, error } = await Q.state.client.auth.signInWithPassword({
        email: E.email.value.trim(), password: E.password.value,
      });
      if (error) throw error;
      await Q.enterAuthenticated(data.user);
    } catch (error) {
      Q.message(E.authMessage, error.message || "Login failed.", "error");
    } finally {
      Q.setBusy(false);
      E.authSubmit.textContent = Q.state.authMode === "register" ? "Create Account" : "Login";
    }
  };

  Q.register = async () => {
    const E = Q.elements;
    const username = E.username.value.trim();
    const password = E.password.value;
    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) {
      Q.message(E.authMessage, "Username must contain 3–30 letters, numbers, dot, underscore or hyphen.", "error");
      return;
    }
    if (password !== E.confirmPassword.value) {
      Q.message(E.authMessage, "Password and confirmation do not match.", "error");
      return;
    }
    Q.setBusy(true);
    Q.hideServiceWarning();
    E.authSubmit.textContent = "Creating account…";
    try {
      const { data, error } = await Q.state.client.auth.signUp({
        email: E.email.value.trim(), password,
        options: {
          data: { username },
          emailRedirectTo: CONFIRMATION_REDIRECT_URL,
        },
      });
      if (error) throw error;
      if (data.session?.user) await Q.enterAuthenticated(data.session.user);
      else {
        Q.setAuthMode("login");
        Q.message(
          E.authMessage,
          "Registration successful. Confirm your email, then return to this page and login.",
          "success",
        );
      }
    } catch (error) {
      Q.message(E.authMessage, error.message || "Registration failed.", "error");
    } finally {
      Q.setBusy(false);
      E.authSubmit.textContent = Q.state.authMode === "register" ? "Create Account" : "Login";
    }
  };

  Q.loadGuestBank = () => {
    if (window.QuizGuestBank) return Promise.resolve(window.QuizGuestBank);
    if (Q.state.guestBankPromise) return Q.state.guestBankPromise;
    Q.state.guestBankPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/assets/js/quiz-guest-bank.js?v=20260619-pdfbank";
      script.onload = () => Promise.resolve(window.QuizGuestBankReady)
        .then(() => resolve(window.QuizGuestBank)).catch(reject);
      script.onerror = () => reject(new Error("Guest question bank could not be loaded."));
      document.head.append(script);
    });
    return Q.state.guestBankPromise;
  };

  Q.enterGuest = async () => {
    Q.setBusy(true);
    Q.hideServiceWarning();
    try {
      if (Q.state.client) await Q.state.client.auth.signOut().catch(() => {});
      await Q.loadGuestBank();
      Q.state.mode = "guest";
      Q.state.user = null;
      Q.state.profile = { username: "Guest", email: "", role: "guest" };
      Q.state.guestResults = Object.create(null);
      Q.showPortal();
      Q.renderGuestDashboard();
    } catch (error) {
      Q.message(Q.elements.authMessage, error.message || "Guest mode could not be started.", "error");
    } finally { Q.setBusy(false); }
  };

  Q.enterAuthenticated = async (user) => {
    Q.state.mode = "authenticated";
    Q.state.user = user;
    Q.showPortal();
    Q.elements.welcomeTitle.textContent = "Loading dashboard…";
    Q.elements.accountSubtitle.textContent = "Connecting to the secure quiz service…";
    Q.hideServiceWarning();
    try {
      await Q.loadAuthenticatedDashboard();
    } catch (error) {
      console.error("Dashboard load failed while authentication remained valid.", error);
      Q.renderServiceFailure(error);
    }
  };
})();
