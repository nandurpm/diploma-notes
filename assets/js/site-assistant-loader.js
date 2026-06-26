(() => {
  "use strict";

  const ASSET_VERSION = "20260626-assistant-parallel-timeout";
  const ASSET_TIMEOUT_MS = 4500;

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

  function withTimeout(promise, label, timeoutMs = ASSET_TIMEOUT_MS) {
    let timeoutId = 0;
    const timeout = new Promise((resolve) => {
      timeoutId = window.setTimeout(() => {
        console.warn(`Ask POLY asset timed out: ${label}`);
        resolve({ timedOut: true, label });
      }, timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
  }

  function loadStyle(prefix, path) {
    if (hasAsset("link[rel='stylesheet']", path)) return Promise.resolve({ skipped: true, path });
    return withTimeout(new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = assetUrl(prefix, path);
      link.addEventListener("load", () => resolve({ ok: true, path }), { once: true });
      link.addEventListener("error", () => resolve({ ok: false, path }), { once: true });
      document.head.append(link);
    }), path);
  }

  function loadScript(prefix, path) {
    if (hasAsset("script", path)) return Promise.resolve({ skipped: true, path });
    return withTimeout(new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = assetUrl(prefix, path);
      script.async = false;
      script.defer = true;
      script.addEventListener("load", () => resolve({ ok: true, path }), { once: true });
      script.addEventListener("error", () => resolve({ ok: false, path }), { once: true });
      document.body.append(script);
    }), path);
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

  function fallbackButton(message = "Ready") {
    if (document.querySelector("#polySiteAssistant .poly-ai-button")) return;
    const mount = ensureMount();
    mount.innerHTML = `<button class="poly-ai-button" type="button" aria-label="Ask POLY"><span class="poly-ai-button-mark">AI</span><span class="poly-ai-button-copy"><span class="poly-ai-button-text">Ask POLY</span><span class="poly-ai-button-subtext">${message}</span></span></button>`;
  }

  async function bootAssistant() {
    if (shouldSkipAssistant()) return;

    const prefix = rootPrefix();
    ensureMount();
    window.setTimeout(() => fallbackButton("Loading..."), 900);

    try {
      await Promise.all([
        loadStyle(prefix, "assets/css/site-assistant.css"),
        loadStyle(prefix, "assets/css/ask-poly-rich-content.css"),
        loadStyle(prefix, "assets/css/site-assistant-fix.css")
      ]);

      await loadScript(prefix, "assets/js/ask-poly-config.js");
      await loadScript(prefix, "assets/js/ask-poly-remote.js");
      await loadScript(prefix, "assets/js/site-assistant.js");

      await Promise.all([
        loadScript(prefix, "assets/js/ask-poly-general-ai-extension.js"),
        loadScript(prefix, "assets/js/ask-poly-live-hotfix.js"),
        loadScript(prefix, "assets/js/ask-poly-rich-renderer.js")
      ]);

      window.setTimeout(() => fallbackButton("Ready"), 1200);
    } catch (error) {
      console.error("Ask POLY assistant failed to initialize:", error);
      fallbackButton("Unavailable");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { window.setTimeout(bootAssistant, 1); }, { once: true });
  } else {
    window.setTimeout(bootAssistant, 1);
  }
})();
