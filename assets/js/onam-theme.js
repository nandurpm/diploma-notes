(() => {
  'use strict';

  if (window.__polyOnamThemeLoaded) return;
  window.__polyOnamThemeLoaded = true;

  const VERSION = '20260703-onam3';
  const DAYS = [
    { key: 'uthradam', label: 'Uthradam', malayalam: 'ഉത്രാടം', message: 'Onam preparations begin. Study with joy and keep moving forward.' },
    { key: 'thiruvonam', label: 'Thiruvonam', malayalam: 'തിരുവോണം', message: 'Happy Onam. May knowledge, unity and success grow.' },
    { key: 'avittam', label: 'Avittam', malayalam: 'അവിട്ടം', message: 'Keep the Onam spirit alive with steady learning and revision.' },
    { key: 'chathayam', label: 'Chathayam', malayalam: 'ചതയം', message: 'Final Onam day theme. Revise well and move forward.' }
  ];

  const ONAM_DATES_2026 = ['2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28'];

  function istDateString(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date).reduce((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function getPreviewDay(params) {
    const raw = String(params.get('onamTheme') || params.get('onam') || '').trim().toLowerCase();
    if (!raw || raw === '0' || raw === 'off' || raw === 'false') return null;
    if (raw === 'random') return 1 + Math.floor(Math.random() * 4);
    const digit = raw.match(/[1-4]/)?.[0];
    return digit ? Number(digit) : 2;
  }

  function getActiveDay() {
    const params = new URLSearchParams(window.location.search);
    const previewDay = getPreviewDay(params);
    if (previewDay) return { day: previewDay, preview: true };
    const index = ONAM_DATES_2026.indexOf(istDateString());
    if (index >= 0) return { day: index + 1, preview: false };
    return null;
  }

  function stylesheet(id, href) {
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.append(link);
    }
    link.href = href;
  }

  function ensureStylesheet() {
    stylesheet('poly-onam-theme-css', `/assets/css/onam-theme.css?v=${VERSION}`);
    stylesheet('poly-onam-2026-art-css', `/assets/css/onam-2026-art.css?v=${VERSION}`);
  }

  function makeEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === 'string') el.textContent = text;
    return el;
  }

  function addBanner(info) {
    if (document.querySelector('.poly-onam-bar')) return;
    const day = DAYS[info.day - 1] || DAYS[1];
    const bar = makeEl('aside', 'poly-onam-bar');
    bar.setAttribute('role', 'status');
    ['🌼', 'Happy Onam!', 'Wishing you and your family a prosperous and joyful Onam.', `${day.label} · ${day.malayalam}`, info.preview ? 'Preview' : '', '🌼'].forEach((text, index) => {
      if (!text) return;
      const className = index === 0 || index === 5 ? 'poly-onam-bar__flower' : index === 3 ? 'poly-onam-bar__day' : index === 4 ? 'poly-onam-preview-tag' : '';
      bar.append(makeEl(index === 1 ? 'strong' : 'span', className, text));
    });
    const skip = document.querySelector('.skip-link');
    if (skip?.nextSibling) skip.after(bar); else document.body.prepend(bar);
  }

  function addDecor() {
    if (document.querySelector('.poly-onam-corner')) return;
    ['tl', 'tr'].forEach((pos) => {
      const corner = makeEl('div', `poly-onam-corner poly-onam-corner--${pos}`);
      ['🌿', '🌼', '🏵️', '🌸'].forEach((item) => corner.append(makeEl('span', '', item)));
      document.body.append(corner);
    });
    ['left', 'right'].forEach((pos) => {
      const dancer = makeEl('div', `poly-onam-dancer poly-onam-dancer--${pos}`, '🧡');
      dancer.setAttribute('aria-hidden', 'true');
      document.body.append(dancer);
    });
  }

  function addPookalam(parent) {
    const stage = makeEl('div', 'poly-onam-pookalam-stage');
    stage.setAttribute('aria-hidden', 'true');
    const leaves = makeEl('div', 'poly-onam-leaves');
    const pookalam = makeEl('div', 'poly-onam-pookalam-art');
    pookalam.append(makeEl('span', 'poly-onam-lamp', '🪔'));
    stage.append(leaves, pookalam);
    parent.append(stage);
  }

  function addBoat(parent) {
    const scene = makeEl('div', 'poly-onam-boat-scene');
    scene.setAttribute('aria-hidden', 'true');
    scene.append(makeEl('span', 'poly-onam-palm', '🌴'));
    scene.append(makeEl('span', 'poly-onam-boat-emoji', '🛶'));
    scene.append(makeEl('span', 'poly-onam-rowers', '⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪'));
    scene.append(makeEl('span', 'poly-onam-flag', '🚩'));
    parent.append(scene);
  }

  function addGrandHero(info) {
    const host = document.querySelector('.home-compact-hero');
    if (!host || document.querySelector('.poly-onam-grand-hero')) return;
    const day = DAYS[info.day - 1] || DAYS[1];
    document.body.classList.add('poly-onam-home');
    host.classList.add('poly-onam-hero-host');

    const scene = makeEl('section', 'poly-onam-grand-hero');
    scene.setAttribute('aria-label', `Happy Onam ${day.label} greeting`);
    const leftArrow = makeEl('button', 'poly-onam-hero-arrow poly-onam-hero-arrow--left', '‹');
    leftArrow.type = 'button';
    const rightArrow = makeEl('button', 'poly-onam-hero-arrow poly-onam-hero-arrow--right', '›');
    rightArrow.type = 'button';
    const left = makeEl('div', 'poly-onam-hero-left');
    addPookalam(left);
    const center = makeEl('div', 'poly-onam-hero-center');
    center.append(makeEl('p', 'poly-onam-script', 'Happy'));
    const h1 = makeEl('h1', '', 'Onam');
    h1.append(makeEl('span', '', '!'));
    center.append(h1, makeEl('p', 'poly-onam-malayalam', 'ഓണാശംസകൾ'), makeEl('p', 'poly-onam-copy', `${day.message} Wishing joy, prosperity and success to you and your family.`));
    const dots = makeEl('div', 'poly-onam-dots');
    dots.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i += 1) dots.append(makeEl('span'));
    center.append(dots);
    const right = makeEl('div', 'poly-onam-hero-right');
    addBoat(right);
    scene.append(leftArrow, left, center, right, rightArrow);
    host.prepend(scene);

    const subjectBrowser = document.querySelector('#subject-browser');
    if (subjectBrowser && host.nextElementSibling !== subjectBrowser) host.after(subjectBrowser);
    const grid = document.querySelector('.selection-grid');
    if (grid && !grid.querySelector('.poly-onam-special-card')) {
      const card = document.createElement('a');
      card.className = 'choice-card poly-onam-special-card';
      card.href = '#subject-browser';
      card.append(makeEl('span', '', '🌼 ONAM SPECIAL'));
      card.append(makeEl('h2', '', 'Celebrate Onam with learning'));
      card.append(makeEl('p', '', 'Use notes, lessons, syllabus and mock exams while the festival theme is active.'));
      grid.append(card);
    }
  }

  function addContextStrip(info) {
    if (document.querySelector('.poly-onam-sadya-strip')) return;
    const day = DAYS[info.day - 1] || DAYS[1];
    const strip = makeEl('div', 'poly-onam-sadya-strip', `${day.label} Onam special theme is active for 2026. Learn, revise and celebrate responsibly.`);
    const target = document.querySelector('.selection-grid,.section.cards,.hero-card,.hero-mini,.hero');
    if (target) target.after(strip);
  }

  function addPetals() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 540) return;
    let count = 0;
    const spawn = () => {
      if (!document.documentElement.classList.contains('poly-onam-theme')) return;
      const petal = makeEl('span', 'poly-onam-petal', Math.random() > 0.48 ? '🌼' : '🌸');
      petal.style.left = `${Math.random() * 100}vw`;
      petal.style.setProperty('--x-end', `${Math.round((Math.random() - 0.5) * 140)}px`);
      petal.style.animationDuration = `${8 + Math.random() * 8}s`;
      petal.style.fontSize = `${14 + Math.random() * 12}px`;
      document.body.append(petal);
      count += 1;
      setTimeout(() => petal.remove(), 17000);
      if (count < 44) setTimeout(spawn, 520 + Math.random() * 780);
    };
    setTimeout(spawn, 450);
  }

  function install(info) {
    ensureStylesheet();
    document.documentElement.classList.add('poly-onam-theme', `poly-onam-day-${info.day}`);
    document.body.classList.add('poly-onam-theme', `poly-onam-day-${info.day}`);
    document.body.dataset.onamDay = String(info.day);
    document.body.dataset.onamPreview = String(Boolean(info.preview));
    addBanner(info);
    addDecor();
    addGrandHero(info);
    addContextStrip(info);
    addPetals();
  }

  function boot() {
    const info = getActiveDay();
    if (info) install(info);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
