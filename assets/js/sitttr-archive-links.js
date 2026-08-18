(() => {
  'use strict';

  const MAP_URL = '/assets/data/sitttr-archive-links.json?v=20260818-sitttr-archive-links4';
  const SITTTR_HOSTS = new Set(['sitttrkerala.ac.in', 'www.sitttrkerala.ac.in']);
  const modelLinkSelector = '.action.qp, .rev2015-action-model';
  const syllabusLinkSelector = '.action.syllabus, .rev2015-action-syllabus';
  let archiveMap = null;
  let observerStarted = false;

  function revisionKey(value) {
    const text = String(value || '');
    const explicit = text.match(/rev(?:ision)?\s*[-_ ]?(2015|2021|2026)/i);
    if (explicit) return explicit[1];
    const match = text.match(/20(?:15|21|26)/);
    return match ? match[0] : '';
  }

  function clean(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normal(value) {
    return clean(value).replace(/[^a-z0-9]+/g, '');
  }

  function semesterKeys(value, documentType) {
    const raw = clean(value);
    const match = raw.match(/semester\s*[-_ ]?(\d+)/);
    const keys = [];
    if (documentType === 'model-question-paper') keys.push('semester-unspecified');
    if (match) keys.push(`semester-${match[1]}`);
    if (raw) keys.push(raw.replace(/\s+/g, '-'));
    if (!keys.includes('semester-unspecified')) keys.push('semester-unspecified');
    return [...new Set(keys)];
  }

  function pageContext(link) {
    const card = link.closest('[data-subject-code], [data-course-code]');
    if (!card) return null;
    const grid = card.closest('.subject-grid') || card.closest('[data-department], [data-programme-name]');
    const revision = revisionKey(card.dataset.revision || grid?.dataset.revision || document.body?.dataset.revision || document.body?.dataset.siteRevision || location.pathname);
    const course = String(card.dataset.subjectCode || card.dataset.courseCode || '').trim();
    if (!revision || !course) return null;

    let department = String(card.dataset.department || grid?.dataset.department || grid?.dataset.programmeName || document.body?.dataset.programmeName || '').trim();
    if (!department) {
      department = new URLSearchParams(location.search).get('department') || '';
    }
    if (!department) {
      const selected = card.closest('#rev2015SubjectResults')?.querySelector('.rev2015-selected-department > div > span');
      department = selected?.textContent?.trim() || '';
    }

    let semester = String(card.dataset.semester || '').trim();
    if (!semester) {
      const group = card.closest('.rev2015-semester-group');
      const labelledBy = group?.getAttribute('aria-labelledby') || '';
      const match = labelledBy.match(/-sem-(\d+)$/);
      semester = match ? `Semester ${match[1]}` : '';
    }
    if (!semester) {
      const searchableText = [
        card.getAttribute('data-search-text') || '',
        card.textContent || ''
      ].join(' ');
      const match = searchableText.match(/semester\s*[-_ ]?(\d+)/i);
      semester = match ? `Semester ${match[1]}` : '';
    }
    return { revision, department, course, semester };
  }

  function archiveDocument(context, documentType) {
    if (!archiveMap || !context) return null;
    const revision = archiveMap.revisions?.[context.revision];
    if (!revision) return null;
    const departmentSlug = revision.departmentAliases?.[normal(context.department)] || context.department;
    const departments = revision.documents?.[documentType] || {};
    const departmentDocs = departments[departmentSlug];
    if (!departmentDocs) return null;
    for (const semester of semesterKeys(context.semester, documentType)) {
      const match = departmentDocs[semester]?.[context.course];
      if (match?.pdfUrl) return match;
    }
    return null;
  }

  function sameSitttrUrl(value) {
    try {
      return SITTTR_HOSTS.has(new URL(value, location.href).hostname);
    } catch (_) {
      return false;
    }
  }

  function updateLink(link, documentType) {
    const context = pageContext(link);
    const document = archiveDocument(context, documentType);
    if (!document?.pdfUrl || !sameSitttrUrl(link.href)) return false;
    link.href = document.pdfUrl;
    link.dataset.sitttrArchive = 'true';
    link.dataset.sitttrArchivePath = document.path || '';
    link.title = documentType === 'syllabus'
      ? 'Open the archived SITTTR syllabus PDF'
      : 'Open the archived SITTTR model question paper PDF';
    link.setAttribute('aria-label', `${link.textContent.trim()} (archived PDF)`);
    return true;
  }

  function applyLinks(root = document) {
    let changed = 0;
    root.querySelectorAll(syllabusLinkSelector).forEach(link => {
      if (updateLink(link, 'syllabus')) changed += 1;
    });
    root.querySelectorAll(modelLinkSelector).forEach(link => {
      if (updateLink(link, 'model-question-paper')) changed += 1;
    });
    return changed;
  }

  function startObserver() {
    if (observerStarted || !('MutationObserver' in window)) return;
    observerStarted = true;
    const observer = new MutationObserver(mutations => {
      if (!archiveMap) return;
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
          const target = mutation.target;
          if (target.matches(syllabusLinkSelector)) updateLink(target, 'syllabus');
          else if (target.matches(modelLinkSelector)) updateLink(target, 'model-question-paper');
          return;
        }
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) applyLinks(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
  }

  async function loadMap() {
    try {
      const response = await fetch(MAP_URL, { headers: { Accept: 'application/json' }, cache: 'force-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      archiveMap = await response.json();
      applyLinks();
      document.documentElement.dataset.sitttrArchiveLinks = 'ready';
      document.dispatchEvent(new CustomEvent('sitttr-archive-links-ready'));
      return archiveMap;
    } catch (error) {
      console.warn('SITTTR archive map unavailable; retaining official SITTTR fallback links.', error);
      document.documentElement.dataset.sitttrArchiveLinks = 'fallback';
      return null;
    }
  }

  startObserver();
  const ready = loadMap();
  window.SitttrArchiveLinks = Object.freeze({ ready, apply: applyLinks });
})();
