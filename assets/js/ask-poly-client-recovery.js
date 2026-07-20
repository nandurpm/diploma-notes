(() => {
  "use strict";

  if (!/\/ask-poly(?:-v2)?\.html$/i.test(location.pathname)) return;

  const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
  const RETRY_DELAY_MS = 900;
  const originalFetch = window.fetch.bind(window);
  let lastHealth = null;
  let lastQuestion = "";

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

  function rememberQuestion(options = {}) {
    try {
      if (typeof options.body !== "string") return;
      const payload = JSON.parse(options.body);
      const question = String(payload?.message || "").trim();
      if (question) lastQuestion = question;
    } catch (_) {
      // Ignore non-JSON request bodies.
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
    rememberQuestion(options);
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

  function questionFromLastUserBubble() {
    if (lastQuestion) return lastQuestion;
    const bubbles = [...document.querySelectorAll("#chatMessages .ask-bubble.user")];
    const latest = bubbles.at(-1);
    if (!latest) return "";
    const clone = latest.cloneNode(true);
    clone.querySelectorAll("time, button").forEach(node => node.remove());
    return String(clone.textContent || "").trim();
  }

  function retryQuestion() {
    const question = questionFromLastUserBubble();
    const input = document.getElementById("chatInput");
    const form = document.getElementById("chatForm");
    if (!question || !input || !form) {
      setStatus("Retry unavailable", "The previous question could not be recovered.");
      return;
    }
    input.value = question;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    if (typeof form.requestSubmit === "function") form.requestSubmit();
    else document.getElementById("sendBtn")?.click();
  }

  function addRetryButtons() {
    document.querySelectorAll("#chatMessages .ask-bubble.ai:not([data-poly-retry-checked])").forEach(bubble => {
      bubble.dataset.polyRetryChecked = "true";
      const text = String(bubble.textContent || "").toLowerCase();
      const failed = text.includes("could not reach the ai service")
        || text.includes("live ai service is temporarily unavailable")
        || text.includes("ai service could not answer right now");
      if (!failed) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ask-copy ask-retry";
      button.textContent = "Retry question";
      button.addEventListener("click", retryQuestion);
      bubble.append(button);
    });
  }

  function watchFailureMessages() {
    const messages = document.getElementById("chatMessages");
    if (!messages || messages.dataset.polyRetryObserved === "true") return;
    messages.dataset.polyRetryObserved = "true";
    addRetryButtons();
    if ("MutationObserver" in window) {
      new MutationObserver(addRetryButtons).observe(messages, { childList: true, subtree: true });
    }
  }

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
    retryQuestion,
    getLastHealth: () => lastHealth
  });

  window.addEventListener("online", checkHealth);
  window.addEventListener("offline", () => setStatus("Offline", "Connect to the internet to use Ask POLY AI."));

  const initialise = () => {
    watchFailureMessages();
    checkHealth();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
