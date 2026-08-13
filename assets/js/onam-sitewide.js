/* 2026 Onam site-wide celebration layer — lightweight shared-shell decoration. */
(() => {
  "use strict";

  const VERSION = "20260813-onam-sitewide1";
  const ONAM_DATES = ["2026-08-25", "2026-08-26", "2026-08-27", "2026-08-28"];
  const HOME_PATHS = new Set(["/", "/index.html"]);

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

  function getRequestedOnamDay() {
    const params = new URLSearchParams(window.location.search || "");
    const direct = String(params.get("onamTheme") || params.get("onam") || "").trim().toLowerCase();
    if (direct) return direct;

    for (const key of params.keys()) {
      const match = String(key || "").trim().toLowerCase().match(/^onam(?:theme)?([1-4]|random)$/);
      if (match) return match[1];
    }
    return "";
  }

  function getActiveOnamDay() {
    const requested = getRequestedOnamDay();
    if (requested === "random") return Math.floor(Math.random() * 4) + 1;
    const previewDay = Number(requested);
    if (previewDay >= 1 && previewDay <= 4) return previewDay;
    const dateIndex = ONAM_DATES.indexOf(getISTDate());
    return dateIndex >= 0 ? dateIndex + 1 : 0;
  }

  function isHomePage() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    return HOME_PATHS.has(path);
  }

  function isCompactViewport() {
    return window.matchMedia("(max-width: 680px), (orientation: landscape) and (max-height: 560px)").matches;
  }

  function addRibbon() {
    if (document.querySelector("[data-poly-onam-ribbon]")) return;
    const ribbon = document.createElement("div");
    ribbon.className = "poly-onam-sitewide-ribbon";
    ribbon.dataset.polyOnamRibbon = VERSION;
    ribbon.setAttribute("aria-hidden", "true");
    document.body.prepend(ribbon);
  }

  function addPetals() {
    document.querySelector("[data-poly-onam-petals]")?.remove();
    if (isCompactViewport() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layer = document.createElement("div");
    layer.className = "poly-onam-sitewide-petals";
    layer.dataset.polyOnamPetals = VERSION;
    layer.setAttribute("aria-hidden", "true");

    const count = window.matchMedia("(max-width: 980px)").matches ? 4 : 6;
    for (let index = 0; index < count; index += 1) {
      const petal = document.createElement("span");
      petal.className = "poly-onam-sitewide-petal";
      petal.setAttribute("aria-hidden", "true");
      petal.style.setProperty("--x", `${7 + Math.round(Math.random() * 86)}vw`);
      petal.style.setProperty("--size", `${8 + Math.round(Math.random() * 5)}px`);
      petal.style.setProperty("--duration", `${11 + Math.round(Math.random() * 5)}s`);
      petal.style.setProperty("--delay", `${Math.round(Math.random() * 8)}s`);
      petal.style.setProperty("--drift", `${Math.round((Math.random() - 0.5) * 38)}px`);
      layer.append(petal);
    }
    document.body.append(layer);
  }

  function applySitewideOnam(day) {
    document.documentElement.classList.add("poly-onam-sitewide", `poly-onam-sitewide-day-${day}`);
    document.body.classList.add("poly-onam-sitewide", `poly-onam-sitewide-day-${day}`);
    document.body.dataset.onamSitewideDay = String(day);
    addRibbon();
    addPetals();
  }

  function run() {
    const day = getActiveOnamDay();
    // The homepage keeps its richer banner renderer and full animation layer.
    if (!day || isHomePage()) return;
    applySitewideOnam(day);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
