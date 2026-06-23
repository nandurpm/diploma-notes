(() => {
  "use strict";

  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || "";
  const $ = (id) => document.getElementById(id);

  function msg(text, ok = false) {
    const node = $("resetMessage");
    if (!node) return;
    node.textContent = text || "";
    node.className = "status " + (text ? (ok ? "ok" : "error") : "");
  }

  function client() {
    if (!window.supabase?.createClient) return null;
    const url = meta("supabase-url");
    const key = meta("supabase-publishable-key");
    if (!url || !key) return null;
    return window.supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
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

    await db.auth.getSession().catch(() => null);

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
        msg(error?.message || "Password update failed. Open the reset link again and retry.");
      } finally {
        $("resetSubmit").disabled = false;
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
