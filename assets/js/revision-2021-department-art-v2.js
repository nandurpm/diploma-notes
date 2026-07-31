/* Purpose: Revision 2021 department art v2 - Descriptive comment added for clarity */
(() => {
  "use strict";

  const pagePath = window.location.pathname.toLowerCase().replace(/\/+$/, "");
  if (!["/revision-2021", "/revision-2021.html"].includes(pagePath)) return;

  const VERSION = "20260717-rev2021-department-art-v1";
  const PROGRAMME_ART = Object.freeze({
    "electrical-electronics-engineering": ["#c2410c", "#2563eb"],
    "electronics-engineering": ["#b45309", "#1d4ed8"],
    "mechanical-engineering": ["#334155", "#0891b2"],
    "civil-engineering": ["#1d4ed8", "#0891b2"],
    "architecture": ["#0f5ea8", "#0e7490"],
    "artificial-intelligence": ["#4f46e5", "#7c3aed"],
    "artificial-intelligence-and-machine-learning": ["#4338ca", "#2563eb"],
    "automation-and-robotics": ["#334155", "#0f766e"],
    "automobile-engineering": ["#b91c1c", "#f97316"],
    "biomedical-engineering": ["#0f766e", "#06b6d4"],
    "chemical-engineering": ["#b45309", "#d97706"],
    "civil-and-environmental-engineering": ["#15803d", "#0891b2"],
    "civil-and-rural-engineering": ["#4d7c0f", "#0e7490"],
    "civil-public-health-and-environment-engineering": ["#047857", "#0284c7"],
    "civil-engineering-and-planning": ["#1e40af", "#6366f1"],
    "cloud-computing-and-big-data": ["#4f46e5", "#06b6d4"],
    "commercial-practice": ["#9a3412", "#d97706"],
    "communication-and-computer-networking": ["#0369a1", "#0f766e"],
    "computer-application-and-business-management": ["#6d28d9", "#2563eb"],
    "computer-engineering": ["#1e3a8a", "#2563eb"],
    "computer-hardware-engineering": ["#1e40af", "#0891b2"],
    "computer-science-and-engineering": ["#4f46e5", "#7c3aed"],
    "cyber-forensics-and-information-security": ["#0f172a", "#2563eb"],
    "electrical-engineering": ["#1e3a8a", "#0e7490"],
    "electrical-engineering-and-electric-vehicles-technology": ["#15803d", "#84cc16"],
    "electronics-and-communication": ["#0369a1", "#06b6d4"],
    "electronics-and-computer-engineering": ["#4338ca", "#2563eb"],
    "fire-technology-and-safety": ["#b91c1c", "#f97316"],
    "food-processing-technology": ["#166534", "#65a30d"],
    "hotel-management-and-catering-technology": ["#9a3412", "#d97706"],
    "information-technology": ["#1d4ed8", "#0284c7"],
    "instrumentation-engineering": ["#0f5c6e", "#2563eb"],
    "integrated-circuit-design-and-fabrication": ["#6d28d9", "#2563eb"],
    "manufacturing-technology": ["#334155", "#d97706"],
    "mechatronics": ["#0f766e", "#2563eb"],
    "micro-electronics": ["#5b21b6", "#7c3aed"],
    "polymer-technology": ["#1d4ed8", "#2563eb"],
    "printing-technology": ["#be123c", "#f59e0b"],
    "renewable-energy": ["#15803d", "#84cc16"],
    "robotic-process-automation": ["#4f46e5", "#06b6d4"],
    "textile-technology": ["#92400e", "#0f766e"],
    "tool-and-die-engineering": ["#334155", "#d97706"],
    "wood-and-paper-technology": ["#854d0e", "#65a30d"]
  });

  function programmeSlug(card) {
    try {
      const url = new URL(card.href, window.location.href);
      const querySlug = url.searchParams.get("dept");
      if (querySlug) return querySlug;

      const pathMatch = url.pathname.match(/\/revision-2021\/([^/]+)\.html$/i);
      return pathMatch ? decodeURIComponent(pathMatch[1]) : "";
    } catch {
      return "";
    }
  }

  function initialise() {
    const grid = document.getElementById("departmentCards");
    if (!grid) return;

    document.body.classList.add("revision-2021-directory-page");
    grid.classList.add("revision-department-grid");

    grid.querySelectorAll(":scope > .choice-card").forEach((card) => {
      const slug = programmeSlug(card);
      const colors = PROGRAMME_ART[slug];
      card.dataset.programmeSlug = slug;

      if (!colors) {
        card.classList.add("department-art-missing");
        return;
      }

      card.classList.add("department-visual-card");
      card.style.setProperty("--department-accent", colors[0]);
      card.style.setProperty("--department-accent-2", colors[1]);
      card.style.setProperty(
        "--department-art",
        `url("/assets/media/departments/rev2021/${slug}.webp?v=${VERSION}")`
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
