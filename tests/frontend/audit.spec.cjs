const { test, expect } = require('@playwright/test');
const PDF_BASE = 'https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/';
// Stable external fixtures isolate frontend logic; publication and third-party
// uptime remain covered by the existing live PDF health workflows.
test.beforeEach(async ({page})=>{
  await page.route('https://**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(PDF_BASE+'manifests/')) return route.fulfill({json:{subjects:[{code:'1131',status:'published',pdfUrl:PDF_BASE+'notes/2026/1131/v1/1131.pdf'}]},headers:{'access-control-allow-origin':'*'}});
    return route.abort();
  });
});
test('calculators work under production CSP',async({page})=>{
  const response=await page.goto('/tools.html');
  const csp=response.headers()['content-security-policy'];
  expect(csp).toContain("script-src 'self'");
  expect(csp).not.toContain('unsafe-eval');
  await page.getByRole('button',{name:'Open Scientific Calculator',exact:true}).click();
  await page.getByLabel('Expression',{exact:true}).fill('sin(30)+sqrt(16)+2^3');
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('#res')).toHaveText('12.5');
  await page.getByLabel('Expression',{exact:true}).fill('1/0');
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('#res')).toContainText('not finite');
});
test('complete catalogue, shared labels, pagination and no horizontal overflow',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#subjectBrowserAnnouncer')).toContainText('Showing');
  await page.locator('#semesterFilter').selectOption('all');
  await page.locator('#subjectSearch').fill('1131');
  await expect(page.locator('#subjectGrid')).toContainText('Shared across');
  const card=page.locator('#subjectGrid .subject-card').first();
  await expect(card.locator('.action.download')).toHaveAttribute('href',PDF_BASE+'notes/2026/1131/v1/1131.pdf');
  await expect(card.locator('.action.download')).toHaveText('Download PDF');
  await page.locator('#revisionFilter').selectOption('2021');
  await page.locator('#departmentFilter').selectOption('all');
  await page.locator('#semesterFilter').selectOption('all');
  await page.locator('#subjectSearch').fill('3011');
  await expect(page.locator('#subjectGrid')).toContainText('3011');
  await expect(page.locator('#departmentFilter')).toContainText('Civil');
  await page.locator('#subjectSearch').fill('');
  await expect(page.locator('#subjectGrid .subject-card')).toHaveCount(36);
  await page.getByRole('button',{name:'Show more subjects'}).click();
  await expect(page.locator('#subjectGrid .subject-card')).toHaveCount(72);
  const overflow = await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,id:el.id,cls:el.className,right:el.getBoundingClientRect().right})).filter(el=>el.right>innerWidth+1).slice(0,10)}));
  expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width+1);
});
test('catalogue errors offer retry rather than partial data',async({page})=>{
  let failed=true;
  await page.route('**/assets/data/revision-2021-subjects.json*',route=>failed?route.fulfill({status:503,body:'unavailable'}):route.continue());
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('could not be loaded');
  failed=false;
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect(page.locator('#subjectBrowserAnnouncer')).toContainText('Showing');
});
test('PDF failures can be retried and do not mean unavailable',async({page})=>{
  let failed=true;
  await page.route(PDF_BASE+'manifests/**',route=>route.fulfill(failed?{status:503,body:'unavailable',headers:{'access-control-allow-origin':'*'}}:{json:{subjects:[{code:'1131',status:'published',pdfUrl:PDF_BASE+'notes/2026/1131/v1/1131.pdf'}]},headers:{'access-control-allow-origin':'*'}}));
  await page.goto('/?revision=2026&code=1131');
  const card=page.locator('#subjectGrid .subject-card').first();
  await expect(card.locator('.pdf-load-retry')).toBeVisible();
  failed=false;
  await card.locator('.pdf-load-retry').click();
  await expect(card.locator('.action.download')).toHaveText('Download PDF');
  await expect(card.locator('.pdf-load-retry')).toHaveCount(0);
});
test('static course-specific paper links survive enhancement',async({page})=>{
  await page.goto('/revision-2021/civil-engineering.html');
  const link=page.locator('.subject-card .action.qp[href*=".pdf"]').first();
  await expect(link).toBeVisible();
  const original=await link.getAttribute('href');
  await expect(page.locator('.subject-card[data-availability-validated]').first()).toBeVisible();
  await expect(link).toHaveAttribute('href',original);
});
test('updates are nonmodal and do not take keyboard focus',async({page})=>{
  await page.goto('/?showPopup=1');
  await page.locator('#subjectSearch').fill('study');
  await expect(page.locator('#polyVisitorPopup')).toBeAttached();
  await expect(page.locator('#subjectSearch')).toBeFocused();
  await expect(page.locator('#polyVisitorPopup')).not.toHaveAttribute('aria-modal','true');
  expect(await page.locator('#polyVisitorPopup').evaluate(el=>getComputedStyle(el).position)).toBe('relative');
});
