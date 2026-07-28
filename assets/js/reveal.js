/* =========================================================
   POLY PMNA — Global Reveal Animation Framework
   ---------------------------------------------------------
   Initializes opt-in reveal animations for elements matching
   [data-reveal] or .reveal. Uses IntersectionObserver with a
   no-motion and no-observer fallback for safe production use.
   ========================================================= */
(() => {
  "use strict";

  const DEFAULT_SELECTOR = "[data-reveal], .reveal";
  const DEFAULT_OPTIONS = {
    root: null,
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.12,
    once: true,
    staggerStep: 80
  };

  const documentElement = document.documentElement;
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const observed = new WeakSet();
  let observer = null;

  documentElement.classList.remove("reveal-no-js");

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
    const settings = readOptions(options);
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

    return { observed: elements.length };
  }

  function refresh(options = {}) {
    return init(options);
  }

  function destroy() {
    observer?.disconnect();
    observer = null;
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
