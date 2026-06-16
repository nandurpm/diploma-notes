(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const isNativeAndroidApp = /PolytechnicStudyHubAndroid\//i.test(navigator.userAgent);

  if (isNativeAndroidApp) {
    root.classList.add("polytechnic-native-app");
    root.style.setProperty("--fixed-site-header-height", "0px");
    root.style.setProperty("--fixed-site-header-gap", "0px");
    body.classList.remove("has-fixed-site-header");

    const header = document.querySelector(".topbar");
    if (header) {
      header.hidden = true;
      header.setAttribute("aria-hidden", "true");
    }

    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      skipLink.hidden = true;
    }
    return;
  }

  const header = document.querySelector(".topbar");
  if (!header) return;

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
