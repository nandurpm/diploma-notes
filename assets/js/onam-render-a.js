/* 2026 Onam integrated banner renderer */
(() => {
  "use strict";

  const ASSET_VERSION = "20260825-onam-wide1";
  const REV2026_THEME_VERSION = "20260716-rev2026-department-themes1";

  const ONAM_DATES = [
    "2026-08-25",
    "2026-08-26",
    "2026-08-27",
    "2026-08-28"
  ];

  const ONAM_BANNERS = {
    1: { day: "Uthradam", slug: "uthradam", alt: "Happy Onam Uthradam banner" },
    2: { day: "Thiruvonam", slug: "thiruvonam", alt: "Happy Onam Thiruvonam banner" },
    3: { day: "Avittam", slug: "avittam", alt: "Happy Onam Avittam banner" },
    4: { day: "Chathayam", slug: "chathayam", alt: "Happy Onam Chathayam banner" }
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

  function isCompactViewport() {
    return window.matchMedia("(max-width: 520px), (orientation: landscape) and (max-height: 520px)").matches;
  }

  function addFestiveAnimationLayer() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelector(".onam-petal-layer")?.remove();
    document.querySelector(".onam-floating-lamp")?.remove();

    const layer = document.createElement("div");
    layer.className = "onam-petal-layer";
    layer.setAttribute("aria-hidden", "true");
    const petals = ["🌼", "🌸", "🏵️", "🍂"];
    const count = window.matchMedia("(max-width: 900px)").matches ? 10 : 12;

    for (let i = 0; i < count; i += 1) {
      const p = document.createElement("span");
      p.className = "onam-petal";
      p.setAttribute("aria-hidden", "true");
      p.textContent = petals[i % petals.length];
      p.style.setProperty("--x", `${Math.round(Math.random() * 94)}vw`);
      p.style.setProperty("--s", `${14 + Math.round(Math.random() * 8)}px`);
      p.style.setProperty("--d", `${15 + Math.round(Math.random() * 8)}s`);
      p.style.setProperty("--delay", `${Math.random() * 8}s`);
      p.style.setProperty("--drift", `${Math.round((Math.random() - 0.5) * 56)}px`);
      layer.appendChild(p);
    }

    document.body.append(layer);

    if (isCompactViewport()) return;
    const lamp = document.createElement("div");
    lamp.className = "onam-floating-lamp";
    lamp.setAttribute("aria-hidden", "true");
    lamp.textContent = "🪔";
    document.body.append(lamp);
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

  function createBannerPicture(config) {
    const picture = document.createElement("picture");
    picture.className = "onam-day-banner-picture";

    const mobileWebp = document.createElement("source");
    mobileWebp.media = "(max-width: 520px)";
    mobileWebp.type = "image/webp";
    mobileWebp.srcset = withVersion(`/assets/media/onam-2026/generated-wide/${config.slug}-banner-wide-768.webp`);

    const desktopWebp = document.createElement("source");
    desktopWebp.type = "image/webp";
    desktopWebp.srcset = withVersion(`/assets/media/onam-2026/generated-wide/${config.slug}-banner-wide-1536.webp`);

    const img = document.createElement("img");
    img.className = "onam-day-banner";
    img.alt = config.alt;
    img.width = 2688;
    img.height = 1152;
    img.loading = "eager";
    img.fetchPriority = "high";
    img.decoding = "async";
    img.src = withVersion(`/assets/media/onam-2026/generated-wide/${config.slug}-banner-wide-1536.jpg`);

    picture.append(mobileWebp, desktopWebp, img);
    return { picture, img };
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

    const { picture, img } = createBannerPicture(config);
    img.onload = () => { applyOnamMode(dayNo, wrap); };
    img.onerror = () => {
      wrap.remove();
      document.documentElement.classList.remove("poly-onam-banner-mode", `poly-onam-day-${dayNo}`);
      document.body.classList.remove("poly-onam-banner-mode", `poly-onam-day-${dayNo}`);
    };

    wrap.appendChild(picture);
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
