(() => {
  'use strict';

  const VERSION = '20260703-onam4-force';
  const DATES = ['2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28'];
  const DAYS = [
    ['Uthradam', 'ഉത്രാടം'],
    ['Thiruvonam', 'തിരുവോണം'],
    ['Avittam', 'അവിട്ടം'],
    ['Chathayam', 'ചതയം']
  ];

  function istToday() {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date()).reduce((a, p) => { if (p.type !== 'literal') a[p.type] = p.value; return a; }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function activeDay() {
    const params = new URLSearchParams(location.search);
    const raw = String(params.get('onamTheme') || params.get('onam') || '').toLowerCase();
    if (raw === 'random') return 1 + Math.floor(Math.random() * 4);
    const digit = raw.match(/[1-4]/)?.[0];
    if (digit) return Number(digit);
    const index = DATES.indexOf(istToday());
    return index >= 0 ? index + 1 : 0;
  }

  function css(id, href) {
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.append(link);
    }
    link.href = href;
  }

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function removeOld() {
    document.querySelectorAll('.poly-onam-bar,.poly-onam-corner,.poly-onam-pookalam,.poly-onam-boat,.poly-onam-sadya-strip,.poly-onam-petal,.poly-onam-grand-hero,.poly-onam-dancer').forEach((n) => n.remove());
  }

  function build(dayNo) {
    const day = DAYS[dayNo - 1] || DAYS[1];
    removeOld();
    css('poly-onam-theme-css', `/assets/css/onam-theme.css?v=${VERSION}`);
    css('poly-onam-2026-art-css', `/assets/css/onam-2026-art.css?v=${VERSION}`);

    document.documentElement.classList.add('poly-onam-theme', `poly-onam-day-${dayNo}`);
    document.body.classList.add('poly-onam-theme', 'poly-onam-home', `poly-onam-day-${dayNo}`);
    document.body.dataset.onamDay = String(dayNo);
    document.body.dataset.onamPreview = String(new URLSearchParams(location.search).has('onamTheme'));

    const bar = el('aside', 'poly-onam-bar');
    bar.setAttribute('role', 'status');
    bar.append(el('span', 'poly-onam-bar__flower', '🌼'), el('strong', '', 'Happy Onam!'), el('span', '', 'Wishing you and your family a prosperous and joyful Onam.'), el('span', 'poly-onam-bar__day', `${day[0]} · ${day[1]}`), el('span', 'poly-onam-bar__flower', '🌼'));
    const skip = document.querySelector('.skip-link');
    if (skip) skip.after(bar); else document.body.prepend(bar);

    ['tl', 'tr'].forEach((pos) => {
      const corner = el('div', `poly-onam-corner poly-onam-corner--${pos}`);
      ['🌿', '🌼', '🏵️', '🌸'].forEach((x) => corner.append(el('span', '', x)));
      document.body.append(corner);
    });
    ['left', 'right'].forEach((pos) => {
      const dancer = el('div', `poly-onam-dancer poly-onam-dancer--${pos}`, '💃');
      document.body.append(dancer);
    });

    const host = document.querySelector('.home-compact-hero');
    if (host) {
      host.classList.add('poly-onam-hero-host');
      const scene = el('section', 'poly-onam-grand-hero');
      const left = el('div', 'poly-onam-hero-left');
      const stage = el('div', 'poly-onam-pookalam-stage');
      const leaves = el('div', 'poly-onam-leaves');
      const pookalam = el('div', 'poly-onam-pookalam-art');
      pookalam.append(el('span', 'poly-onam-lamp', '🪔'));
      stage.append(leaves, pookalam);
      left.append(stage);

      const center = el('div', 'poly-onam-hero-center');
      const title = el('h1', '', 'Onam');
      title.append(el('span', '', '!'));
      center.append(el('p', 'poly-onam-script', 'Happy'), title, el('p', 'poly-onam-malayalam', 'ഓണാശംസകൾ'), el('p', 'poly-onam-copy', 'May this Onam bring joy, prosperity, happiness and success to every student.'));
      const dots = el('div', 'poly-onam-dots');
      for (let i = 0; i < 4; i += 1) dots.append(el('span'));
      center.append(dots);

      const right = el('div', 'poly-onam-hero-right');
      const boat = el('div', 'poly-onam-boat-scene');
      boat.append(el('span', 'poly-onam-palm', '🌴'), el('span', 'poly-onam-boat-emoji', '🛶'), el('span', 'poly-onam-rowers', '⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪'), el('span', 'poly-onam-flag', '🚩'));
      right.append(boat);
      scene.append(el('button', 'poly-onam-hero-arrow poly-onam-hero-arrow--left', '‹'), left, center, right, el('button', 'poly-onam-hero-arrow poly-onam-hero-arrow--right', '›'));
      host.prepend(scene);

      const browser = document.querySelector('#subject-browser');
      if (browser && host.nextElementSibling !== browser) host.after(browser);
    }
  }

  function boot() {
    const day = activeDay();
    if (!day) return;
    setTimeout(() => build(day), 250);
    setTimeout(() => build(day), 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
