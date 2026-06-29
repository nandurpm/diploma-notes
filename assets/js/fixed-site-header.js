(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const ua = navigator.userAgent || "";
  const pathname = window.location.pathname;
  const isHomePage = pathname === "/" || /\/index\.html$/i.test(pathname);
  const isRevisionDepartmentPage = /^\/revision-2021\/.+\.html$/i.test(pathname);
  const appMatch = ua.match(/PolytechnicStudyHubAndroid\/([0-9]+(?:\.[0-9]+)*)/i);
  const isAndroidWebView = /Android/i.test(ua) && (/\bwv\b/i.test(ua) || /Version\/\d+(?:\.\d+)?\s+Chrome\//i.test(ua));
  const isStandaloneAndroid = /Android/i.test(ua) && window.matchMedia?.("(display-mode: standalone)")?.matches;
  const isNativeApp = Boolean(appMatch) || isAndroidWebView || Boolean(isStandaloneAndroid);
  const installedVersion = appMatch ? appMatch[1] : null;
  const isLessonPage = /\/lessons\/lessons-\d+[a-z]?\.html$/i.test(window.location.pathname);
  if (isLessonPage) root.classList.add("poly-lesson-page");

  const hideNativeWebHeader = () => {
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
      header.style.setProperty("display", "none", "important");
      header.style.setProperty("visibility", "hidden", "important");
      header.style.setProperty("height", "0", "important");
      header.style.setProperty("min-height", "0", "important");
      header.style.setProperty("max-height", "0", "important");
      header.style.setProperty("padding", "0", "important");
      header.style.setProperty("margin", "0", "important");
      header.style.setProperty("overflow", "hidden", "important");
    }

    const skip = document.querySelector(".skip-link");
    if (skip) {
      skip.hidden = true;
      skip.setAttribute("aria-hidden", "true");
      skip.style.setProperty("display", "none", "important");
    }
  };

  const compareVersions = (left, right) => {
    const a = String(left || "0").split(".").map((n) => parseInt(n, 10) || 0);
    const b = String(right || "0").split(".").map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      if ((a[i] || 0) > (b[i] || 0)) return 1;
      if ((a[i] || 0) < (b[i] || 0)) return -1;
    }
    return 0;
  };

  if (isNativeApp) hideNativeWebHeader();

  const ensureNativeUpdateUi = () => {
    let button = document.querySelector(".app-download");
    let banner = button?.closest(".native-app-update-banner") || null;
    if (!button && isNativeApp) {
      banner = document.createElement("aside");
      banner.className = "native-app-update-banner";
      banner.hidden = true;
      banner.setAttribute("role", "status");
      banner.setAttribute("aria-live", "polite");
      banner.innerHTML = '<div class="native-app-update-copy"><strong>App update available</strong><span class="native-app-update-message">A newer Polytechnic Study Hub app is ready.</span></div><a class="btn primary app-download native-app-update-action" href="#" aria-hidden="true" hidden>Update App</a><button class="native-app-update-dismiss" type="button" aria-label="Dismiss app update notice">Later</button>';
      body.prepend(banner);
      button = banner.querySelector(".app-download");
      banner.querySelector(".native-app-update-dismiss")?.addEventListener("click", () => { banner.hidden = true; });
    }
    return { button, banner };
  };

  const configureAppDownloadButton = () => {
    const { button, banner } = ensureNativeUpdateUi();
    if (!button) return;
    const show = () => { button.hidden = false; button.removeAttribute("aria-hidden"); if (banner) banner.hidden = false; };
    const hide = () => { button.hidden = true; button.setAttribute("aria-hidden", "true"); if (banner) banner.hidden = true; };
    if (!isNativeApp) {
      button.dataset.appButtonState = "download";
      button.textContent = "📱 Download Our App";
      button.setAttribute("aria-label", "Download Polytechnic Study Hub Android application");
      show();
      return;
    }
    button.dataset.appButtonState = "checking";
    hide();
    fetch(`/downloads/app-update.json?t=${Date.now()}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Update check failed: ${response.status}`);
        return response.json();
      })
      .then((update) => {
        const latest = update?.versionName;
        const apkUrl = update?.apkUrl;
        if (!latest || !apkUrl || !installedVersion || compareVersions(latest, installedVersion) <= 0) {
          button.dataset.appButtonState = "current";
          hide();
          return;
        }
        button.dataset.appButtonState = "update";
        button.textContent = `Update to ${latest}`;
        button.href = new URL(apkUrl, window.location.origin).href;
        button.setAttribute("aria-label", `Update Polytechnic Study Hub to version ${latest}`);
        const message = banner?.querySelector(".native-app-update-message");
        if (message) message.textContent = update.message || `Version ${latest} is available.`;
        show();
      })
      .catch((error) => {
        console.error("Unable to check for an app update.", error);
        button.dataset.appButtonState = "unavailable";
        hide();
      });
  };

  const addStylesheetOnce = (id, href) => {
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.append(link);
  };

  const installDailyQuizResponsiveFix = () => {
    if (!/\/daily-quiz\.html$/i.test(window.location.pathname)) return;
    addStylesheetOnce("poly-quiz-responsive-fix", `/assets/css/quiz-responsive-fix.css?v=20260620-mobile-fix-${Date.now()}`);
  };

  const installLessonPageFix = () => {
    if (!isLessonPage) return;
    root.classList.add("poly-lesson-page");
    body.classList.add("poly-lesson-page");
    body.classList.remove("has-fixed-site-header", "portal-page");
    root.style.setProperty("--fixed-site-header-height", "0px");
    root.style.setProperty("--fixed-site-header-gap", "0px");
    addStylesheetOnce("poly-lesson-page-fix", `/assets/css/lesson-page-fix.css?v=20260620-lesson-fix-${Date.now()}`);
  };

  const installVisitorPopup = () => {
    if (isHomePage || isRevisionDepartmentPage) return;
    if (document.getElementById("poly-visitor-popup-script")) return;
    const script = document.createElement("script");
    script.id = "poly-visitor-popup-script";
    script.src = "/assets/js/visitor-popup.js?v=20260626-popup-parallel-timeout";
    script.defer = true;
    document.head.append(script);
  };

  configureAppDownloadButton();
  installDailyQuizResponsiveFix();
  installLessonPageFix();
  installVisitorPopup();

  if (isLessonPage) return;

  if (isNativeApp) {
    hideNativeWebHeader();
    requestAnimationFrame(hideNativeWebHeader);
    setTimeout(hideNativeWebHeader, 250);
    return;
  }

  const header = document.querySelector(".topbar");
  if (!header) return;

  const navItems = [
    { label: "Home", href: "/index.html", match: (p) => p === "/" || p.endsWith("/index.html") },
    { label: "About", href: "/about.html", match: (p) => p.endsWith("/about.html") },
    { label: "Revision 2021", href: "/revision-2021.html", match: (p) => p.endsWith("/revision-2021.html") || p.includes("/revision-2021/") },
    { label: "Mock Exams", href: "/daily-quiz.html", match: (p) => p.endsWith("/daily-quiz.html") || /\/mock-exam(?:-|\.html)/.test(p) },
    { label: "Ask POLY AI", href: "/ask-poly.html", match: (p) => p.endsWith("/ask-poly.html") || p.endsWith("/ask-poly-v2.html") },
    { label: "2015 Materials", href: "/materials-2015.html", match: (p) => p.endsWith("/materials-2015.html") },
    { label: "Tools", href: "/tools.html", match: (p) => /\/tools(?:-v2|-v2-original)?\.html$/.test(p) },
    { label: "Help", href: "/contact.html", match: (p) => p.endsWith("/contact.html") }
  ];

  const buildHeader = () => {
    body.classList.add("portal-page");
    let brand = header.querySelector(".brand");
    if (!brand) { brand = document.createElement("a"); header.prepend(brand); }
    brand.className = "brand";
    brand.href = "/index.html";
    brand.setAttribute("aria-label", "Polytechnic Study Hub home");
    brand.innerHTML = '<span class="brand-symbol" aria-hidden="true">📚</span><strong>Polytechnic Study Hub</strong>';

    let toggle = header.querySelector(".menu-toggle, .menu-btn, .toggle");
    if (!toggle) { toggle = document.createElement("button"); brand.after(toggle); }
    toggle.className = "menu-toggle";
    toggle.type = "button";
    toggle.textContent = "Menu";
    toggle.setAttribute("aria-label", "Toggle navigation");

    let nav = header.querySelector(".navlinks, .menu");
    if (!nav) { nav = document.createElement("nav"); header.append(nav); }
    const wasOpen = nav.classList.contains("open") || header.classList.contains("open");
    nav.className = wasOpen ? "navlinks open" : "navlinks";
    nav.setAttribute("aria-label", "Primary navigation");
    nav.innerHTML = "";
    const path = window.location.pathname.toLowerCase();
    navItems.forEach((item) => {
      const link = document.createElement("a");
      link.href = item.href;
      link.textContent = item.label;
      if (item.match(path)) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
      nav.append(link);
    });
    toggle.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
    if (toggle.dataset.fixedHeaderBound !== "true") {
      toggle.dataset.fixedHeaderBound = "true";
      toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
      nav.addEventListener("click", (event) => { if (event.target.closest("a")) setOpen(false); });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && nav.classList.contains("open")) { setOpen(false); toggle.focus(); }
      });
    }
  };

  let frame = 0;
  const updateHeight = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      root.style.setProperty("--fixed-site-header-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
      body.classList.add("has-fixed-site-header");
    });
  };
  function setOpen(open) {
    const nav = header.querySelector(".navlinks");
    const toggle = header.querySelector(".menu-toggle");
    nav?.classList.toggle("open", open);
    header.classList.toggle("open", open);
    toggle?.setAttribute("aria-expanded", String(open));
    updateHeight();
    setTimeout(updateHeight, 80);
    setTimeout(updateHeight, 260);
  }

  buildHeader();
  updateHeight();
  if ("ResizeObserver" in window) new ResizeObserver(updateHeight).observe(header);
  window.addEventListener("resize", updateHeight, { passive: true });
  window.addEventListener("orientationchange", updateHeight, { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(updateHeight).catch(() => {});
})();
