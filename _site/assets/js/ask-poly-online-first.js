/* Purpose: Ask poly online first - Descriptive comment added for clarity */
(() => {
  "use strict";

  const HISTORY_KEY = "askPolyOnlineHistory:v1:" + window.location.pathname;
  const command = /^(ok|okay|okk|k|thanks|thank you|sorry|next|exam)$/i;
  const greeting = /^(hi+|hai|hello|hey|help|what can you do)$/i;
  const availability = /^(are you available|available\??|are you online|online\??|working\??|test|testing|ping)$/i;
  const reason = /^(reason|why failed|why error|why no answer|why not working|issue|problem)$/i;
  const vague = /^(why|what|how|where|when|which|who|then|yes|no|and|so|tell|explain)$/i;

  let lastAnswer = "";
  let lastReason = "Online AI has not failed in this session yet.";
  let history = [];

  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

  function loadHistory() {
    try {
      const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      history = Array.isArray(data) ? data.slice(-6) : [];
    } catch (_) {
      history = [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-6)));
    } catch (_) {}
  }

  function msg(body, role, text) {
    const node = document.createElement("div");
    node.className = `poly-ai-msg ${role}`;
    node.textContent = text;
    body.append(node);
    if (role === "bot") lastAnswer = text;
    body.scrollTop = body.scrollHeight;
  }

  function status(text) {
    const node = document.querySelector("#polySiteAssistant .poly-ai-status");
    if (node) node.textContent = text;
  }

  function selectedText() {
    const selection = window.getSelection();
    const text = clean(selection?.toString());
    const anchor = selection?.anchorNode?.parentElement;
    return text && anchor && !anchor.closest("#polySiteAssistant") ? text.slice(0, 900) : "";
  }

  function pageContext() {
    const main = document.querySelector(".panel.active") || document.querySelector("main");
    return clean(main?.innerText || "").slice(0, 900);
  }

  function mathAnswer(query) {
    let text = clean(query).toLowerCase();
    if (!text || text.length > 80) return "";
    text = text.replace(/what is|calculate|solve|answer|maths|math|=/g, "")
      .replace(/plus/g, "+").replace(/minus/g, "-")
      .replace(/times|into|multiplied by/g, "*").replace(/divided by|over/g, "/")
      .replace(/×/g, "*").replace(/÷/g, "/").replace(/,/g, "").replace(/\s+/g, "");
    if (!/[+\-*/%]/.test(text) || !/^[\d+\-*/().%]+$/.test(text)) return "";
    try {
      const value = Function(`"use strict";return (${text})`)();
      if (!Number.isFinite(Number(value))) return "";
      return `${text.replace(/\*/g, " × ").replace(/\//g, " ÷ ")} = ${Number(value.toFixed(10))}`;
    } catch (_) {
      return "";
    }
  }

  function localAnswer(query) {
    const text = clean(query).replace(/[.!?]+$/g, "");
    if (greeting.test(text)) return "Hi! Ask any study, translation, grammar, coding, chemistry, electronics, maths or exam question. Normal questions are sent to online AI.";
    if (availability.test(text)) return "Yes. Ask POLY is available. Normal questions are sent to the online AI backend.";
    if (reason.test(text)) return `Reason: ${lastReason}`;
    if (command.test(text)) return "Please ask the full question. Example: “Translate this to Malayalam”, “What is chemical bond?”, or “Create an HTML calculator”.";
    if (vague.test(text)) return "Please ask a complete question so I can answer correctly.";
    return mathAnswer(query);
  }

  function install(root) {
    if (!root || root.dataset.onlineFirst === "true") return;
    const form = root.querySelector(".poly-ai-form");
    const input = form?.querySelector("input");
    const body = root.querySelector(".poly-ai-body");
    const send = form?.querySelector("button[type='submit']");
    if (!form || !input || !body || !send) return;

    root.dataset.onlineFirst = "true";
    loadHistory();
    status(globalThis.AskPolyRemote?.isConfigured?.() ? "Online AI ready" : "Online AI not configured");
    input.placeholder = "Ask any question like ChatGPT…";

    form.addEventListener("submit", async (event) => {
      const query = clean(input.value);
      if (!query) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = "";
      msg(body, "user", query);

      const local = localAnswer(query);
      if (local) {
        msg(body, "bot", local);
        status("Answered locally");
        return;
      }

      if (!globalThis.AskPolyRemote?.isConfigured?.()) {
        msg(body, "bot", "Online AI is not configured right now. Please try again later.");
        status("Online AI unavailable");
        return;
      }

      status("Online AI is thinking…");
      input.disabled = true;
      send.disabled = true;
      try {
        const result = await globalThis.AskPolyRemote.ask({
          message: query,
          history,
          pageTitle: document.title,
          pageUrl: window.location.href,
          selectedText: selectedText(),
          pageContext: pageContext()
        });
        if (!result?.answer) throw new Error("No answer returned from online AI.");
        msg(body, "bot", result.answer);
        history.push({ role: "user", text: query }, { role: "assistant", text: result.answer });
        history = history.slice(-6);
        saveHistory();
        status(`Answered by online AI${result.model ? " • " + result.model : ""}`);
      } catch (error) {
        lastReason = clean(error?.message || error || "Online AI request failed.");
        msg(body, "bot", "Online AI could not answer right now. Please try again, or ask a shorter question.");
        status("Online AI unavailable");
      } finally {
        input.disabled = false;
        send.disabled = false;
        input.focus();
      }
    }, true);

    [...root.querySelectorAll(".poly-ai-icon")].find((b) => /copy/i.test(b.textContent))?.addEventListener("click", async (event) => {
      if (!lastAnswer) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      try { await navigator.clipboard.writeText(lastAnswer); status("Last answer copied"); } catch (_) { status("Copy unavailable"); }
    }, true);
  }

  function wait() {
    const root = document.getElementById("polySiteAssistant");
    if (root?.querySelector(".poly-ai-form")) return install(root);
    const observer = new MutationObserver(() => {
      const node = document.getElementById("polySiteAssistant");
      if (!node?.querySelector(".poly-ai-form")) return;
      observer.disconnect();
      install(node);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wait, { once: true });
  else wait();
})();
