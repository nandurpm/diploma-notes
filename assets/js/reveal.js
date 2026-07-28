/* =========================================================
   POLY PMNA — Global Reveal Animation Framework
   ---------------------------------------------------------
   Initializes reveal animations for elements matching [data-reveal]
   or .reveal, and auto-tags standard educational content on
   lesson-related pages. Uses IntersectionObserver with safe fallbacks.
   ========================================================= */
(() => {
  "use strict";

  const DEFAULT_SELECTOR = "[data-reveal], .reveal";
  const AUTO_REVEAL_SELECTOR = [
    "main section",
    "main article",
    ".lesson-card",
    ".lesson-content",
    ".lesson-block",
    ".subject-card",
    ".notes-card",
    ".chapter",
    ".topic",
    ".module",
    ".paper-card",
    ".syllabus-card",
    ".hero",
    ".feature",
    ".card",
    ".cards",
    ".grid",
    ".image",
    ".video",
    ".table-container",
    ".table-wrap",
    ".content",
    ".container",
    ".row",
    ".col"
  ].join(",");
  const EDUCATIONAL_PAGE_PATTERN = /\/(?:revision-2026-content\/)?(?:lessons|notes|question-papers|model-question-papers|previous-question-papers|syllabus|lab-manuals|mock-exam)[^/]*|\/(?:revision-2026|revision-2021)\//i;
  const DEFAULT_OPTIONS = {
    root: null,
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.12,
    once: true,
    staggerStep: 80,
    autoReveal: true,
    autoSelector: AUTO_REVEAL_SELECTOR,
    autoAnimation: "up"
  };

  const documentElement = document.documentElement;
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const observed = new WeakSet();
  let observer = null;
  let autoObserver = null;
  let refreshTimer = 0;

  documentElement.classList.remove("reveal-no-js");

  function isRevealDisabledPage() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    return document.body?.dataset.revealDisabled === "true" ||
      documentElement.dataset.revealDisabled === "true" ||
      path === "/" ||
      path.endsWith("/index.html");
  }

  function isEducationalContentPage() {
    if (document.body?.dataset.revealAuto === "true") return true;
    if (document.body?.classList.contains("poly-lesson-page")) return true;
    return EDUCATIONAL_PAGE_PATTERN.test(window.location.pathname);
  }

  function shouldAutoTag(element) {
    if (!(element instanceof Element)) return false;
    if (element.matches(DEFAULT_SELECTOR)) return false;
    if (element.closest("header, footer, nav, script, style, template, noscript, [hidden], [data-reveal-skip]")) return false;
    return true;
  }

  function applyAutomaticRevealAttributes(settings, scope = document) {
    if (!settings.autoReveal || !isEducationalContentPage()) return 0;

    const candidates = scope instanceof Element && scope.matches(settings.autoSelector)
      ? [scope, ...scope.querySelectorAll(settings.autoSelector)]
      : [...scope.querySelectorAll(settings.autoSelector)];

    let tagged = 0;
    candidates.forEach((element) => {
      if (!shouldAutoTag(element)) return;
      element.dataset.reveal = settings.autoAnimation;
      tagged += 1;
    });
    return tagged;
  }

  function watchAutomaticReveal(settings) {
    if (autoObserver || !settings.autoReveal || !isEducationalContentPage() || !("MutationObserver" in window)) return;

    autoObserver = new MutationObserver((mutations) => {
      const hasNewElements = mutations.some((mutation) =>
        [...mutation.addedNodes].some((node) => node.nodeType === 1)
      );
      if (!hasNewElements) return;

      clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => init(settings), 80);
    });
    autoObserver.observe(document.body, { childList: true, subtree: true });
  }

  function toNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function readOptions(options = {}) {
    const config = window.POLY_REVEAL_OPTIONS || {};
    return { ...DEFAULT_OPTIONS, ...config, ...options };
  }

  function shouldAnimate() {
    return !reduceMotionQuery.matches;
  }

  function revealElement(element) {
    element.classList.add("is-revealed", "reveal-visible");
    element.dispatchEvent(new CustomEvent("poly:reveal", { bubbles: true }));
  }

  function prepareElement(element, index, options) {
    if (!(element instanceof Element) || observed.has(element)) return;

    observed.add(element);
    element.classList.add("reveal-ready");

    if (element.parentElement?.classList.contains("reveal-stagger")) {
      element.style.setProperty("--reveal-stagger-index", String(index));
      element.style.setProperty("--reveal-stagger-step", `${toNumber(options.staggerStep, DEFAULT_OPTIONS.staggerStep)}ms`);
    }

    if (element.dataset.revealDelay && !/^\d+$/.test(element.dataset.revealDelay)) {
      element.style.setProperty("--reveal-delay", element.dataset.revealDelay);
    }

    if (element.dataset.revealDuration) {
      element.style.setProperty("--reveal-duration", element.dataset.revealDuration);
    }

    if (element.dataset.revealDistance) {
      element.style.setProperty("--reveal-distance", element.dataset.revealDistance);
    }
  }

  function revealAll(elements) {
    elements.forEach(revealElement);
  }

  function createObserver(options) {
    return new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const target = entry.target;
        revealElement(target);

        const once = target.dataset.revealOnce ?? String(options.once);
        if (once !== "false") observer?.unobserve(target);
      });
    }, {
      root: options.root,
      rootMargin: options.rootMargin,
      threshold: options.threshold
    });
  }

  function init(options = {}) {
    if (isRevealDisabledPage()) {
      destroy();
      documentElement.classList.add("reveal-disabled", "reveal-no-motion");
      document.querySelectorAll(DEFAULT_SELECTOR).forEach(revealElement);
      return { observed: 0, disabled: true };
    }

    documentElement.classList.remove("reveal-disabled");
    const settings = readOptions(options);
    applyAutomaticRevealAttributes(settings);
    const elements = [...document.querySelectorAll(settings.selector || DEFAULT_SELECTOR)];

    if (!elements.length) return { observed: 0 };

    elements.forEach((element, index) => prepareElement(element, index, settings));

    if (!shouldAnimate() || !("IntersectionObserver" in window)) {
      documentElement.classList.add("reveal-no-motion");
      revealAll(elements);
      return { observed: 0, revealed: elements.length };
    }

    documentElement.classList.remove("reveal-no-motion");
    observer = observer || createObserver(settings);
    elements.forEach((element) => {
      if (!element.classList.contains("is-revealed")) observer.observe(element);
    });
    watchAutomaticReveal(settings);

    return { observed: elements.length };
  }

  function refresh(options = {}) {
    return init(options);
  }

  function destroy() {
    observer?.disconnect();
    autoObserver?.disconnect();
    clearTimeout(refreshTimer);
    observer = null;
    autoObserver = null;
    refreshTimer = 0;
  }

  window.PolyReveal = {
    init,
    refresh,
    reveal: revealElement,
    destroy
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init(), { once: true });
  } else {
    init();
  }
})();
