(() => {
  "use strict";

  const ASSET_VERSION = "20260621-ask-poly-student-friendly-fix";

  function rootPrefix() {
    const depth = window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth > 0 ? "../".repeat(depth) : "";
  }

  function shouldSkipAssistant() {
    const pathname = window.location.pathname;
    return [
      "/privacy.html",
      "/terms.html",
      "/disclaimer.html",
      "/previous-question-papers.html"
    ].includes(pathname);
  }

  function assetUrl(prefix, path) {
    return `${prefix}${path}?v=${ASSET_VERSION}`;
  }

  function hasAsset(selector, path) {
    return [...document.querySelectorAll(selector)].some((element) => {
      const raw = selector === "script" ? element.src : element.href;
      if (!raw) return false;
      try {
        return new URL(raw, window.location.href).pathname.endsWith(`/${path}`);
      } catch (_) {
        return false;
      }
    });
  }

  function loadStyle(prefix, path) {
    if (hasAsset("link[rel='stylesheet']", path)) return Promise.resolve();
    return new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = assetUrl(prefix, path);
      link.addEventListener("load", resolve, { once: true });
      link.addEventListener("error", resolve, { once: true });
      document.head.append(link);
    });
  }

  function loadScript(prefix, path) {
    if (hasAsset("script", path)) return Promise.resolve();
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = assetUrl(prefix, path);
      script.async = false;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", resolve, { once: true });
      document.body.append(script);
    });
  }

  function ensureMount() {
    let mount = document.getElementById("polySiteAssistant");
    if (!mount) {
      mount = document.createElement("div");
      mount.id = "polySiteAssistant";
      mount.setAttribute("aria-live", "polite");
      document.body.append(mount);
    }
    return mount;
  }

  function fallbackButton() {
    if (document.querySelector("#polySiteAssistant .poly-ai-button")) return;
    const mount = ensureMount();
    mount.innerHTML = `<button class="poly-ai-button" type="button" aria-label="Ask POLY loading"><span class="poly-ai-button-mark">AI</span><span class="poly-ai-button-copy"><span class="poly-ai-button-text">Ask POLY</span><span class="poly-ai-button-subtext">Loading...</span></span></button>`;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (shouldSkipAssistant()) return;

    const prefix = rootPrefix();
    ensureMount();

    await loadStyle(prefix, "assets/css/site-assistant.css");
    await loadStyle(prefix, "assets/css/ask-poly-rich-content.css");
    await loadStyle(prefix, "assets/css/site-assistant-fix.css");

    await loadScript(prefix, "assets/js/ask-poly-config.js");
    await loadScript(prefix, "assets/js/ask-poly-remote.js");
    await loadScript(prefix, "assets/js/site-assistant.js");
    await loadScript(prefix, "assets/js/ask-poly-general-ai-extension.js");
    await loadScript(prefix, "assets/js/ask-poly-rich-renderer.js");

    window.setTimeout(fallbackButton, 1200);
  });
})();
