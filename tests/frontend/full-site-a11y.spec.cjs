const { test, expect } = require('@playwright/test');

const routes = [
  ['home', '/'],
  ['about', '/about.html'],
  ['revision-2026', '/revision-2026.html'],
  ['revision-2021', '/revision-2021.html'],
  ['mock-exams', '/daily-quiz.html'],
  ['ask-poly', '/ask-poly.html'],
  ['materials-2015', '/materials-2015.html'],
  ['tools', '/tools.html'],
  ['help', '/contact.html'],
  ['model-question-papers', '/model-question-papers.html'],
  ['study-materials', '/study-materials.html'],
  ['syllabus', '/syllabus.html'],
  ['previous-question-papers', '/previous-question-papers.html'],
  ['privacy', '/privacy.html'],
  ['terms', '/terms.html'],
  ['disclaimer', '/disclaimer.html'],
  ['revision-2026-architecture', '/revision-2026/architecture.html'],
  ['revision-2021-architecture', '/revision-2021/architecture.html'],
];

function message(name, value) {
  return `${name}: ${JSON.stringify(value)}`;
}

for (const [name, path] of routes) {
  test(`${name} keeps the responsive accessibility baseline`, async ({ page }) => {
    await page.route('https://**/*', route => route.abort());
    await page.goto(`${path}?audit=playwright-20260915`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);

    const result = await page.evaluate(() => {
      const visible = el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0;
      };
      const accessibleName = el => {
        const labelledBy = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
          .map(id => document.getElementById(id)?.textContent || '').join(' ');
        const explicit = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent || '' : '';
        const wrapped = el.closest('label')?.textContent || '';
        return (el.getAttribute('aria-label') || labelledBy || explicit || wrapped || el.getAttribute('title') || el.getAttribute('placeholder') || el.textContent || el.value || '').replace(/\s+/g, ' ').trim();
      };
      const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
      const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
      const formControls = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')]
        .filter(visible)
        .filter(el => !accessibleName(el));
      const missingAlt = [...document.images]
        .filter(visible)
        .filter(img => !img.hasAttribute('alt') && img.getAttribute('aria-hidden') !== 'true');
      const unnamedControls = [...document.querySelectorAll('button, [role="button"]')]
        .filter(visible)
        .filter(el => !accessibleName(el));
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
        .filter(visible)
        .map(el => ({ rank: Number(el.tagName.slice(1)), text: (el.textContent || '').trim().slice(0, 80) }));
      const headingJumps = [];
      for (let i = 1; i < headings.length; i += 1) {
        if (headings[i].rank > headings[i - 1].rank + 1) headingJumps.push([headings[i - 1], headings[i]]);
      }
      const positiveTabindex = [...document.querySelectorAll('[tabindex]')]
        .map(el => Number(el.getAttribute('tabindex')))
        .filter(value => Number.isFinite(value) && value > 0);
      const targetSelector = [
        '.menu-toggle', '.navlinks a', '.hero-actions a', '.btn', '.action',
        'button', '[role="button"]', 'input:not([type="hidden"])', 'select', 'textarea'
      ].join(',');
      const smallTargets = [...document.querySelectorAll(targetSelector)]
        .filter(visible)
        .map(el => ({ name: accessibleName(el).slice(0, 80), tag: el.tagName.toLowerCase(), width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) }))
        .filter(item => item.width < 44 || item.height < 44)
        .slice(0, 30);
      return {
        lang: document.documentElement.lang,
        hasViewport: Boolean(document.querySelector('meta[name="viewport"]')),
        h1Count: document.querySelectorAll('h1').length,
        hasMain: Boolean(document.querySelector('main')),
        hasSkipLink: Boolean(document.querySelector('.skip-link, a[href^="#main"]')),
        duplicateIds,
        formControls: formControls.map(el => ({ tag: el.tagName.toLowerCase(), id: el.id, name: el.getAttribute('name') || '' })),
        missingAlt: missingAlt.map(img => img.currentSrc || img.src),
        unnamedControls: unnamedControls.map(el => el.outerHTML.slice(0, 160)),
        headingJumps,
        positiveTabindex,
        overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        smallTargets,
        width: innerWidth,
      };
    });

    expect.soft(result.lang, message('language', result.lang)).not.toBe('');
    expect.soft(result.hasViewport, message('viewport', result)).toBe(true);
    expect.soft(result.h1Count, message('h1Count', result.h1Count)).toBe(1);
    expect.soft(result.hasMain, message('main', result)).toBe(true);
    expect.soft(result.hasSkipLink, message('skipLink', result)).toBe(true);
    expect.soft(result.duplicateIds, message('duplicateIds', result.duplicateIds)).toEqual([]);
    expect.soft(result.formControls, message('unlabelledFormControls', result.formControls)).toEqual([]);
    expect.soft(result.missingAlt, message('missingImageAlt', result.missingAlt)).toEqual([]);
    expect.soft(result.unnamedControls, message('unnamedControls', result.unnamedControls)).toEqual([]);
    expect.soft(result.headingJumps, message('headingJumps', result.headingJumps)).toEqual([]);
    expect.soft(result.positiveTabindex, message('positiveTabindex', result.positiveTabindex)).toEqual([]);
    expect.soft(result.overflow, message('horizontalOverflow', result)).toBeLessThanOrEqual(2);
    if (result.width <= 414) {
      expect.soft(result.smallTargets, message('touchTargetsUnder44px', result.smallTargets)).toEqual([]);
    }
  });
}

test('mobile navigation opens, closes and reports state', async ({ page }) => {
  test.skip((test.info().project.use.viewport?.width || 9999) > 414, 'mobile-only navigation test');
  await page.route('https://**/*', route => route.abort());
  await page.goto('/');
  const toggle = page.locator('.menu-toggle');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
