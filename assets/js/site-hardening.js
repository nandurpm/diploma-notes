(() => {
  "use strict";

  const currentPath = () => window.location.pathname.replace(/\/+$/, "") || "/";
  const isLessonPage = () => /\/lessons\/lessons-\d+[a-z]?\.html$/i.test(currentPath());
  const APP_USER_AGENT_PATTERN = /PolytechnicStudyHubAndroid\/([0-9]+(?:\.[0-9]+){0,3})/i;
  const APP_UPDATE_MANIFEST = "/downloads/app-update.json";
  let printableDetailStates = [];

  function normalizeLinks() {
    document.querySelectorAll(".navlinks a.active").forEach((link) => {
      link.setAttribute("aria-current", "page");
    });
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      link.setAttribute("rel", "noopener noreferrer");
    });
    document.querySelectorAll('a[href="departments.html"], a[href="/departments.html"]').forEach((link) => {
      link.href = link.getAttribute("href")?.startsWith("/") ? "/revision-2021.html" : "revision-2021.html";
      if (/departments/i.test(link.textContent)) link.textContent = "Revision 2021";
    });
  }

  function materialPageFallbacks() {
    if (currentPath() !== "/materials-2015.html") return;
    window.setTimeout(() => {
      document.querySelectorAll("[data-link-group]").forEach((container) => {
        if (container.querySelector("a") || container.textContent.trim()) return;
        const span = document.createElement("span");
        span.className = "availability-label";
        span.setAttribute("aria-disabled", "true");
        span.textContent = "Not available yet";
        container.append(span);
      });
    }, 0);
  }

  function contactFallbackTimer() {
    if (currentPath() !== "/contact.html") return;
    const list = document.getElementById("commentsList");
    if (!list) return;
    window.setTimeout(() => {
      if (!list.querySelector(".discussion-loading")) return;
      const box = document.createElement("div");
      box.className = "comment-error-box";
      box.textContent = "Discussion is currently unavailable. Please contact us by email.";
      list.replaceChildren(box);
      console.error("Discussion initialization timed out before the comments module produced a success or error state.");
    }, 12000);
  }

  function layoutOverflowFlag() {
    if (new URLSearchParams(window.location.search).get("layout-test") !== "1") return;
    const check = () => {
      document.body.dataset.layoutOverflow = String(document.documentElement.scrollWidth > window.innerWidth + 1);
    };
    check();
    requestAnimationFrame(() => requestAnimationFrame(check));
  }

  function lessonCodeFromHref(href) {
    try {
      const pathname = new URL(href, window.location.href).pathname;
      return pathname.match(/\/lessons\/lessons-(\d+[a-z]?)\.html$/i)?.[1] || "";
    } catch {
      return "";
    }
  }

  function currentLessonCode() {
    return lessonCodeFromHref(window.location.href);
  }

  function notesPdfHref(code) {
    return new URL(`/notes/downloadable-notes-${encodeURIComponent(code)}.pdf`, window.location.origin).href;
  }

  function notesPdfFilename(code) {
    return `downloadable-notes-${code}.pdf`;
  }

  function normalizeDirectDownload(link, code, label) {
    link.href = notesPdfHref(code);
    link.download = notesPdfFilename(code);
    link.removeAttribute("target");
    link.removeAttribute("onclick");
    link.textContent = label;
    link.setAttribute("aria-label", `${label} for Course ${code}`);
    link.classList.remove("generated-pdf-fallback");
  }

  function enhanceLessonDownloadButtons(root = document) {
    root.querySelectorAll?.(".subject-card").forEach((card) => {
      const lesson = card.querySelector("a.action.lessons");
      if (!lesson) return;
      const code = lessonCodeFromHref(lesson.href);
      if (!code) return;

      const existing = card.querySelector("a.action.download");
      if (existing) {
        normalizeDirectDownload(existing, code, "Download Notes (PDF)");
        return;
      }

      const download = document.createElement("a");
      download.className = "action download";
      normalizeDirectDownload(download, code, "Download Notes (PDF)");

      const unavailable = [...card.querySelectorAll(".availability-label")]
        .find((item) => /notes/i.test(item.textContent || ""));
      if (unavailable) {
        unavailable.replaceWith(download);
      } else {
        card.querySelector(".action-row")?.append(download);
      }
    });
  }

  function observeLessonCards() {
    enhanceLessonDownloadButtons();
    const grid = document.getElementById("subjectGrid");
    if (!grid) return;
    const observer = new MutationObserver(() => enhanceLessonDownloadButtons(grid));
    observer.observe(grid, { childList: true, subtree: true });
  }

  function installLessonPrintStyles() {
    if (!isLessonPage() || document.getElementById("poly-lesson-print-fix")) return;
    const style = document.createElement("style");
    style.id = "poly-lesson-print-fix";
    style.textContent = `
      @media print {
        @page { size:A4; margin:12mm 9mm 14mm; }
        html,body{width:100%!important;max-width:none!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;overflow:visible!important;background:#fff!important}
        body::before,body::after{display:none!important}
        header,nav,.topbar,.bar,.lesson-nav,.reading-progress,.revision-back-button,#toTop,.download-pdf-btn,.pdf-button,.search-tools,button{display:none!important}
        main,.wrap,.shell,.page-shell,.content,.container{display:block!important;width:100%!important;max-width:none!important;height:auto!important;margin:0!important;padding:0!important;overflow:visible!important}
        body.poly-print-all [hidden],body.poly-print-all [aria-hidden="true"],body.poly-print-all .panel,body.poly-print-all .tab-panel,body.poly-print-all .tab-content,body.poly-print-all .module-panel,body.poly-print-all .lesson-panel,body.poly-print-all .content-panel,body.poly-print-all .content-section,body.poly-print-all .section-panel,body.poly-print-all [role="tabpanel"]{display:block!important;visibility:visible!important;opacity:1!important;height:auto!important;max-height:none!important;overflow:visible!important;transform:none!important;position:static!important}
        .hero,.hero-inner,.lesson-layout,.grid,.grid-2,.grid-3,.grid-4,.formula-grid,.meta-grid,.two,.quick-grid,.toc{display:block!important;width:100%!important;max-width:none!important;height:auto!important;position:static!important;overflow:visible!important}
        .hero>*,.hero-inner>*,.lesson-layout>*,.grid>*,.grid-2>*,.grid-3>*,.grid-4>*,.formula-grid>*,.meta-grid>*,.two>*,.quick-grid>*{width:100%!important;max-width:none!important;margin:0 0 4mm!important}
        section,article,.sec,.card,.c,.worked,.case-card,.question-paper,.module-banner,.hero{break-inside:auto!important;page-break-inside:auto!important;break-before:auto!important;page-break-before:auto!important;break-after:auto!important;page-break-after:auto!important}
        h1,h2,h3,h4,h5,h6,figure,table,pre,blockquote,.diagram,.formula,.formula-card,.info-box,.callout,.q,details,summary{break-inside:avoid!important;page-break-inside:avoid!important}
        .toc,aside{position:static!important;top:auto!important}
        img,svg,canvas{max-width:100%!important;height:auto!important;break-inside:avoid!important;page-break-inside:avoid!important}
        table{width:100%!important;min-width:0!important;max-width:100%!important;table-layout:auto!important}
        .table-wrap,.tbl{overflow:visible!important;max-width:100%!important}
        details>*{display:block!important}
        *{animation:none!important;transition:none!important}
      }
    `;
    document.head.append(style);
  }

  function prepareLessonForPrint() {
    if (!isLessonPage() || document.body.classList.contains("poly-print-all")) return;
    printableDetailStates = [...document.querySelectorAll("details")].map((detail) => ({ detail, open: detail.open }));
    printableDetailStates.forEach(({ detail }) => {
      detail.open = true;
    });
    document.body.classList.add("poly-print-all");
  }

  function restoreLessonAfterPrint() {
    printableDetailStates.forEach(({ detail, open }) => {
      detail.open = open;
    });
    printableDetailStates = [];
    document.body?.classList.remove("poly-print-all");
  }

  function replaceLessonPrintButtons() {
    if (!isLessonPage()) return;
    const code = currentLessonCode();
    if (!code) return;

    document.querySelectorAll("button, a").forEach((control) => {
      const inlinePrint = /window\.print\s*\(/i.test(control.getAttribute("onclick") || "");
      const classMatch = control.matches(".download-pdf-btn, .pdf-button");
      const labelMatch = /(?:download|print|save).*(?:pdf)|pdf.*(?:download|print|save)/i.test(control.textContent || "");
      if (!inlinePrint && !classMatch && !labelMatch) return;

      if (control instanceof HTMLAnchorElement) {
        normalizeDirectDownload(control, code, "Download Lesson PDF");
        return;
      }

      const link = document.createElement("a");
      [...control.attributes].forEach((attribute) => {
        if (!["onclick", "type", "href", "download"].includes(attribute.name.toLowerCase())) {
          link.setAttribute(attribute.name, attribute.value);
        }
      });
      normalizeDirectDownload(link, code, "Download Lesson PDF");
      control.replaceWith(link);
    });
  }

  function handleLegacyLessonPdfQuery() {
    if (!isLessonPage()) return;
    const params = new URLSearchParams(window.location.search);
    const code = currentLessonCode();
    if (!code) return;

    if (params.get("download") === "pdf") {
      window.location.replace(notesPdfHref(code));
      return;
    }

    if (params.get("print") === "1") {
      window.setTimeout(() => {
        prepareLessonForPrint();
        window.print();
      }, 500);
    }
  }

  function versionParts(value) {
    return String(value || "")
      .trim()
      .split(".")
      .slice(0, 4)
      .map((part) => Number.parseInt(part, 10))
      .map((part) => Number.isFinite(part) && part >= 0 ? part : 0);
  }

  function compareVersions(left, right) {
    const a = versionParts(left);
    const b = versionParts(right);
    const length = Math.max(a.length, b.length, 3);
    for (let index = 0; index < length; index += 1) {
      const difference = (a[index] || 0) - (b[index] || 0);
      if (difference !== 0) return difference;
    }
    return 0;
  }

  function safeUpdateUrl(value) {
    try {
      const url = new URL(String(value || ""), window.location.origin);
      if (url.protocol !== "https:" || url.host !== window.location.host) return null;
      return url;
    } catch {
      return null;
    }
  }

  function addAppUpdateStyles() {
    if (document.getElementById("poly-app-update-styles")) return;
    const style = document.createElement("style");
    style.id = "poly-app-update-styles";
    style.textContent = `
      .poly-app-update-overlay{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:end center;padding:16px;background:rgba(5,14,33,.48);backdrop-filter:blur(5px)}
      .poly-app-update-card{width:min(100%,560px);max-height:min(84vh,680px);overflow:auto;border:1px solid rgba(255,255,255,.65);border-radius:24px;background:#fff;color:#10213d;box-shadow:0 24px 70px rgba(5,20,50,.34);padding:22px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .poly-app-update-kicker{margin:0 0 6px;color:#1d4ed8;font-size:.77rem;font-weight:900;letter-spacing:.11em;text-transform:uppercase}
      .poly-app-update-card h2{margin:0;font-size:clamp(1.35rem,5vw,1.85rem);line-height:1.15}
      .poly-app-update-version{margin:8px 0 0;color:#52637d;font-size:.92rem;font-weight:700}
      .poly-app-update-message{margin:16px 0 0;line-height:1.6}
      .poly-app-update-notes{margin:14px 0 0;padding-left:20px;color:#33445f;line-height:1.55}
      .poly-app-update-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
      .poly-app-update-actions a,.poly-app-update-actions button{min-height:44px;border-radius:13px;padding:11px 17px;font:inherit;font-weight:850;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}
      .poly-app-update-primary{border:1px solid #1d4ed8;background:#1d4ed8;color:#fff;flex:1 1 180px}
      .poly-app-update-later{border:1px solid #cbd5e1;background:#fff;color:#1e293b;flex:0 1 120px}
      .poly-app-update-sha{margin:14px 0 0;color:#64748b;font-size:.73rem;overflow-wrap:anywhere}
      @media(max-width:480px){.poly-app-update-overlay{padding:0;align-items:end}.poly-app-update-card{border-radius:24px 24px 0 0;padding:20px}.poly-app-update-actions>*{width:100%}}
      @media(prefers-reduced-motion:no-preference){.poly-app-update-card{animation:poly-app-update-in .22s ease-out both}@keyframes poly-app-update-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}}
    `;
    document.head.append(style);
  }

  function showAppUpdateDialog(manifest, installedVersion, apkUrl) {
    if (document.getElementById("poly-app-update-overlay")) return;
    addAppUpdateStyles();

    const overlay = document.createElement("div");
    overlay.id = "poly-app-update-overlay";
    overlay.className = "poly-app-update-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "poly-app-update-title");
    overlay.setAttribute("aria-describedby", "poly-app-update-message");

    const card = document.createElement("section");
    card.className = "poly-app-update-card";

    const kicker = document.createElement("p");
    kicker.className = "poly-app-update-kicker";
    kicker.textContent = manifest.forceUpdate ? "Required app update" : "App update available";

    const title = document.createElement("h2");
    title.id = "poly-app-update-title";
    title.textContent = manifest.title || `Polytechnic Study Hub ${manifest.versionName} is available`;

    const version = document.createElement("p");
    version.className = "poly-app-update-version";
    version.textContent = `Installed: ${installedVersion}  •  Latest: ${manifest.versionName}`;

    const message = document.createElement("p");
    message.id = "poly-app-update-message";
    message.className = "poly-app-update-message";
    message.textContent = manifest.message || "Download the latest secure version of the app.";

    card.append(kicker, title, version, message);

    if (Array.isArray(manifest.releaseNotes) && manifest.releaseNotes.length) {
      const notes = document.createElement("ul");
      notes.className = "poly-app-update-notes";
      manifest.releaseNotes.slice(0, 8).forEach((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = String(item);
        notes.append(listItem);
      });
      card.append(notes);
    }

    const actions = document.createElement("div");
    actions.className = "poly-app-update-actions";

    const update = document.createElement("a");
    update.className = "poly-app-update-primary";
    update.href = apkUrl.href;
    update.download = apkUrl.pathname.split("/").pop() || "Polytechnic-Study-Hub.apk";
    update.textContent = "Update Now";
    update.setAttribute("aria-label", `Download Polytechnic Study Hub ${manifest.versionName}`);
    actions.append(update);

    if (!manifest.forceUpdate) {
      const later = document.createElement("button");
      later.type = "button";
      later.className = "poly-app-update-later";
      later.textContent = "Later";
      later.addEventListener("click", () => {
        sessionStorage.setItem(`poly-app-update-dismissed-${manifest.versionName}`, "1");
        overlay.remove();
      });
      actions.append(later);
    }

    card.append(actions);

    if (manifest.sha256) {
      const checksum = document.createElement("p");
      checksum.className = "poly-app-update-sha";
      checksum.textContent = `SHA-256: ${manifest.sha256}`;
      card.append(checksum);
    }

    overlay.append(card);
    document.body.append(overlay);
    update.focus({ preventScroll: true });
  }

  async function checkForAppUpdate() {
    const match = navigator.userAgent.match(APP_USER_AGENT_PATTERN);
    if (!match) return;

    const installedVersion = match[1];
    try {
      const manifestUrl = new URL(APP_UPDATE_MANIFEST, window.location.origin);
      manifestUrl.searchParams.set("check", Date.now().toString());
      const response = await fetch(manifestUrl, {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) return;

      const manifest = await response.json();
      if (!manifest || compareVersions(manifest.versionName, installedVersion) <= 0) return;
      if (sessionStorage.getItem(`poly-app-update-dismissed-${manifest.versionName}`) === "1") return;

      const apkUrl = safeUpdateUrl(manifest.apkUrl);
      if (!apkUrl) return;
      showAppUpdateDialog(manifest, installedVersion, apkUrl);
    } catch (error) {
      console.warn("App update check failed.", error);
    }
  }

  window.addEventListener("beforeprint", prepareLessonForPrint);
  window.addEventListener("afterprint", restoreLessonAfterPrint);

  document.addEventListener("DOMContentLoaded", () => {
    normalizeLinks();
    materialPageFallbacks();
    contactFallbackTimer();
    layoutOverflowFlag();
    observeLessonCards();
    installLessonPrintStyles();
    replaceLessonPrintButtons();
    handleLegacyLessonPdfQuery();
    window.setTimeout(checkForAppUpdate, 700);
  });
})();
