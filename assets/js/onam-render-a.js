(() => {
  "use strict";

  const ASSET_VERSION = "20260704-banner6";
  const REV2026_THEME_VERSION = "20260717-site-shell1";

  const ONAM_DATES = [
    "2026-08-25",
    "2026-08-26",
    "2026-08-27",
    "2026-08-28"
  ];

  const ONAM_BANNERS = {
    1: { day: "Uthradam", src: "/assets/media/onam-2026/uthradam-banner.png", alt: "Happy Onam Uthradam banner" },
    2: { day: "Thiruvonam", src: "/assets/media/onam-2026/thiruvonam-banner.png", alt: "Happy Onam Thiruvonam banner" },
    3: { day: "Avittam", src: "/assets/media/onam-2026/avittam-banner.png", alt: "Happy Onam Avittam banner" },
    4: { day: "Chathayam", src: "/assets/media/onam-2026/chathayam-banner.png", alt: "Happy Onam Chathayam banner" }
  };

  function withVersion(src) {
    return `${src}?v=${encodeURIComponent(ASSET_VERSION)}`;
  }

  function installRevision2026DepartmentThemes() {
    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
    if (currentPath !== "/revision-2026" && currentPath !== "/revision-2026.html") return;
    if (document.getElementById("revision-2026-department-themes")) return;
    const link = document.createElement("link");
    link.id = "revision-2026-department-themes";
    link.rel = "stylesheet";
    link.href = `/assets/css/revision-2026-department-themes.css?v=${REV2026_THEME_VERSION}`;
    document.head.append(link);
  }

  function getISTDate() {
    const p = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date()).reduce((a, x) => {
      if (x.type !== "literal") a[x.type] = x.value;
      return a;
    }, {});
    return `${p.year}-${p.month}-${p.day}`;
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
    const raw = getRequestedOnamDay();
    if (raw === "random") return Math.floor(Math.random() * 4) + 1;
    const n = Number(raw);
    if (n >= 1 && n <= 4) return n;
    const index = ONAM_DATES.indexOf(getISTDate());
    return index >= 0 ? index + 1 : 0;
  }

  function addFestiveAnimationLayer() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelector(".onam-petal-layer")?.remove();
    document.querySelector(".onam-floating-lamp")?.remove();

    const layer = document.createElement("div");
    layer.className = "onam-petal-layer";
    const petals = ["🌼", "🌸", "🏵️", "🍂"];

    for (let i = 0; i < 22; i += 1) {
      const p = document.createElement("span");
      p.className = "onam-petal";
      p.textContent = petals[i % petals.length];
      p.style.setProperty("--x", `${Math.round(Math.random() * 94)}vw`);
      p.style.setProperty("--s", `${14 + Math.round(Math.random() * 11)}px`);
      p.style.setProperty("--d", `${10 + Math.round(Math.random() * 9)}s`);
      p.style.setProperty("--delay", `${Math.random() * 8}s`);
      p.style.setProperty("--drift", `${Math.round((Math.random() - 0.5) * 70)}px`);
      layer.appendChild(p);
    }

    const lamp = document.createElement("div");
    lamp.className = "onam-floating-lamp";
    lamp.textContent = "🪔";
    document.body.append(layer, lamp);
  }

  function moveSubjectBrowserBelowBanner(wrap) {
    const browser = document.getElementById("subject-browser");
    if (!browser || !wrap || !wrap.parentNode) return;
    if (wrap.nextElementSibling !== browser) wrap.after(browser);
  }

  function applyOnamMode(dayNo, wrap) {
    document.documentElement.classList.add("poly-onam-banner-mode", `poly-onam-day-${dayNo}`);
    document.body.classList.add("poly-onam-banner-mode", `poly-onam-day-${dayNo}`);
    document.body.dataset.onamDay = String(dayNo);
    moveSubjectBrowserBelowBanner(wrap);
    addFestiveAnimationLayer();
  }

  function injectBanner(dayNo) {
    const config = ONAM_BANNERS[dayNo];
    if (!config) return;

    const old = document.getElementById("onam-day-banner-wrap");
    if (old) old.remove();

    const heroTarget = document.querySelector(".home-compact-hero") || document.querySelector("main") || document.body;
    const wrap = document.createElement("section");
    wrap.id = "onam-day-banner-wrap";
    wrap.className = "onam-day-banner-wrap";
    wrap.setAttribute("aria-label", `${config.day} Onam banner`);

    const img = document.createElement("img");
    img.className = "onam-day-banner";
    img.alt = config.alt;
    img.loading = "eager";
    img.decoding = "async";

    img.onload = () => { applyOnamMode(dayNo, wrap); };
    img.onerror = () => {
      wrap.remove();
      document.documentElement.classList.remove("poly-onam-banner-mode", `poly-onam-day-${dayNo}`);
      document.body.classList.remove("poly-onam-banner-mode", `poly-onam-day-${dayNo}`);
    };

    img.src = withVersion(config.src);
    wrap.appendChild(img);
    heroTarget.parentNode.insertBefore(wrap, heroTarget);
  }

  function run() {
    installRevision2026DepartmentThemes();
    const dayNo = getActiveOnamDay();
    if (!dayNo) return;
    injectBanner(dayNo);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
