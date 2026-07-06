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
  function notesUrlFor(code) { return `${root()}notes/downloadable-notes-${esc(code)}.pdf`; }
  function lessonUrlFor(code) { return `${root()}lessons/lessons-${esc(code)}.html?autoPrintNotes=1`; }
  function clearNotes(row) {
    row.querySelectorAll(".action.download,.notes-status").forEach((item) => item.remove());
    Array.from(row.querySelectorAll(".availability-label"))
      .filter((item) => /notes?/i.test(item.textContent || ""))
      .forEach((item) => item.remove());
  }
  function makeLink(href, mode) {
    const link = document.createElement("a");
    link.className = "action download";
    link.href = href;
    link.textContent = "Download Notes";
    if (mode === "lesson") {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.dataset.generatedFromLesson = "true";
      link.title = "Generate clean PDF notes directly from the lesson HTML page.";
    } else {
      link.download = "";
      link.dataset.verified = "true";
      link.title = "Download the published PDF notes.";
    }
    return link;
  }
  async function validateCard(card) {
    const code = norm(card.querySelector(".subject-top strong")?.textContent || card.dataset.subjectCode);
    const row = card.querySelector(".action-row");
    if (!row || !code) return;
    const qp = row.querySelector(".action.qp");
    const lessonAvailable = Boolean(row.querySelector(".action.lessons")) || card.dataset.lessonAvailable === "true";
    const href = notesUrlFor(code);
    clearNotes(row);
    const waiting = document.createElement("span");
    waiting.className = "availability-label notes-status";
    waiting.setAttribute("aria-disabled", "true");
    waiting.textContent = "Preparing notes…";
    row.insertBefore(waiting, qp || null);
    const ok = await pdfExists(href);
    if (!card.isConnected) return;
    clearNotes(row);
    if (lessonAvailable) row.insertBefore(makeLink(lessonUrlFor(code), "lesson"), qp || null);
    else if (ok) row.insertBefore(makeLink(href, "pdf"), qp || null);
    else {
      const unavailable = document.createElement("span");
      unavailable.className = "availability-label notes-status";
      unavailable.setAttribute("aria-disabled", "true");
      unavailable.textContent = "Lessons unavailable";
      row.insertBefore(unavailable, qp || null);
    }
  }
  function run() {
    document.querySelectorAll(".subject-card").forEach((card) => {
      if (card.dataset.notesChecked === "1") return;
      card.dataset.notesChecked = "1";
      validateCard(card);
    });
  }
  addEventListener("DOMContentLoaded", () => {
    run();
    new MutationObserver(run).observe(document.getElementById("subjectGrid") || document.body, { childList: true, subtree: true });
  });
})();
