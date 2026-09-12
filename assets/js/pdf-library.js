'use strict';
(function() {
  const base = 'https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/';
  const search = document.getElementById('search');
  const status = document.getElementById('status');
  const files = document.getElementById('files');
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const retry = document.getElementById('retry');
  let documents = [], filtered = [], page = 0;

  function render() {
    if (!files) return;
    files.replaceChildren();
    filtered.slice(page * 100, (page + 1) * 100).forEach(item => {
      const row = document.createElement('li');
      const link = document.createElement('a');
      link.href = item.pdfUrl;
      link.textContent = item.title || item.path;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const detail = document.createElement('small');
      detail.textContent = `${item.path} · ${(item.bytes / 1048576).toFixed(2)} MB`;
      row.append(link, detail);
      files.append(row);
    });
    if (status) {
      status.textContent = `${filtered.length.toLocaleString()} matching PDFs · ${documents.length.toLocaleString()} total`;
    }
    const pageSpan = document.getElementById('page');
    if (pageSpan) {
      pageSpan.textContent = filtered.length ? `Page ${page + 1} of ${Math.ceil(filtered.length / 100)}` : 'No results';
    }
    if (previous) previous.disabled = page === 0;
    if (next) next.disabled = (page + 1) * 100 >= filtered.length;
  }

  if (search) {
    search.addEventListener('input', () => {
      const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
      filtered = documents.filter(item => words.every(word => `${item.path} ${item.title}`.toLowerCase().includes(word)));
      page = 0;
      render();
    });
  }

  if (previous) previous.onclick = () => { page--; render(); };
  if (next) next.onclick = () => { page++; render(); };

  async function load() {
    if (retry) retry.hidden = true;
    if (status) status.textContent = 'Loading the PDF archive…';
    try {
      const response = await fetch(base + 'manifests/archive-index.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.documents)) throw new Error('Invalid archive index');
      documents = data.documents.filter(item => typeof item.path === 'string' && typeof item.pdfUrl === 'string' && item.pdfUrl.startsWith(base));
      filtered = documents;
      page = 0;
      if (search) {
        search.disabled = false;
        search.value = '';
      }
      render();
    } catch (error) {
      if (status) status.textContent = 'The archive catalog is temporarily unavailable. Please try again shortly.';
      if (retry) retry.hidden = false;
    }
  }

  if (retry) retry.onclick = load;
  load();
})();
