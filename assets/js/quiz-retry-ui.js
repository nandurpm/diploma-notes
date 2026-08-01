/* Purpose: Quiz retry ui - Descriptive comment added for clarity */
(() => {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function ensureRetryButton() {
    const modebar = document.querySelector(".modebar");
    if (!modebar || byId("retryQuizService")) return;

    const button = document.createElement("button");
    button.className = "btn outline";
    button.id = "retryQuizService";
    button.type = "button";
    button.textContent = "Retry Service";
    button.addEventListener("click", async () => {
      const message = byId("quizMsg") || byId("authMessage");
      if (message) {
        message.textContent = "Retrying quiz service...";
        message.className = "status";
      }
      try {
        await window.PolyQuizResults?.recent?.();
        byId("openDash")?.click();
        if (message) {
          message.textContent = "Retry completed. If online data is still unavailable, continue as Guest and try again later.";
          message.className = "status ok";
        }
      } catch (error) {
        if (message) {
          message.textContent = "Service unavailable. Continue as Guest or try again later.";
          message.className = "status error";
        }
      }
    });
    modebar.append(button);
  }

  function showMaintenanceFallback() {
    const cards = byId("dailySubjectCards");
    const box = byId("quizBox");
    if (!cards || cards.children.length) return;
    if (box) {
      box.classList.remove("hidden");
      box.innerHTML = '<div class="notice">Quiz subjects are not available right now. Use Retry Service, or continue as Guest if the cloud service is down.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.setTimeout(ensureRetryButton, 800);
    window.setTimeout(showMaintenanceFallback, 1800);
  });
})();
