(() => {
  "use strict";

  if (/\/ask-poly\.html$/i.test(location.pathname)) return;

  function install() {
    if (window.POLY_DISABLE_ASSISTANT || document.getElementById("polyVisitorPopup")) return;

    const style = document.createElement("style");
    style.textContent = `
      .poly-popup-open{position:fixed;right:22px;bottom:22px;z-index:99990;display:inline-flex;align-items:center;gap:10px;min-height:54px;padding:10px 18px 10px 10px;border:0;border-radius:999px;background:linear-gradient(135deg,#1d4ed8,#06b6d4);color:#fff;font:900 15px/1 Inter,system-ui,sans-serif;box-shadow:0 18px 42px rgba(29,78,216,.30);cursor:pointer}.poly-popup-open span{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.20)}
      .poly-popup-box{position:fixed;right:20px;bottom:88px;z-index:99991;width:min(380px,calc(100vw - 28px));display:none;border:1px solid rgba(37,99,235,.18);border-radius:26px;background:#fff;box-shadow:0 28px 90px rgba(15,23,42,.26);overflow:hidden;font-family:Inter,system-ui,sans-serif}.poly-popup-box.open{display:block}.poly-popup-head{display:flex;justify-content:space-between;gap:12px;padding:15px 16px;background:linear-gradient(135deg,#eff6ff,#ecfeff);border-bottom:1px solid rgba(15,23,42,.08)}.poly-popup-head strong{font-size:17px;color:#0f172a}.poly-popup-head small{display:block;color:#0f766e;font-weight:800}.poly-popup-close{border:0;background:#fff;border-radius:50%;width:34px;height:34px;font-size:18px;font-weight:900;cursor:pointer}.poly-popup-body{padding:16px;color:#334155;line-height:1.55}.poly-popup-actions{display:flex;gap:10px;flex-wrap:wrap;padding:0 16px 16px}.poly-popup-actions a{border-radius:999px;padding:10px 13px;text-decoration:none;font-weight:900}.poly-popup-primary{background:#1d4ed8;color:#fff}.poly-popup-secondary{background:#eff6ff;color:#1e3a8a}
      @media(max-width:620px){.poly-popup-open{right:14px;bottom:14px;width:56px;height:56px;padding:0;border-radius:50%;justify-content:center}.poly-popup-open b{display:none}.poly-popup-open span{width:42px;height:42px}.poly-popup-box{right:10px;bottom:80px;width:calc(100vw - 20px)}}`;
    document.head.append(style);

    const box = document.createElement("aside");
    box.id = "polyVisitorPopup";
    box.className = "poly-popup-box";
    box.innerHTML = '<div class="poly-popup-head"><div><strong>Ask POLY AI</strong><small>Website help + instant maths</small></div><button class="poly-popup-close" type="button" aria-label="Close">×</button></div><div class="poly-popup-body">Ask POLY can help with subjects, syllabus, notes, mock exams and maths spot answers like <b>25% of 480</b> or <b>solve 2x+5=15</b>.</div><div class="poly-popup-actions"><a class="poly-popup-primary" href="/ask-poly.html">Open Ask POLY</a><a class="poly-popup-secondary" href="/tools.html">Open Tools</a></div>';
    document.body.append(box);

    const existingHomeButton = document.querySelector(".home-ask-poly-float");
    let button = document.getElementById("polyVisitorPopupButton");
    if (!button && !existingHomeButton) {
      button = document.createElement("button");
      button.id = "polyVisitorPopupButton";
      button.className = "poly-popup-open";
      button.type = "button";
      button.innerHTML = "<span>AI</span><b>Ask POLY</b>";
      document.body.append(button);
    }

    const open = () => box.classList.add("open");
    const close = () => box.classList.remove("open");
    const toggle = () => box.classList.toggle("open");
    button?.addEventListener("click", toggle);
    existingHomeButton?.addEventListener("click", (event) => { event.preventDefault(); open(); });
    box.querySelector(".poly-popup-close")?.addEventListener("click", close);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
