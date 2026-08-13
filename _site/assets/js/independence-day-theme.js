/*
 * POLY PMNA — Annual Independence Day theme controller
 *
 * The only date decision in the theme lives here. It uses the visitor's
 * local calendar, activates on 15 August every year, and removes every
 * temporary class/node/listener when the date changes or the page is reused.
 */
(() => {
  "use strict";

  if (window.PolyIndependenceDayTheme) return;

  const root = document.documentElement;
  const body = document.body;
  const STYLE_PATH = "/assets/css/independence-day-theme.css";
  const THEME_CLASS = "poly-independence-day";
  const PARTICLE_COUNT = 18;
  const originalThemeColor = document.querySelector('meta[name="theme-color"]')?.getAttribute("content") || "";
  const cleanupTasks = [];
  let banner = null;
  let particles = null;
  let timer = 0;
  let competingThemeObserver = null;
  let active = false;
  let dismissed = false;
  let lastDateKey = "";

  const localDateParts = (date = new Date()) => ({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

  const getDateKey = (parts) => `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;

  const isIndependenceDay = (date = new Date()) => {
    const parts = localDateParts(date);
    return parts.month === 8 && parts.day === 15;
  };

  const getThemeColorMeta = () => document.querySelector('meta[name="theme-color"]');

  function ensureThemeStylesheet() {
    const existing = [...document.querySelectorAll('link[rel="stylesheet"]')].some((node) => {
      try { return new URL(node.href || "", window.location.href).pathname === STYLE_PATH; } catch (_) { return false; }
    });
    if (existing || document.querySelector(`link[data-poly-independence-day-css="true"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${STYLE_PATH}?v=annual-tricolour-circuit-1`;
    link.dataset.polyIndependenceDayCss = "true";
    document.head.append(link);
    cleanupTasks.push(() => link.remove());
  }

  function updateThemeColor() {
    const meta = getThemeColorMeta();
    if (!meta) return;
    meta.setAttribute("content", "#123d63");
    cleanupTasks.push(() => {
      if (originalThemeColor) meta.setAttribute("content", originalThemeColor);
      else meta.removeAttribute("content");
    });
  }

  function removeCompetingOnamTheme() {
    const onamClasses = [
      "poly-onam-banner-mode",
      "poly-onam-day-1",
      "poly-onam-day-2",
      "poly-onam-day-3",
      "poly-onam-day-4",
    ];
    onamClasses.forEach((className) => {
      root.classList.remove(className);
      body?.classList.remove(className);
    });
    body?.removeAttribute("data-onam-day");
    document.getElementById("onam-day-banner-wrap")?.remove();
    document.querySelectorAll(".onam-petal-layer, .onam-floating-lamp").forEach((node) => node.remove());
  }

  function addBanner(parts) {
    if (document.getElementById("poly-independence-banner")) {
      banner = document.getElementById("poly-independence-banner");
      return;
    }

    banner = document.createElement("section");
    banner.id = "poly-independence-banner";
    banner.className = "poly-independence-banner";
    banner.setAttribute("aria-label", "Independence Day special edition");
    banner.innerHTML = `
      <span class="poly-independence-banner__flag" aria-hidden="true"></span>
      <span class="poly-independence-banner__copy">
        <span class="poly-independence-banner__eyebrow">15 August · Annual special edition</span>
        <strong class="poly-independence-banner__title">Happy Independence Day</strong>
        <span class="poly-independence-banner__message">Learn boldly. Build thoughtfully. Shape a stronger future together.</span>
      </span>
      <span class="poly-independence-banner__meta">${parts.year} edition</span>
      <button class="poly-independence-banner__dismiss" type="button" aria-label="Hide Independence Day banner">×</button>
    `;

    const dismiss = banner.querySelector(".poly-independence-banner__dismiss");
    dismiss?.addEventListener("click", () => {
      dismissed = true;
      banner?.setAttribute("hidden", "true");
      try { sessionStorage.setItem("poly-independence-day-banner-dismissed", getDateKey(parts)); } catch (_) { /* privacy mode */ }
    });
    cleanupTasks.push(() => dismiss?.replaceWith(dismiss.cloneNode(true)));

    const anchor = document.querySelector(".skip-link") || body.firstElementChild;
    body.insertBefore(banner, anchor || body.firstChild);
    try {
      dismissed = sessionStorage.getItem("poly-independence-day-banner-dismissed") === getDateKey(parts);
    } catch (_) {
      dismissed = false;
    }
    if (dismissed) banner.hidden = true;
    cleanupTasks.push(() => banner?.remove());
  }

  function watchForCompetingTheme() {
    if (!("MutationObserver" in window) || !body) return;
    competingThemeObserver?.disconnect();
    competingThemeObserver = new MutationObserver(() => {
      if (active && document.getElementById("onam-day-banner-wrap")) removeCompetingOnamTheme();
    });
    competingThemeObserver.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "data-onam-day"] });
    cleanupTasks.push(() => {
      competingThemeObserver?.disconnect();
      competingThemeObserver = null;
    });
  }

  function addParticles() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    if (document.querySelector(".poly-independence-particles")) return;

    particles = document.createElement("div");
    particles.className = "poly-independence-particles";
    particles.setAttribute("aria-hidden", "true");
    const palette = ["#f28c28", "#123d63", "#138a58"];
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const particle = document.createElement("span");
      particle.className = "poly-independence-particle";
      particle.style.left = `${Math.round((index * 47 + 9) % 100)}%`;
      particle.style.setProperty("--particle-color", palette[index % palette.length]);
      particle.style.setProperty("--particle-duration", `${12 + (index % 6) * 1.6}s`);
      particle.style.setProperty("--particle-delay", `${(index % 7) * -1.8}s`);
      particle.style.setProperty("--particle-drift", `${(index % 2 ? -1 : 1) * (14 + (index % 5) * 9)}px`);
      particles.append(particle);
    }
    body.append(particles);
    cleanupTasks.push(() => particles?.remove());
  }

  function activate() {
    if (active || !body || !isIndependenceDay()) return false;
    active = true;
    root.classList.add(THEME_CLASS);
    root.dataset.polyTheme = "independence-day";
    body.classList.add(THEME_CLASS);
    removeCompetingOnamTheme();
    ensureThemeStylesheet();
    updateThemeColor();
    const parts = localDateParts();
    addBanner(parts);
    addParticles();
    watchForCompetingTheme();
    lastDateKey = getDateKey(parts);
    return true;
  }

  function deactivate() {
    if (!active) return;
    active = false;
    while (cleanupTasks.length) {
      try { cleanupTasks.pop()(); } catch (_) { /* best-effort teardown */ }
    }
    root.classList.remove(THEME_CLASS);
    delete root.dataset.polyTheme;
    body.classList.remove(THEME_CLASS);
    const meta = getThemeColorMeta();
    if (meta) {
      if (originalThemeColor) meta.setAttribute("content", originalThemeColor);
      else meta.removeAttribute("content");
    }
    banner = null;
    particles = null;
    lastDateKey = "";
  }

  function checkDate() {
    const parts = localDateParts();
    const dateKey = getDateKey(parts);
    if (dateKey === lastDateKey && active) return;
    if (isIndependenceDay()) activate();
    else if (active) deactivate();
    lastDateKey = dateKey;
  }

  const api = Object.freeze({
    isActive: () => active,
    isIndependenceDay,
    activate,
    deactivate,
    version: "annual-tricolour-circuit-1",
  });
  window.PolyIndependenceDayTheme = api;

  checkDate();
  timer = window.setInterval(checkDate, 60 * 1000);
})();
