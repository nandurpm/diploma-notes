(() => {
  "use strict";

  // Safe lightweight loader. It only injects the visitor popup script and does not
  // render heavy assistant code on department pages.
  if (window.POLY_DISABLE_ASSISTANT) return;
  if (/\/revision-2021\/.+\.html$/i.test(location.pathname)) return;
  if (/\/ask-poly\.html$/i.test(location.pathname)) return;
  if (document.getElementById("poly-visitor-popup-script")) return;

  const script = document.createElement("script");
  script.id = "poly-visitor-popup-script";
  script.src = "/assets/js/visitor-popup.js?v=20260702-popup-sequence-stop";
  script.defer = true;
  document.head.append(script);
})();