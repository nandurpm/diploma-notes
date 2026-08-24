(() => {
  "use strict";

  const panels = [...document.querySelectorAll(".academic-hub .academic-menu")];
  if (!panels.length) return;

  const track = (panel, position) => {
    const label = panel.querySelector("summary strong")?.textContent?.trim();
    if (!label) return;

    const event = {
      name: "Academic panel opened",
      data: {
        panel: label,
        position: String(position + 1),
      },
    };

    // Queue the documented Vercel HTML event call if the provider is still loading.
    if (typeof window.va !== "function") {
      window.va = (...args) => {
        (window.vaq = window.vaq || []).push(args);
      };
    }
    try {
      window.va("event", event);
    } catch {
      // Analytics must never interfere with the study hub.
    }

    // Keep a provider-neutral hook available for QA or a future first-party collector.
    window.dispatchEvent(new CustomEvent("poly:academic-panel-opened", {
      detail: event,
    }));
  };

  panels.forEach((panel, position) => {
    const summary = panel.querySelector("summary");
    let userActivated = false;

    summary?.addEventListener("click", () => {
      userActivated = true;
    });

    panel.addEventListener("toggle", () => {
      const wasUserActivated = userActivated;
      userActivated = false;
      if (panel.open && wasUserActivated) track(panel, position);
    });
  });
})();
