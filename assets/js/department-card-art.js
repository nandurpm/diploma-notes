(() => {
  "use strict";

  if (!window.location.pathname.toLowerCase().replace(/\/+$/, "").endsWith("/revision-2021.html")) return;

  const artwork = [
    { test: /electrical and electronics/i, file: "electrical-electronics.svg", colors: ["#1d4ed8", "#f59e0b"] },
    { test: /electronics/i, file: "electronics.svg", colors: ["#047857", "#14b8a6"] },
    { test: /mechanical|automobile|manufacturing|mechatronics|robot|tool/i, file: "mechanical.svg", colors: ["#ea580c", "#64748b"] },
    { test: /civil|rural|planning|public health|environment/i, file: "civil.svg", colors: ["#334155", "#0f766e"] },
    { test: /architecture/i, file: "architecture.svg", colors: ["#4338ca", "#7c3aed"] },
    { test: /computer|cloud|information technology|cyber|communication/i, file: "computer-engineering.svg", colors: ["#1d4ed8", "#0e7490"] },
    { test: /artificial intelligence|machine learning/i, file: "artificial-intelligence.svg", colors: ["#6d28d9", "#2563eb"] },
    { test: /biomedical/i, file: "biomedical.svg", colors: ["#be123c", "#e11d48"] },
    { test: /chemical|polymer|food/i, file: "chemical.svg", colors: ["#c2410c", "#0f766e"] },
    { test: /renewable|wood|paper|textile|printing|hotel|commercial|fire/i, file: "renewable-energy.svg", colors: ["#047857", "#f59e0b"] }
  ];

  function pick(title) {
    return artwork.find((item) => item.test.test(title)) || artwork[5];
  }

  function initialise() {
    const grid = document.querySelector(".selection-grid");
    if (!grid) return;

    grid.classList.add("revision-department-grid");
    grid.querySelectorAll(":scope > .choice-card").forEach((card) => {
      const title = card.querySelector("h2")?.textContent?.trim() || "Department";
      const item = pick(title);
      card.classList.add("department-visual-card");
      card.style.setProperty("--department-accent", item.colors[0]);
      card.style.setProperty("--department-accent-2", item.colors[1]);
      card.style.setProperty("--department-art", `url("/assets/media/departments/${item.file}")`);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
  } else {
    initialise();
  }
})();
