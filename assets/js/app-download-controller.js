(() => {
  "use strict";

  const ensureButton = () => {
    let button = document.querySelector(".app-download");
    if (button) return button;

    const actions = document.querySelector(".home-app-actions,.home-compact-hero .hero-actions,.hero-actions");
    if (!actions) return null;

    button = document.createElement("a");
    button.className = "btn ghost app-download";
    button.href = "/downloads/Polytechnic-Study-Hub-v1.0.5.apk";
    button.download = "Polytechnic-Study-Hub-v1.0.5.apk";
    button.textContent = "📱 Download Our App";
    button.setAttribute("aria-label", "Download Polytechnic Study Hub Android app");
    actions.append(button);
    return button;
  };

  const button = ensureButton();
  if (!button) return;

  const appMatch = navigator.userAgent.match(/PolytechnicStudyHubAndroid\/([0-9]+(?:\.[0-9]+)*)/i);
  if (appMatch) {
    button.hidden = true;
    button.setAttribute("aria-hidden", "true");
    button.style.setProperty("display", "none", "important");
    button.removeAttribute("href");
    button.removeAttribute("download");
    return;
  }

  const PUBLISHED_UPDATE = Object.freeze({
    versionName: "1.0.5",
    apkUrl: "/downloads/Polytechnic-Study-Hub-v1.0.5.apk",
    title: "Polytechnic Study Hub Android app",
    message: "Download the currently published Android app."
  });

  const validApkPath = (value) => {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.origin);
      if (url.origin !== window.location.origin) return "";
      if (!url.pathname.startsWith("/downloads/") || !url.pathname.endsWith(".apk")) return "";
      return url.href;
    } catch (_) {
      return "";
    }
  };

  const showUnavailable = (message = "The app download is temporarily unavailable.") => {
    button.dataset.appButtonState = "unavailable";
    button.textContent = "📱 App Download Unavailable";
    button.href = "/downloads/";
    button.removeAttribute("download");
    button.setAttribute("aria-disabled", "true");
    button.setAttribute("aria-label", message);
    button.hidden = false;
    button.removeAttribute("aria-hidden");
    button.style.removeProperty("display");
  };

  const activateDownload = (update) => {
    const apkHref = validApkPath(update.apkUrl);
    if (!update?.versionName || !apkHref) {
      showUnavailable();
      return;
    }

    const apkUrl = new URL(apkHref);
    const filename = apkUrl.pathname.split("/").pop() || `Polytechnic-Study-Hub-v${update.versionName}.apk`;

    button.dataset.appButtonState = "download";
    button.textContent = `📱 Download App v${update.versionName}`;
    button.href = apkUrl.href;
    button.download = filename;
    button.removeAttribute("aria-disabled");
    button.setAttribute("aria-label", `Download Polytechnic Study Hub Android app version ${update.versionName}`);
    button.hidden = false;
    button.removeAttribute("aria-hidden");
    button.style.removeProperty("display");
  };

  const activateLatestAvailable = async () => {
    try {
      const response = await fetch(`/downloads/app-update.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Update check failed: ${response.status}`);
      const update = await response.json();
      activateDownload(update?.apkUrl ? update : PUBLISHED_UPDATE);
    } catch (error) {
      console.error("Unable to read app-update.json; using published app link.", error);
      activateDownload(PUBLISHED_UPDATE);
    }
  };

  button.addEventListener("click", (event) => {
    if (button.dataset.appButtonState === "download") return;
    event.preventDefault();
    window.alert(button.getAttribute("aria-label") || "The app download is temporarily unavailable.");
  });

  activateDownload(PUBLISHED_UPDATE);
  activateLatestAvailable();
})();
