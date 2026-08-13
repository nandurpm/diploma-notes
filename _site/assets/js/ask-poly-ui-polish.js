/* Purpose: Ask poly ui polish - Descriptive comment added for clarity */
(() => {
  "use strict";

  if (!/\/ask-poly\.html$/i.test(location.pathname)) return;

  const ICONS = [
    [/find|search|subject/i, "🔎"],
    [/notes|lesson|download/i, "📄"],
    [/mock|exam|quiz/i, "📝"],
    [/electrical|tool|calculator/i, "⚡"],
    [/report|issue|broken|help/i, "🛠️"],
    [/syllabus|sitttr|qp|question/i, "📘"],
    [/department|semester/i, "🎓"]
  ];

  function iconFor(text) {
    const match = ICONS.find(([pattern]) => pattern.test(text || ""));
    return match ? match[1] : "✨";
  }

  function addStyles() {
    if (document.getElementById("askPolyUiPolishStyle")) return;
    const style = document.createElement("style");
    style.id = "askPolyUiPolishStyle";
    style.textContent = `
      .chat-panel{border-color:rgba(29,78,216,.22)!important;box-shadow:0 26px 76px rgba(15,23,42,.13)!important}
      .chat-head{gap:14px!important}.chat-head p{margin:.25rem 0 0!important;color:#52637a!important}.chat-status{border:1px solid rgba(15,118,110,.18);background:#ecfdf5;border-radius:999px;padding:7px 11px;color:#0f766e!important;white-space:nowrap}
      .chat-box{padding:24px!important;scroll-behavior:smooth!important;overscroll-behavior:contain}.bubble{padding:16px 18px!important;line-height:1.65!important}.bubble.ai{background:#eef6ff!important;border-color:rgba(29,78,216,.20)!important}.bubble.user{box-shadow:0 12px 30px rgba(29,78,216,.22)!important}
      .bubble-time{display:block;margin-top:7px;font-size:11px;font-weight:750;opacity:.68}.bubble.user .bubble-time{color:rgba(255,255,255,.82)}.bubble.ai .bubble-time{color:#64748b}
      .chat-actions button,.hint-row button,.chat-form button{min-height:44px}.chat-actions button{border:1px solid rgba(29,78,216,.16)!important;background:#fff!important}.chat-actions button:focus-visible,.hint-row button:focus-visible,.chat-form button:focus-visible,.chat-form textarea:focus-visible{outline:3px solid rgba(14,165,233,.32)!important;outline-offset:3px!important}
      .hint-row{align-items:center}.hint-row button{display:inline-flex;align-items:center;gap:7px;border-color:rgba(29,78,216,.24)!important;background:#f8fbff!important;color:#1e3a8a!important;box-shadow:0 8px 22px rgba(15,43,90,.06)}
      .chat-form{align-items:flex-end!important}.chat-form textarea{overflow:hidden!important;line-height:1.55!important;min-height:58px!important}.chat-form button.secondary{min-width:auto!important;padding:0 14px!important;background:#f8fafc!important;border-color:rgba(100,116,139,.30)!important;color:#334155!important}
      .chat-clear-top{margin-left:auto;border:1px solid rgba(100,116,139,.28)!important;background:#fff!important;color:#334155!important;border-radius:999px!important;padding:9px 13px!important;font-weight:900!important;cursor:pointer!important;min-height:40px!important}.chat-clear-top:hover{background:#f8fafc!important}
      .ask-char-counter{padding-left:2px}.ask-char-counter.over{background:#fff1f2;border:1px solid #fecdd3;border-radius:999px;padding:6px 10px;width:max-content;max-width:100%}
      @media(max-width:700px){.chat-panel{border-radius:22px!important}.chat-head{align-items:flex-start!important;flex-wrap:wrap!important}.chat-box{height:min(58dvh,560px)!important;max-height:calc(100dvh - 270px)!important;padding:16px!important}.bubble{max-width:96%!important;padding:14px 15px!important}.hint-row{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;gap:10px!important;padding:2px 2px 10px!important;scroll-snap-type:x proximity}.hint-row button{flex:0 0 auto;scroll-snap-align:start;white-space:nowrap}.chat-form{gap:10px!important}.chat-form button{width:100%}.chat-clear-top{margin-left:0!important}}
    `;
    document.head.append(style);
  }

  function setupChatBox() {
    const box = document.getElementById("chatBox");
    if (!box) return;
    box.setAttribute("role", "log");
    box.setAttribute("aria-live", "polite");
    box.setAttribute("aria-relevant", "additions text");
    box.setAttribute("aria-label", "Ask POLY conversation messages");
  }

  function polishPrompts() {
    document.querySelectorAll(".hint-row button").forEach((button) => {
      if (button.dataset.polishedPrompt === "true") return;
      const label = button.textContent.trim();
      button.textContent = `${iconFor(label)} ${label}`;
      button.dataset.polishedPrompt = "true";
    });
  }

  function setupTextarea() {
    const textarea = document.getElementById("chatInput");
    if (!textarea || textarea.dataset.autoResize === "true") return;
    textarea.dataset.autoResize = "true";
    textarea.rows = 1;
    const resize = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    };
    textarea.addEventListener("input", resize);
    textarea.addEventListener("focus", resize);
    resize();
  }

  function timestampBubbles(root = document) {
    root.querySelectorAll?.(".bubble").forEach((bubble) => {
      if (bubble.dataset.timestamped === "true") return;
      bubble.dataset.timestamped = "true";
      const time = document.createElement("time");
      time.className = "bubble-time";
      const now = new Date();
      time.dateTime = now.toISOString();
      time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      bubble.append(time);
    });
  }

  function moveClearButton() {
    const head = document.querySelector(".chat-head");
    const clear = document.querySelector(".chat-form button.secondary");
    if (!head || !clear || clear.dataset.movedTop === "true") return;
    clear.dataset.movedTop = "true";
    clear.classList.add("chat-clear-top");
    clear.textContent = "Clear chat";
    clear.addEventListener("click", (event) => {
      if (!window.confirm("Clear the Ask POLY chat history?")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    head.append(clear);
  }

  function polish() {
    addStyles();
    setupChatBox();
    setupTextarea();
    polishPrompts();
    timestampBubbles();
    moveClearButton();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", polish, { once: true });
  else polish();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) timestampBubbles(node);
      });
    }
    polishPrompts();
    setupTextarea();
    moveClearButton();
    const box = document.getElementById("chatBox");
    if (box) box.scrollTop = box.scrollHeight;
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
