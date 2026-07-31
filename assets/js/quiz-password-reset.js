/* Purpose: Quiz password reset - Descriptive comment added for clarity */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  function setMessage(text, ok = false) {
    const target = $("authMessage");
    if (!target) return;
    target.textContent = text || "";
    target.className = "status " + (text ? (ok ? "ok" : "error") : "");
  }

  async function sendResetLink() {
    const email = $("email")?.value?.trim() || "";
    const button = $("forgotPasswordBtn");
    if (button) button.disabled = true;
    setMessage("Sending password reset link...", true);
    try {
      const result = await window.PolyQuizAuth.requestPasswordReset(email);
      setMessage(result.message, true);
    } catch (error) {
      setMessage(error?.message || "Password reset failed. Please try again.");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function bind() {
    const button = $("forgotPasswordBtn");
    if (!button) return;
    button.addEventListener("click", sendResetLink);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
