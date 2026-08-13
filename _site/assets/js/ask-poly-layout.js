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

  const setOpen = (open) => {
    sidebar.classList.toggle("open", open);
    toggle?.setAttribute("aria-expanded", String(open));
  };

  toggle?.addEventListener("click", () => setOpen(!sidebar.classList.contains("open")));
  mobileNew?.addEventListener("click", () => {
    newChat?.click();
    setOpen(false);
  });
  chatList?.addEventListener("click", (event) => {
    if (event.target.closest(".ask-item") && !event.target.closest(".ask-delete")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) setOpen(false);
  }, { passive: true });
})();
