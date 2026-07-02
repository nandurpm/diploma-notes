(() => {
  'use strict';

  if (window.__polyOnamThemeLoaded) return;
  window.__polyOnamThemeLoaded = true;

  const VERSION = '20260702-onam1';
  const DAYS = [
    { key: 'uthradam', label: 'Uthradam', malayalam: 'ഉത്രാടം', message: 'Onam preparations begin. Stay blessed and keep learning.' },
    { key: 'thiruvonam', label: 'Thiruvonam', malayalam: 'തിരുവോണം', message: 'Happy Onam. May knowledge, unity and success grow.' },
    { key: 'avittam', label: 'Avittam', malayalam: 'അവിട്ടം', message: 'Keep the Onam spirit alive with steady learning.' },
    { key: 'chathayam', label: 'Chathayam', malayalam: 'ചതയം', message: 'Final Onam day theme. Revise well and move forward.' }
  ];

  const DEFAULT_DATES = {
    // Four public Onam days: Uthradam, Thiruvonam, Avittam, Chathayam.
    2025: ['2025-09-04', '2025-09-05', '2025-09-06', '2025-09-07'],
    2026: ['2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28']
  };

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
    const fromUrl = params.get('onamTheme') || params.get('onam') || '';
    const fromStorage = (() => {
      try { return localStorage.getItem('polyOnamThemePreview') || ''; }
      catch { return ''; }
    })();
    const raw = String(fromUrl || fromStorage).trim().toLowerCase();
    if (!raw || raw === '0' || raw === 'off' || raw === 'false') return null;
    if (raw === 'random') return 1 + Math.floor(Math.random() * 4);
    const digit = raw.match(/[1-4]/)?.[0];
    return digit ? Number(digit) : 2;
  }

  function getActiveDay() {
    const params = new URLSearchParams(window.location.search);
    const previewDay = getPreviewDay(params);
    if (previewDay) return { day: previewDay, preview: true };

    const current = istDateString();
    const dates = window.POLY_ONAM_THEME_DATES || DEFAULT_DATES;
    for (const yearDates of Object.values(dates)) {
      const index = yearDates.indexOf(current);
      if (index >= 0) return { day: index + 1, preview: false };
    }
    return null;
  }

  function ensureStylesheet() {
    if (document.getElementById('poly-onam-theme-css')) return;
    const link = document.createElement('link');
    link.id = 'poly-onam-theme-css';
    link.rel = 'stylesheet';
    link.href = `/assets/css/onam-theme.css?v=${VERSION}`;
    document.head.append(link);
  }

  function flowerSvg() {
    return `<svg viewBox='0 0 180 180' aria-hidden='true' focusable='false'>
      <defs><linearGradient id='og' x1='0' x2='1'><stop stop-color='#facc15'/><stop offset='1' stop-color='#f97316'/></linearGradient></defs>
      <g opacity='.98'>
        <path d='M0 0c35 8 62 28 80 59-30-2-58-15-80-59z' fill='#166534'/>
        <path d='M20 4c29 14 50 35 62 65-28-8-50-28-62-65z' fill='#15803d'/>
        <circle cx='60' cy='58' r='16' fill='url(#og)'/><circle cx='87' cy='45' r='14' fill='#facc15'/><circle cx='105' cy='72' r='17' fill='#f97316'/>
        <circle cx='70' cy='91' r='15' fill='#f59e0b'/><circle cx='118' cy='106' r='14' fill='#facc15'/><circle cx='44' cy='116' r='13' fill='#f97316'/>
        <path d='M26 73c50 12 86 40 118 89' fill='none' stroke='#14532d' stroke-width='8' stroke-linecap='round'/>
      </g>
    </svg>`;
  }

  function boatSvg() {
    return `<svg viewBox='0 0 420 150' aria-hidden='true' focusable='false'>
      <path d='M35 90c72 28 224 40 350 6-68 45-232 52-350-6z' fill='#4a250f'/>
      <path d='M360 34c26 22 38 50 36 70-20-30-42-52-82-72 18-4 30-3 46 2z' fill='#4a250f'/>
      <path d='M52 80c74 16 190 22 286 8' fill='none' stroke='#d89b18' stroke-width='8' stroke-linecap='round'/>
      <g fill='#fff8e6' stroke='#4a250f' stroke-width='3'>
        ${Array.from({ length: 14 }, (_, i) => `<circle cx='${95 + i * 16}' cy='72' r='6'/>`).join('')}
      </g>
      <g stroke='#d89b18' stroke-width='5' stroke-linecap='round'>
        ${Array.from({ length: 9 }, (_, i) => `<path d='M${105 + i * 24} 66l-20 45'/>`).join('')}
      </g>
      <path d='M0 123c85-15 151 18 225 0s122-12 195 0' fill='none' stroke='#0f8a99' stroke-width='8' stroke-linecap='round' opacity='.6'/>
    </svg>`;
  }

  function addBanner(info) {
    if (document.querySelector('.poly-onam-bar')) return;
    const day = DAYS[info.day - 1] || DAYS[1];
    const bar = document.createElement('aside');
    bar.className = 'poly-onam-bar';
    bar.setAttribute('role', 'status');
    bar.innerHTML = `<span class='poly-onam-bar__flower'>🌼</span><span>Happy Onam!</span><span class='poly-onam-bar__day'>Day ${info.day} - ${day.label}</span><span>${day.malayalam}</span><span class='poly-onam-bar__tag'>Onam Special</span>${info.preview ? `<span class='poly-onam-preview-tag'>Preview</span>` : ''}<span class='poly-onam-bar__flower'>🌼</span>`;
    const skip = document.querySelector('.skip-link');
    if (skip?.nextSibling) skip.after(bar); else document.body.prepend(bar);
  }

  function addDecor() {
    if (document.querySelector('.poly-onam-corner')) return;
    ['tl', 'tr', 'bl', 'br'].forEach((pos) => {
      const corner = document.createElement('div');
      corner.className = `poly-onam-corner poly-onam-corner--${pos}`;
      corner.innerHTML = flowerSvg();
      document.body.append(corner);
    });
    const pookalam = document.createElement('div');
    pookalam.className = 'poly-onam-pookalam';
    pookalam.setAttribute('aria-hidden', 'true');
    document.body.append(pookalam);

    const boat = document.createElement('div');
    boat.className = 'poly-onam-boat';
    boat.innerHTML = boatSvg();
    document.body.append(boat);
  }

  function addContextStrip(info) {
    if (!document.querySelector('#main-content,.main-content,main')) return;
    if (document.querySelector('.poly-onam-sadya-strip')) return;
    const day = DAYS[info.day - 1] || DAYS[1];
    const strip = document.createElement('div');
    strip.className = 'poly-onam-sadya-strip';
    strip.textContent = `${day.message} Use the search, notes and mock exams while the Onam theme is active.`;
    const hero = document.querySelector('.home-compact-hero,.page-title,.hero-card,.hero-mini,.hero');
    if (hero) hero.append(strip);
  }

  function addPetals() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 540) return;
    let count = 0;
    const maxPetals = 34;
    const spawn = () => {
      if (!document.documentElement.classList.contains('poly-onam-theme')) return;
      const petal = document.createElement('span');
      petal.className = 'poly-onam-petal';
      petal.textContent = Math.random() > 0.45 ? '🌼' : '🌸';
      petal.style.left = `${Math.random() * 100}vw`;
      petal.style.setProperty('--x-end', `${Math.round((Math.random() - 0.5) * 120)}px`);
      petal.style.animationDuration = `${7 + Math.random() * 8}s`;
      petal.style.fontSize = `${14 + Math.random() * 10}px`;
      document.body.append(petal);
      count += 1;
      setTimeout(() => petal.remove(), 16000);
      if (count < maxPetals) setTimeout(spawn, 700 + Math.random() * 900);
    };
    setTimeout(spawn, 700);
  }

  function install(info) {
    ensureStylesheet();
    document.documentElement.classList.add('poly-onam-theme', `poly-onam-day-${info.day}`);
    document.body.classList.add('poly-onam-theme', `poly-onam-day-${info.day}`);
    document.body.dataset.onamDay = String(info.day);
    document.body.dataset.onamPreview = String(Boolean(info.preview));
    addBanner(info);
    addDecor();
    addContextStrip(info);
    addPetals();
  }

  function boot() {
    const info = getActiveDay();
    if (!info) return;
    install(info);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
