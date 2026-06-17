(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const appUserAgentMatch = navigator.userAgent.match(/PolytechnicStudyHubAndroid\/([0-9]+(?:\.[0-9]+)*)/i);
  const isNativeAndroidApp = Boolean(appUserAgentMatch);
  const installedAppVersion = appUserAgentMatch ? appUserAgentMatch[1] : null;

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
      button.textContent = "📱 Download Our App";
      button.setAttribute("aria-label", "Download Polytechnic Study Hub Android application");
      showButton();
      return;
    }

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
          hideButton();
          return;
        }

        button.textContent = "UPDATE YOUR APP";
        button.href = apkUrl;
        button.setAttribute("aria-label", `Update Polytechnic Study Hub to version ${latestVersion}`);
        showButton();
      })
      .catch((error) => {
        console.error("Unable to check for an app update.", error);
        hideButton();
      });
  };

  configureAppDownloadButton();

  if (isNativeAndroidApp) {
    root.classList.add("polytechnic-native-app");
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
