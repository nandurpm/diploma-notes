/* POLY PMNA shared printable-notes behavior. */
(() => {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const requested = params.has('autoPrintNotes') || params.has('downloadNotes');
  const browserPrint = typeof window.print === 'function' ? window.print.bind(window) : null;
  const nativeApp = /(?:PolytechnicStudyHubAndroid|PolyPmnaAndroid)\/[0-9]+(?:\.[0-9]+)*/i.test(navigator.userAgent || '');

  function requestPrint() {
    const bridge = window.PolyNativePrint;
    if (nativeApp && bridge && typeof bridge.printLesson === 'function') {
      if (window.__polyNativePrintBusy) return true;
      try {
        window.__polyNativePrintBusy = true;
        window.setTimeout(() => { window.__polyNativePrintBusy = false; }, 1500);
        bridge.printLesson(document.title || 'POLY PMNA printable notes');
        return true;
      } catch (_) {
        // Fall through to the browser printer when a non-standard WebView bridge fails.
      }
    }
    if (!browserPrint) return false;
    try {
      browserPrint();
      return true;
    } catch (_) {
      return false;
    }
  }

  // Expose one print entry point for shared lesson controls and replace window.print only
  // inside the trusted Android APK. This also covers older inline lesson buttons.
  if (!window.__polyNativePrintOverride) {
    window.__polyNativePrintOverride = true;
    window.polyRequestLessonPrint = requestPrint;
    if (nativeApp) window.print = requestPrint;
  }
  const printSupported = typeof window.polyRequestLessonPrint === 'function' || typeof window.print === 'function';

  const guide = document.createElement('div');
  guide.className = 'print-notes-guide no-print';
  guide.setAttribute('role', 'status');
  guide.innerHTML = '<strong>Printable notes:</strong> use your browser or app menu to choose Print or Save as PDF. If no print dialog appears, open this page in Chrome or another full browser.';

  function installGuide() {
    if (!document.body || document.querySelector('.print-notes-guide')) return;
    const main = document.querySelector('main') || document.body.firstElementChild;
    if (main && main.parentNode) main.parentNode.insertBefore(guide, main);
    else document.body.insertBefore(guide, document.body.firstChild);
  }

  function preparePrint() {
    document.documentElement.classList.add('print-notes-mode');
    document.body.classList.add('print-notes-mode');
    document.querySelectorAll('[hidden]').forEach((node) => {
      node.dataset.printWasHidden = 'true';
      node.hidden = false;
    });
    document.title = document.title.replace(/\s*[|—-]\s*POLY PMNA.*$/i, '') || 'POLY PMNA printable notes';
    installGuide();
  }

  function start() {
    if (!requested) return;
    preparePrint();
    if (printSupported) {
      window.setTimeout(() => {
        const print = window.polyRequestLessonPrint || window.print;
        if (typeof print === 'function') print();
      }, 700);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
