#!/usr/bin/env node
/* Audit public sitemap pages in Chromium and record JavaScript runtime errors. */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = process.env.BASE_DIR || path.resolve(__dirname, '..');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8000';
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
const reportJson = path.join(root, 'reports', 'site-integrity-audit.json');
const reportMd = path.join(root, 'reports', 'site-integrity-audit.md');

function localUrl(publicUrl) {
  const parsed = new URL(publicUrl);
  return `${baseUrl}${parsed.pathname || '/'}${parsed.search || ''}`;
}

function isNetworkNoise(message) {
  return /Failed to load resource|net::ERR_|CORS policy|Content Security Policy|favicon\.ico/i.test(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  const results = [];
  for (const publicUrl of urls) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error' && !isNetworkNoise(message.text())) {
        errors.push(`console: ${message.text()}`);
      }
    });

    try {
      const response = await page.goto(localUrl(publicUrl), {
        waitUntil: 'domcontentloaded',
        timeout: 25000,
      });
      if (!response || !response.ok()) {
        errors.push(`navigation: HTTP ${response ? response.status() : 'no response'}`);
      }
      await page.waitForTimeout(900);
    } catch (error) {
      errors.push(`navigation: ${error.message}`);
    }

    results.push({ url: publicUrl, errors: [...new Set(errors)] });
    await page.close();
  }

  await context.close();
  await browser.close();

  const failing = results.filter((entry) => entry.errors.length > 0);
  const payload = JSON.parse(fs.readFileSync(reportJson, 'utf8'));
  payload.runtime_console_audit = {
    pages_checked: results.length,
    pages_with_errors: failing.length,
    pages: results,
  };
  fs.writeFileSync(reportJson, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  let markdown = fs.readFileSync(reportMd, 'utf8');
  markdown = markdown.replace(
    '- Runtime console audit: **Pending workflow browser check**',
    `- Runtime pages checked: **${results.length}**\n- Pages with JavaScript console/runtime errors: **${failing.length}**`,
  );
  markdown += '\n## Browser runtime result\n\n';
  if (failing.length === 0) {
    markdown += 'All sitemap pages loaded without application JavaScript console or page errors. Network-only third-party loading messages were ignored.\n';
  } else {
    for (const entry of failing) {
      markdown += `\n### ${entry.url}\n`;
      for (const error of entry.errors) markdown += `- ${error}\n`;
    }
  }
  fs.writeFileSync(reportMd, markdown, 'utf8');

  console.log(`Runtime pages checked: ${results.length}`);
  console.log(`Pages with runtime errors: ${failing.length}`);
  if (failing.length > 0) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
