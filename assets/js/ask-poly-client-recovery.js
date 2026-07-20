(() => {
  "use strict";

  if (!/\/ask-poly(?:-v2)?\.html$/i.test(location.pathname)) return;

  const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
  const RETRY_DELAY_MS = 900;
  const originalFetch = window.fetch.bind(window);
  let lastHealth = null;

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const statusNode = () => document.getElementById("chatStatus");

  function setStatus(text, title = "") {
    const node = statusNode();
    if (!node) return;
    node.textContent = text;
    if (title) node.title = title;
  }

  function endpointUrl() {
    return String(globalThis.ASK_POLY_CONFIG?.endpoint || "").trim();
  }

  function healthUrl() {
    const endpoint = endpointUrl();
    if (!endpoint) return "";
    try {
      const url = new URL(endpoint, location.href);
      url.pathname = "/health";
      url.search = "";
      url.hash = "";
      return url.href;
    } catch (_) {
      return "";
    }
  }

  function isAskRequest(input) {
    const endpoint = endpointUrl();
    if (!endpoint) return false;
    try {
      const requested = new URL(typeof input === "string" ? input : input.url, location.href);
      const configured = new URL(endpoint, location.href);
      return requested.origin === configured.origin && requested.pathname === configured.pathname;
    } catch (_) {
      return false;
    }
  }

  function cloneOptions(options = {}) {
    return {
      ...options,
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      }
    };
  }

  async function fetchAskWithRetry(input, options) {
    const requestOptions = cloneOptions(options);
    let firstError = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await originalFetch(input, requestOptions);
        if (response.ok || !RETRYABLE_STATUS.has(response.status) || attempt === 2) return response;
        firstError = new Error(`Ask POLY returned HTTP ${response.status}.`);
      } catch (error) {
        firstError = error;
        if (attempt === 2 || error?.name === "AbortError") throw error;
      }

      setStatus("Retrying AI service…", firstError?.message || "Temporary AI connection failure");
      await delay(RETRY_DELAY_MS);
    }

    throw firstError || new Error("Ask POLY request failed.");
  }

  window.fetch = function polyAskFetch(input, options = {}) {
    if (!isAskRequest(input)) return originalFetch(input, options);
    return fetchAskWithRetry(input, options);
  };

  async function checkHealth() {
    if (!navigator.onLine) {
      setStatus("Offline", "Connect to the internet to use Ask POLY AI.");
      lastHealth = null;
      return null;
    }

    const url = healthUrl();
    if (!url) {
      setStatus("AI configuration error", "Ask POLY endpoint is missing.");
      return null;
    }

    setStatus("Checking AI service…");
    try {
      const response = await originalFetch(`${url}?t=${Date.now()}`, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true || payload.configured !== true) {
        throw new Error(payload.error || `Health check failed with HTTP ${response.status}.`);
      }
      lastHealth = payload;
      const providers = Array.isArray(payload.providers) ? payload.providers.join(", ") : "AI provider";
      setStatus("Ready", `Connected: ${providers}${payload.model ? ` · ${payload.model}` : ""}`);
      return payload;
    } catch (error) {
      lastHealth = null;
      setStatus("AI service reconnecting", error?.message || "Health check failed");
      return null;
    }
  }

  globalThis.AskPolyClientRecovery = Object.freeze({
    checkHealth,
    getLastHealth: () => lastHealth
  });

  window.addEventListener("online", checkHealth);
  window.addEventListener("offline", () => setStatus("Offline", "Connect to the internet to use Ask POLY AI."));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkHealth, { once: true });
  } else {
    checkHealth();
  }
})();
