/* Purpose: Ask poly mobile layout - Descriptive comment added for clarity */
(() => {
  "use strict";
  if (!/\/ask-poly(?:-v2)?\.html$/i.test(location.pathname)) return;
  window.addEventListener("DOMContentLoaded", () => {
    const panel = document.getElementById("savedChatsPanel");
    const toggle = document.getElementById("mobileChatsToggle");
    const mobileNew = document.getElementById("mobileNewChatBtn");
    const newChat = document.getElementById("newChatBtn");
    const input = document.getElementById("chatInput");
    if (toggle && panel) {
      toggle.addEventListener("click", () => {
        const open = panel.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.textContent = open ? "Close chats" : "☰ Saved chats";
      });
    }
    if (mobileNew && newChat) {
      mobileNew.addEventListener("click", () => {
        newChat.click();
        if (panel) panel.classList.remove("is-open");
        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
          toggle.textContent = "☰ Saved chats";
        }
        setTimeout(() => input?.focus(), 120);
      });
    }
    panel?.addEventListener("click", (event) => {
      if (!event.target.closest(".ask-item")) return;
      if (window.matchMedia("(max-width: 900px)").matches) {
        panel.classList.remove("is-open");
        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
          toggle.textContent = "☰ Saved chats";
        }
      }
    });
  });
})();
