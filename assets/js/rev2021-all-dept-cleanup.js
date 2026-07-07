(() => {
  "use strict";
  const codeOf = (card) => String(card.dataset.subjectCode || card.querySelector(".subject-top strong")?.textContent || "").trim().toUpperCase();
  function updateCounts() {
    document.querySelectorAll(".semester-subject-section").forEach((section) => {
      const count = section.querySelectorAll(".subject-card").length;
      const label = section.querySelector(".semester-group-heading span");
      if (label) label.textContent = `${count} ${count === 1 ? "subject" : "subjects"}`;
    });
  }
  function cleanup() {
    const grid = document.getElementById("subjectGrid");
    if (!grid) return;
    grid.querySelectorAll(".subject-card").forEach((card) => {
      if (codeOf(card) === "6007" && /First Year \/ Common/i.test(card.textContent || "")) card.remove();
    });
    grid.querySelectorAll(".semester-subject-section").forEach((section) => {
      const cards = [...section.querySelectorAll(".subject-card")];
      const bases = new Set(cards.map(codeOf).map((code) => code.match(/^(\d{4})[A-Z]$/)?.[1]).filter(Boolean));
      cards.forEach((card) => {
        if (bases.has(codeOf(card))) card.remove();
      });
    });
    updateCounts();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cleanup, { once: true });
  else cleanup();
  setTimeout(cleanup, 400);
  setTimeout(cleanup, 1000);
})();
