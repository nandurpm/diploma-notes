(() => {
  'use strict';

  const VERSION = '20260703-reference-exact';
  const DATES = ['2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28'];
  const DAYS = [
    ['Uthradam', 'ഉത്രാടം'],
    ['Thiruvonam', 'തിരുവോണം'],
    ['Avittam', 'അവിട്ടം'],
    ['Chathayam', 'ചതയം']
  ];

  function istDate() {
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date()).reduce((a, x) => {
      if (x.type !== 'literal') a[x.type] = x.value;
      return a;
    }, {});
    return `${p.year}-${p.month}-${p.day}`;
  }

  function activeDay() {
    const params = new URLSearchParams(location.search);
    const raw = String(params.get('onamTheme') || params.get('onam') || '').trim().toLowerCase();
    if (raw === 'random') return 1 + Math.floor(Math.random() * 4);
    const digit = raw.match(/[1-4]/)?.[0];
    if (digit) return Number(digit);
    const index = DATES.indexOf(istDate());
    return index >= 0 ? index + 1 : 0;
  }

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function removeOldOnam() {
    document.querySelectorAll('.poly-onam-bar,.poly-onam-grand-hero,.poly-onam-reference-hero,.poly-onam-corner,.poly-onam-dancer,.poly-onam-sadya-strip,.poly-onam-petal,.poly-onam-special-card').forEach((n) => n.remove());
  }

  function addStyle() {
    let style = document.getElementById('poly-onam-reference-css');
    if (!style) {
      style = document.createElement('style');
      style.id = 'poly-onam-reference-css';
      document.head.append(style);
    }
    style.textContent = `
      html.poly-onam-theme,body.poly-onam-theme{background:#fff8e8!important;overflow-x:hidden!important;color:#111827!important}body.poly-onam-theme:before{display:none!important}body.poly-onam-theme:after{content:''!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important;height:20px!important;z-index:9990!important;pointer-events:none!important;background:radial-gradient(circle at 10px 10px,#f97316 0 7px,transparent 8px),radial-gradient(circle at 28px 10px,#facc15 0 7px,transparent 8px),radial-gradient(circle at 46px 10px,#65a30d 0 7px,transparent 8px)!important;background-size:54px 20px!important}.poly-onam-bar{position:relative!important;z-index:100000!important;height:48px!important;min-height:48px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:12px!important;background:linear-gradient(90deg,#a16207,#facc15 22%,#fff2aa 50%,#facc15 78%,#a16207)!important;color:#111!important;font-size:16px!important;font-weight:900!important;border:0!important;border-bottom:1px solid rgba(120,74,0,.22)!important;box-shadow:0 8px 20px rgba(120,74,0,.14)!important;overflow:hidden!important;white-space:nowrap!important}.poly-onam-bar:before,.poly-onam-bar:after{content:'🌿 🌼 🪔 🌼 🌿'!important;position:absolute!important;top:8px!important;font-size:18px!important}.poly-onam-bar:before{left:16px!important}.poly-onam-bar:after{right:16px!important;transform:scaleX(-1)!important}.poly-onam-bar__day{background:rgba(255,255,255,.55)!important;border-radius:999px!important;padding:4px 12px!important;color:#7c2d12!important;font-weight:900!important}.poly-onam-theme .topbar{background:rgba(255,255,255,.97)!important;border-bottom:1px solid rgba(216,155,24,.24)!important;box-shadow:0 10px 24px rgba(120,74,0,.09)!important}.poly-onam-theme .topbar:before{content:''!important;position:absolute!important;left:0!important;right:0!important;top:-9px!important;height:14px!important;background:radial-gradient(circle at 9px 7px,#f97316 0 5px,transparent 6px),radial-gradient(circle at 25px 7px,#facc15 0 5px,transparent 6px)!important;background-size:34px 14px!important}.poly-onam-theme .topbar:after{content:'🪔'!important;position:absolute!important;right:70px!important;bottom:8px!important;font-size:28px!important}.poly-onam-theme .navlinks a.active{background:#fff!important;color:#ea580c!important;box-shadow:inset 0 -2px 0 #ea580c!important}.poly-onam-hero-host{position:relative!important;width:100vw!important;max-width:none!important;margin:0 0 16px calc(50% - 50vw)!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;min-height:345px!important;overflow:hidden!important}.poly-onam-home .poly-onam-hero-host>*:not(.poly-onam-reference-hero){display:none!important}.poly-onam-reference-hero{position:relative!important;width:100vw!important;height:345px!important;min-height:345px!important;display:grid!important;grid-template-columns:35% 30% 35%!important;align-items:center!important;margin:0!important;padding:0!important;overflow:hidden!important;background:linear-gradient(90deg,#fff1c3 0%,#fff8e8 42%,#e9fbff 100%)!important;border-bottom:1px solid rgba(216,155,24,.24)!important;box-shadow:0 14px 30px rgba(120,74,0,.08)!important}.poly-onam-reference-hero:before{content:''!important;position:absolute!important;inset:0!important;background:radial-gradient(circle at 15% 68%,rgba(250,204,21,.30),transparent 280px),radial-gradient(circle at 80% 58%,rgba(14,165,233,.18),transparent 330px),linear-gradient(180deg,rgba(255,255,255,.32),rgba(255,255,255,.04))!important}.poly-onam-reference-hero:after{content:'🌿  🌼  🌿  🪔  🌿  🌼  🌿'!important;position:absolute!important;left:28px!important;right:28px!important;top:18px!important;font-size:23px!important;letter-spacing:14px!important;opacity:.42!important;white-space:nowrap!important}.poly-onam-left,.poly-onam-center,.poly-onam-right{position:relative!important;z-index:2!important}.poly-onam-left,.poly-onam-right{height:100%!important;display:flex!important;align-items:flex-end!important;justify-content:center!important}.poly-onam-center{text-align:center!important}.poly-pookalam-scene{position:relative!important;width:min(500px,33vw)!important;height:300px!important;margin-bottom:8px!important}.poly-banana-leaf{position:absolute!important;left:34px!important;bottom:28px!important;width:260px!important;height:150px!important;border-radius:78% 12% 75% 12%!important;background:linear-gradient(135deg,#0f5a22,#84cc16)!important;transform:rotate(-18deg)!important;box-shadow:66px -10px 0 -24px #166534!important}.poly-pookalam{position:absolute!important;left:50%!important;bottom:38px!important;width:380px!important;max-width:100%!important;aspect-ratio:1!important;border-radius:50%!important;transform:translateX(-50%) scaleY(.33)!important;background:radial-gradient(circle,#7c2d12 0 7%,#fde047 8% 16%,#16a34a 17% 27%,#fff7ed 28% 39%,#dc2626 40% 51%,#f97316 52% 64%,#facc15 65% 78%,#fff7ed 79% 100%)!important;box-shadow:0 25px 38px rgba(120,74,0,.24),inset 0 0 0 12px rgba(255,255,255,.42)!important}.poly-pookalam:before{content:''!important;position:absolute!important;inset:9%!important;border-radius:50%!important;background:repeating-conic-gradient(from 0deg,#facc15 0 9deg,#fff7ed 10deg 18deg,#f97316 19deg 27deg,#16a34a 28deg 36deg)!important;opacity:.82!important}.poly-lamp{position:absolute!important;left:50%!important;top:14px!important;transform:translateX(-50%)!important;font-size:88px!important;filter:drop-shadow(0 12px 12px rgba(120,74,0,.25))!important}.poly-onam-script{font-family:cursive!important;font-size:50px!important;line-height:.75!important;margin:0!important;color:#e45b0b!important;font-weight:500!important}.poly-onam-title{font-family:'Space Grotesk','Inter',system-ui,sans-serif!important;margin:0!important;font-size:108px!important;line-height:.82!important;letter-spacing:-.08em!important;font-weight:900!important;color:transparent!important;background:linear-gradient(105deg,#e45b0b,#d89b18 45%,#3f7f16 78%)!important;-webkit-background-clip:text!important;background-clip:text!important;text-shadow:0 18px 26px rgba(120,74,0,.10)!important}.poly-onam-title span{color:#facc15!important;-webkit-text-fill-color:#facc15!important}.poly-onam-ml{margin:8px 0!important;color:#3f7f16!important;font-size:32px!important;font-weight:950!important}.poly-onam-msg{max-width:470px!important;margin:0 auto!important;color:#4b2e14!important;font-size:15px!important;font-weight:650!important;line-height:1.45!important}.poly-onam-dots{display:flex!important;gap:9px!important;justify-content:center!important;margin-top:22px!important}.poly-onam-dots span{width:10px!important;height:10px!important;border-radius:50%!important;background:#facc15!important}.poly-onam-dots span:first-child{background:#657513!important}.poly-boat-scene{position:relative!important;width:min(610px,37vw)!important;height:265px!important;margin-bottom:8px!important;border-radius:28px!important;overflow:hidden!important;background:linear-gradient(180deg,rgba(254,243,199,.20),rgba(207,250,254,.80))!important}.poly-boat-scene:before{content:'🌴'!important;position:absolute!important;right:62px!important;top:2px!important;font-size:90px!important;opacity:.55!important}.poly-boat-scene:after{content:''!important;position:absolute!important;left:0!important;right:0!important;bottom:0!important;height:84px!important;background:linear-gradient(180deg,#e0f2fe,#bae6fd)!important}.poly-boat{position:absolute!important;left:45px!important;right:28px!important;bottom:45px!important;height:64px!important;background:#43200b!important;border-radius:4px 12px 88% 88%!important;transform:skewX(-13deg)!important;box-shadow:0 -8px 0 #d89b18,0 10px 0 #2b1407!important}.poly-boat:after{content:''!important;position:absolute!important;right:-32px!important;top:-58px!important;width:115px!important;height:116px!important;background:#43200b!important;clip-path:polygon(0 18%,100% 0,75% 100%,36% 62%)!important}.poly-rowers{position:absolute!important;left:112px!important;right:96px!important;bottom:118px!important;z-index:4!important;font-size:20px!important;letter-spacing:8px!important;color:#fff7ed!important;text-shadow:0 2px 0 #4a250f!important;white-space:nowrap!important}.poly-flag{position:absolute!important;left:94px!important;bottom:134px!important;font-size:32px!important;z-index:5!important}.poly-onam-corner{position:fixed!important;z-index:9997!important;pointer-events:none!important;width:172px!important;height:155px!important;font-size:34px!important;filter:drop-shadow(0 10px 14px rgba(120,74,0,.18))!important}.poly-onam-corner span{position:absolute!important}.poly-onam-corner span:nth-child(1){left:0!important;top:0!important;font-size:60px!important}.poly-onam-corner span:nth-child(2){left:55px!important;top:12px!important}.poly-onam-corner span:nth-child(3){left:22px!important;top:65px!important}.poly-onam-corner span:nth-child(4){left:92px!important;top:64px!important}.poly-onam-corner--tl{top:78px!important;left:0!important}.poly-onam-corner--tr{top:78px!important;right:0!important;transform:scaleX(-1)!important}.poly-onam-dancer{display:none!important}.poly-onam-home #subject-browser{max-width:calc(100vw - 44px)!important;margin:14px auto 0!important;padding:0!important}.poly-onam-home #subject-browser .section-heading{display:none!important}.poly-onam-home .home-subject-filters{background:rgba(255,255,255,.9)!important;border:1px solid rgba(216,155,24,.18)!important;border-radius:16px!important;padding:14px!important;box-shadow:0 12px 34px rgba(120,74,0,.08)!important}.poly-onam-theme .subject-card{border-radius:18px!important;border-color:rgba(216,155,24,.28)!important;box-shadow:0 12px 28px rgba(120,74,0,.07)!important}.poly-onam-theme .subject-card:before{content:''!important;position:absolute!important;left:0!important;right:0!important;top:0!important;height:4px!important;background:linear-gradient(90deg,#2563eb,#0d9488,#facc15,#f97316)!important}@media(max-width:1000px){.poly-onam-reference-hero{grid-template-columns:1fr!important;height:auto!important;min-height:360px!important;padding:30px 12px!important}.poly-onam-left,.poly-onam-right{display:none!important}.poly-onam-title{font-size:76px!important}.poly-onam-script{font-size:38px!important}.poly-onam-ml{font-size:26px!important}.poly-onam-bar{font-size:13px!important;gap:8px!important}.poly-onam-bar__day{display:none!important}.poly-onam-bar:before,.poly-onam-bar:after{display:none!important}.poly-onam-corner{opacity:.55!important;width:100px!important}.poly-onam-corner--tr{display:none!important}}
    `;
  }

  function build(dayNo) {
    const day = DAYS[dayNo - 1] || DAYS[1];
    removeOldOnam();
    addStyle();
    document.documentElement.classList.add('poly-onam-theme', `poly-onam-day-${dayNo}`);
    document.body.classList.add('poly-onam-theme', 'poly-onam-home', `poly-onam-day-${dayNo}`);

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
    if (!host) return;
    host.classList.add('poly-onam-hero-host');

    const hero = el('section', 'poly-onam-reference-hero');
    const left = el('div', 'poly-onam-left');
    const pookalamScene = el('div', 'poly-pookalam-scene');
    pookalamScene.append(el('div', 'poly-banana-leaf'), el('div', 'poly-pookalam'), el('div', 'poly-lamp', '🪔'));
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

  function boot() {
    const day = activeDay();
    if (!day) return;
    build(day);
    setTimeout(() => build(day), 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
