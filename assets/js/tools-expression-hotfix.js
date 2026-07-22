/* Purpose: Tools expression hotfix - Descriptive comment added for clarity */
(() => {
  'use strict';
  const src = '/assets/js/tools-scientific-full.js?v=20260701-sci-full1';
  if ([...document.scripts].some(script => (script.src || '').includes('/assets/js/tools-scientific-full.js'))) return;
  const script = document.createElement('script');
  script.src = src;
  script.defer = false;
  document.head.appendChild(script);
})();
