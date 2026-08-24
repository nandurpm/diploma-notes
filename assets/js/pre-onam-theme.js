/* POLY PMNA — Pookkalam Countdown pre-Onam controller */
(() => {
  "use strict";

  const VERSION = "20260819-pre-onam-perf3";
  const CSS_PATH = "/assets/css/pre-onam-theme.css";
  const AUDIO_PATH = "/assets/media/onam-2026/pre-onam-festive-loop.mp3";
  const START_DATE = "2026-08-19";
  const END_DATE = "2026-08-24";
  const ONAM_DATES = new Set([
    "2026-08-25",
    "2026-08-26",
    "2026-08-27",
    "2026-08-28"
  ]);

  const state = {
    timeoutId: null,
    refreshListener: null,
    audio: null,
    musicButton: null
  };

  function getISTDate() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date()).reduce((result, part) => {
      if (part.type !== "literal") result[part.type] = part.value;
      return result;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function hasOnamPreview() {
    const params = new URLSearchParams(window.location.search || "");
    if (params.get("onamTheme") || params.get("onam")) return true;
    return [...params.keys()].some(key => /^onam(?:theme)?([1-4]|random)$/i.test(key));
  }

  function getISTMidnightDelay() {
    const now = new Date();
    const dateText = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);
    const [year, month, day] = dateText.split("-").map(Number);
    const nextMidnightUtc = Date.UTC(year, month - 1, day + 1, -5, -30, 0);
    return Math.max(15_000, nextMidnightUtc - now.getTime() + 2_000);
  }

  function getSeasonState(date = getISTDate()) {
    if (hasOnamPreview()) return "onam";
    if (date >= START_DATE && date <= END_DATE) return "pre-onam";
    if (ONAM_DATES.has(date)) return "onam";
    return "original";
  }

  function ensureStylesheet() {
    if (document.getElementById("poly-pre-onam-theme-css")) return;
    const link = document.createElement("link");
    link.id = "poly-pre-onam-theme-css";
    link.rel = "stylesheet";
    link.href = `${CSS_PATH}?v=${encodeURIComponent(VERSION)}`;
    document.head.append(link);
  }

  function removeStylesheet() {
    document.getElementById("poly-pre-onam-theme-css")?.remove();
  }

  function removeSeasonalDecorations() {
    document.getElementById("poly-pre-onam-ribbon")?.remove();
    document.querySelector(".pre-onam-petal-layer")?.remove();
    document.querySelector(".pre-onam-diya")?.remove();
  }

  function removeMusicToggle() {
    state.audio?.pause();
    if (state.audio) state.audio.src = "";
    state.musicButton?.remove();
    state.audio = null;
    state.musicButton = null;
  }

  function applyRootState(season) {
    const root = document.documentElement;
    const body = document.body;
    if (!body) return;

    root.classList.remove("poly-pre-onam-mode");
    body.classList.remove("poly-pre-onam-mode");
    body.removeAttribute("data-pre-onam-date");
    removeSeasonalDecorations();

    if (season !== "pre-onam") return;
    root.classList.add("poly-pre-onam-mode");
    body.classList.add("poly-pre-onam-mode");
    body.dataset.preOnamDate = getISTDate();
  }

  function dayDifference(fromDate, toDate) {
    const from = Date.parse(`${fromDate}T00:00:00Z`);
    const to = Date.parse(`${toDate}T00:00:00Z`);
    return Math.max(0, Math.round((to - from) / 86_400_000));
  }

  function getCopy(date) {
    const remaining = dayDifference(date, "2026-08-25");
    if (date === "2026-08-24") {
      return {
        eyebrow: "Onam 2026 · Eve",
        title: "Onam celebrations begin tomorrow",
        message: "The pookalam is ready. Return tomorrow for the first day banner and a full festive POLY PMNA experience.",
        number: "1",
        label: "day to Onam"
      };
    }

    const messages = {
      6: "Onam preparations have begun. Build your knowledge, one subject at a time.",
      5: "A little more colour, a little more learning. The Onam countdown continues.",
      4: "Let every lesson become a flower in your pookalam of progress.",
      3: "The festive mood is growing across POLY PMNA. Keep learning and keep shining.",
      2: "The pookalam is almost complete. Onam is just around the corner.",
      1: "Tomorrow the Onam day banners begin. Today, make one more step forward."
    };
    return {
      eyebrow: "Onam 2026 · Pookkalam Countdown",
      title: "Preparing for Onam",
      message: messages[remaining] || "Onam preparations have begun. Build your knowledge, one subject at a time.",
      number: String(remaining),
      label: remaining === 1 ? "day to Onam" : "days to Onam"
    };
  }

  function createPookalam() {
    const pookalam = document.createElement("div");
    pookalam.className = "pre-onam-pookalam";
    pookalam.setAttribute("aria-hidden", "true");
    const rings = document.createElement("span");
    rings.className = "pre-onam-ribbon__rings";
    rings.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 4; i += 1) {
      const ring = document.createElement("span");
      ring.className = "pre-onam-ribbon__ring--extra";
      ring.setAttribute("aria-hidden", "true");
      rings.append(ring);
    }
    pookalam.append(rings);
    return pookalam;
  }

  function createRibbon() {
    if (!document.body || document.getElementById("poly-pre-onam-ribbon")) return;
    const date = getISTDate();
    const copy = getCopy(date);
    const ribbon = document.createElement("section");
    ribbon.id = "poly-pre-onam-ribbon";
    ribbon.className = "pre-onam-ribbon";
    ribbon.setAttribute("aria-label", "Onam 2026 countdown");

    const copyWrap = document.createElement("div");
    copyWrap.className = "pre-onam-ribbon__copy";
    copyWrap.innerHTML = `
      <p class="pre-onam-ribbon__eyebrow">${copy.eyebrow}</p>
      <h2 class="pre-onam-ribbon__title">${copy.title}</h2>
      <p class="pre-onam-ribbon__message">${copy.message}</p>
    `;

    const countdown = document.createElement("div");
    countdown.className = "pre-onam-ribbon__countdown";
    countdown.setAttribute("aria-label", `${copy.number} ${copy.label}`);
    countdown.innerHTML = `
      <span class="pre-onam-ribbon__countdown-number">${copy.number}</span>
      <span class="pre-onam-ribbon__countdown-label">${copy.label}</span>
    `;

    ribbon.append(copyWrap, countdown, createPookalam());
    const main = document.querySelector("main");
    const homeHero = document.querySelector(".home-compact-hero");
    if (homeHero?.parentNode) {
      homeHero.after(ribbon);
    } else if (main?.firstElementChild) {
      main.insertBefore(ribbon, main.firstElementChild);
    } else if (main) {
      main.append(ribbon);
    } else {
      document.body.prepend(ribbon);
    }
  }

  function createPetals() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.querySelector(".pre-onam-petal-layer")) return;
    const layer = document.createElement("div");
    layer.className = "pre-onam-petal-layer";
    layer.setAttribute("aria-hidden", "true");
    const colors = ["#f07828", "#d8a928", "#559b55", "#f2c94c", "#e8a832"];
    const isCompact = window.matchMedia("(max-width: 700px)").matches;
    const saveData = Boolean(navigator.connection?.saveData);
    const count = saveData ? 3 : (isCompact ? 6 : 10);
    for (let i = 0; i < count; i += 1) {
      const petal = document.createElement("span");
      petal.className = "pre-onam-petal";
      petal.style.setProperty("--pre-x", `${5 + Math.round(Math.random() * 90)}vw`);
      petal.style.setProperty("--pre-size", `${7 + Math.round(Math.random() * 7)}px`);
      petal.style.setProperty("--pre-color", colors[i % colors.length]);
      petal.style.setProperty("--pre-duration", `${14 + Math.round(Math.random() * 9)}s`);
      petal.style.setProperty("--pre-delay", `${Math.round(Math.random() * 9)}s`);
      petal.style.setProperty("--pre-drift", `${Math.round((Math.random() - .5) * 70)}px`);
      layer.append(petal);
    }
    document.body.append(layer);
  }

  function createDiya() {
    if (window.matchMedia("(max-width: 520px)").matches) return;
    if (document.querySelector(".pre-onam-diya")) return;
    const diya = document.createElement("div");
    diya.className = "pre-onam-diya";
    diya.setAttribute("aria-hidden", "true");
    document.body.append(diya);
  }

  function createMusicToggle() {
    if (!document.body || state.musicButton) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "pre-onam-music-toggle";
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", "Play festive Onam background music");
    button.innerHTML = '<span class="pre-onam-music-toggle__icon" aria-hidden="true">♫</span><span class="pre-onam-music-toggle__label">Play festive music</span>';

    const audio = new Audio();
    audio.loop = true;
    audio.preload = "none";
    audio.volume = 0.22;

    const sync = () => {
      const playing = !audio.paused;
      button.setAttribute("aria-pressed", String(playing));
      button.setAttribute("aria-label", playing ? "Pause festive Onam background music" : "Play festive Onam background music");
      const label = button.querySelector(".pre-onam-music-toggle__label");
      if (label) label.textContent = playing ? "Pause festive music" : "Play festive music";
      button.classList.toggle("is-playing", playing);
    };

    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("ended", sync);
    audio.addEventListener("error", () => {
      button.disabled = true;
      button.setAttribute("aria-label", "Festive music unavailable");
      const label = button.querySelector(".pre-onam-music-toggle__label");
      if (label) label.textContent = "Music unavailable";
    }, { once: true });

    button.addEventListener("click", async () => {
      if (audio.paused) {
        try {
          if (!audio.src) audio.src = AUDIO_PATH;
          await audio.play();
        } catch (_) {
          button.setAttribute("aria-label", "Tap again to play festive Onam background music");
        }
      } else {
        audio.pause();
      }
    });

    state.audio = audio;
    state.musicButton = button;
    document.body.append(button);
    sync();
  }

  function scheduleNextISTMidnight() {
    window.clearTimeout(state.timeoutId);
    state.timeoutId = window.setTimeout(() => {
      applySeason();
      scheduleNextISTMidnight();
    }, getISTMidnightDelay());
  }

  function scheduleDecorations() {
    const render = () => {
      if (getSeasonState() !== "pre-onam") return;
      createPetals();
      createDiya();
    };
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(render, { timeout: 900 });
    } else {
      window.setTimeout(render, 120);
    }
  }

  function applySeason() {
    const season = getSeasonState();
    applyRootState(season);
    if (season === "original") {
      removeMusicToggle();
      removeStylesheet();
      return;
    }
    ensureStylesheet();
    createMusicToggle();
    if (season !== "pre-onam") return;
    createRibbon();
    scheduleDecorations();
  }

  function isHomePage() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    return path === "/" || path === "/index.html";
  }

  function init() {
    if (window.location.pathname.startsWith("/maintenance/")) return;
    if (!isHomePage()) return;
    applySeason();
    scheduleNextISTMidnight();
    state.refreshListener = () => window.setTimeout(applySeason, 0);
    window.addEventListener("pageshow", state.refreshListener, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
