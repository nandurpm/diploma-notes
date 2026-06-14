(() => {
  "use strict";

  if (!window.location.pathname.toLowerCase().replace(/\/+$/, "").endsWith("/revision-2021.html")) return;

  const artworkByHref = {
    "revision-2021/electrical-electronics-engineering.html": { file: "electrical-electronics-engineering.svg", colors: ["#1d4ed8", "#f59e0b"] },
    "revision-2021/electronics-engineering.html": { file: "electronics-engineering.svg", colors: ["#047857", "#14b8a6"] },
    "revision-2021/mechanical-engineering.html": { file: "mechanical-engineering.svg", colors: ["#ea580c", "#64748b"] },
    "revision-2021/civil-engineering.html": { file: "civil-engineering.svg", colors: ["#4338ca", "#7c3aed"] },
    "revision-2021/architecture.html": { file: "architecture.svg", colors: ["#0e7490", "#2563eb"] },
    "revision-2021/artificial-intelligence.html": { file: "artificial-intelligence.svg", colors: ["#be123c", "#e11d48"] },
    "revision-2021/artificial-intelligence-and-machine-learning.html": { file: "artificial-intelligence-and-machine-learning.svg", colors: ["#c2410c", "#0f766e"] },
    "revision-2021/automation-and-robotics.html": { file: "automation-and-robotics.svg", colors: ["#334155", "#0f766e"] },
    "revision-2021/automobile-engineering.html": { file: "automobile-engineering.svg", colors: ["#1d4ed8", "#f59e0b"] },
    "revision-2021/biomedical-engineering.html": { file: "biomedical-engineering.svg", colors: ["#047857", "#14b8a6"] },
    "revision-2021/chemical-engineering.html": { file: "chemical-engineering.svg", colors: ["#ea580c", "#64748b"] },
    "revision-2021/civil-and-environmental-engineering.html": { file: "civil-and-environmental-engineering.svg", colors: ["#4338ca", "#7c3aed"] },
    "revision-2021/civil-and-rural-engineering.html": { file: "civil-and-rural-engineering.svg", colors: ["#0e7490", "#2563eb"] },
    "revision-2021/civil-public-health-and-environment-engineering.html": { file: "civil-public-health-and-environment-engineering.svg", colors: ["#be123c", "#e11d48"] },
    "revision-2021/civil-engineering-and-planning.html": { file: "civil-engineering-and-planning.svg", colors: ["#c2410c", "#0f766e"] },
    "revision-2021/cloud-computing-and-big-data.html": { file: "cloud-computing-and-big-data.svg", colors: ["#334155", "#0f766e"] },
    "revision-2021/commercial-practice.html": { file: "commercial-practice.svg", colors: ["#1d4ed8", "#f59e0b"] },
    "revision-2021/communication-and-computer-networking.html": { file: "communication-and-computer-networking.svg", colors: ["#047857", "#14b8a6"] },
    "revision-2021/computer-application-and-business-management.html": { file: "computer-application-and-business-management.svg", colors: ["#ea580c", "#64748b"] },
    "revision-2021/computer-engineering.html": { file: "computer-engineering.svg", colors: ["#4338ca", "#7c3aed"] },
    "revision-2021/computer-hardware-engineering.html": { file: "computer-hardware-engineering.svg", colors: ["#0e7490", "#2563eb"] },
    "revision-2021/computer-science-and-engineering.html": { file: "computer-science-and-engineering.svg", colors: ["#be123c", "#e11d48"] },
    "revision-2021/cyber-forensics-and-information-security.html": { file: "cyber-forensics-and-information-security.svg", colors: ["#c2410c", "#0f766e"] },
    "revision-2021/electrical-engineering.html": { file: "electrical-engineering.svg", colors: ["#334155", "#0f766e"] },
    "revision-2021/electrical-engineering-and-electric-vehicles-technology.html": { file: "electrical-engineering-and-electric-vehicles-technology.svg", colors: ["#1d4ed8", "#f59e0b"] },
    "revision-2021/electronics-and-communication.html": { file: "electronics-and-communication.svg", colors: ["#047857", "#14b8a6"] },
    "revision-2021/electronics-and-computer-engineering.html": { file: "electronics-and-computer-engineering.svg", colors: ["#ea580c", "#64748b"] },
    "revision-2021/fire-technology-and-safety.html": { file: "fire-technology-and-safety.svg", colors: ["#4338ca", "#7c3aed"] },
    "revision-2021/food-processing-technology.html": { file: "food-processing-technology.svg", colors: ["#0e7490", "#2563eb"] },
    "revision-2021/hotel-management-and-catering-technology.html": { file: "hotel-management-and-catering-technology.svg", colors: ["#be123c", "#e11d48"] },
    "revision-2021/information-technology.html": { file: "information-technology.svg", colors: ["#c2410c", "#0f766e"] },
    "revision-2021/instrumentation-engineering.html": { file: "instrumentation-engineering.svg", colors: ["#334155", "#0f766e"] },
    "revision-2021/integrated-circuit-design-and-fabrication.html": { file: "integrated-circuit-design-and-fabrication.svg", colors: ["#1d4ed8", "#f59e0b"] },
    "revision-2021/manufacturing-technology.html": { file: "manufacturing-technology.svg", colors: ["#047857", "#14b8a6"] },
    "revision-2021/mechatronics.html": { file: "mechatronics.svg", colors: ["#ea580c", "#64748b"] },
    "revision-2021/micro-electronics.html": { file: "micro-electronics.svg", colors: ["#4338ca", "#7c3aed"] },
    "revision-2021/polymer-technology.html": { file: "polymer-technology.svg", colors: ["#0e7490", "#2563eb"] },
    "revision-2021/printing-technology.html": { file: "printing-technology.svg", colors: ["#be123c", "#e11d48"] },
    "revision-2021/renewable-energy.html": { file: "renewable-energy.svg", colors: ["#c2410c", "#0f766e"] },
    "revision-2021/robotic-process-automation.html": { file: "robotic-process-automation.svg", colors: ["#334155", "#0f766e"] },
    "revision-2021/textile-technology.html": { file: "textile-technology.svg", colors: ["#1d4ed8", "#f59e0b"] },
    "revision-2021/tool-and-die-engineering.html": { file: "tool-and-die-engineering.svg", colors: ["#047857", "#14b8a6"] },
    "revision-2021/wood-and-paper-technology.html": { file: "wood-and-paper-technology.svg", colors: ["#ea580c", "#64748b"] }
  };

  function normaliseHref(card) {
    const href = card.getAttribute("href") || "";
    return href.replace(/^\//, "");
  }

  function initialise() {
    const grid = document.querySelector(".selection-grid");
    if (!grid) return;

    grid.classList.add("revision-department-grid");
    grid.querySelectorAll(":scope > .choice-card").forEach((card) => {
      const item = artworkByHref[normaliseHref(card)];
      if (!item) {
        card.classList.add("department-visual-card", "department-art-missing");
        return;
      }
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
