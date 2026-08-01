/* Purpose: Ask poly client recovery - Descriptive comment added for clarity */
(() => {
  "use strict";

  if (!/\/ask-poly(?:-v2)?\.html$/i.test(location.pathname)) return;

  const RETRYABLE_STATUS = new Set([401, 403, 408, 425, 429, 500, 502, 503, 504]);
  const RETRY_DELAY_MS = 700;
  const originalFetch = window.fetch.bind(window);
  let lastHealth = null;
  let lastQuestion = "";
  let activeEndpoint = "";

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const statusNode = () => document.getElementById("chatStatus");
  const config = () => globalThis.ASK_POLY_CONFIG || {};

  function setStatus(text, title = "") {
    const node = statusNode();
    if (!node) return;
    node.textContent = text;
    node.title = title;
  }

  function endpointCandidates() {
    return [...new Set([
      String(config().endpoint || "").trim(),
      String(config().backupEndpoint || "").trim()
    ].filter(Boolean))];
  }

  function healthCandidates() {
    const configured = String(config().healthEndpoint || "").trim();
    const derived = endpointCandidates().map(endpoint => {
      try {
        const url = new URL(endpoint, location.href);
        if (url.hostname.endsWith("workers.dev")) url.pathname = "/health";
        url.search = "";
        url.hash = "";
        return url.href;
      } catch (_) {
        return "";
      }
    });
    return [...new Set([configured, ...derived].filter(Boolean))];
  }

  function matchesEndpoint(input) {
    try {
      const requested = new URL(typeof input === "string" ? input : input.url, location.href);
      return endpointCandidates().some(endpoint => {
        const candidate = new URL(endpoint, location.href);
        return requested.origin === candidate.origin && requested.pathname === candidate.pathname;
      });
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

  function authHeadersFor(url) {
    try {
      const parsed = new URL(url, location.href);
      const key = String(config().supabasePublishableKey || "").trim();
      if (!key || !parsed.hostname.endsWith("supabase.co")) return {};
      return {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "X-Client-Info": "poly-pmna-ask-web/3"
      };
    } catch (_) {
      return {};
    }
  }

  function cloneOptions(options = {}, endpoint = "") {
    return {
      ...options,
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
        ...authHeadersFor(endpoint)
      }
    };
  }

  async function fetchAskWithFailover(input, options) {
    rememberQuestion(options);
    const candidates = endpointCandidates();
    if (!candidates.length) throw new Error("Ask POLY endpoint is missing.");

    let lastError = null;
    let lastResponse = null;

    for (let index = 0; index < candidates.length; index += 1) {
      const endpoint = candidates[index];
      const attempts = index === 0 ? 2 : 1;

      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          const response = await originalFetch(endpoint, cloneOptions(options, endpoint));
          if (response.ok) {
            activeEndpoint = endpoint;
            if (index > 0) setStatus("Ready on backup AI", "Primary AI route was unavailable; backup route answered.");
            return response;
          }
          lastResponse = response;
          if (!RETRYABLE_STATUS.has(response.status)) return response;
          lastError = new Error(`Ask POLY returned HTTP ${response.status}.`);
        } catch (error) {
          lastError = error;
          if (error?.name === "AbortError") throw error;
        }

        if (attempt < attempts) {
          setStatus("Retrying AI relay…", lastError?.message || "Temporary AI connection failure");
          await delay(RETRY_DELAY_MS);
        }
      }

      if (index < candidates.length - 1) {
        setStatus("Switching AI route…", "The primary endpoint could not be reached from this network.");
      }
    }

    if (lastResponse) return lastResponse;
    throw lastError || new Error("Ask POLY request failed on all routes.");
  }

  window.fetch = function polyAskFetch(input, options = {}) {
    if (!matchesEndpoint(input)) return originalFetch(input, options);
    return fetchAskWithFailover(input, options);
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
        || text.includes("ai service could not answer right now")
        || text.includes("relay could not reach");
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

    const candidates = healthCandidates();
    if (!candidates.length) {
      setStatus("AI configuration error", "Ask POLY endpoint is missing.");
      return null;
    }

    setStatus("Checking AI routes…");
    let lastError = null;

    for (const url of candidates) {
      try {
        const response = await originalFetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, {
          method: "GET",
          mode: "cors",
          credentials: "omit",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            ...authHeadersFor(url)
          }
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.ok !== true || payload.configured !== true) {
          throw new Error(payload.error || `Health check failed with HTTP ${response.status}.`);
        }
        lastHealth = payload;
        activeEndpoint = url;
        const providers = Array.isArray(payload.providers) ? payload.providers.join(", ") : "AI provider";
        const route = new URL(url).hostname.endsWith("supabase.co") ? "Supabase relay" : "Worker direct";
        setStatus("Ready", `${route} · ${providers}${payload.model ? ` · ${payload.model}` : ""}`);
        return payload;
      } catch (error) {
        lastError = error;
      }
    }

    lastHealth = null;
    setStatus("AI routes unavailable", lastError?.message || "Health checks failed");
    return null;
  }

  globalThis.AskPolyClientRecovery = Object.freeze({
    checkHealth,
    retryQuestion,
    getLastHealth: () => lastHealth,
    getActiveEndpoint: () => activeEndpoint
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
