/* Purpose: Protected email - Descriptive comment added for clarity */
(() => {
  "use strict";

  function decodeProtectedEmail(value) {
    const encoded = String(value || "").trim();
    if (!/^[0-9a-f]+$/i.test(encoded) || encoded.length < 4 || encoded.length % 2 !== 0) {
      return "";
    }
    const key = Number.parseInt(encoded.slice(0, 2), 16);
    let result = "";
    for (let index = 2; index < encoded.length; index += 2) {
      result += String.fromCharCode(Number.parseInt(encoded.slice(index, index + 2), 16) ^ key);
    }
    return result;
  }

  function activateProtectedEmail(link) {
    const address = decodeProtectedEmail(link.dataset.protectedEmail);
    if (!address || !address.includes("@")) return;
    const subject = String(link.dataset.emailSubject || "").trim();
    link.href = `mailto:${address}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
  }

  function init() {
    document.querySelectorAll("[data-protected-email]").forEach(activateProtectedEmail);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
