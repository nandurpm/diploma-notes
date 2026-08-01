/* Purpose: App download controller - Descriptive comment added for clarity */
(() => {
  "use strict";

  const RELEASE_OWNER = "nandurpm";
  const RELEASE_REPOSITORY = "diploma-notes";

  const ensureButton = () => {
    let button = document.querySelector(".app-download");
    if (button) return button;

    const actions = document.querySelector(".home-app-actions,.home-compact-hero .hero-actions,.hero-actions");
    if (!actions) return null;

    button = document.createElement("a");
    button.className = "btn ghost app-download";
    button.href = "/downloads/";
    button.textContent = "📱 Checking App Download…";
    button.dataset.appButtonState = "checking";
    button.setAttribute("aria-label", "Checking the latest POLY PMNA Android app download");
    actions.append(button);
    return button;
  };

  const button = ensureButton();
  if (!button) return;

  const appMatch = navigator.userAgent.match(/(?:PolytechnicStudyHubAndroid|PolyPmnaAndroid)\/([0-9]+(?:\.[0-9]+)*)/i);
  const currentAppVersion = appMatch ? appMatch[1] : null;

  const isNewer = (latest, current) => {
    if (!latest || !current) return false;
    const l = latest.split(".").map(Number);
    const c = current.split(".").map(Number);
    for (let i = 0; i < Math.max(l.length, c.length); i++) {
      const lv = l[i] || 0;
      const cv = c[i] || 0;
      if (lv > cv) return true;
      if (lv < cv) return false;
    }
    return false;
  };

  const validApkUrl = (value) => {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.origin);
      if (url.protocol !== "https:") return "";

      const sameSiteApk = url.origin === window.location.origin
        && url.pathname.startsWith("/downloads/")
        && url.pathname.toLowerCase().endsWith(".apk");

      const trustedReleaseApk = url.hostname.toLowerCase() === "github.com"
        && url.pathname.toLowerCase().startsWith(`/${RELEASE_OWNER}/${RELEASE_REPOSITORY}/releases/download/`)
        && url.pathname.toLowerCase().endsWith(".apk");

      return sameSiteApk || trustedReleaseApk ? url.href : "";
    } catch (_) {
      return "";
    }
  };

  const showUnavailable = (message = "The Android app download is temporarily unavailable.") => {
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
    const apkHref = validApkUrl(update?.apkUrl);
    if (!update?.versionName || !apkHref) {
      showUnavailable();
      return;
    }

    const apkUrl = new URL(apkHref);
    const filename = decodeURIComponent(apkUrl.pathname.split("/").pop() || `POLY_PMNA_v${update.versionName}.apk`);

    button.dataset.appButtonState = "download";
    button.textContent = `📱 Download Our App v${update.versionName}`;
    button.href = apkUrl.href;

    // The download attribute is reliable for same-origin files. GitHub Release
    // assets provide their own attachment response, so normal navigation starts
    // the APK download on Android without opening an intermediate website page.
    if (apkUrl.origin === window.location.origin) button.download = filename;
    else button.removeAttribute("download");

    button.removeAttribute("aria-disabled");
    button.setAttribute("aria-label", `Download POLY PMNA Android app version ${update.versionName}`);
    button.hidden = false;
    button.removeAttribute("aria-hidden");
    button.style.removeProperty("display");

    if (currentAppVersion) {
      if (isNewer(update.versionName, currentAppVersion)) {
        button.dataset.appButtonState = "update";
        button.textContent = `✨ Update Available v${update.versionName}`;
        button.classList.remove("ghost");
        button.classList.add("primary");
        // Ensure the button is visible in the app when an update is available
        button.style.setProperty("display", "inline-flex", "important");
      } else {
        button.hidden = true;
        button.setAttribute("aria-hidden", "true");
        button.style.setProperty("display", "none", "important");
      }
    }
  };

  const activateLatestAvailable = async () => {
    try {
      const response = await fetch(`/downloads/app-update.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Update check failed: ${response.status}`);
      activateDownload(await response.json());
    } catch (error) {
      console.error("Unable to read the Android app update manifest.", error);
      showUnavailable();
    }
  };

  button.addEventListener("click", (event) => {
    if (["download", "update"].includes(button.dataset.appButtonState)) return;
    event.preventDefault();
    window.alert(button.getAttribute("aria-label") || "The Android app download is temporarily unavailable.");
  });

  activateLatestAvailable();
})();
