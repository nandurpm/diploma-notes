(() => {
  "use strict";

  const ONAM_DATES = [
    "2026-08-25", // Uthradam
    "2026-08-26", // Thiruvonam
    "2026-08-27", // Avittam
    "2026-08-28"  // Chathayam
  ];

  const ONAM_BANNERS = {
    1: {
      day: "Uthradam",
      src: "/assets/media/onam-2026/uthradam-banner.png",
      alt: "Happy Onam Uthradam banner"
    },
    2: {
      day: "Thiruvonam",
      src: "/assets/media/onam-2026/thiruvonam-banner.png",
      alt: "Happy Onam Thiruvonam banner"
    },
    3: {
      day: "Avittam",
      src: "/assets/media/onam-2026/avittam-banner.png",
      alt: "Happy Onam Avittam banner"
    },
    4: {
      day: "Chathayam",
      src: "/assets/media/onam-2026/chathayam-banner.png",
      alt: "Happy Onam Chathayam banner"
    }
  };

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

  function getActiveOnamDay() {
    const raw = String(
      new URLSearchParams(window.location.search).get("onamTheme") || ""
    ).trim().toLowerCase();

    if (raw === "random") return Math.floor(Math.random() * 4) + 1;

    const n = Number(raw);
    if (n >= 1 && n <= 4) return n;

    const index = ONAM_DATES.indexOf(getISTDate());
    return index >= 0 ? index + 1 : 0;
  }

  function injectBanner(dayNo) {
    const config = ONAM_BANNERS[dayNo];
    if (!config) return;

    const old = document.getElementById("onam-day-banner-wrap");
    if (old) old.remove();

    const heroTarget =
      document.querySelector(".home-compact-hero") ||
      document.querySelector("main") ||
      document.body;

    const wrap = document.createElement("section");
    wrap.id = "onam-day-banner-wrap";
    wrap.className = "onam-day-banner-wrap";
    wrap.setAttribute("aria-label", `${config.day} Onam banner`);

    const img = document.createElement("img");
    img.className = "onam-day-banner";
    img.alt = config.alt;
    img.loading = "eager";
    img.decoding = "async";

    img.onload = () => {
      document.documentElement.classList.add("poly-onam-banner-mode");
      document.body.classList.add("poly-onam-banner-mode");
    };

    img.onerror = () => {
      wrap.remove();
      document.documentElement.classList.remove("poly-onam-banner-mode");
      document.body.classList.remove("poly-onam-banner-mode");
    };

    img.src = config.src;

    wrap.appendChild(img);
    heroTarget.parentNode.insertBefore(wrap, heroTarget);
  }

  function run() {
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
