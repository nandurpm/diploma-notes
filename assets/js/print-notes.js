/* POLY PMNA shared printable-notes behavior. */
(() => {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const requested = params.has('autoPrintNotes') || params.has('downloadNotes');
  const printSupported = typeof window.print === 'function';

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
      window.setTimeout(() => window.print(), 700);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
