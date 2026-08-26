/* POLY PMNA — redirect to the maintained GitHub Pages site on month-end. */
(() => {
  "use strict";
  if (window.PolyMonthEndRedirect) return;

  const destination = "https://nandurpm.github.io/polypmna/";
  const timeZone = "Asia/Kolkata";
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const preview = /(?:[?&](?:monthEndRedirect|monthEndTheme)=1\b|#(?:monthEndRedirect|monthEndTheme)\b)/i.test(
    location.search + location.hash
  );
  let redirected = false;
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

  const isDestination = () => {
    const current = `${location.origin}${location.pathname}`.replace(/\/+$/, "");
    return current === "https://nandurpm.github.io/polypmna";
  };

  const shouldRedirect = () => preview || isLastDayOfMonth();

  const sync = () => {
    if (redirected || isDestination() || !shouldRedirect()) return;
    redirected = true;
    window.location.replace(destination);
  };

  const scheduleNextCheck = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      sync();
      scheduleNextCheck();
    }, 60 * 60 * 1000);
  };

  window.PolyMonthEndRedirect = Object.freeze({
    destination,
    isPreview: () => preview,
    isLastDayOfMonth,
    shouldRedirect,
    refresh: sync,
    timeZone
  });

  sync();
  scheduleNextCheck();
})();

/* Preview: append ?monthEndRedirect=1 to any public page URL. */
/* The previous ?monthEndTheme=1 preview flag remains supported as an alias. */
// Example: https://polypmna.dpdns.org/?monthEndRedirect=1
