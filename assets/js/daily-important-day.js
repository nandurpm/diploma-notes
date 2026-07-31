/* Purpose: Daily important day - Descriptive comment added for clarity */
(() => {
  "use strict";

  const card = document.querySelector("[data-important-card]");
  const script = document.currentScript;
  if (!card || !script) return;

  const dataUrl = new URL("../data/important-days-wishes.json", script.src);
  const selectors = {
    date: card.querySelector("[data-important-date]"),
    title: card.querySelector("[data-important-title]"),
    message: card.querySelector("[data-important-message]"),
    badges: card.querySelector("[data-important-badges]"),
    counter: card.querySelector("[data-important-counter]"),
    current: card.querySelector("[data-current-slide]"),
    total: card.querySelector("[data-total-slides]"),
    content: card.querySelector("[data-important-content]"),
  };

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const weekdayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const rotationMs = 5000;
  const exactEventEndDate = "2028-01-01";
  const importantDayImages = {
    "default-study": "assets/media/important-days/default-study.webp",
    "education-reading": "assets/media/important-days/education-reading.webp",
    "environment": "assets/media/important-days/environment.webp",
    "health-awareness": "assets/media/important-days/health-awareness.webp",
    "international-global": "assets/media/important-days/international-global.webp",
    "kerala-piravi": "assets/media/important-days/kerala-piravi.webp",
    "kerala-temple": "assets/media/important-days/kerala-temple.webp",
    "national-day": "assets/media/important-days/national-day.webp",
    "onam": "assets/media/important-days/onam.webp",
    "remembrance": "assets/media/important-days/remembrance.webp",
    "science-technology": "assets/media/important-days/science-technology.webp",
    "social-equality": "assets/media/important-days/social-equality.webp",
    "vishu": "assets/media/important-days/vishu.webp",
  };

  let allEvents = [];
  let visibleEvents = [];
  let activeIndex = 0;
  let timerId = 0;
  let pointerStartX = null;
  let dataPromise = null;

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function isDateKey(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  let cachedFallbackFormatter = null;
  function getIndiaDateKey(date = new Date()) {
    if (window.PolyUtils && typeof window.PolyUtils.formatDateKey === "function") {
      return window.PolyUtils.formatDateKey(date);
    }
    if (!cachedFallbackFormatter) {
      cachedFallbackFormatter = new Intl.DateTimeFormat("en", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }

    const parts = cachedFallbackFormatter.formatToParts(date).reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

    if (parts.year && parts.month && parts.day) {
      return `${parts.year}-${parts.month}-${parts.day}`;
    }

    const indiaDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    return `${indiaDate.getFullYear()}-${pad2(indiaDate.getMonth() + 1)}-${pad2(indiaDate.getDate())}`;
  }

  function parseDateKey(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return { year, month, day };
  }

  function monthDay(dateKey) {
    return isDateKey(dateKey) ? dateKey.slice(5) : "";
  }

  function isExactDatePeriod(dateKey) {
    return isDateKey(dateKey) && dateKey <= exactEventEndDate;
  }

  function formatDateLabel(dateKey) {
    if (!isDateKey(dateKey)) return "TODAY";
    const { year, month, day } = parseDateKey(dateKey);
    const date = new Date(Date.UTC(year, month - 1, day));
    return `${pad2(day)} ${monthNames[month - 1]} ${year} · ${weekdayNames[date.getUTCDay()]}`;
  }

  function isKeralaEvent(event) {
    const text = `${event.category || ""} ${event.title || ""}`.toLowerCase();
    return /kerala|onam|vishu|sabarimala|thrissur|attukal|malayalam|vidyarambham|ayyankali|narayana|mannam|piravi/.test(text);
  }

  function isPublicHoliday(event) {
    return /public holiday/.test(String(event.category || "").toLowerCase());
  }

  function isNationalDay(event) {
    const text = `${event.category || ""} ${event.title || ""}`.toLowerCase();
    return /\bnational day\b|republic day|independence day|constitution day/.test(text);
  }

  function isInternationalEvent(event) {
    const category = String(event.category || "").toLowerCase();
    return /international|\/ un|un /.test(category);
  }

  function isAwarenessEvent(event) {
    const text = `${event.category || ""} ${event.messageType || ""} ${event.title || ""}`.toLowerCase();
    return /awareness|health|disease|cancer|violence|disaster|rights/.test(text);
  }

  function isSpecificAwarenessEvent(event) {
    const text = `${event.category || ""} ${event.title || ""}`.toLowerCase();
    return /awareness|health|disease|cancer|violence|disaster|rights|stigma|pollution|drug/.test(text);
  }

  function isRemembranceEvent(event) {
    const text = `${event.category || ""} ${event.messageType || ""} ${event.title || ""}`.toLowerCase();
    return /remembrance|tribute|martyr|samadhi|hiroshima|nagasaki|memorial|sacrifice/.test(text);
  }

  function isProvisionalEvent(event) {
    const text = `${event.category || ""} ${event.title || ""} ${event.message || ""}`.toLowerCase();
    return /provisional|likely|tentative/.test(text);
  }

  function isMovableEvent(event) {
    const text = `${event.category || ""} ${event.title || ""}`.toLowerCase();
    return /onam|vishu|muharram|eid|ramadan|easter|good friday|ashura|father|mother|mandala|pooja|mahotsavam|aanayoottu|thrissur|pooram|temple festival|kerala public holiday|provisional|tentative|likely/.test(text);
  }

  function isAnnualFixedEvent(event) {
    if (isMovableEvent(event) || isProvisionalEvent(event)) return false;
    const text = `${event.category || ""} ${event.title || ""}`.toLowerCase();
    return /international|\/ un|un |india|national|world|science|health|environment|education|literacy|statistics|consumer|constitution|republic day|independence day|new year|christmas|gandhi|ambedkar|kargil|teacher|engineer|children|women|labour|yoga|music/.test(text);
  }

  function eventPriority(event) {
    const category = String(event.category || "").toLowerCase();
    const title = String(event.title || "").toLowerCase();
    if (isKeralaEvent(event) && /principal festival|onam|vishu|piravi|vidyarambham/.test(`${category} ${title}`)) return 10;
    if (isKeralaEvent(event)) return 20;
    if (isPublicHoliday(event)) return 30;
    if (isNationalDay(event)) return 40;
    if (isInternationalEvent(event)) return 50;
    if (isRemembranceEvent(event)) return 60;
    if (isAwarenessEvent(event)) return 70;
    return 90;
  }

  function sortSameDayEvents(events) {
    return [...events].sort((a, b) => (
      eventPriority(a) - eventPriority(b)
      || String(a.title || "").localeCompare(String(b.title || ""), undefined, { sensitivity: "base" })
    ));
  }

  function findEventsForDate(events, dateKey) {
    return sortSameDayEvents(events.filter((event) => event.date === dateKey));
  }

  function findAnnualRecurringEvents(events, dateKey) {
    const todayMonthDay = monthDay(dateKey);
    if (!todayMonthDay) return [];
    const candidates = events.filter((event) => monthDay(event.date) === todayMonthDay && isAnnualFixedEvent(event));
    return sortSameDayEvents(candidates).map((event) => ({ ...event, date: dateKey }));
  }

  function primaryBadge(event) {
    if (isKeralaEvent(event) && /festival|onam|vishu|poor|pongala|temple|sabarimala|feast|vidyarambham/i.test(`${event.category} ${event.title}`)) return "Kerala Festival";
    if (isKeralaEvent(event)) return "Kerala Day";
    if (isNationalDay(event)) return "National Day";
    if (isRemembranceEvent(event)) return "Remembrance";
    if (isSpecificAwarenessEvent(event)) return "Awareness Day";
    if (isInternationalEvent(event)) return "International Day";
    if (isAwarenessEvent(event)) return "Awareness Day";
    if (/education|student|teacher|literacy/i.test(`${event.category} ${event.title}`)) return "Education";
    return "Today";
  }

  function makeBadge(label, modifier = "") {
    const badge = document.createElement("span");
    badge.className = `daily-special-card__badge${modifier ? ` daily-special-card__badge--${modifier}` : ""}`;
    badge.textContent = label;
    return badge;
  }

  function renderBadges(event) {
    selectors.badges.replaceChildren(makeBadge(primaryBadge(event)));
    if (isPublicHoliday(event)) selectors.badges.append(makeBadge("Public Holiday", "holiday"));
    if (isProvisionalEvent(event)) selectors.badges.append(makeBadge("Provisional date", "provisional"));
  }

  function imageUrlFor(event) {
    if (event.image) {
      return new URL(event.image, window.location.href).href;
    }
    const key = event.imageKey && importantDayImages[event.imageKey] ? event.imageKey : "default-study";
    return new URL(importantDayImages[key], window.location.href).href;
  }

  function setText(element, value) {
    if (element) element.textContent = value || "";
  }

  function renderControls() {
    const hasMultiple = visibleEvents.length > 1;
    selectors.counter.hidden = !hasMultiple;
    if (hasMultiple) {
      setText(selectors.current, String(activeIndex + 1));
      setText(selectors.total, String(visibleEvents.length));
    }
  }

  function renderEvent(event, dateKey) {
    selectors.date.dateTime = dateKey;
    selectors.date.textContent = formatDateLabel(dateKey);
    selectors.title.textContent = event.title || "Today";
    card.style.setProperty("--daily-special-image", `url("${imageUrlFor(event)}")`);

    const titleOnly = /title only/i.test(event.messageType || "");
    const message = String(event.message || "").trim();
    const shouldShowMessage = message && !(titleOnly && message.toLowerCase() === String(event.title || "").toLowerCase());
    selectors.message.textContent = shouldShowMessage ? message : "";
    selectors.message.hidden = !shouldShowMessage;

    const lang = /^malayalam$/i.test(event.language || "") ? "ml" : "en";
    selectors.title.lang = lang;
    selectors.message.lang = lang;
    renderBadges(event);
    renderControls();
  }

  function renderFallback(dateKey = getIndiaDateKey()) {
    stopAutoRotation();
    visibleEvents = [];
    activeIndex = 0;
    selectors.date.dateTime = dateKey;
    selectors.date.textContent = formatDateLabel(dateKey);
    selectors.title.lang = "en";
    selectors.message.lang = "ml";
    selectors.title.textContent = "Make today count.";
    card.style.setProperty("--daily-special-image", `url("${new URL(importantDayImages["default-study"], window.location.href).href}")`);
    selectors.message.hidden = false;
    selectors.message.textContent = "A little progress every day builds a better future.\nഓരോ ദിവസത്തെയും ചെറിയ മുന്നേറ്റങ്ങൾ വലിയ വിജയത്തിലേക്ക് നയിക്കുന്നു.";
    selectors.badges.replaceChildren(makeBadge("Today"));
    renderControls();
  }

  function showEvent(index, { userInitiated = false } = {}) {
    if (!visibleEvents.length) return;
    activeIndex = (index + visibleEvents.length) % visibleEvents.length;
    selectors.content.setAttribute("aria-live", userInitiated ? "polite" : "off");
    renderEvent(visibleEvents[activeIndex], visibleEvents[activeIndex].date);
    if (!userInitiated) {
      window.setTimeout(() => selectors.content.setAttribute("aria-live", "polite"), 120);
    }
  }

  function showNextEvent(options) {
    showEvent(activeIndex + 1, options);
  }

  function showPreviousEvent(options) {
    showEvent(activeIndex - 1, options);
  }

  function stopAutoRotation() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = 0;
    }
  }

  function startAutoRotation() {
    stopAutoRotation();
    if (visibleEvents.length < 2 || reducedMotion.matches || document.hidden) return;
    timerId = window.setInterval(() => showNextEvent({ userInitiated: false }), rotationMs);
  }

  function renderTodayEvents(events, dateKey = getIndiaDateKey()) {
    visibleEvents = isExactDatePeriod(dateKey) ? findEventsForDate(events, dateKey) : findAnnualRecurringEvents(events, dateKey);
    activeIndex = 0;
    if (!visibleEvents.length) {
      renderFallback(dateKey);
      return;
    }
    showEvent(0, { userInitiated: true });
    startAutoRotation();
  }

  async function loadImportantDays() {
    if (!dataPromise) {
      dataPromise = fetch(dataUrl)
        .then((response) => {
          if (!response.ok) throw new Error(`Important-days data request failed: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          allEvents = Array.isArray(data) ? data.filter((event) => isDateKey(event.date)) : [];
          return allEvents;
        });
    }
    return dataPromise;
  }

  async function renderForDate(dateKey) {
    const events = await loadImportantDays();
    renderTodayEvents(events, isDateKey(dateKey) ? dateKey : getIndiaDateKey());
  }

  function setupControls() {
    card.addEventListener("pointerenter", stopAutoRotation);
    card.addEventListener("pointerleave", startAutoRotation);
    card.addEventListener("focusin", stopAutoRotation);
    card.addEventListener("focusout", startAutoRotation);
    card.addEventListener("pointerdown", (event) => {
      pointerStartX = event.isPrimary === false ? null : event.clientX;
    });
    card.addEventListener("pointerup", (event) => {
      if (pointerStartX === null || visibleEvents.length < 2) return;
      const delta = event.clientX - pointerStartX;
      pointerStartX = null;
      if (Math.abs(delta) < 42) return;
      if (delta < 0) showNextEvent({ userInitiated: true });
      else showPreviousEvent({ userInitiated: true });
      startAutoRotation();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoRotation();
      else startAutoRotation();
    });

    reducedMotion.addEventListener?.("change", startAutoRotation);
  }

  setupControls();

  window.DiplomaImportantDays = {
    getIndiaDateKey,
    findEventsForDate: (dateKey) => findEventsForDate(allEvents, dateKey),
    findAnnualRecurringEvents: (dateKey) => findAnnualRecurringEvents(allEvents, dateKey),
    renderForDate,
  };

  const forcedDate = new URLSearchParams(window.location.search).get("importantDate");
  loadImportantDays()
    .then((events) => renderTodayEvents(events, isDateKey(forcedDate) ? forcedDate : getIndiaDateKey()))
    .catch((error) => {
      console.error("Unable to load important-day data:", error);
      renderFallback();
    });
})();
