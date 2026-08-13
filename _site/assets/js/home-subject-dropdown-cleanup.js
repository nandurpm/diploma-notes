/* Purpose: Home subject dropdown cleanup - Descriptive comment added for clarity */
(() => {
  "use strict";

  const COMMON_VALUE = "__common__";
  const badDepartmentOption = text => {
    const value = String(text || "").trim().toLowerCase();
    return /\b2015\b/.test(value) ||
      value.includes("study materials") ||
      value.includes("department materials") ||
      value.includes("first year materials") ||
      /(^|\s)materials($|\s)/.test(value);
  };

  const cleanup = () => {
    const grid = document.getElementById("subjectGrid");
    const select = document.getElementById("departmentFilter");
    if (!grid || !select || grid.dataset.mode !== "home") return;

    [...select.options].forEach(option => {
      if (option.value !== COMMON_VALUE && badDepartmentOption(option.textContent || option.value)) {
        option.remove();
      }
    });

    if (![...select.options].some(option => option.value === select.value)) {
      select.value = COMMON_VALUE;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const start = () => {
    const select = document.getElementById("departmentFilter");
    cleanup();
    if (select) new MutationObserver(cleanup).observe(select, { childList: true });
    [100, 300, 700, 1200, 2000].forEach(delay => setTimeout(cleanup, delay));
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
