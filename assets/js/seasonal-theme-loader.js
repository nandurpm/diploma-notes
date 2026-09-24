/* Load seasonal controllers only while their IST calendar window is active. */
(() => {
  const loaded = new Set();
  function refresh() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    const date = `${parts.year}-${parts.month}-${parts.day}`;
    const names = [];
    if (parts.month === '08' && parts.day === '15') names.push('independence-day-theme');
    if (parts.day === '10') names.push('learning-sprint-theme');
    if (date >= '2026-08-19' && date <= '2026-08-28') names.push('pre-onam-theme');
    if ((parts.month === '12' && parts.day >= '28') || (parts.month === '01' && parts.day <= '03')) names.push('new-year-theme');
    for (const name of names) {
      if (loaded.has(name) || document.querySelector(`script[src*="/${name}.js"]`)) continue;
      loaded.add(name);
      const script = document.createElement('script');
      script.src = `/assets/js/${name}.js?v=20260924`;
      script.onerror = () => loaded.delete(name);
      document.head.append(script);
    }
  }
  refresh();
  setInterval(refresh, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
