(() => {
  "use strict";

  function initDeferredVideo() {
    const video = document.querySelector("video.home-video[data-deferred-video]");
    if (!video) return;

    const activate = () => {
      if (video.preload === "none") {
        video.preload = "metadata";
        video.load();
      }
    };

    video.addEventListener("pointerdown", activate, { once: true, passive: true });
    video.addEventListener("play", activate, { once: true, passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDeferredVideo, { once: true });
  } else {
    initDeferredVideo();
  }
})();

