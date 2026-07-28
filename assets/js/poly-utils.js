/* Purpose: Poly utils - Descriptive comment added for clarity */
/*
 * Shared browser utilities for POLY PMNA pages.
 *
 * Exposes a single global namespace, window.PolyUtils, so individual page
 * scripts can reuse the same HTML escaping and Supabase browser-client setup
 * instead of redefining them. Load this before any script that consumes it.
 */
window.PolyUtils = (() => {
  "use strict";

  const HTML_ESCAPE_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
  }

  function getMetaContent(name) {
    return document.querySelector(`meta[name="${name}"]`)?.content || "";
  }

  const DEFAULT_AUTH_OPTIONS = {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  };

  function createSupabaseBrowserClient(options = {}) {
    if (!window.supabase?.createClient) return null;

    const url = options.url || getMetaContent("supabase-url");
    const key = options.key || getMetaContent("supabase-publishable-key");
    if (!url || !key) return null;

    const clientOptions = {
      auth: { ...DEFAULT_AUTH_OPTIONS, ...(options.auth || {}) },
    };
    if (options.global) clientOptions.global = options.global;

    return window.supabase.createClient(url, key, clientOptions);
  }

  /**
   * Formats a Date object as a YYYY-MM-DD string in the specified timezone.
   * Encourages code reuse and standardizes timezone calculations across all portal/quiz/special-day modules.
   */
  function formatDateKey(date = new Date(), timeZone = "Asia/Kolkata") {
    const d = date ? new Date(date) : new Date();
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(d);

      const value = (type) => parts.find((item) => item.type === type)?.value ?? "";
      const y = value("year");
      const m = value("month");
      const day = value("day");
      if (y && m && day) return `${y}-${m}-${day}`;
    } catch (_) {
      // Fallback if Intl.DateTimeFormat is not supported or fails
    }
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  return { escapeHtml, getMetaContent, createSupabaseBrowserClient, formatDateKey };
})();
