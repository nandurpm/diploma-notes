/* Purpose: Ask poly layout - Descriptive comment added for clarity */
(() => {
  "use strict";

  if (!/\/ask-poly(?:-v2)?\.html$/i.test(location.pathname)) return;

  const sidebar = document.getElementById("savedChatsPanel");
  const toggle = document.getElementById("mobileChatsToggle");
  const mobileNew = document.getElementById("mobileNewChatBtn");
  const newChat = document.getElementById("newChatBtn");
  const chatList = document.getElementById("chatList");

  if (!sidebar) return;

  const isNarrow = () => window.matchMedia("(max-width: 900px)").matches;
  const setOpen = (open) => {
    const next = Boolean(open) && isNarrow();
    sidebar.classList.toggle("open", next);
    toggle?.setAttribute("aria-expanded", String(next));
    toggle?.setAttribute("aria-label", next ? "Close saved chats" : "Open saved chats");
    if (toggle) toggle.textContent = next ? "× Close chats" : "☰ Saved chats";
    sidebar.setAttribute("aria-hidden", String(isNarrow() && !next));
    document.body.classList.toggle("ask-chats-open", next);
  };

  setOpen(false);
  toggle?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(!sidebar.classList.contains("open"));
  });
  mobileNew?.addEventListener("click", () => {
    newChat?.click();
    setOpen(false);
  });
  chatList?.addEventListener("click", (event) => {
    if (event.target.closest(".ask-item") && !event.target.closest(".ask-delete")) setOpen(false);
  });
  document.addEventListener("click", (event) => {
    if (isNarrow() && sidebar.classList.contains("open") && !sidebar.contains(event.target) && !toggle?.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar.classList.contains("open")) {
      setOpen(false);
      toggle?.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (!isNarrow()) setOpen(false);
    else sidebar.setAttribute("aria-hidden", String(!sidebar.classList.contains("open")));
  }, { passive: true });
})();
