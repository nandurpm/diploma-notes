(() => {
  "use strict";

  const palettes = [
    ["#2563eb", "#06b6d4", "#dbeafe"],
    ["#7c3aed", "#db2777", "#f3e8ff"],
    ["#059669", "#14b8a6", "#d1fae5"],
    ["#ea580c", "#e11d48", "#ffedd5"],
    ["#0891b2", "#2563eb", "#cffafe"],
    ["#4f46e5", "#8b5cf6", "#e0e7ff"],
    ["#15803d", "#65a30d", "#dcfce7"],
    ["#b45309", "#f59e0b", "#fef3c7"]
  ];

  const categorySymbols = [
    { pattern: /artificial intelligence|machine learning|robotic process|cloud computing|cyber|computer|information technology/i, symbol: "01" },
    { pattern: /electrical|electronics|communication|instrumentation|integrated circuit|micro electronics/i, symbol: "⚡" },
    { pattern: /mechanical|mechatronics|manufacturing|tool.*die|automation.*robotics/i, symbol: "⚙" },
    { pattern: /civil|architecture|planning|rural|public health|environment/i, symbol: "▦" },
    { pattern: /automobile|electric vehicles/i, symbol: "EV" },
    { pattern: /biomedical/i, symbol: "♥" },
    { pattern: /chemical|polymer/i, symbol: "⚗" },
    { pattern: /renewable energy/i, symbol: "☀" },
    { pattern: /fire technology/i, symbol: "▲" },
    { pattern: /food processing|hotel management|commercial practice/i, symbol: "✦" },
    { pattern: /textile|printing|wood.*paper/i, symbol: "◆" }
  ];

  function hashText(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash);
  }

  function escapeXml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }

  function symbolFor(title, badge) {
    return categorySymbols.find((item) => item.pattern.test(title))?.symbol || badge.slice(0, 3);
  }

  function buildArtwork(title, badge, palette, variant) {
    const [primary, secondary, soft] = palette;
    const symbol = symbolFor(title, badge);
    const safeBadge = escapeXml(badge.slice(0, 5));
    const safeSymbol = escapeXml(symbol);
    const offset = 26 + (variant % 5) * 12;
    const ring = 92 + (variant % 4) * 10;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 320" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${soft}"/>
            <stop offset="0.52" stop-color="#ffffff"/>
            <stop offset="1" stop-color="${secondary}" stop-opacity="0.32"/>
          </linearGradient>
          <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${primary}"/>
            <stop offset="1" stop-color="${secondary}"/>
          </linearGradient>
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="${primary}" flood-opacity="0.18"/>
          </filter>
        </defs>
        <rect width="720" height="320" fill="url(#bg)"/>
        <circle cx="602" cy="86" r="${ring}" fill="${primary}" opacity="0.10"/>
        <circle cx="650" cy="255" r="132" fill="${secondary}" opacity="0.12"/>
        <circle cx="520" cy="266" r="78" fill="${primary}" opacity="0.07"/>
        <path d="M400 ${offset} H690 M430 ${offset + 56} H650 M470 ${offset + 112} H700" stroke="${primary}" stroke-opacity="0.15" stroke-width="4" stroke-linecap="round"/>
        <path d="M520 22 V286 M580 8 V310 M640 34 V294" stroke="${secondary}" stroke-opacity="0.10" stroke-width="3" stroke-linecap="round"/>
        <g filter="url(#shadow)" transform="translate(490 70)">
          <rect width="170" height="170" rx="38" fill="#ffffff" fill-opacity="0.84" stroke="${primary}" stroke-opacity="0.16" stroke-width="2"/>
          <rect x="15" y="15" width="140" height="140" rx="30" fill="url(#accent)" opacity="0.13"/>
          <text x="85" y="88" text-anchor="middle" dominant-baseline="middle" font-family="Inter, Segoe UI Symbol, Arial, sans-serif" font-size="58" font-weight="900" fill="${primary}">${safeSymbol}</text>
          <text x="85" y="138" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" fill="${secondary}">${safeBadge}</text>
        </g>
        <g fill="${primary}" opacity="0.20">
          <circle cx="440" cy="74" r="7"/><circle cx="458" cy="108" r="5"/><circle cx="424" cy="142" r="6"/>
        </g>
      </svg>`;

    return `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}")`;
  }

  function initialiseDepartmentArtwork() {
    const grid = document.querySelector(".selection-grid");
    if (!grid || !window.location.pathname.toLowerCase().endsWith("/revision-2021.html")) return;

    grid.classList.add("revision-department-grid");

    grid.querySelectorAll(":scope > .choice-card").forEach((card) => {
      if (card.dataset.departmentArtwork === "ready") return;

      const title = card.querySelector("h2")?.textContent?.trim() || "Department";
      const badge = card.querySelector("span")?.textContent?.trim() || "DN";
      const hash = hashText(title);
      const palette = palettes[hash % palettes.length];

      card.classList.add("department-visual-card");
      card.style.setProperty("--department-accent", palette[0]);
      card.style.setProperty("--department-accent-2", palette[1]);
      card.style.setProperty("--department-art", buildArtwork(title, badge, palette, hash));
      card.dataset.departmentArtwork = "ready";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseDepartmentArtwork);
  } else {
    initialiseDepartmentArtwork();
  }
})();
