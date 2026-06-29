globalThis.ASK_POLY_CONFIG = Object.freeze({
  endpoint: "https://ask-poly-ai.nandakumarkdpm.workers.dev/api/ask-poly",
  timeoutMs: 30000,
  maxHistory: 12
});

(() => {
  if (!/\/ask-poly\.html$/i.test(location.pathname)) return;
  const files = [
    ["ask-poly-knowledge-loader", "/assets/js/ask-poly-knowledge-loader.js?v=20260629-knowledge"],
    ["ask-poly-ui-polish-loader", "/assets/js/ask-poly-ui-polish.js?v=20260629-ui-polish"]
  ];
  files.forEach(([id, src]) => {
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.defer = true;
    document.head.append(script);
  });
})();
