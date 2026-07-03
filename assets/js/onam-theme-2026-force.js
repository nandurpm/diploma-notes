(() => {
  'use strict';

  const VERSION = '20260703-onam5-reference';
  const DATES_2026 = ['2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28'];
  const DAY_NAMES = [
    ['Uthradam', 'ഉത്രാടം'],
    ['Thiruvonam', 'തിരുവോണം'],
    ['Avittam', 'അവിട്ടം'],
    ['Chathayam', 'ചതയം']
  ];

  function istDate() {
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).reduce((a, x) => { if (x.type !== 'literal') a[x.type] = x.value; return a; }, {});
    return `${p.year}-${p.month}-${p.day}`;
  }

  function activeDay() {
    const params = new URLSearchParams(location.search);
    const raw = String(params.get('onamTheme') || params.get('onam') || '').toLowerCase().trim();
    if (raw === 'random') return 1 + Math.floor(Math.random() * 4);
    const digit = raw.match(/[1-4]/)?.[0];
    if (digit) return Number(digit);
    const index = DATES_2026.indexOf(istDate());
    return index >= 0 ? index + 1 : 0;
  }

  function addStyle() {
    let style = document.getElementById('poly-onam-reference-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'poly-onam-reference-style';
      document.head.append(style);
    }
    style.textContent = `
      html.poly-onam-theme,body.poly-onam-theme{background:#fff8e8!important;overflow-x:hidden!important}
      body.poly-onam-theme:before{display:none!important}
      body.poly-onam-theme:after{content:''!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important;height:18px!important;z-index:9998!important;pointer-events:none!important;background:radial-gradient(circle at 9px 9px,#f97316 0 7px,transparent 8px),radial-gradient(circle at 27px 9px,#facc15 0 7px,transparent 8px),radial-gradient(circle at 45px 9px,#65a30d 0 7px,transparent 8px)!important;background-size:54px 18px!important}
      .poly-onam-bar{position:relative!important;z-index:100000!important;height:46px!important;min-height:46px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:12px!important;padding:0 18px!important;background:linear-gradient(90deg,#b77905,#facc15 25%,#fff1a8 50%,#facc15 75%,#b77905)!important;border:0!important;border-bottom:1px solid rgba(146,64,14,.25)!important;color:#111827!important;font-weight:900!important;font-size:16px!important;box-shadow:0 8px 24px rgba(120,74,0,.14)!important;white-space:nowrap!important;overflow:hidden!important}
      .poly-onam-bar:before,.poly-onam-bar:after{content:'🌿 🌼 🪔 🌼 🌿'!important;position:absolute!important;top:7px!important;font-size:18px!important;opacity:.95!important}.poly-onam-bar:before{left:14px!important}.poly-onam-bar:after{right:14px!important;transform:scaleX(-1)!important}.poly-onam-bar strong{font-weight:950!important}.poly-onam-bar__day{background:rgba(255,255,255,.55)!important;border:1px solid rgba(124,45,18,.16)!important;border-radius:999px!important;padding:4px 12px!important;color:#7c2d12!important;font-weight:900!important}.poly-onam-bar__flower{font-size:18px!important}.poly-onam-preview-tag{display:none!important}
      body.poly-onam-theme .topbar{background:rgba(255,255,255,.96)!important;border-bottom:1px solid rgba(216,155,24,.25)!important;box-shadow:0 12px 30px rgba(120,74,0,.08)!important}body.poly-onam-theme .topbar:before{content:''!important;position:absolute!important;left:0!important;right:0!important;top:-9px!important;height:14px!important;background:radial-gradient(circle at 9px 7px,#f97316 0 5px,transparent 6px),radial-gradient(circle at 25px 7px,#facc15 0 5px,transparent 6px)!important;background-size:34px 14px!important}body.poly-onam-theme .topbar:after{content:'🪔'!important;right:70px!important;bottom:7px!important;font-size:28px!important}.poly-onam-theme .navlinks a.active{background:#fff!important;color:#ea580c!important;border-color:#fed7aa!important;box-shadow:inset 0 -2px 0 #ea580c!important}
      .poly-onam-hero-host{position:relative!important;width:100vw!important;max-width:none!important;margin:0 0 16px calc(50% - 50vw)!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;overflow:hidden!important;min-height:342px!important}.poly-onam-home .poly-onam-hero-host>*:not(.poly-onam-reference-hero){display:none!important}
      .poly-onam-reference-hero{position:relative!important;width:100vw!important;max-width:none!important;min-width:100vw!important;height:342px!important;min-height:342px!important;margin:0!important;padding:0!important;display:grid!important;grid-template-columns:35% 30% 35%!important;align-items:center!important;overflow:hidden!important;background:linear-gradient(90deg,#fff1c4 0%,#fff8e7 43%,#eafcff 100%)!important;border-bottom:1px solid rgba(216,155,24,.24)!important;box-shadow:0 14px 34px rgba(120,74,0,.08)!important}.poly-onam-reference-hero:before{content:''!important;position:absolute!important;inset:0!important;background:radial-gradient(circle at 17% 65%,rgba(250,204,21,.28),transparent 260px),radial-gradient(circle at 78% 55%,rgba(14,165,233,.16),transparent 320px),linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,255,255,.05))!important}.poly-onam-reference-hero:after{content:'🌿  🌼  🌿  🪔  🌿  🌼  🌿'!important;position:absolute!important;left:24px!important;right:24px!important;top:18px!important;font-size:23px!important;letter-spacing:15px!important;opacity:.45!important;white-space:nowrap!important}
      .poly-onam-left,.poly-onam-center,.poly-onam-right{position:relative!important;z-index:2!important}.poly-onam-left{height:100%!important;display:flex!important;align-items:flex-end!important;justify-content:center!important}.poly-onam-center{text-align:center!important;align-self:center!important}.poly-onam-right{height:100%!important;display:flex!important;align-items:flex-end!important;justify-content:center!important}
      .poly-pookalam-scene{position:relative!important;width:min(470px,32vw)!important;height:290px!important;margin-bottom:10px!important}.poly-banana-leaf{position:absolute!important;left:32px!important;bottom:28px!important;width:245px!important;height:145px!important;border-radius:78% 12% 75% 12%!important;background:linear-gradient(135deg,#0f5a22,#7ac943)!important;transform:rotate(-18deg)!important;box-shadow:65px -10px 0 -22px #166534!important}.poly-pookalam{position:absolute!important;left:50%!important;bottom:36px!important;width:360px!important;max-width:100%!important;aspect-ratio:1!important;border-radius:50%!important;transform:translateX(-50%) scaleY(.33)!important;background:radial-gradient(circle,#7c2d12 0 7%,#fde047 8% 16%,#16a34a 17% 27%,#fff7ed 28% 39%,#dc2626 40% 51%,#f97316 52% 64%,#facc15 65% 78%,#fff7ed 79% 100%)!important;box-shadow:0 25px 38px rgba(120,74,0,.24),inset 0 0 0 12px rgba(255,255,255,.42)!important}.poly-pookalam:before{content:''!important;position:absolute!important;inset:9%!important;border-radius:50%!important;background:repeating-conic-gradient(from 0deg,#facc15 0 9deg,#fff7ed 10deg 18deg,#f97316 19deg 27deg,#16a34a 28deg 36deg)!important;opacity:.80!important}.poly-lamp{position:absolute!important;left:50%!important;top:20px!important;transform:translateX(-50%)!important;font-size:86px!important;filter:drop-shadow(0 12px 12px rgba(120,74,0,.24))!important}
      .poly-onam-script{font-family:cursive!important;font-size:48px!important;line-height:.75!important;margin:0!important;color:#e45b0b!important;font-weight:500!important}.poly-onam-title{font-family:'Space Grotesk','Inter',system-ui,sans-serif!important;margin:0!important;font-size:104px!important;line-height:.82!important;letter-spacing:-.08em!important;font-weight:900!important;color:transparent!important;background:linear-gradient(105deg,#e45b0b,#d89b18 45%,#3f7f16 78%)!important;-webkit-background-clip:text!important;background-clip:text!important;text-shadow:0 18px 26px rgba(120,74,0,.10)!important}.poly-onam-title span{color:#facc15!important;-webkit-text-fill-color:#facc15!important}.poly-onam-ml{margin:8px 0 8px!important;color:#3f7f16!important;font-size:32px!important;font-weight:950!important}.poly-onam-msg{max-width:460px!important;margin:0 auto!important;color:#4b2e14!important;font-size:15px!important;font-weight:650!important;line-height:1.45!important}.poly-onam-dots{display:flex!important;gap:9px!important;justify-content:center!important;margin-top:22px!important}.poly-onam-dots span{width:10px!important;height:10px!important;border-radius:50%!important;background:#facc15!important}.poly-onam-dots span:first-child{background:#657513!important}
      .poly-boat-scene{position:relative!important;width:min(590px,36vw)!important;height:255px!important;margin-bottom:8px!important;border-radius:28px!important;overflow:hidden!important;background:linear-gradient(180deg,rgba(254,243,199,.25),rgba(207,250,254,.80))!important}.poly-boat-scene:before{content:'🌴'!important;position:absolute!important;right:60px!important;top:4px!important;font-size:86px!important;opacity:.55!important}.poly-boat-scene:after{content:''!important;position:absolute!important;left:0!important;right:0!important;bottom:0!important;height:82px!important;background:linear-gradient(180deg,#e0f2fe,#bae6fd)!important}.poly-boat{position:absolute!important;left:50px!important;right:25px!important;bottom:44px!important;height:62px!important;background:#43200b!important;border-radius:4px 12px 88% 88%!important;transform:skewX(-13deg)!important;box-shadow:0 -8px 0 #d89b18,0 10px 0 #2b1407!important}.poly-boat:after{content:''!important;position:absolute!important;right:-28px!important;top:-55px!important;width:105px!important;height:110px!important;background:#43200b!important;clip-path:polygon(0 18%,100% 0,75% 100%,36% 62%)!important}.poly-rowers{position:absolute!important;left:115px!important;right:100px!important;bottom:115px!important;z-index:4!important;font-size:20px!important;letter-spacing:8px!important;color:#fff7ed!important;text-shadow:0 2px 0 #4a250f!important;white-space:nowrap!important}.poly-flag{position:absolute!important;left:98px!important;bottom:130px!important;font-size:32px!important;z-index:5!important}
      .poly-onam-corner{position:fixed!important;z-index:9997!important;pointer-events:none!important;width:170px!important;height:150px!important;font-size:34px!important;filter:drop-shadow(0 10px 14px rgba(120,74,0,.18))!important}.poly-onam-corner span{position:absolute!important}.poly-onam-corner span:nth-child(1){left:0!important;top:0!important;font-size:60px!important}.poly-onam-corner span:nth-child(2){left:55px!important;top:12px!important}.poly-onam-corner span:nth-child(3){left:22px!important;top:65px!important}.poly-onam-corner span:nth-child(4){left:92px!important;top:64px!important}.poly-onam-corner--tl{top:74px!important;left:0!important}.poly-onam-corner--tr{top:74px!important;right:0!important;transform:scaleX(-1)!important}.poly-onam-dancer{display:none!important}.poly-onam-petal{position:fixed!important;top:-30px!important;z-index:9996!important;pointer-events:none!important;animation:polyOnamFall linear forwards!important}@keyframes polyOnamFall{0%{transform:translate3d(0,-30px,0) rotate(0deg);opacity:0}12%{opacity:.85}100%{transform:translate3d(var(--x-end,40px),105vh,0) rotate(260deg);opacity:0}}
      .poly-onam-home #subject-browser{max-width:calc(100vw - 44px)!important;margin:14px auto 0!important;padding:0!important}.poly-onam-home #subject-browser .section-heading{display:none!important}.poly-onam-home .home-subject-filters{background:rgba(255,255,255,.88)!important;border:1px solid rgba(216,155,24,.18)!important;border-radius:16px!important;padding:14px!important;box-shadow:0 12px 34px rgba(120,74,0,.08)!important}.poly-onam-theme .subject-card{border-radius:18px!important;border-color:rgba(216,155,24,.28)!important;box-shadow:0 12px 28px rgba(120,74,0,.07)!important}.poly-onam-theme .subject-card:before{content:''!important;position:absolute!important;left:0!important;right:0!important;top:0!important;height:4px!important;background:linear-gradient(90deg,#2563eb,#0d9488,#facc15,#f97316)!important}
      @media(max-width:1000px){.poly-onam-reference-hero{grid-template-columns:1fr!important;height:auto!important;min-height:360px!important;padding:30px 12px!important}.poly-onam-left,.poly-onam-right{display:none!important}.poly-onam-title{font-size:74px!important}.poly-onam-script{font-size:38px!important}.poly-onam-ml{font-size:26px!important}.poly-onam-bar{font-size:13px!important;gap:8px!important}.poly-onam-bar__day{display:none!important}.poly-onam-bar:before,.poly-onam-bar:after{display:none!important}.poly-onam-corner{opacity:.55!important;width:100px!important}.poly-onam-corner--tr{display:none!important}}
    `;
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function removeOld() {
    document.querySelectorAll('.poly-onam-bar,.poly-onam-corner,.poly-onam-pookalam,.poly-onam-boat,.poly-onam-sadya-strip,.poly-onam-petal,.poly-onam-grand-hero,.poly-onam-reference-hero,.poly-onam-dancer').forEach((n) => n.remove());
  }

  function build(dayNo) {
    const day = DAY_NAMES[dayNo - 1] || DAY_NAMES[1];
    removeOld();
    addStyle();
    document.documentElement.classList.add('poly-onam-theme', `poly-onam-day-${dayNo}`);
    document.body.classList.add('poly-onam-theme', 'poly-onam-home', `poly-onam-day-${dayNo}`);
    document.body.dataset.onamDay = String(dayNo);

    const bar = el('aside', 'poly-onam-bar');
    bar.setAttribute('role', 'status');
    bar.append(el('span', 'poly-onam-bar__flower', '🌼'), el('strong', '', 'Happy Onam!'), el('span', '', 'Wishing you and your family a prosperous and joyful Onam.'), el('span', 'poly-onam-bar__day', `${day[0]} · ${day[1]}`), el('span', 'poly-onam-bar__flower', '🌼'));
    const skip = document.querySelector('.skip-link');
    if (skip) skip.after(bar); else document.body.prepend(bar);

    ['tl', 'tr'].forEach((pos) => {
      const c = el('div', `poly-onam-corner poly-onam-corner--${pos}`);
      ['🌿', '🌼', '🏵️', '🌸'].forEach((x) => c.append(el('span', '', x)));
      document.body.append(c);
    });

    const host = document.querySelector('.home-compact-hero');
    if (host) {
      host.classList.add('poly-onam-hero-host');
      const hero = el('section', 'poly-onam-reference-hero');
      const left = el('div', 'poly-onam-left');
      const pookalamScene = el('div', 'poly-pookalam-scene');
      const pookalam = el('div', 'poly-pookalam');
      pookalamScene.append(el('div', 'poly-banana-leaf'), pookalam, el('div', 'poly-lamp', '🪔'));
      left.append(pookalamScene);

      const center = el('div', 'poly-onam-center');
      const title = el('h1', 'poly-onam-title', 'Onam');
      title.append(el('span', '', '!'));
      const dots = el('div', 'poly-onam-dots');
      for (let i = 0; i < 4; i += 1) dots.append(el('span'));
      center.append(el('p', 'poly-onam-script', 'Happy'), title, el('p', 'poly-onam-ml', 'ഓണാശംസകൾ'), el('p', 'poly-onam-msg', 'May this Onam bring joy, prosperity and happiness to you and your family.'), dots);

      const right = el('div', 'poly-onam-right');
      const boatScene = el('div', 'poly-boat-scene');
      boatScene.append(el('div', 'poly-boat'), el('div', 'poly-rowers', '● ● ● ● ● ● ● ● ●'), el('div', 'poly-flag', '🚩'));
      right.append(boatScene);

      hero.append(left, center, right);
      host.prepend(hero);
      const browser = document.querySelector('#subject-browser');
      if (browser && host.nextElementSibling !== browser) host.after(browser);
    }

    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && innerWidth > 700) {
      for (let i = 0; i < 18; i += 1) {
        setTimeout(() => {
          const p = el('span', 'poly-onam-petal', Math.random() > .5 ? '🌼' : '🌸');
          p.style.left = `${Math.random() * 100}vw`;
          p.style.setProperty('--x-end', `${Math.round((Math.random() - .5) * 130)}px`);
          p.style.animationDuration = `${8 + Math.random() * 8}s`;
          p.style.fontSize = `${14 + Math.random() * 10}px`;
          document.body.append(p);
          setTimeout(() => p.remove(), 17000);
        }, i * 500);
      }
    }
  }

  function boot() {
    const day = activeDay();
    if (!day) return;
    setTimeout(() => build(day), 100);
    setTimeout(() => build(day), 900);
    setTimeout(() => build(day), 2200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
