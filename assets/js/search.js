/* Purpose: Global search shortcut - Focuses page-specific search input on '/' keypress */
(() => {
  "use strict";

  document.addEventListener("keydown", (event) => {
    // If the event targets an editable element, do not hijack the '/' key
    if (event.key !== "/" || event.target.matches("input, select, textarea, [contenteditable]")) return;

    // Selector for all known search inputs across the site
    const selectors = ["#subjectSearch", "#q", "#programmeSearch", "#rev2015Search", "#chatSearch"];
    const searchInput = document.querySelector(selectors.join(", "));

    if (!searchInput) return;

    event.preventDefault();
    searchInput.focus();
  });
})();
