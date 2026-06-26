(() => {
  "use strict";

  if (!/\/tools\.html$/i.test(location.pathname)) return;
  if (document.getElementById("polyHelperFeature")) return;

  function install() {
    const hero = document.querySelector(".hero");
    if (!hero || document.getElementById("polyHelperFeature")) return;

    const style = document.createElement("style");
    style.textContent = ".poly-helper-feature{margin:18px 0;border:1px solid #cfe0f5;border-radius:24px;background:#fff;box-shadow:0 18px 45px rgba(15,43,90,.11);padding:22px}.poly-helper-feature h2{margin:8px 0;font-size:clamp(26px,4vw,42px)}.poly-helper-feature p{color:#475569;line-height:1.6}.poly-helper-link{display:inline-flex;margin-top:10px;border-radius:999px;padding:12px 18px;background:linear-gradient(135deg,#2457f5,#08a8c8);color:#fff;font-weight:900;text-decoration:none}";
    document.head.append(style);

    const section = document.createElement("section");
    section.id = "polyHelperFeature";
    section.className = "poly-helper-feature";
    section.innerHTML = '<p class="tag">Website Tool</p><h2>POLY Website Guide</h2><p>Find Revision 2021 subjects, syllabus links, available lessons, notes, mock exams, 2015 materials, student tools and issue reporting help.</p><a class="poly-helper-link" href="/ask-poly.html">Open Guide</a>';
    hero.after(section);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
