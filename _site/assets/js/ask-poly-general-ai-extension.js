/* Purpose: Ask poly general ai extension - Descriptive comment added for clarity */
(() => {
  "use strict";

  const SCRIPT_PATH = "assets/js/ask-poly-online-first.js";
  const VERSION = "20260621-online-first-real-ai";

  function rootPrefix() {
    const depth = window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth > 0 ? "../".repeat(depth) : "";
  }

  if ([...document.scripts].some((script) => script.src && script.src.includes(SCRIPT_PATH))) return;

  const script = document.createElement("script");
  script.src = `${rootPrefix()}${SCRIPT_PATH}?v=${VERSION}`;
  script.async = false;
  document.body.append(script);
})();
