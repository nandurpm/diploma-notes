/* POLY PMNA — reference-inspired theme controller for the last calendar day of each month. */
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
  const preview = /(?:[?&]monthEndTheme=1\b|#monthEndTheme\b)/i.test(
    location.search + location.hash
  );
  let active = false;
  let timer = 0;

  const dateParts = () => Object.fromEntries(
    formatter.formatToParts(new Date())
      .filter(part => ["year", "month", "day"].includes(part.type))
      .map(part => [part.type, Number(part.value)])
  );

  const isLastDayOfMonth = () => {
    const { year, month, day } = dateParts();
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return day === daysInMonth;
  };

  const sync = () => {
    const nextActive = preview || isLastDayOfMonth();
    if (nextActive === active) return;
    active = nextActive;
    root.classList.toggle("poly-reference-31st", active);
    root.dataset.polyTheme = active ? "reference-month-end" : "default";
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
    isPreview: () => preview,
    isLastDayOfMonth,
    refresh: sync,
    timeZone
  });
  window.PolyMonthEndTheme = window.PolyReference31stTheme;

  sync();
  scheduleNextCheck();
})();

/* Preview: append ?monthEndTheme=1 to any public page URL. */
// Example: https://polypmna.dpdns.org/?monthEndTheme=1
