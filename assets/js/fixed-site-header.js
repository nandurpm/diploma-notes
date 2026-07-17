(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const ua = navigator.userAgent || "";
  const pathname = window.location.pathname;
  const isRevisionDepartmentPage = /^\/revision-(?:2021|2026)\/.+\.html$/i.test(pathname);
  const isAskPolyPage = /\/ask-poly(?:-v2)?\.html$/i.test(pathname);
  const isLessonPage = /\/lessons\/lessons-\d+[a-z]?\.html$/i.test(pathname);
  const appMatch = ua.match(/(?:PolytechnicStudyHubAndroid|PolyPmnaAndroid)\/([0-9]+(?:\.[0-9]+)*)/i);
  const isAndroidWebView = /Android/i.test(ua) && (/\bwv\b/i.test(ua) || /Version\/\d+(?:\.\d+)?\s+Chrome\//i.test(ua));
  const isStandaloneAndroid = /Android/i.test(ua) && window.matchMedia?.("(display-mode: standalone)")?.matches;
  const isNativeApp = Boolean(appMatch) || isAndroidWebView || Boolean(isStandaloneAndroid);
  const installedVersion = appMatch ? appMatch[1] : null;
  const ONAM_VERSION = "20260704-banner6";
  const CONSISTENCY_VERSION = "20260717-site-shell1";

  if (isLessonPage) root.classList.add("poly-lesson-page");

  function addStylesheetOnce(id, href) {
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.append(link);
  }

  function loadScriptOnce(id, src) {
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.defer = true;
    document.head.append(script);
  }

  function hideNativeWebHeader() {
    root.classList.add("polytechnic-native-app");
    root.style.setProperty("--fixed-site-header-height", "0px");
    root.style.setProperty("--fixed-site-header-gap", "0px");
    body.classList.remove("has-fixed-site-header");
    body.style.setProperty("padding-top", "0", "important");
    body.style.setProperty("margin-top", "0", "important");
    const header = document.querySelector(".topbar");
    if (header) {
      header.hidden = true;
      header.setAttribute("aria-hidden", "true");
      ["display", "visibility", "height", "min-height", "max-height", "padding", "margin", "overflow"].forEach((prop) => {
        const value = prop === "display" ? "none" : prop === "visibility" ? "hidden" : "0";
        header.style.setProperty(prop, value, "important");
      });
    }
    const skip = document.querySelector(".skip-link");
    if (skip) { skip.hidden = true; skip.setAttribute("aria-hidden", "true"); skip.style.setProperty("display", "none", "important"); }
  }

  function compareVersions(left, right) {
    const a = String(left || "0").split(".").map((n) => parseInt(n, 10) || 0);
    const b = String(right || "0").split(".").map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      if ((a[i] || 0) > (b[i] || 0)) return 1;
      if ((a[i] || 0) < (b[i] || 0)) return -1;
    }
    return 0;
  }

  function ensureNativeUpdateUi() {
    let button = document.querySelector(".app-download");
    let banner = button?.closest(".native-app-update-banner") || null;
    if (!button && isNativeApp) {
      banner = document.createElement("aside");
      banner.className = "native-app-update-banner";
      banner.hidden = true;
      banner.setAttribute("role", "status");
      banner.setAttribute("aria-live", "polite");
      banner.innerHTML = '<div class="native-app-update-copy"><strong>App update available</strong><span class="native-app-update-message">A newer POLY PMNA app is ready.</span></div><a class="btn primary app-download native-app-update-action" href="#" aria-hidden="true" hidden>Update App</a><button class="native-app-update-dismiss" type="button" aria-label="Dismiss app update notice">Later</button>';
      body.prepend(banner);
      button = banner.querySelector(".app-download");
      banner.querySelector(".native-app-update-dismiss")?.addEventListener("click", () => { banner.hidden = true; });
    }
    return { button, banner };
  }

  function configureAppDownloadButton() {
    const { button, banner } = ensureNativeUpdateUi();
    if (!button) return;
    const show = () => { button.hidden = false; button.removeAttribute("aria-hidden"); if (banner) banner.hidden = false; };
    const hide = () => { button.hidden = true; button.setAttribute("aria-hidden", "true"); if (banner) banner.hidden = true; };
    if (!isNativeApp) {
      button.dataset.appButtonState = "download";
      button.textContent = "📱 Download Our App";
      button.setAttribute("aria-label", "Download POLY PMNA Android application");
      show();
      return;
    }
    button.dataset.appButtonState = "checking";
    hide();
    fetch(`/downloads/app-update.json?t=${Date.now()}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((update) => {
        const latest = update?.versionName;
        const apkUrl = update?.apkUrl;
        if (!latest || !apkUrl || (installedVersion && compareVersions(latest, installedVersion) <= 0)) { button.dataset.appButtonState = "current"; hide(); return; }
        button.dataset.appButtonState = "update";
        button.textContent = `Update to ${latest}`;
        button.href = new URL(apkUrl, window.location.origin).href;
        button.setAttribute("aria-label", `Update POLY PMNA to version ${latest}`);
        const message = banner?.querySelector(".native-app-update-message");
        if (message) message.textContent = update.message || `Version ${latest} is available.`;
        show();
      })
      .catch(() => { button.dataset.appButtonState = "unavailable"; hide(); });
  }

  function installSharedFixes() {
    loadScriptOnce("poly-site-shell", `/assets/js/site-shell.js?v=${CONSISTENCY_VERSION}`);
    loadScriptOnce("poly-site-consistency-fix", `/assets/js/site-consistency-fix.js?v=${CONSISTENCY_VERSION}`);
  }

  function installOnamThemeLoader() {
    addStylesheetOnce("poly-onam-banner-css", `/assets/css/onam-theme.css?v=${ONAM_VERSION}`);
    loadScriptOnce("poly-onam-banner-script", `/assets/js/onam-render-a.js?v=${ONAM_VERSION}`);
  }

  function installDailyQuizResponsiveFix() {
    if (/\/daily-quiz\.html$/i.test(pathname)) addStylesheetOnce("poly-quiz-responsive-fix", `/assets/css/quiz-responsive-fix.css?v=20260711-consistency1`);
  }

  function installLessonPageFix() {
    if (!isLessonPage) return;
    root.classList.add("poly-lesson-page");
    body.classList.add("poly-lesson-page");
    body.classList.remove("has-fixed-site-header", "portal-page");
    root.style.setProperty("--fixed-site-header-height", "0px");
    root.style.setProperty("--fixed-site-header-gap", "0px");
    addStylesheetOnce("poly-lesson-page-fix", `/assets/css/lesson-page-fix.css?v=20260711-consistency1`);
  }

  function installVisitorPopup() {
    if (isAskPolyPage || isRevisionDepartmentPage || isLessonPage) return;
    loadScriptOnce("poly-visitor-popup-script", "/assets/js/visitor-popup.js?v=20260711-consistency1");
  }

  installSharedFixes();
  installOnamThemeLoader();
  configureAppDownloadButton();
  installDailyQuizResponsiveFix();
  installLessonPageFix();
  installVisitorPopup();

  if (isLessonPage) return;
  if (isNativeApp) { hideNativeWebHeader(); requestAnimationFrame(hideNativeWebHeader); setTimeout(hideNativeWebHeader, 250); return; }

  const header = document.querySelector(".topbar");
  if (!header) return;

  function buildHeader() {
    body.classList.add("portal-page");
    window.PolySiteShell?.render();
  }

  let frame = 0;
  function updateHeight() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      root.style.setProperty("--fixed-site-header-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
      body.classList.add("has-fixed-site-header");
    });
  }
  buildHeader();
  updateHeight();
  if ("ResizeObserver" in window) new ResizeObserver(updateHeight).observe(header);
  window.addEventListener("resize", updateHeight, { passive: true });
  window.addEventListener("orientationchange", updateHeight, { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(updateHeight).catch(() => {});
})();
