(() => {
  "use strict";

  const cache = new Map();
  const root = () => {
    const depth = location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth ? "../".repeat(depth) : "";
  };
  const norm = (value) => String(value || "").trim().toUpperCase();
  const esc = (value) => encodeURIComponent(value);

  async function pdfExists(url) {
    const absolute = new URL(url, location.href).href;
    if (cache.has(absolute)) return cache.get(absolute);
    const check = fetch(absolute, { method: "HEAD", cache: "no-store" })
      .then((response) => {
        const type = response.headers.get("content-type") || "";
        return response.ok && !/html/i.test(type);
      })
      .catch(() => false);
    cache.set(absolute, check);
    const result = await check;
    cache.set(absolute, result);
    return result;
  }

  function notesUrlFor(code) {
    return `${root()}notes/downloadable-notes-${esc(code)}.pdf`;
  }

  async function validateCard(card) {
    const code = norm(card.querySelector(".subject-top strong")?.textContent || card.dataset.subjectCode);
    const row = card.querySelector(".action-row");
    if (!row || !code) return;

    const href = notesUrlFor(code);
    row.querySelectorAll(".action.download,.notes-status").forEach((item) => item.remove());

    const placeholder = document.createElement("span");
    placeholder.className = "availability-label notes-status";
    placeholder.setAttribute("aria-disabled", "true");
    placeholder.textContent = "Checking notes…";
    const qp = row.querySelector(".action.qp");
    row.insertBefore(placeholder, qp || null);

    const ok = await pdfExists(href);
    if (!card.isConnected) return;
    row.querySelectorAll(".action.download,.notes-status").forEach((item) => item.remove());

    if (ok) {
      const link = document.createElement("a");
      link.className = "action download";
      link.href = href;
      link.download = "";
      link.dataset.verified = "true";
      link.textContent = "Download Notes";
      row.insertBefore(link, qp || null);
      return;
    }

    const unavailable = document.createElement("span");
    unavailable.className = "availability-label notes-status";
    unavailable.setAttribute("aria-disabled", "true");
    unavailable.textContent = "Notes unavailable";
    row.insertBefore(unavailable, qp || null);
  }

  function run() {
    document.querySelectorAll(".subject-card").forEach((card) => {
      if (card.dataset.notesChecked === "1") return;
      card.dataset.notesChecked = "1";
      validateCard(card);
    });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.(".action.download:not([data-verified='true'])");
    if (!link) return;
    event.preventDefault();
  }, true);

  addEventListener("DOMContentLoaded", () => {
    run();
    new MutationObserver(run).observe(document.getElementById("subjectGrid") || document.body, { childList: true, subtree: true });
  });
})();
