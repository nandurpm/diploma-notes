/* Purpose: Rev2021 all dept cleanup - Descriptive comment added for clarity */
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
      const suffixBases = new Set();
      cards.forEach((card) => {
        const match = codeOf(card).match(/^(\d{4})[A-Z]$/);
        if (match) suffixBases.add(match[1]);
      });
      cards.forEach((card) => {
        if (suffixBases.has(codeOf(card))) card.remove();
      });
    });

    updateCounts();
  }

  let timer = 0;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(cleanup, 120);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, { once: true });
  else schedule();

  setTimeout(schedule, 400);
  setTimeout(schedule, 1000);
  setTimeout(schedule, 2500);

  const startObserver = () => {
    if (!document.body) return;
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) startObserver();
  else document.addEventListener("DOMContentLoaded", startObserver, { once: true });
})();
