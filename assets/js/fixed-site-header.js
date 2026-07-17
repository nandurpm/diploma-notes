(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const pathname = window.location.pathname || "/";
  const userAgent = navigator.userAgent || "";
  const isLessonPage = /\/(?:revision-2026-content\/)?lessons\/lessons-[^/]+\.html$/i.test(pathname);
  const nativeUserAgent = /(?:PolytechnicStudyHubAndroid|PolyPmnaAndroid)\/([0-9]+(?:\.[0-9]+)*)/i.test(userAgent);
  const nativeBridge = window.POLY_PMNA_NATIVE_APP === true || root.dataset.nativeApp === "poly-pmna";
  const isNativeApp = nativeUserAgent || nativeBridge;

  function clearHeaderOffset() {
    root.style.setProperty("--fixed-site-header-height", "0px");
    root.style.setProperty("--fixed-site-header-gap", "0px");
    body.classList.remove("has-fixed-site-header");
  }

  function hideWebHeader() {
    root.classList.add("polytechnic-native-app");
    clearHeaderOffset();
    const header = document.querySelector(".topbar");
    if (header) {
      header.hidden = true;
      header.setAttribute("aria-hidden", "true");
    }
    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      skipLink.hidden = true;
      skipLink.setAttribute("aria-hidden", "true");
    }
  }

  function isolateLessonPage() {
    root.classList.add("poly-lesson-page");
    body.classList.add("poly-lesson-page");
    body.classList.remove("portal-page", "has-fixed-site-header");
    clearHeaderOffset();
    const header = document.querySelector(".topbar");
    if (header) {
      header.hidden = true;
      header.setAttribute("aria-hidden", "true");
    }
  }

  function measureHeader() {
    const header = document.querySelector(".topbar:not([hidden])");
    if (!header) {
      clearHeaderOffset();
      return;
    }
    const height = Math.ceil(header.getBoundingClientRect().height);
    root.style.setProperty("--fixed-site-header-height", `${height}px`);
    body.classList.add("has-fixed-site-header");
  }

  function init() {
    if (isLessonPage) {
      isolateLessonPage();
      return;
    }

    if (isNativeApp) {
      hideWebHeader();
      const observer = new MutationObserver(hideWebHeader);
      observer.observe(body, { childList: true, subtree: true });
      return;
    }

    let frame = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureHeader);
    };

    scheduleMeasure();
    const header = document.querySelector(".topbar");
    if (header && "ResizeObserver" in window) new ResizeObserver(scheduleMeasure).observe(header);
    window.addEventListener("poly-site-header-resize", scheduleMeasure);
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    window.addEventListener("orientationchange", scheduleMeasure, { passive: true });
    document.fonts?.ready?.then(scheduleMeasure).catch(() => {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
