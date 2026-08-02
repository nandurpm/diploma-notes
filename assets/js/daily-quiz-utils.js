/* Purpose: Daily quiz utils - Descriptive comment added for clarity */
(() => {
  "use strict";

  const DQ = (window.DailyQuiz = window.DailyQuiz || {});
  const meta = (name) =>
    document.querySelector(`meta[name="${name}"]`)?.content ?? "";

  DQ.config = {
    supabaseUrl: meta("supabase-url"),
    publishableKey: meta("supabase-publishable-key"),
    functionName: "daily-quiz-api",
    questionsPerDay: 10,
    dayMs: 86_400_000,
  };

  DQ.state = {
    client: null,
    elements: {},
    questions: [],
    quizMode: "first",
    authMode: "login",
    busy: false,
  };

  DQ.byId = (id) => document.getElementById(id);

  DQ.escapeHtml = (value) =>
    window.PolyUtils?.escapeHtml
      ? window.PolyUtils.escapeHtml(value)
      : String(value ?? "").replace(
          /[&<>"']/g,
          (character) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#039;",
            })[character],
        );

  DQ.showMessage = (element, text, type = "") => {
    element.textContent = text;
    element.classList.remove("success", "error");
    if (type) element.classList.add(type);
  };

  // PERFORMANCE OPTIMIZATION: Cache the fallback Intl.DateTimeFormat instance in module-level scope
  // to avoid redundant timezone resolution and constructor overhead on every interval clock tick.
  let fallbackFormatter = null;
  DQ.localDateKeyIST = () => {
    if (window.PolyUtils && typeof window.PolyUtils.formatDateKey === "function") {
      return window.PolyUtils.formatDateKey();
    }
    if (!fallbackFormatter) {
      fallbackFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }
    const parts = fallbackFormatter.formatToParts(new Date());

    const value = (type) =>
      parts.find((item) => item.type === type)?.value ?? "";

    return `${value("year")}-${value("month")}-${value("day")}`;
  };

  DQ.nextQuizTimestamp = () => {
    const [year, month, day] = DQ.localDateKeyIST().split("-").map(Number);

    // A new quiz begins at 00:00 IST, equal to 18:30 UTC on the
    // preceding UTC calendar date.
    let next = Date.UTC(year, month - 1, day, 18, 30, 0, 0);
    if (Date.now() >= next) next += DQ.config.dayMs;
    return next;
  };

  DQ.updateClock = () => {
    const { elements } = DQ.state;
    elements.dateStat.textContent = DQ.localDateKeyIST();

    const seconds = Math.max(
      0,
      Math.floor((DQ.nextQuizTimestamp() - Date.now()) / 1000),
    );

    elements.countdown.textContent = [
      Math.floor(seconds / 3600),
      Math.floor((seconds % 3600) / 60),
      seconds % 60,
    ]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  DQ.callApi = async (action, extra = {}) => {
    const { client } = DQ.state;
    const { data, error } = await client.functions.invoke(
      DQ.config.functionName,
      { body: { action, ...extra } },
    );

    if (error) {
      let message = error.message;
      try {
        message = (await error.context.json()).error || message;
      } catch {
        // Keep the Supabase client message when the response is not JSON.
      }
      throw new Error(message);
    }

    if (data?.error) throw new Error(data.error);
    return data;
  };
})();
