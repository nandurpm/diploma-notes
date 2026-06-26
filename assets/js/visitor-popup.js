(() => {
  "use strict";

  if (window.POLY_VISITOR_POPUP_READY) return;
  window.POLY_VISITOR_POPUP_READY = true;

  const config = {
    delayMs: 20000,
    autoCloseMs: 60000,
    probeTimeoutMs: 2500,
    shownDateKey: "polyPmnaVisitorPopupShownDate",
    sequenceIndexKey: "polyPmnaVisitorPopupSequenceIndex",
    mediaBase: "/assets/popup/",
    candidates: [
      { file: "popup-1.jpg", kind: "image", type: "image/jpeg" },
      { file: "popup-2.jpg", kind: "image", type: "image/jpeg" },
      { file: "popup-3.jpg", kind: "image", type: "image/jpeg" },
      { file: "popup-1.mp4", kind: "video", type: "video/mp4" },
      { file: "popup-2.mp4", kind: "video", type: "video/mp4" }
    ]
  };

  const localDateKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const wasShownToday = () => {
    try {
      return localStorage.getItem(config.shownDateKey) === localDateKey();
    } catch (error) {
      return false;
    }
  };

  const rememberShownToday = () => {
    try {
      localStorage.setItem(config.shownDateKey, localDateKey());
    } catch (error) {
      // Private browsing or disabled storage should not break the website.
    }
  };

  const getSequenceIndex = () => {
    try {
      const value = Number.parseInt(localStorage.getItem(config.sequenceIndexKey) || "0", 10);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch (error) {
      return 0;
    }
  };

  const saveSequenceIndex = (value) => {
    try {
      localStorage.setItem(config.sequenceIndexKey, String(value));
    } catch (error) {
      // Ignore storage failures.
    }
  };

  const withTimeout = (promise, timeoutMs = config.probeTimeoutMs) => {
    let timeoutId = 0;
    const timeout = new Promise((resolve) => {
      timeoutId = window.setTimeout(() => resolve(null), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
  };

  const probeMedia = (item) => {
    const url = `${config.mediaBase}${item.file}`;
    const request = fetch(url, { method: "HEAD", cache: "default" })
      .then((response) => response.ok ? { ...item, url } : null)
      .catch(() => null);
    return withTimeout(request);
  };

  const findAvailableMedia = async () => {
    const results = await Promise.all(config.candidates.map(probeMedia));
    return results.filter(Boolean);
  };

  const chooseNextMedia = (existingMedia) => {
    if (!Array.isArray(existingMedia) || existingMedia.length === 0) return null;
    const currentIndex = getSequenceIndex();
    const selected = existingMedia[currentIndex % existingMedia.length];
    saveSequenceIndex((currentIndex + 1) % existingMedia.length);
    return selected;
  };

  const injectStyles = () => {
    if (document.getElementById("poly-visitor-popup-style")) return;
    const style = document.createElement("style");
    style.id = "poly-visitor-popup-style";
    style.textContent = `
      .poly-visitor-popup{position:fixed;inset:0;z-index:999999;display:grid;place-items:center;padding:clamp(16px,4vw,40px);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .poly-visitor-popup[hidden]{display:none!important}
      .poly-visitor-popup__backdrop{position:absolute;inset:0;background:rgba(8,23,56,.52);backdrop-filter:blur(10px)}
      .poly-visitor-popup__card{position:relative;width:min(94vw,860px);max-height:88vh;overflow:hidden;border:1px solid rgba(255,255,255,.72);border-radius:28px;background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(239,247,255,.95));box-shadow:0 30px 90px rgba(15,36,84,.35);animation:polyPopupIn .34s ease-out both}
      .poly-visitor-popup__media{display:grid;place-items:center;background:#eef6ff}
      .poly-visitor-popup__media img,.poly-visitor-popup__media video{display:block;width:100%;max-height:82vh;object-fit:contain;background:#eef6ff}
      .poly-visitor-popup__close{position:absolute;top:12px;right:12px;width:42px;height:42px;border:0;border-radius:999px;background:rgba(15,23,42,.82);color:#fff;font-size:26px;line-height:1;cursor:pointer;box-shadow:0 12px 28px rgba(15,23,42,.28);z-index:2}
      .poly-visitor-popup__close:hover,.poly-visitor-popup__close:focus-visible{background:#0b5dd8;outline:3px solid rgba(59,130,246,.24);outline-offset:2px}
      .poly-visitor-popup__sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
      @keyframes polyPopupIn{from{opacity:0;transform:translateY(22px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
      @media(max-width:640px){.poly-visitor-popup{padding:12px}.poly-visitor-popup__card{border-radius:20px;width:96vw}.poly-visitor-popup__media img,.poly-visitor-popup__media video{max-height:78vh}.poly-visitor-popup__close{top:8px;right:8px;width:38px;height:38px}}
      @media(prefers-reduced-motion:reduce){.poly-visitor-popup__card{animation:none}}
    `;
    document.head.append(style);
  };

  const buildMediaElement = (media) => {
    if (media.kind === "video") {
      const video = document.createElement("video");
      video.controls = true;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", `POLY PMNA visitor notification video: ${media.file}`);
      const source = document.createElement("source");
      source.src = media.url;
      source.type = media.type;
      video.append(source);
      return video;
    }

    const image = document.createElement("img");
    image.src = media.url;
    image.alt = `POLY PMNA visitor notification: ${media.file}`;
    image.loading = "eager";
    image.decoding = "async";
    return image;
  };

  const showPopup = (media) => {
    if (!media || wasShownToday()) return;
    injectStyles();

    const popup = document.createElement("section");
    popup.className = "poly-visitor-popup";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-modal", "true");
    popup.setAttribute("aria-labelledby", "polyVisitorPopupTitle");

    const backdrop = document.createElement("button");
    backdrop.className = "poly-visitor-popup__backdrop";
    backdrop.type = "button";
    backdrop.setAttribute("aria-label", "Close notification popup");

    const card = document.createElement("article");
    card.className = "poly-visitor-popup__card";

    const title = document.createElement("h2");
    title.id = "polyVisitorPopupTitle";
    title.className = "poly-visitor-popup__sr";
    title.textContent = "POLY PMNA notification";

    const closeButton = document.createElement("button");
    closeButton.className = "poly-visitor-popup__close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close popup");
    closeButton.innerHTML = "&times;";

    const mediaWrap = document.createElement("div");
    mediaWrap.className = "poly-visitor-popup__media";
    mediaWrap.append(buildMediaElement(media));

    card.append(title, closeButton, mediaWrap);
    popup.append(backdrop, card);
    document.body.append(popup);
    rememberShownToday();
    closeButton.focus({ preventScroll: true });

    let closeTimer = window.setTimeout(closePopup, config.autoCloseMs);

    function closePopup() {
      window.clearTimeout(closeTimer);
      popup.remove();
      document.removeEventListener("keydown", handleKeydown);
    }

    function handleKeydown(event) {
      if (event.key === "Escape") closePopup();
    }

    closeButton.addEventListener("click", closePopup);
    backdrop.addEventListener("click", closePopup);
    document.addEventListener("keydown", handleKeydown);
  };

  const start = () => {
    if (wasShownToday()) return;
    window.setTimeout(async () => {
      if (wasShownToday()) return;
      const existingMedia = await findAvailableMedia();
      const selectedMedia = chooseNextMedia(existingMedia);
      showPopup(selectedMedia);
    }, config.delayMs);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
