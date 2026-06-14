(() => {
  "use strict";

  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, "");
  if (!pathname.endsWith("/revision-2021.html")) return;

  if (!document.querySelector('link[href*="department-card-related-icons.css"]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "/assets/css/department-card-related-icons.css?v=20260614-related4";
    document.head.append(stylesheet);
  }

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

  function hashText(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash);
  }

  function initialise() {
    const grid = document.querySelector(".selection-grid");
    if (!grid) return;

    grid.classList.add("revision-department-grid");
    grid.querySelectorAll(":scope > .choice-card").forEach((card) => {
      const title = card.querySelector("h2")?.textContent?.trim() || "Department";
      const palette = palettes[hashText(title) % palettes.length];
      card.classList.add("department-visual-card");
      card.style.setProperty("--department-accent", palette[0]);
      card.style.setProperty("--department-accent-2", palette[1]);
      card.style.setProperty("--department-art", `linear-gradient(135deg, ${palette[2]}, #ffffff)`);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
  } else {
    initialise();
  }
})();