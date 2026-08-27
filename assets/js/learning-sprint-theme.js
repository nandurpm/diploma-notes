/* POLY PMNA — recurring 10th Learning Sprint theme controller. */
(() => {
  "use strict";

  if (window.PolyLearningSprintTheme) return;

  const TIME_ZONE = "Asia/Kolkata";
  const THEME_CLASS = "poly-learning-sprint-day";
  const BANNER_ID = "poly-learning-sprint-banner";
  const STYLE_ID = "poly-learning-sprint-theme-css";
  const STYLE_PATH = "/assets/css/learning-sprint-theme.css";
  const PREVIEW_PATTERN = /(?:[?&](?:learningSprint|sprint)=1\b|#(?:learningSprint|sprint)\b)/i;
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const originalThemeColor = document.querySelector('meta[name="theme-color"]')?.getAttribute("content") || "";
  const preview = PREVIEW_PATTERN.test(`${location.search}${location.hash}`);
  let active = false;
  let timer = 0;

  function getISTDateParts(date = new Date()) {
    return Object.fromEntries(
      dateFormatter.formatToParts(date)
        .filter((part) => ["year", "month", "day"].includes(part.type))
        .map((part) => [part.type, Number(part.value)])
    );
  }

  function getISTDate(date = new Date()) {
    const parts = getISTDateParts(date);
    return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  }

  function isTenthDay(date = new Date()) {
    return getISTDateParts(date).day === 10;
  }

  function hasHigherPriorityTheme() {
    const classes = [
      "poly-independence-day",
      "poly-pre-onam-mode",
      "poly-onam-banner-mode",
      "poly-new-year-theme"
    ];
    return classes.some((className) => (
      document.documentElement.classList.contains(className) ||
      document.body?.classList.contains(className)
    ));
  }

  function shouldBeActive() {
    return (preview || isTenthDay()) && !hasHigherPriorityTheme();
  }

  function ensureStylesheet() {
    if (document.getElementById(STYLE_ID)) return;
    const existing = [...document.querySelectorAll('link[rel="stylesheet"]')].some((node) => {
      try {
        return new URL(node.href || "", window.location.href).pathname === STYLE_PATH;
      } catch (_) {
        return false;
      }
    });
    if (existing) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = `${STYLE_PATH}?v=20260827-learning-sprint-v1`;
    document.head.append(link);
  }

  function removeStylesheet() {
    document.getElementById(STYLE_ID)?.remove();
  }

  function createBanner() {
    if (!document.body || document.getElementById(BANNER_ID)) return;

    const banner = document.createElement("section");
    banner.id = BANNER_ID;
    banner.className = "poly-learning-sprint-banner";
    banner.setAttribute("aria-labelledby", "poly-learning-sprint-title");
    banner.innerHTML = `
      <div class="poly-learning-sprint-banner__number" aria-hidden="true">10</div>
      <div class="poly-learning-sprint-banner__copy">
        <span class="poly-learning-sprint-banner__badge">Monthly study checkpoint</span>
        <h2 id="poly-learning-sprint-title">10th Learning Sprint</h2>
        <p>Learn one more concept. Solve one more problem. Build one more skill.</p>
      </div>
      <nav class="poly-learning-sprint-banner__actions" aria-label="Learning Sprint actions">
        <a href="/#subject-browser">Review notes</a>
        <a href="/daily-quiz.html">Practice questions</a>
      </nav>`;

    const header = document.querySelector("[data-site-header]");
    const main = document.querySelector("main");
    if (header?.parentNode) header.after(banner);
    else if (main?.parentNode) main.before(banner);
    else document.body.prepend(banner);
  }

  function updateThemeColor(activeState) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute("content", activeState ? "#00a6a6" : originalThemeColor);
  }

  function activate() {
    if (active || !shouldBeActive() || !document.body) return false;
    active = true;
    document.documentElement.classList.add(THEME_CLASS);
    document.documentElement.dataset.polyTheme = "learning-sprint-10th";
    document.body.classList.add(THEME_CLASS);
    document.body.dataset.learningSprintDate = getISTDate();
    ensureStylesheet();
    updateThemeColor(true);
    createBanner();
    return true;
  }

  function deactivate() {
    if (!active) return false;
    active = false;
    document.documentElement.classList.remove(THEME_CLASS);
    document.documentElement.removeAttribute("data-poly-theme");
    document.body?.classList.remove(THEME_CLASS);
    document.body?.removeAttribute("data-learning-sprint-date");
    document.getElementById(BANNER_ID)?.remove();
    removeStylesheet();
    updateThemeColor(false);
    return true;
  }

  function checkNow() {
    if (shouldBeActive()) activate();
    else deactivate();
  }

  function getISTMidnightDelay() {
    const now = new Date();
    const parts = getISTDateParts(now);
    const nextMidnightUtc = Date.UTC(parts.year, parts.month - 1, parts.day + 1, -5, -30, 0);
    return Math.max(15_000, nextMidnightUtc - now.getTime() + 2_000);
  }

  function scheduleNextISTMidnight() {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      checkNow();
      scheduleNextISTMidnight();
    }, getISTMidnightDelay());
  }

  const api = Object.freeze({
    activate,
    checkNow,
    deactivate,
    getISTDate,
    isActive: () => active,
    isPreview: () => preview,
    isTenthDay,
    shouldBeActive,
    timeZone: TIME_ZONE
  });
  window.PolyLearningSprintTheme = api;

  if (!window.location.pathname.startsWith("/maintenance/")) {
    checkNow();
    scheduleNextISTMidnight();
  }
})();

/* Preview: append ?learningSprint=1 to a public page URL. */
// Example: https://polypmna.dpdns.org/?learningSprint=1
