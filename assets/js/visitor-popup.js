/* =========================================================
   VISITOR POPUP — Promotional Popup Rotation System
   ---------------------------------------------------------
   Shows a rotating popup on non-Ask-POLY pages. Popups can
   be images (PNG) or videos (MP4) loaded from assets/popup/.
   Each visitor sees one popup per day, cycling through
   available popup files in order.

   Popup files (in order of priority):
   - /assets/popup/popup-1.png
   - /assets/popup/popup-2.png
   - /assets/popup/popup-1.mp4
   - /assets/popup/popup-2.mp4

   If no popup files exist, a fallback HTML promotional card
   for Ask POLY AI is shown instead.

   Related files:
   - assets/popup/ (popup media files)
   - assets/popup/README.md (popup usage guide)

   Warning: The popup probes media availability via HEAD
   requests. Deferred to avoid network latency on page load.
   ========================================================= */
(() => {
  "use strict";

  if (/\/ask-poly(?:-v2)?\.html$/i.test(location.pathname)) return;
  if (document.getElementById("polyVisitorPopupScriptReady")) return;

  const readyFlag = document.createElement("meta");
  readyFlag.id = "polyVisitorPopupScriptReady";
  readyFlag.name = "poly-visitor-popup";
  readyFlag.content = "media-popup-v3";
  document.head.append(readyFlag);

  const POPUPS = [
    { id: "popup-1", type: "image", src: "/assets/popup/popup-1.png" },
    { id: "popup-2", type: "image", src: "/assets/popup/popup-2.png" },
    { id: "popup-1-video", type: "video", src: "/assets/popup/popup-1.mp4" }
  ];

  const FALLBACK_POPUP = {
    id: "ask-poly-fallback",
    type: "html",
    title: "POLY PMNA Update",
    subtitle: "Study faster with Ask POLY AI",
    body: "Use Ask POLY AI for syllabus help, subject doubts, notes, mock exams, tools and quick study guidance.",
    primaryText: "Open Ask POLY AI",
    primaryHref: "/ask-poly.html",
    secondaryText: "Revision 2021",
    secondaryHref: "/revision-2021.html"
  };

  const STORAGE_DATE = "polyVisitorPopupMediaDateV3";
  const STORAGE_INDEX = "polyVisitorPopupMediaIndexV3";
  const SESSION_CACHE_KEY = "polyVisitorPopupAvailableV3";
  const WAIT_MS = 60000;
  const AUTO_CLOSE_MS = 60000;
  const forceShow = /(?:[?&]showPopup=1\b|#showPopup\b)/i.test(location.search + location.hash);

  // PERFORMANCE OPTIMIZATION: Cache the fallback Intl.DateTimeFormat instance in module-level scope
  // to avoid redundant timezone resolution and constructor overhead on today() queries.
  let cachedFormatter = null;
  const today = () => {
    try {
      if (!cachedFormatter) {
        cachedFormatter = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        });
      }
      const parts = cachedFormatter.formatToParts(new Date());
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return `${values.year}-${values.month}-${values.day}`;
    } catch (_) {
      return new Date().toISOString().slice(0, 10);
    }
  };

  async function exists(item) {
    try {
      const response = await fetch(`${item.src}?v=20260723-popup-1min`, {
        method: "HEAD",
        cache: "no-store"
      });
      if (response.ok) {
        const len = response.headers.get("content-length");
        return !len || Number(len) > 0;
      }
      if (response.status !== 405) return false;
    } catch (_) {
      // Fall back to GET below.
    }

    try {
      const response = await fetch(`${item.src}?v=20260723-popup-1min`, {
        cache: "no-store",
        headers: { Range: "bytes=0-0" }
      });
      const len = response.headers.get("content-length");
      return (response.ok || response.status === 206) && (!len || Number(len) > 0);
    } catch (_) {
      return false;
    }
  }

  async function availablePopups() {
    const checks = await Promise.allSettled(
      POPUPS.map(async (item) => (await exists(item)) ? item : null)
    );
    const available = checks
      .filter((result) => result.status === "fulfilled" && result.value)
      .map((result) => result.value);
    return available.length ? available : [FALLBACK_POPUP];
  }

  function installStyles() {
    if (document.getElementById("polyVisitorPopupStyles")) return;
    const style = document.createElement("style");
    style.id = "polyVisitorPopupStyles";
    style.textContent = `
      .poly-media-popup-backdrop{position:fixed;inset:0;z-index:100050;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.48);backdrop-filter:blur(8px)}
      .poly-media-popup-backdrop.open{display:flex}
      .poly-media-popup{width:min(720px,96vw);max-height:min(760px,92vh);overflow:hidden;border:1px solid rgba(255,255,255,.78);border-radius:28px;background:#fff;box-shadow:0 32px 100px rgba(15,23,42,.32);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;animation:polyPopupIn .22s ease both}
      .poly-media-popup-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;background:linear-gradient(135deg,#eff6ff,#ecfeff);border-bottom:1px solid rgba(15,35,65,.08)}
      .poly-media-popup-title{display:flex;align-items:center;gap:10px;color:#0f172a;font-weight:950}.poly-media-popup-title span{display:grid;place-items:center;width:34px;height:34px;border-radius:13px;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;font-size:13px}
      .poly-media-popup-title small{display:block;margin-top:2px;color:#0f766e;font-weight:800}.poly-media-popup-close{width:38px;height:38px;border:1px solid rgba(15,35,65,.10);border-radius:50%;background:#fff;color:#0f172a;font-size:20px;font-weight:950;cursor:pointer}
      .poly-media-popup-body{background:#020617}.poly-media-popup-body img,.poly-media-popup-body video{display:block;width:100%;max-height:66vh;object-fit:contain;background:#020617}.poly-media-popup-body video{outline:0}
      .poly-media-popup-html{padding:24px;background:linear-gradient(135deg,#fff7ed,#eff6ff);color:#0f172a;line-height:1.55}.poly-media-popup-html h2{margin:0 0 10px;font-size:28px;line-height:1.1}.poly-media-popup-html p{margin:0;color:#334155;font-size:15px}.poly-media-popup-html .poly-popup-icons{font-size:38px;margin-bottom:10px}
      .poly-media-popup-actions{display:flex;gap:10px;flex-wrap:wrap;padding:14px 16px;background:#fff}.poly-media-popup-actions a,.poly-media-popup-actions button{border:0;border-radius:999px;padding:10px 14px;text-decoration:none;font-weight:950;cursor:pointer}.poly-media-popup-primary{background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff}.poly-media-popup-secondary{background:#eff6ff;color:#1e3a8a}
      @keyframes polyPopupIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
      @media(max-width:620px){.poly-media-popup-backdrop{padding:10px}.poly-media-popup{border-radius:22px}.poly-media-popup-body img,.poly-media-popup-body video{max-height:62vh}.poly-media-popup-actions a,.poly-media-popup-actions button{width:100%;text-align:center}}
    `;
    document.head.append(style);
  }

  function getSavedIndex() {
    try {
      const previous = parseInt(localStorage.getItem(STORAGE_INDEX) || "-1", 10);
      return Number.isFinite(previous) ? previous : -1;
    } catch (_) {
      return -1;
    }
  }

  function resetDailySequenceIfNeeded() {
    try {
      if (localStorage.getItem(STORAGE_DATE) !== today()) {
        localStorage.setItem(STORAGE_DATE, today());
        localStorage.setItem(STORAGE_INDEX, "-1");
        sessionStorage.removeItem(SESSION_CACHE_KEY);
      }
    } catch (_) {}
  }

  function markShown(index) {
    try {
      localStorage.setItem(STORAGE_DATE, today());
      localStorage.setItem(STORAGE_INDEX, String(index));
    } catch (_) {}
  }

  function shouldShowForThisVisit(count) {
    if (forceShow) return true;
    if (!count) return false;
    return getSavedIndex() < count - 1;
  }

  function nextIndex(count) {
    if (!count) return 0;
    return Math.min(getSavedIndex() + 1, count - 1);
  }

  function mediaMarkup(item) {
    if (item.type === "video") return `<video src="${item.src}" controls autoplay muted playsinline preload="metadata"></video>`;
    if (item.type === "image") return `<img src="${item.src}" alt="Polytechnic Study Hub popup update" loading="eager">`;
    return `<div class="poly-media-popup-html"><div class="poly-popup-icons">📚 🤖 ✅</div><h2>${item.title}</h2><p>${item.body}</p></div>`;
  }

  function openPopup(item, index) {
    installStyles();
    document.getElementById("polyVisitorPopup")?.remove();

    // ACCESSIBILITY: Save the currently active element to restore focus when the modal popup closes.
    const triggerElement = document.activeElement;

    const backdrop = document.createElement("div");
    backdrop.id = "polyVisitorPopup";
    backdrop.className = "poly-media-popup-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", "Polytechnic Study Hub update popup");

    const title = item.title || "POLY PMNA Update";
    const subtitle = item.subtitle || "New update available";
    const primaryText = item.primaryText || "Open Ask POLY AI";
    const primaryHref = item.primaryHref || "/ask-poly.html";
    const secondaryText = item.secondaryText || "Revision 2021";
    const secondaryHref = item.secondaryHref || "/revision-2021.html";

    backdrop.innerHTML = `
      <article class="poly-media-popup">
        <div class="poly-media-popup-head">
          <div class="poly-media-popup-title"><span>AI</span><div><strong>${title}</strong><small>${subtitle}</small></div></div>
          <button class="poly-media-popup-close" type="button" aria-label="Close popup">×</button>
        </div>
        <div class="poly-media-popup-body">${mediaMarkup(item)}</div>
        <div class="poly-media-popup-actions">
          <a class="poly-media-popup-primary" href="${primaryHref}">${primaryText}</a>
          <a class="poly-media-popup-secondary" href="${secondaryHref}">${secondaryText}</a>
          <button class="poly-media-popup-secondary" type="button" data-popup-close>Close</button>
        </div>
      </article>`;

    const close = () => {
      backdrop.classList.remove("open");
      setTimeout(() => {
        backdrop.remove();
        // ACCESSIBILITY: Restore keyboard focus back to the triggering element.
        if (triggerElement && typeof triggerElement.focus === "function") {
          triggerElement.focus();
        }
      }, 220);
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
    requestAnimationFrame(() => {
      backdrop.classList.add("open");
      // ACCESSIBILITY: Auto-focus the first meaningful interactive element inside the modal popup.
      const focusTarget = backdrop.querySelector(".poly-media-popup-primary") || backdrop.querySelector(".poly-media-popup-close");
      if (focusTarget) {
        setTimeout(() => focusTarget.focus(), 60);
      }
    });
    markShown(index);
    setTimeout(close, AUTO_CLOSE_MS);
  }

  async function install() {
    if (window.POLY_DISABLE_ASSISTANT || document.getElementById("polyVisitorPopup")) return;
    resetDailySequenceIfNeeded();

    // PERFORMANCE OPTIMIZATION: Early return if the user has already seen all possible
    // popups today, completely avoiding any timers, network probes, or layout latency.
    const maxPossibleCount = Math.max(POPUPS.length, 1);
    if (!forceShow && getSavedIndex() >= maxPossibleCount - 1) return;

    const delay = forceShow ? 500 : WAIT_MS;
    setTimeout(async () => {
      if (window.POLY_DISABLE_ASSISTANT || document.getElementById("polyVisitorPopup")) return;

      // PERFORMANCE OPTIMIZATION: Cache the resolved list of available popups in sessionStorage
      // to avoid triggering redundant network HEAD/GET requests on subsequent page loads within the session.
      let available = null;
      try {
        const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
        if (cached) {
          available = JSON.parse(cached);
        }
      } catch (_) {}

      // PERFORMANCE OPTIMIZATION: Defer network probing of popups from page load to inside the
      // timeout. This ensures that users who navigate away quickly do not incur any network requests.
      if (!Array.isArray(available) || !available.length) {
        available = await availablePopups();
        try {
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(available));
        } catch (_) {}
      }

      if (!shouldShowForThisVisit(available.length)) return;
      const index = nextIndex(available.length);
      openPopup(available[index], index);
    }, delay);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
