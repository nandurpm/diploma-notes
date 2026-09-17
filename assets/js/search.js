/* Purpose: Global search shortcut - Focuses page-specific search input on '/' keypress and handles Escape to clear/blur */
(() => {
  "use strict";

  const selectors = ["#subjectSearch", "#q", "#programmeSearch", "#rev2015Search", "#chatSearch"];

  document.addEventListener("keydown", (event) => {
    const isSearchInput = event.target.matches?.(selectors.join(", ")) || (event.target.tagName === "INPUT" && event.target.type === "search");

    if (event.key === "Escape" && isSearchInput) {
      if (event.target.value) {
        event.target.value = "";
        event.target.dispatchEvent(new Event("input", { bubbles: true }));
      }
      event.target.blur();
      return;
    }

    // If the event targets an editable element, do not hijack the '/' key
    if (event.key !== "/" || event.target.matches("input, select, textarea, [contenteditable]")) return;

    const searchInput = document.querySelector(selectors.join(", "));
    if (!searchInput) return;

    event.preventDefault();
    searchInput.focus();
  });
})();
