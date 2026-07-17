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

  return { escapeHtml, getMetaContent, createSupabaseBrowserClient };
})();
