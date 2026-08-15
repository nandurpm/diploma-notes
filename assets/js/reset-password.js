/* Purpose: Reset password - Descriptive comment added for clarity */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  function msg(text, ok = false) {
    const node = $("resetMessage");
    if (!node) return;
    node.textContent = text || "";
    node.className = "status " + (text ? (ok ? "ok" : "error") : "");
  }

  function client() {
    return window.PolyUtils.createSupabaseBrowserClient();
  }

  async function bind() {
    document.querySelectorAll("[data-year]").forEach((node) => {
      node.textContent = new Date().getFullYear();
    });

    const db = client();
    const form = $("resetForm");
    if (!db || !form) {
      msg("Password reset system did not load. Check internet and try again.");
      return;
    }

    const { data: sessionData, error: sessionError } = await db.auth.getSession().catch((error) => ({ data: null, error }));
    if (sessionError || !sessionData?.session) {
      msg("This password-reset link is invalid or expired. Request a new link and try again.");
      form.querySelectorAll("input, button").forEach((node) => { node.disabled = true; });
      return;
    }
    if (window.location.hash || new URLSearchParams(window.location.search).has("code")) {
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.hash ? "" : window.location.search.replace(/([?&])code=[^&]*&?/, "$1").replace(/[?&]$/, "")}`);
    }

    const showPw = $("showPasswordToggle");
    if (showPw) {
      showPw.addEventListener("change", () => {
        const type = showPw.checked ? "text" : "password";
        const pw = $("newPassword");
        const cp = $("confirmPassword");
        if (pw) pw.type = type;
        if (cp) cp.type = type;
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const password = $("newPassword")?.value || "";
      const confirm = $("confirmPassword")?.value || "";
      if (password.length < 6) {
        msg("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirm) {
        msg("Passwords do not match.");
        return;
      }
      $("resetSubmit").disabled = true;
      msg("Updating password...", true);
      try {
        const { error } = await db.auth.updateUser({ password });
        if (error) throw error;
        msg("Password changed successfully. You can login with the new password.", true);
        setTimeout(() => { location.href = "/daily-quiz.html"; }, 1800);
      } catch (error) {
        const text = String(error?.message || error || "").toLowerCase();
        msg(text.includes("network") || text.includes("fetch")
          ? "The password service is temporarily unreachable. Please try again later."
          : "Password update failed. The reset link may have expired; request a new link and retry.");
      } finally {
        $("resetSubmit").disabled = false;
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
