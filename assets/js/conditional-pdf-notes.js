/*
 * Conditional Download Notes behavior for POLY PMNA.
 *
 * Behavior:
 *   1. Every existing Download Notes link remains a print-mode lesson link.
 *   2. If the selected subject has a published PDF entry in the external
 *      manifest, the click is intercepted and navigates to that PDF instead.
 *   3. If the manifest is missing, unavailable, or has no matching subject,
 *      the original print-mode link is left untouched.
 *
 * Load this script on pages that render Download Notes links, before or after
 * the subject-browser scripts. The delegated click handler works either way.
 */
(() => {
  "use strict";

  const MANIFEST_URLS = [
    "https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/manifests/notes-2021.json",
    "https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/manifests/notes-2026.json"
  ];

  const pdfBySubject = new Map();
  const cacheBust = `?v=${Date.now()}`;

  function normalizeRevision(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/^REV/, "");
  }

  function normalizeCode(value) {
    return String(value || "")
      .trim()
      .toUpperCase();
  }

  function keyFor(revision, code) {
    const rev = normalizeRevision(revision);
    const subjectCode = normalizeCode(code);
    return rev && subjectCode ? `${rev}:${subjectCode}` : "";
  }

  function validPdfUrl(value) {
    try {
      const url = new URL(String(value || ""), window.location.href);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function addManifest(json) {
    const records = Array.isArray(json) ? json : json && json.subjects;
    if (!Array.isArray(records)) return;

    records.forEach((record) => {
      if (!record || String(record.status || "published").toLowerCase() !== "published") return;

      const code = record.code || record.subjectCode;
      const pdfUrl = validPdfUrl(record.pdfUrl || record.url);
      const key = keyFor(record.revision, code);
      if (!key || !pdfUrl) return;

      pdfBySubject.set(key, {
        code: normalizeCode(code),
        revision: normalizeRevision(record.revision),
        pdfUrl,
        version: record.version || ""
      });
    });
  }

  async function loadManifest(url) {
    try {
      const response = await fetch(`${url}${cacheBust}`, {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        credentials: "omit",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) return;
      addManifest(await response.json());
    } catch {
      // A missing/unreachable manifest is deliberately treated as no PDFs.
      // Existing print-mode links remain the safe fallback.
    }
  }

  function inferContext(link) {
    const card = link.closest("[data-subject-code], [data-course-code]");
    const pathMatch = window.location.pathname.match(/lessons-([^/]+)\.html$/i);

    const code = link.dataset.pdfCode
      || link.dataset.noteCode
      || card?.dataset.subjectCode
      || card?.dataset.courseCode
      || pathMatch?.[1]
      || "";

    const revision = link.dataset.pdfRevision
      || link.dataset.noteRevision
      || card?.dataset.revision
      || (window.location.pathname.includes("revision-2026") ? "2026" : "2021");

    return { code, revision };
  }

  const manifestsReady = Promise.all(MANIFEST_URLS.map(loadManifest));

  function installConditionalDownloadHandler() {
    document.addEventListener("click", async (event) => {
      const link = event.target.closest(
        [
          "a[data-notes-link]",
          "a.poly-lesson-download",
          "a.action.download[href*='autoPrintNotes=1']",
          "a.action.download[data-pdf-code]",
          "a.action.download[data-note-code]"
        ].join(", ")
      );
      if (!link) return;

      const originalHref = link.href;
      const { code, revision } = inferContext(link);

      // Prevent the browser from navigating while the per-subject manifest is checked.
      event.preventDefault();
      event.stopPropagation();
      link.target = "_self";
      link.removeAttribute("download");

      await manifestsReady;
      const entry = pdfBySubject.get(keyFor(revision, code));

      if (!entry) {
        // No published PDF for this exact subject: preserve the old print-to-PDF flow.
        window.location.assign(originalHref);
        return;
      }

      link.href = entry.pdfUrl;
      window.location.assign(entry.pdfUrl);
    }, true);
  }

  installConditionalDownloadHandler();
})();
