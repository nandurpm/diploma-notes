(() => {
  "use strict";

  function rootPrefix() {
    const depth = window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth > 0 ? "../".repeat(depth) : "";
  }

  function shouldSkipAssistant() {
    const pathname = window.location.pathname;
    if (
      pathname.startsWith("/lessons/") ||
      pathname === "/contact.html"
    ) {
      return true;
    }
    return [
      "/about.html",
      "/privacy.html",
      "/terms.html",
      "/disclaimer.html",
      "/previous-question-papers.html"
    ].includes(pathname);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (shouldSkipAssistant() || document.querySelector(".poly-ai-button")) return;

    const prefix = rootPrefix();
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `${prefix}assets/css/site-assistant.css`;
    document.head.append(css);

    let mount = document.getElementById("polySiteAssistant");
    if (!mount) {
      mount = document.createElement("div");
      mount.id = "polySiteAssistant";
      mount.setAttribute("aria-live", "polite");
      document.body.append(mount);
    }

    const script = document.createElement("script");
    script.src = `${prefix}assets/js/site-assistant.js`;
    script.defer = true;
    document.body.append(script);
  });
})();
