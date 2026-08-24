/* Purpose: Subject browser 4024 hotfix - Descriptive comment added for clarity */
(() => {
  'use strict';
  const VALID_DEPARTMENTS = new Set(['Mechanical Engineering', 'Tool and Die Engineering', 'Manufacturing Technology']);
  function rootPrefix() {
    const depth = window.location.pathname.replace(/\/[^/]*$/, '').split('/').filter(Boolean).length;
    return depth > 0 ? '../'.repeat(depth) : '';
  }
  function add4024Card() {
    const grid = document.getElementById('subjectGrid');
    if (!grid || grid.querySelector('[data-subject-code="4024"], [data-code="4024"]')) return;
    const department = grid.dataset.department || '';
    if (!VALID_DEPARTMENTS.has(department)) return;
    const root = rootPrefix();
    const card = document.createElement('article');
    card.className = 'subject-card';
    card.dataset.subjectCode = '4024';
    card.innerHTML = '<div class="subject-top"><span>2021</span><strong>4024</strong></div><h3>Industrial Engineering</h3><p>' + department + ' / Semester 4 / Program Core</p><div class="action-row"><a class="action syllabus" href="https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2021" target="_blank" rel="noopener noreferrer">Open Syllabus</a><a class="action lessons" href="' + root + 'lessons/lessons-4024.html">View Lessons</a><a class="action download" href="' + root + 'notes/downloadable-notes-4024.pdf" download>Download Notes</a><a class="action qp" href="https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=4024" target="_blank" rel="noopener noreferrer">Sample QP</a></div>';
    let target = [...grid.querySelectorAll('.semester-subject-section')].find((section) => /Semester\s*4/i.test(section.innerText));
    if (!target) {
      target = document.createElement('section');
      target.className = 'semester-subject-section';
      target.style.cssText = 'grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px';
      target.innerHTML = '<div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)"><h3>Semester 4</h3><span>1 subject</span></div><div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%"></div>';
      grid.prepend(target);
    }
    const holder = target.querySelector('.semester-card-grid') || target;
    holder.prepend(card);
  }
  window.addEventListener('DOMContentLoaded', () => {
    add4024Card();
    setTimeout(add4024Card, 700);
    setTimeout(add4024Card, 1800);
  });
})();
