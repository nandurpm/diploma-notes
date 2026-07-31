/* Purpose: Ask poly live hotfix - Descriptive comment added for clarity */
(() => {
  "use strict";

  const AVAILABILITY_PATTERN = /^(are you available|available\??|are you online|online\??|working\??|are you working|test|testing|ping)$/i;
  const REASON_PATTERN = /^(reason|what reason|why not working|why failed|why no answer|why error|issue|problem)$/i;
  const CHEMICAL_BOND_PATTERN = /chemical\s+bond/i;
  let lastReason = "The online AI provider did not return an answer fast enough, or the deployed Worker/browser cache has not refreshed yet.";

  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

  function appendMessage(role, text) {
    const body = document.querySelector("#polySiteAssistant .poly-ai-body");
    if (!body) return;
    const msg = document.createElement("div");
    msg.className = `poly-ai-msg ${role}`;
    msg.textContent = text;
    body.append(msg);
    body.scrollTop = body.scrollHeight;
  }

  function setStatus(text) {
    const status = document.querySelector("#polySiteAssistant .poly-ai-status");
    if (status) status.textContent = text;
  }

  function answerFor(query) {
    if (AVAILABILITY_PATTERN.test(query)) {
      return {
        text: "Yes. The local Ask POLY assistant is available. Online AI is configured, but if the provider is slow, local subject search, lesson search and basic maths still work.",
        status: "Available • Local mode ready"
      };
    }
    if (REASON_PATTERN.test(query)) {
      return {
        text: `Reason: ${lastReason}\n\nFix/check: redeploy the Ask POLY Worker, wait for GitHub Pages/browser cache refresh, then test again. Local mode is still active.`,
        status: "Reason explained locally"
      };
    }
    if (CHEMICAL_BOND_PATTERN.test(query)) {
      return {
        text: "A chemical bond is the attractive force that holds atoms together in a molecule or compound. Atoms form bonds to become more stable, usually by sharing, gaining, or losing electrons. Main types are ionic, covalent and metallic bonds.",
        status: "Answered locally"
      };
    }
    return null;
  }

  document.addEventListener("submit", (event) => {
    const form = event.target?.closest?.("#polySiteAssistant .poly-ai-form");
    if (!form) return;
    const input = form.querySelector("input");
    const query = clean(input?.value);
    const answer = answerFor(query);
    if (!answer) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (input) input.value = "";
    appendMessage("user", query);
    appendMessage("bot", answer.text);
    setStatus(answer.status);
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const message = clean(event.reason?.message || event.reason || "");
    if (/Ask POLY|fetch|network|timeout|abort|AI/i.test(message)) lastReason = message;
  });
})();
