(() => {
  "use strict";

  let button = document.querySelector(".app-download");
  if (!button) return;

  const appMatch = navigator.userAgent.match(/PolytechnicStudyHubAndroid\/([0-9]+(?:\.[0-9]+)*)/i);
  if (appMatch) return;

  const FALLBACK_UPDATE = Object.freeze({
    versionName: "1.0.3",
    apkUrl: "/downloads/Polytechnic-Study-Hub-v1.0.3.apk",
    title: "Polytechnic Study Hub Android app",
    message: "Download the latest available Android APK."
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
    button.removeAttribute("href");
    button.disabled = true;
    button.removeAttribute("download");
    button.setAttribute("aria-disabled", "true");
    button.setAttribute("aria-label", message);
    button.hidden = false;
    button.removeAttribute("aria-hidden");
  };

  const activateDownload = (update) => {
    const apkHref = validApkPath(update.apkUrl);
    if (!update?.versionName || !apkHref) {
      showUnavailable();
      return;
    }

    const apkUrl = new URL(apkHref);
    const filename = apkUrl.pathname.split("/").pop() || `Polytechnic-Study-Hub-v${update.versionName}.apk`;

    if (button.tagName !== "A") {
      const anchor = document.createElement("a");
      anchor.className = button.className;
      Object.assign(anchor.dataset, button.dataset);
      button.replaceWith(anchor);
      button = anchor;
    }
    button.dataset.appButtonState = "download";
    button.textContent = `📱 Download App ${update.versionName}`;
    button.href = apkUrl.href;
    button.download = filename;
    button.removeAttribute("aria-disabled");
    button.removeAttribute("disabled");
    button.setAttribute("aria-label", `Download Polytechnic Study Hub Android version ${update.versionName}`);
    button.hidden = false;
    button.removeAttribute("aria-hidden");
  };

  const activateLatestAvailable = async () => {
    try {
      const response = await fetch(`/downloads/app-update.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Update check failed: ${response.status}`);
      const update = await response.json();
      activateDownload(update);
    } catch (error) {
      console.error("Unable to read app-update.json; using fallback APK link.", error);
      activateDownload(FALLBACK_UPDATE);
    }
  };

  button.addEventListener("click", (event) => {
    if (button.dataset.appButtonState === "download") return;
    event.preventDefault();
    window.alert(button.getAttribute("aria-label") || "The app download is temporarily unavailable.");
  });

  activateDownload(FALLBACK_UPDATE);
  activateLatestAvailable();
})();
