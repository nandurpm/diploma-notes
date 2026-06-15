(() => {
  "use strict";

  const header = document.querySelector(".topbar");
  if (!header) return;

  const root = document.documentElement;
  const body = document.body;
  let frame = 0;

  const updateHeaderHeight = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      root.style.setProperty("--fixed-site-header-height", `${height}px`);
      body.classList.add("has-fixed-site-header");
    });
  };

  updateHeaderHeight();

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
  }

  window.addEventListener("resize", updateHeaderHeight, { passive: true });
  window.addEventListener("orientationchange", updateHeaderHeight, { passive: true });

  if (document.fonts?.ready) {
    document.fonts.ready.then(updateHeaderHeight).catch(() => {});
  }

  const menuToggle = header.querySelector(".menu-toggle, .menu-btn");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      requestAnimationFrame(updateHeaderHeight);
      setTimeout(updateHeaderHeight, 80);
      setTimeout(updateHeaderHeight, 260);
    });
  }
})();
