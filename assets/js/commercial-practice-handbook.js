/* Interactions shared by the Commercial Practice handbooks. */
(() => {
  'use strict';
  const print = document.getElementById('printBtn');
  print?.addEventListener('click', () => {
    document.querySelectorAll('details').forEach(node => { node.open = true; });
    (window.polyRequestLessonPrint || window.print)();
  });

  document.getElementById('calculatePayment')?.addEventListener('click', () => {
    const amount = document.getElementById('upiAmt');
    const fee = document.getElementById('upiFee');
    const result = document.getElementById('upiResult');
    if (!amount.value || !fee.value || !amount.checkValidity() || !fee.checkValidity()) {
      result.textContent = 'Enter a positive amount and a fee from 0 to 5 percent.';
      return;
    }
    const charge = amount.valueAsNumber * fee.valueAsNumber / 100;
    result.textContent = `Fee = ₹${charge.toFixed(2)} | Total = ₹${(amount.valueAsNumber + charge).toFixed(2)}`;
  });

  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  if (!input || !results) return;
  // Stable targets let search open the precise topic or answer, including in 1142.
  const entries = Array.from(document.querySelectorAll('main h2, main h3, main details > summary')).map((node, index) => {
    const target = node.closest('details') || node;
    if (!target.id) target.id = `handbook-topic-${index + 1}`;
    const label = node.textContent.trim();
    return { target, label, searchText: label.toLowerCase() };
  });
  let status = document.getElementById('searchStatus');
  if (!status) {
    status = document.createElement('p');
    status.id = 'searchStatus';
    status.setAttribute('role', 'status');
    results.before(status);
  }
  input.removeAttribute('oninput');
  input.setAttribute('aria-controls', 'searchResults');
  input.setAttribute('aria-describedby', status.id);
  input.addEventListener('input', () => {
    results.replaceChildren();
    const query = input.value.trim().toLowerCase();
    const matches = query ? entries.filter(entry => entry.searchText.includes(query)) : [];
    status.textContent = query ? `${matches.length} matching topics${matches.length > 25 ? '; showing the first 25' : ''}.` : '';
    matches.slice(0, 25).forEach(entry => {
      const link = document.createElement('a');
      link.href = `#${entry.target.id}`;
      link.textContent = entry.label;
      link.addEventListener('click', () => {
        if (entry.target.tagName === 'DETAILS') entry.target.open = true;
      });
      results.append(link);
    });
  });
})();
