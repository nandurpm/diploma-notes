(() => {
  "use strict";

  const button = document.querySelector(".app-download");
  if (!button) return;

  const appMatch = navigator.userAgent.match(/PolytechnicStudyHubAndroid\/([0-9]+(?:\.[0-9]+)*)/i);
  if (appMatch) return;

  const FALLBACK_UPDATE = Object.freeze({
    versionName: "1.0.5",
    apkUrl: "/downloads/Polytechnic-Study-Hub-v1.0.5.apk",
    title: "Polytechnic Study Hub latest Android app",
    message: "Download the latest available Android APK. Website updates load automatically."
  });

  const versionParts = (value) => String(value || "0").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const compareVersions = (left, right) => {
    const l = versionParts(left);
    const r = versionParts(right);
    const length = Math.max(l.length, r.length);
    for (let index = 0; index < length; index += 1) {
      if ((l[index] || 0) > (r[index] || 0)) return 1;
      if ((l[index] || 0) < (r[index] || 0)) return -1;
    }
    return 0;
  };

  const chooseLatest = (update) => {
    if (!update?.versionName || compareVersions(update.versionName, FALLBACK_UPDATE.versionName) < 0) {
      return FALLBACK_UPDATE;
    }
    return update;
  };

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
  };

  const activateDownload = (update) => {
    const latest = chooseLatest(update);
    const apkHref = validApkPath(latest.apkUrl);
    if (!latest?.versionName || !apkHref) {
      showUnavailable();
      return;
    }

    const apkUrl = new URL(apkHref);
    const filename = apkUrl.pathname.split("/").pop() || `Polytechnic-Study-Hub-v${latest.versionName}.apk`;

    button.dataset.appButtonState = "download";
    button.textContent = "📱 Download Our App";
    button.href = apkUrl.href;
    button.download = filename;
    button.removeAttribute("aria-disabled");
    button.setAttribute("aria-label", `Download Polytechnic Study Hub Android app version ${latest.versionName}`);
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