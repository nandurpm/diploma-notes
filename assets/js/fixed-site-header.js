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

  const configureAppDownloadButton = () => {
    const button = document.querySelector(".app-download");
    if (!button) return;

    const showButton = () => {
      button.hidden = false;
      button.removeAttribute("aria-hidden");
    };

    const hideButton = () => {
      button.hidden = true;
      button.setAttribute("aria-hidden", "true");
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
        button.textContent = "UPDATE YOUR APP";
        button.href = apkUrl;
        button.setAttribute("aria-label", `Update Polytechnic Study Hub to version ${latestVersion}`);
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

  const ensureDailyQuizMenuLink = () => {
    const nav = header.querySelector(".navlinks");
    if (!nav || nav.querySelector('a[href$="daily-quiz.html"]')) return;

    const dailyLink = document.createElement("a");
    dailyLink.href = "daily-quiz.html";
    dailyLink.textContent = "Daily Quiz";

    const materialsLink = [...nav.querySelectorAll("a")].find((link) => link.getAttribute("href")?.includes("materials-2015.html"));
    if (materialsLink) {
      materialsLink.before(dailyLink);
    } else {
      nav.append(dailyLink);
    }
  };

  ensureDailyQuizMenuLink();

  let frame = 0;

  const updateHeaderHeight = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      root.style.setProperty("--fixed-site-header-height", `${height}px`);
      body.classList.add("has-fixed-site-header");
    });
  };

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

  const menuToggle = header.querySelector(".menu-toggle, .menu-btn");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      requestAnimationFrame(updateHeaderHeight);
      setTimeout(updateHeaderHeight, 80);
      setTimeout(updateHeaderHeight, 260);
    });
  }
})();
