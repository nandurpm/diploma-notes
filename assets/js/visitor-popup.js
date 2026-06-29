(() => {
  "use strict";

  if (/\/ask-poly(?:-v2)?\.html$/i.test(location.pathname)) return;
  if (document.getElementById("polyVisitorPopupScriptReady")) return;

  const readyFlag = document.createElement("meta");
  readyFlag.id = "polyVisitorPopupScriptReady";
  readyFlag.name = "poly-visitor-popup";
  readyFlag.content = "media-sequence";
  document.head.append(readyFlag);

  const POPUPS = [
    { id: "popup-1", type: "image", src: "/assets/popup/popup-1.jpg" },
    { id: "popup-2", type: "image", src: "/assets/popup/popup-2.jpg" },
    { id: "popup-3", type: "image", src: "/assets/popup/popup-3.jpg" },
    { id: "popup-1-video", type: "video", src: "/assets/popup/popup-1.mp4" },
    { id: "popup-2-video", type: "video", src: "/assets/popup/popup-2.mp4" }
  ];

  const STORAGE_DATE = "polyVisitorPopupMediaDateV2";
  const STORAGE_INDEX = "polyVisitorPopupMediaIndexV2";
  const WAIT_MS = 20000;
  const AUTO_CLOSE_MS = 60000;
  const today = () => new Date().toISOString().slice(0, 10);
  const forceShow = /(?:[?&]showPopup=1\b|#showPopup\b)/i.test(location.search + location.hash);

  async function exists(item) {
    try {
      const response = await fetch(`${item.src}?v=20260629-popup-check`, { method: "HEAD", cache: "no-store" });
      if (response.ok) return true;
      if (response.status !== 405) return false;
    } catch (_) {
      // Fall back to a tiny GET check below.
    }
    try {
      const response = await fetch(`${item.src}?v=20260629-popup-check`, { cache: "no-store", headers: { Range: "bytes=0-0" } });
      return response.ok || response.status === 206;
    } catch (_) {
      return false;
    }
  }

  async function availablePopups() {
    const checks = await Promise.all(POPUPS.map(async (item) => (await exists(item)) ? item : null));
    return checks.filter(Boolean);
  }

  function installStyles() {
    if (document.getElementById("polyVisitorPopupStyles")) return;
    const style = document.createElement("style");
    style.id = "polyVisitorPopupStyles";
    style.textContent = `
      .poly-media-popup-backdrop{position:fixed;inset:0;z-index:99990;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.48);backdrop-filter:blur(8px)}
      .poly-media-popup-backdrop.open{display:flex}
      .poly-media-popup{width:min(720px,96vw);max-height:min(760px,92vh);overflow:hidden;border:1px solid rgba(255,255,255,.78);border-radius:28px;background:#fff;box-shadow:0 32px 100px rgba(15,23,42,.32);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;animation:polyPopupIn .22s ease both}
      .poly-media-popup-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;background:linear-gradient(135deg,#eff6ff,#ecfeff);border-bottom:1px solid rgba(15,35,65,.08)}
      .poly-media-popup-title{display:flex;align-items:center;gap:10px;color:#0f172a;font-weight:950}.poly-media-popup-title span{display:grid;place-items:center;width:34px;height:34px;border-radius:13px;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;font-size:13px}
      .poly-media-popup-close{width:38px;height:38px;border:1px solid rgba(15,35,65,.10);border-radius:50%;background:#fff;color:#0f172a;font-size:20px;font-weight:950;cursor:pointer}
      .poly-media-popup-body{background:#020617}.poly-media-popup-body img,.poly-media-popup-body video{display:block;width:100%;max-height:66vh;object-fit:contain;background:#020617}.poly-media-popup-body video{outline:0}
      .poly-media-popup-actions{display:flex;gap:10px;flex-wrap:wrap;padding:14px 16px;background:#fff}.poly-media-popup-actions a,.poly-media-popup-actions button{border:0;border-radius:999px;padding:10px 14px;text-decoration:none;font-weight:950;cursor:pointer}.poly-media-popup-primary{background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff}.poly-media-popup-secondary{background:#eff6ff;color:#1e3a8a}
      @keyframes polyPopupIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
      @media(max-width:620px){.poly-media-popup-backdrop{padding:10px}.poly-media-popup{border-radius:22px}.poly-media-popup-body img,.poly-media-popup-body video{max-height:62vh}.poly-media-popup-actions a,.poly-media-popup-actions button{width:100%;text-align:center}}
    `;
    document.head.append(style);
  }

  function markShown(index) {
    try {
      localStorage.setItem(STORAGE_DATE, today());
      localStorage.setItem(STORAGE_INDEX, String(index));
    } catch (_) {}
  }

  function shouldShowToday() {
    if (forceShow) return true;
    try {
      return localStorage.getItem(STORAGE_DATE) !== today();
    } catch (_) {
      return true;
    }
  }

  function nextIndex(count) {
    if (!count) return 0;
    try {
      const previous = parseInt(localStorage.getItem(STORAGE_INDEX) || "-1", 10);
      return Number.isFinite(previous) ? (previous + 1) % count : 0;
    } catch (_) {
      return 0;
    }
  }

  function openPopup(item, index) {
    installStyles();
    document.getElementById("polyVisitorPopup")?.remove();

    const backdrop = document.createElement("div");
    backdrop.id = "polyVisitorPopup";
    backdrop.className = "poly-media-popup-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", "Polytechnic Study Hub update popup");

    const media = item.type === "video"
      ? `<video src="${item.src}" controls autoplay muted playsinline preload="metadata"></video>`
      : `<img src="${item.src}" alt="Polytechnic Study Hub popup update" loading="eager">`;

    backdrop.innerHTML = `
      <article class="poly-media-popup">
        <div class="poly-media-popup-head"><div class="poly-media-popup-title"><span>AI</span><strong>POLY PMNA Update</strong></div><button class="poly-media-popup-close" type="button" aria-label="Close popup">×</button></div>
        <div class="poly-media-popup-body">${media}</div>
        <div class="poly-media-popup-actions"><a class="poly-media-popup-primary" href="/ask-poly.html">Open Ask POLY AI</a><a class="poly-media-popup-secondary" href="/revision-2021.html">Revision 2021</a><button class="poly-media-popup-secondary" type="button" data-popup-close>Close</button></div>
      </article>`;

    const close = () => {
      backdrop.classList.remove("open");
      setTimeout(() => backdrop.remove(), 220);
    };

    backdrop.querySelector(".poly-media-popup-close")?.addEventListener("click", close);
    backdrop.querySelector("[data-popup-close]")?.addEventListener("click", close);
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
    document.addEventListener("keydown", function esc(event) {
      if (event.key === "Escape") {
        document.removeEventListener("keydown", esc);
        close();
      }
    });

    document.body.append(backdrop);
    requestAnimationFrame(() => backdrop.classList.add("open"));
    markShown(index);
    setTimeout(close, AUTO_CLOSE_MS);
  }

  async function install() {
    if (window.POLY_DISABLE_ASSISTANT || document.getElementById("polyVisitorPopup")) return;
    const available = await availablePopups();
    if (!available.length || !shouldShowToday()) return;
    const index = nextIndex(available.length);
    setTimeout(() => openPopup(available[index], index), forceShow ? 500 : WAIT_MS);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
