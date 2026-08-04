/* Purpose: Home subject filter cleaner - Descriptive comment added for clarity */
(() => {
  "use strict";

  const COMMON_VALUE = "__common__";

  const blocked = (value) => {
    const text = String(value || "").trim().toLowerCase();
    return /\b2015\b/.test(text) ||
      text.includes("study materials") ||
      text.includes("department materials") ||
      text.includes("first year materials") ||
      /(^|\s)materials($|\s)/.test(text);
  };

  const clean = () => {
    const grid = document.getElementById("subjectGrid");
    const select = document.getElementById("departmentFilter");
    if (!grid || !select || grid.dataset.mode !== "home") return;

    [...select.options].forEach((option) => {
      if (option.value !== COMMON_VALUE && blocked(option.textContent || option.value)) option.remove();
    });

  if (![...select.options].some((option) => option.value === select.value)) {
      const hasCommonOption = [...select.options].some((option) => option.value === COMMON_VALUE);
      select.value = hasCommonOption ? COMMON_VALUE : "all";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }

  const start = () => {
    const select = document.getElementById("departmentFilter");
    clean();
    if (select) new MutationObserver(clean).observe(select, { childList: true });
    [100, 300, 700, 1200, 2000, 3500].forEach((delay) => setTimeout(clean, delay));
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
