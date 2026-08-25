/* POLY PMNA — reference-inspired theme controller for the 31st of each month. */
(() => {
  "use strict";
  if (window.PolyReference31stTheme) return;

  const root = document.documentElement;
  const timeZone = "Asia/Kolkata";
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  const originalThemeColor = meta?.getAttribute("content") || "";
  let active = false;
  let timer = 0;

  const dateParts = () => Object.fromEntries(
    formatter.formatToParts(new Date())
      .filter(part => ["year", "month", "day"].includes(part.type))
      .map(part => [part.type, Number(part.value)])
  );
  const isThirtyFirst = () => dateParts().day === 31;
  const sync = () => {
    const nextActive = isThirtyFirst();
    if (nextActive === active) return;
    active = nextActive;
    root.classList.toggle("poly-reference-31st", active);
    root.dataset.polyTheme = active ? "reference-31st" : "default";
    if (meta) {
      if (active) meta.setAttribute("content", "#0f9fba");
      else if (originalThemeColor) meta.setAttribute("content", originalThemeColor);
      else meta.removeAttribute("content");
    }
  };
  const scheduleNextCheck = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      sync();
      scheduleNextCheck();
    }, 60 * 60 * 1000);
  };

  window.PolyReference31stTheme = Object.freeze({
    isActive: () => active,
    refresh: sync,
    timeZone
  });
  sync();
  scheduleNextCheck();
})();
