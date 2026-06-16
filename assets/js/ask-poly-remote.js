(() => {
  "use strict";

  function currentConfig() {
    const config = globalThis.ASK_POLY_CONFIG || {};
    return {
      endpoint: String(config.endpoint || "").trim(),
      timeoutMs: Math.max(5000, Number(config.timeoutMs || 60000)),
      maxHistory: Math.max(0, Math.min(20, Number(config.maxHistory || 12)))
    };
  }

  function validEndpoint(endpoint) {
    if (!endpoint) return false;
    try {
      const url = new URL(endpoint, window.location.href);
      return url.protocol === "https:"
        || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
    } catch (_) {
      return false;
    }
  }

  async function ask(payload) {
    const config = currentConfig();
    if (!validEndpoint(config.endpoint)) return null;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          ...payload,
          history: Array.isArray(payload.history) ? payload.history.slice(-config.maxHistory) : []
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.error || `Ask POLY AI failed with HTTP ${response.status}.`);
        error.status = response.status;
        error.detail = data.detail || "";
        throw error;
      }
      return data;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  globalThis.AskPolyRemote = Object.freeze({
    isConfigured: () => validEndpoint(currentConfig().endpoint),
    endpoint: () => currentConfig().endpoint,
    ask
  });
})();
