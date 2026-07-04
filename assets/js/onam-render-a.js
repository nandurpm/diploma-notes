(() => {
  "use strict";

  const ONAM_DATES = [
    "2026-08-25",
    "2026-08-26",
    "2026-08-27",
    "2026-08-28"
  ];

  const ONAM_BANNERS = {
    1: { day: "Uthradam", mal: "ഉത്രാടം", src: "/assets/media/onam-2026/uthradam-banner.svg", alt: "Happy Onam Uthradam banner" },
    2: { day: "Thiruvonam", mal: "തിരുവോണം", src: "/assets/media/onam-2026/thiruvonam-banner.svg", alt: "Happy Onam Thiruvonam banner" },
    3: { day: "Avittam", mal: "അവിട്ടം", src: "/assets/media/onam-2026/avittam-banner.svg", alt: "Happy Onam Avittam banner" },
    4: { day: "Chathayam", mal: "ചതയം", src: "/assets/media/onam-2026/chathayam-banner.svg", alt: "Happy Onam Chathayam banner" }
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
    const params = new URLSearchParams(window.location.search);
    const raw = String(params.get("onamTheme") || "").trim().toLowerCase();
    if (raw === "random") return Math.floor(Math.random() * 4) + 1;
    const n = Number(raw);
    if (n >= 1 && n <= 4) return n;
    const index = ONAM_DATES.indexOf(getISTDate());
    return index >= 0 ? index + 1 : 0;
  }

  function injectBanner(dayNo) {
    const config = ONAM_BANNERS[dayNo];
    if (!config) return;

    document.documentElement.classList.add("poly-onam-banner-mode");
    document.body.classList.add("poly-onam-banner-mode");

    document.querySelectorAll("#onam-day-banner-wrap,.poly-onam-grand-hero,.poly-onam-reference-hero,.poly-onam-bar,.poly-onam-corner,.poly-onam-dancer,.poly-onam-petal,.poly-onam-sadya-strip").forEach((item) => item.remove());

    const heroTarget = document.querySelector(".home-compact-hero") || document.querySelector("main") || document.body;
    const wrap = document.createElement("section");
    wrap.id = "onam-day-banner-wrap";
    wrap.className = "onam-day-banner-wrap";
    wrap.setAttribute("aria-label", `${config.day} Onam banner`);

    const img = document.createElement("img");
    img.className = "onam-day-banner";
    img.src = config.src;
    img.alt = config.alt;
    img.loading = "eager";
    img.decoding = "async";

    wrap.append(img);
    heroTarget.parentNode.insertBefore(wrap, heroTarget);
  }

  function run() {
    const dayNo = getActiveOnamDay();
    if (!dayNo) return;
    injectBanner(dayNo);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
})();
