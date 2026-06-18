(() => {
  "use strict";

  const button = document.querySelector(".app-download");
  if (!button) return;

  const appMatch = navigator.userAgent.match(/PolytechnicStudyHubAndroid\/([0-9]+(?:\.[0-9]+)*)/i);
  if (appMatch) return;

  const requiredVersion = button.dataset.requiredVersion || "1.0.4";

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

  const showPending = () => {
    button.dataset.appButtonState = "pending";
    button.textContent = "📱 Updated App Preparing…";
    button.href = "#";
    button.removeAttribute("download");
    button.setAttribute("aria-disabled", "true");
    button.setAttribute("aria-label", "The updated Polytechnic Study Hub Android app is being prepared");
    button.hidden = false;
    button.removeAttribute("aria-hidden");
  };

  const activateDownload = (update) => {
    const apkUrl = new URL(update.apkUrl, window.location.origin);
    const filename = apkUrl.pathname.split("/").pop() || `Polytechnic-Study-Hub-v${update.versionName}.apk`;

    button.dataset.appButtonState = "download";
    button.textContent = `📱 Download App ${update.versionName}`;
    button.href = apkUrl.href;
    button.download = filename;
    button.removeAttribute("aria-disabled");
    button.setAttribute("aria-label", `Download Polytechnic Study Hub Android version ${update.versionName}`);
    button.hidden = false;
    button.removeAttribute("aria-hidden");
  };

  button.addEventListener("click", (event) => {
    if (button.dataset.appButtonState !== "download") {
      event.preventDefault();
      window.alert("The updated app is being prepared. The old version is not offered for download.");
    }
  });

  showPending();

  fetch(`/downloads/app-update.json?t=${Date.now()}`, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Update check failed: ${response.status}`);
      return response.json();
    })
    .then(async (update) => {
      if (!update?.versionName || !update?.apkUrl) return;
      if (compareVersions(update.versionName, requiredVersion) < 0) return;

      const apkResponse = await fetch(new URL(update.apkUrl, window.location.origin), {
        method: "HEAD",
        cache: "no-store",
      });
      if (!apkResponse.ok) throw new Error(`APK check failed: ${apkResponse.status}`);
      activateDownload(update);
    })
    .catch((error) => {
      console.error("Unable to activate the updated app download.", error);
      showPending();
    });
})();
