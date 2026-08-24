(() => {
  "use strict";

  const accordions = [...document.querySelectorAll(".academic-hub .academic-menu")];
  if (accordions.length < 2) return;

  const closeOthers = active => {
    accordions.forEach(panel => {
      if (panel !== active && panel.open) panel.open = false;
    });
  };

  // If the browser restores multiple open panels from session state, keep only
  // the last one rather than allowing the initial state to violate exclusivity.
  const initiallyOpen = accordions.filter(panel => panel.open);
  if (initiallyOpen.length > 1) closeOthers(initiallyOpen.at(-1));

  accordions.forEach(panel => {
    panel.addEventListener("toggle", () => {
      if (panel.open) closeOthers(panel);
    });
  });
})();
