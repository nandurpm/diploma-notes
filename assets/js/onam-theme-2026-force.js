(() => {
  'use strict';
  const DATES=['2026-08-25','2026-08-26','2026-08-27','2026-08-28'];
  function ist(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).reduce((a,x)=>{if(x.type!=='literal')a[x.type]=x.value;return a;},{});return `${p.year}-${p.month}-${p.day}`;}
  function active(){const q=new URLSearchParams(location.search);const raw=String(q.get('onamTheme')||q.get('onam')||'').toLowerCase();if(raw==='random')return 1+Math.floor(Math.random()*4);const d=raw.match(/[1-4]/)?.[0];if(d)return Number(d);const i=DATES.indexOf(ist());return i>=0?i+1:0;}
  const day=active();if(!day)return;window.POLY_ONAM_DAY=day;
  ['onam-exact-a.css','onam-hero-layout.css'].forEach((f,i)=>{let l=document.getElementById('poly-onam-css-'+i);if(!l){l=document.createElement('link');l.id='poly-onam-css-'+i;l.rel='stylesheet';document.head.append(l);}l.href='/assets/css/'+f+'?v=20260703-exact';});
})();
