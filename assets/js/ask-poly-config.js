globalThis.ASK_POLY_CONFIG = Object.freeze({
  endpoint: "https://ask-poly-ai.nandakumarkdpm.workers.dev/api/ask-poly",
  timeoutMs: 30000,
  maxHistory: 12
});

(() => {
  if (!/\/ask-poly\.html$/i.test(location.pathname)) return;
  if (document.getElementById("ask-poly-ui-polish-loader")) return;
  const script = document.createElement("script");
  script.id = "ask-poly-ui-polish-loader";
  script.src = "/assets/js/ask-poly-ui-polish.js?v=20260627-ui-polish";
  script.defer = true;
  document.head.append(script);
})();
