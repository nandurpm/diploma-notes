/* Purpose: Home date fallback - Descriptive comment added for clarity */
(() => {
  "use strict";
  const dateEl = document.querySelector("[data-important-date]");
  const titleEl = document.querySelector("[data-important-title]");
  const label = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  if (dateEl) {
    dateEl.textContent = label;
    dateEl.dateTime = new Date().toISOString().slice(0, 10);
  }
  if (titleEl && /loading today/i.test(titleEl.textContent || "")) titleEl.textContent = label;
})();
