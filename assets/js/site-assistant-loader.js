(() => {
  "use strict";

  const ASSET_VERSION = "20260620-ai-diagnostics1";

  function renderPrimaryMenu() {
    const nav = document.querySelector(".topbar .navlinks");
    if (!nav) return;
    const currentPath = window.location.pathname || "/";
    const items = [
      { label: "Home", href: "/index.html", active: currentPath === "/" || currentPath.endsWith("/index.html") },
      { label: "About", href: "/about.html", active: currentPath.endsWith("/about.html") },
      { label: "Revision 2021", href: "/revision-2021.html", active: currentPath.endsWith("/revision-2021.html") || currentPath.includes("/revision-2021/") },
      { label: "Mock Exams", href: "/daily-quiz.html", active: currentPath.endsWith("/daily-quiz.html") || currentPath.includes("/mock-exam-") },
      { label: "2015 Materials", href: "/materials-2015.html", active: currentPath.endsWith("/materials-2015.html") },
      { label: "Help", href: "/contact.html", active: currentPath.endsWith("/contact.html") }
    ];
    nav.replaceChildren(...items.map((item) => {
      const link = document.createElement("a");
      link.href = item.href;
      link.textContent = item.label;
      if (item.active) {
        link.className = "active";
        link.setAttribute("aria-current", "page");
      }
      return link;
    }));
  }

  function rootPrefix() {
    const depth = window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth > 0 ? "../".repeat(depth) : "";
  }

  function shouldSkipAssistant() {
    const pathname = window.location.pathname;
    if (pathname.startsWith("/lessons/") || pathname === "/contact.html") return true;
    return [
      "/about.html",
      "/privacy.html",
      "/terms.html",
      "/disclaimer.html",
      "/previous-question-papers.html"
    ].includes(pathname);
  }

  function assetUrl(prefix, path) {
    return `${prefix}${path}?v=${ASSET_VERSION}`;
  }

  function hasAsset(tagName, path) {
    return [...document.querySelectorAll(tagName)].some((element) => {
      const raw = tagName === "script" ? element.src : element.href;
      if (!raw) return false;
      try {
        return new URL(raw, window.location.href).pathname.endsWith(`/${path}`);
      } catch (_) {
        return false;
      }
    });
  }

  function loadStyle(prefix, path) {
    if (hasAsset("link[rel='stylesheet']", path)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = assetUrl(prefix, path);
    document.head.append(link);
  }

  function loadScript(prefix, path) {
    if (hasAsset("script", path)) return Promise.resolve();
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = assetUrl(prefix, path);
      script.async = false;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", resolve, { once: true });
      document.body.append(script);
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    renderPrimaryMenu();

    if (shouldSkipAssistant() || document.querySelector(".poly-ai-button")) return;

    const prefix = rootPrefix();
    loadStyle(prefix, "assets/css/site-assistant.css");
    loadStyle(prefix, "assets/css/ask-poly-rich-content.css");

    let mount = document.getElementById("polySiteAssistant");
    if (!mount) {
      mount = document.createElement("div");
      mount.id = "polySiteAssistant";
      mount.setAttribute("aria-live", "polite");
      document.body.append(mount);
    }

    await loadScript(prefix, "assets/js/site-assistant.js");
    await loadScript(prefix, "assets/js/ask-poly-config.js");
    await loadScript(prefix, "assets/js/ask-poly-remote.js");
    await loadScript(prefix, "assets/js/ask-poly-general-ai-extension.js");
    await loadScript(prefix, "assets/js/ask-poly-rich-renderer.js");
  });
})();
