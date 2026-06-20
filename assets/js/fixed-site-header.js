(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const appUserAgentMatch = navigator.userAgent.match(/PolytechnicStudyHubAndroid\/([0-9]+(?:\.[0-9]+)*)/i);
  const isNativeAndroidApp = Boolean(appUserAgentMatch);
  const installedAppVersion = appUserAgentMatch ? appUserAgentMatch[1] : null;

  async function recoverFragmentLesson() {
    if (!body.classList.contains("course-2001")) return;
    const slots = [...document.querySelectorAll("[data-fragment]")];

    await Promise.all(slots.map(async (slot) => {
      try {
        const response = await fetch(slot.dataset.fragment, { cache: "no-cache" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        slot.outerHTML = await response.text();
      } catch (error) {
        slot.outerHTML = `<section class="section"><div class="callout warning"><b>Section could not be loaded:</b> ${String(error.message || error)}</div></section>`;
      }
    }));

    const panels = [...document.querySelectorAll(".panel")];
    const tabs = [...document.querySelectorAll(".tab[data-panel]")];

    const showPanel = (id, shouldScroll = true) => {
      panels.forEach((panel) => panel.classList.toggle("active", panel.id === id));
      tabs.forEach((tab) => {
        const active = tab.dataset.panel === id;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-current", active ? "page" : "false");
      });
      if (shouldScroll) window.scrollTo({ top: 0, behavior: "smooth" });
    };

    tabs.forEach((tab) => {
      if (tab.dataset.recoveryBound === "true") return;
      tab.dataset.recoveryBound = "true";
      tab.addEventListener("click", () => showPanel(tab.dataset.panel));
    });

    const bindSearch = (inputId, selector) => {
      const input = document.getElementById(inputId);
      if (!input || input.dataset.recoveryBound === "true") return;
      input.dataset.recoveryBound = "true";
      const apply = () => {
        const query = input.value.trim().toLowerCase();
        document.querySelectorAll(selector).forEach((item) => {
          item.hidden = Boolean(query) && !item.innerText.toLowerCase().includes(query);
        });
      };
      input.addEventListener("input", apply);
      document.querySelector(`[data-clear="${inputId}"]`)?.addEventListener("click", () => {
        input.value = "";
        apply();
        input.focus();
      });
    };

    bindSearch("topicSearch", ".searchable-topic");
    bindSearch("questionSearch", ".searchable-question");

    const progress = document.getElementById("readingProgress");
    const topButton = document.getElementById("toTop");
    if (progress && topButton && topButton.dataset.recoveryBound !== "true") {
      topButton.dataset.recoveryBound = "true";
      window.addEventListener("scroll", () => {
        const percentage = root.scrollTop / Math.max(1, root.scrollHeight - root.clientHeight) * 100;
        progress.style.width = `${percentage}%`;
        topButton.classList.toggle("show", root.scrollTop > 700);
      }, { passive: true });
      topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    showPanel("overview", false);
    document.dispatchEvent(new CustomEvent("poly:lesson-fragments-ready"));
  }

  recoverFragmentLesson().catch((error) => {
    console.error("Unable to recover the fragmented lesson page.", error);
    document.querySelectorAll(".fragment-slot").forEach((slot) => {
      slot.outerHTML = `<section class="section"><div class="callout warning"><b>Section could not be loaded.</b></div></section>`;
    });
  });

  if (isNativeAndroidApp) {
    root.classList.add("polytechnic-native-app");
  }

  const compareVersions = (left, right) => {
    const leftParts = String(left || "0").split(".").map((part) => Number.parseInt(part, 10) || 0);
    const rightParts = String(right || "0").split(".").map((part) => Number.parseInt(part, 10) || 0);
    const length = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < length; index += 1) {
      const leftPart = leftParts[index] || 0;
      const rightPart = rightParts[index] || 0;
      if (leftPart > rightPart) return 1;
      if (leftPart < rightPart) return -1;
    }
    return 0;
  };

  const ensureNativeUpdateUi = () => {
    let button = document.querySelector(".app-download");
    let banner = button?.closest(".native-app-update-banner") || null;

    if (!button && isNativeAndroidApp) {
      banner = document.createElement("aside");
      banner.className = "native-app-update-banner";
      banner.hidden = true;
      banner.setAttribute("role", "status");
      banner.setAttribute("aria-live", "polite");
      banner.innerHTML = `
        <div class="native-app-update-copy">
          <strong>App update available</strong>
          <span class="native-app-update-message">A newer Polytechnic Study Hub app is ready.</span>
        </div>
        <a class="btn primary app-download native-app-update-action" href="#" aria-hidden="true" hidden>Update App</a>
        <button class="native-app-update-dismiss" type="button" aria-label="Dismiss app update notice">Later</button>
      `;
      body.prepend(banner);
      button = banner.querySelector(".app-download");
      banner.querySelector(".native-app-update-dismiss")?.addEventListener("click", () => {
        banner.hidden = true;
      });
    }

    return { button, banner };
  };

  const configureAppDownloadButton = () => {
    const { button, banner } = ensureNativeUpdateUi();
    if (!button) return;

    const showButton = () => {
      button.hidden = false;
      button.removeAttribute("aria-hidden");
      if (banner) banner.hidden = false;
    };

    const hideButton = () => {
      button.hidden = true;
      button.setAttribute("aria-hidden", "true");
      if (banner) banner.hidden = true;
    };

    if (!isNativeAndroidApp) {
      button.dataset.appButtonState = "download";
      button.textContent = "📱 Download Our App";
      button.setAttribute("aria-label", "Download Polytechnic Study Hub Android application");
      showButton();
      return;
    }

    button.dataset.appButtonState = "checking";
    hideButton();
    button.removeAttribute("download");

    fetch(`/downloads/app-update.json?t=${Date.now()}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Update check failed: ${response.status}`);
        return response.json();
      })
      .then((update) => {
        const latestVersion = update && update.versionName;
        const apkUrl = update && update.apkUrl;

        if (!latestVersion || !apkUrl || compareVersions(latestVersion, installedAppVersion) <= 0) {
          button.dataset.appButtonState = "current";
          hideButton();
          return;
        }

        button.dataset.appButtonState = "update";
        button.textContent = `Update to ${latestVersion}`;
        button.href = new URL(apkUrl, window.location.origin).href;
        button.setAttribute("aria-label", `Update Polytechnic Study Hub to version ${latestVersion}`);
        if (banner) {
          const message = banner.querySelector(".native-app-update-message");
          if (message) message.textContent = update.message || `Version ${latestVersion} is available.`;
        }
        showButton();
      })
      .catch((error) => {
        console.error("Unable to check for an app update.", error);
        button.dataset.appButtonState = "unavailable";
        hideButton();
      });
  };

  configureAppDownloadButton();

  if (isNativeAndroidApp) {
    root.style.setProperty("--fixed-site-header-height", "0px");
    root.style.setProperty("--fixed-site-header-gap", "0px");
    body.classList.remove("has-fixed-site-header");

    const header = document.querySelector(".topbar");
    if (header) {
      header.hidden = true;
      header.setAttribute("aria-hidden", "true");
    }

    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      skipLink.hidden = true;
    }
    return;
  }

  const header = document.querySelector(".topbar");
  if (!header) return;

  const canonicalNav = [
    { key: "home", label: "Home", href: "index.html", match: (path) => path === "/" || path.endsWith("/index.html") },
    { key: "about", label: "About", href: "about.html", match: (path) => path.endsWith("/about.html") },
    { key: "revision", label: "Revision 2021", href: "revision-2021.html", match: (path) => path.endsWith("/revision-2021.html") || path.includes("/revision-2021/") },
    { key: "mock", label: "Mock Exams", href: "daily-quiz.html", match: (path) => path.endsWith("/daily-quiz.html") },
    { key: "materials", label: "2015 Materials", href: "materials-2015.html", match: (path) => path.endsWith("/materials-2015.html") },
    { key: "tools", label: "Tools", href: "tools-v2.html", badge: "New", match: (path) => path.endsWith("/tools-v2.html") || path.endsWith("/tools.html") },
    { key: "papers", label: "Question Papers", href: "previous-question-papers.html", match: (path) => path.endsWith("/previous-question-papers.html") || path.endsWith("/model-question-papers.html") },
    { key: "help", label: "Help", href: "contact.html", match: (path) => path.endsWith("/contact.html") },
  ];

  const currentPath = window.location.pathname.toLowerCase();

  const ensureNavigationBadgeStyle = () => {
    if (document.getElementById("poly-unified-nav-style")) return;
    const style = document.createElement("style");
    style.id = "poly-unified-nav-style";
    style.textContent = `.new-badge{display:inline-flex;margin-left:5px;padding:2px 7px;border-radius:999px;background:#dcfae6;color:#067647;font-size:.66rem;font-weight:950;line-height:1;text-transform:uppercase;vertical-align:middle}.topbar .navlinks a.active .new-badge,.topbar .navlinks a:hover .new-badge{background:rgba(255,255,255,.92);color:#067647}`;
    document.head.append(style);
  };

  const normalizeSiteNavigation = () => {
    body.classList.add("portal-page");
    ensureNavigationBadgeStyle();

    let brand = header.querySelector(".brand");
    if (!brand) {
      brand = document.createElement("a");
      header.prepend(brand);
    }
    brand.className = "brand";
    brand.href = "index.html";
    brand.setAttribute("aria-label", "Polytechnic Study Hub home");
    brand.innerHTML = '<span class="brand-symbol" aria-hidden="true">📚</span><strong>Polytechnic Study Hub</strong>';

    let menuToggle = header.querySelector(".menu-toggle, .menu-btn");
    if (!menuToggle) {
      menuToggle = document.createElement("button");
      brand.after(menuToggle);
    }
    menuToggle.className = "menu-toggle";
    menuToggle.type = "button";
    menuToggle.textContent = menuToggle.textContent.trim() || "Menu";
    menuToggle.setAttribute("aria-label", "Toggle navigation");

    let nav = header.querySelector(".navlinks");
    if (!nav) {
      nav = document.createElement("nav");
      header.append(nav);
    }
    const wasOpen = nav.classList.contains("open");
    nav.className = wasOpen ? "navlinks open" : "navlinks";
    nav.setAttribute("aria-label", "Primary navigation");
    nav.innerHTML = "";

    canonicalNav.forEach((item) => {
      const link = document.createElement("a");
      link.href = item.href;
      link.textContent = item.label;
      if (item.badge) {
        link.append(" ");
        const badge = document.createElement("span");
        badge.className = "new-badge";
        badge.textContent = item.badge;
        link.append(badge);
      }
      const isActive = item.match(currentPath);
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      }
      nav.append(link);
    });

    menuToggle.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");

    if (menuToggle.dataset.unifiedNavBound !== "true") {
      menuToggle.dataset.unifiedNavBound = "true";
      menuToggle.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
        requestAnimationFrame(updateHeaderHeight);
        setTimeout(updateHeaderHeight, 80);
        setTimeout(updateHeaderHeight, 260);
      });
    }
  };

  let frame = 0;

  const updateHeaderHeight = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      root.style.setProperty("--fixed-site-header-height", `${height}px`);
      body.classList.add("has-fixed-site-header");
    });
  };

  normalizeSiteNavigation();
  updateHeaderHeight();

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
  }

  window.addEventListener("resize", updateHeaderHeight, { passive: true });
  window.addEventListener("orientationchange", updateHeaderHeight, { passive: true });

  if (document.fonts?.ready) {
    document.fonts.ready.then(updateHeaderHeight).catch(() => {});
  }
})();
