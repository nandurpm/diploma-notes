(() => {
  "use strict";

  const cache = new Map();
  const root = () => {
    const depth = location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth ? "../".repeat(depth) : "";
  };
  const norm = (value) => String(value || "").trim().toUpperCase();
  const notesUrlFor = (code) => `${root()}notes/downloadable-notes-${encodeURIComponent(code)}.pdf`;

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

  async function validateCard(card) {
    const row = card.querySelector(".action-row");
    const code = norm(card.dataset.subjectCode || card.querySelector(".subject-top strong")?.textContent);
    if (!row || !code) return;
    const href = notesUrlFor(code);
    const qp = row.querySelector(".action.qp");
    row.querySelectorAll(".action.download,.notes-status").forEach((item) => item.remove());
    const pending = document.createElement("span");
    pending.className = "availability-label notes-status";
    pending.setAttribute("aria-disabled", "true");
    pending.textContent = "Checking notes…";
    row.insertBefore(pending, qp || null);
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
    } else {
      const unavailable = document.createElement("span");
      unavailable.className = "availability-label notes-status";
      unavailable.setAttribute("aria-disabled", "true");
      unavailable.textContent = "Notes unavailable";
      row.insertBefore(unavailable, qp || null);
    }
  }

  function run() {
    document.querySelectorAll(".subject-card").forEach((card) => {
      if (card.dataset.notesVerified === "1") return;
      card.dataset.notesVerified = "1";
      validateCard(card);
    });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.(".action.download:not([data-verified='true'])");
    if (!link) return;
    event.preventDefault();
  }, true);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
})();
