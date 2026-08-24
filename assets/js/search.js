/* Purpose: Global search shortcuts - '/' to focus search input, 'Escape' to clear and blur */
(() => {
  "use strict";

  const SEARCH_SELECTORS = "#subjectSearch, #q, #programmeSearch, #rev2015Search, #chatSearch";

  document.addEventListener("keydown", (event) => {
    const active = document.activeElement;
    const isSearchInput = active && active.matches && active.matches(SEARCH_SELECTORS);

    if (event.key === "Escape" && isSearchInput) {
      if (active.value) {
        active.value = "";
        active.dispatchEvent(new Event("input", { bubbles: true }));
      }
      active.blur();
      return;
    }

    // If the event targets an editable element, do not hijack the '/' key
    if (event.key !== "/" || event.target.matches("input, select, textarea, [contenteditable]")) return;

    const searchInput = document.querySelector(SEARCH_SELECTORS);
    if (!searchInput) return;

    event.preventDefault();
    searchInput.focus();
  });
})();
