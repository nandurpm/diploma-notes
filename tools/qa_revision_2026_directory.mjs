import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:8000";
const PAGE_URL = `${BASE_URL}/revision-2026.html`;
const REPORT_PATH = path.resolve("reports/revision-2026-directory-qa.json");
const SCREENSHOT_DIR = process.env.QA_SCREENSHOT_DIR || "/tmp/revision-2026-directory-qa";

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const checks = [];
const failures = [];
const consoleErrors = [];
const consoleWarnings = [];
const screenshots = [];

function record(name, passed, details = {}) {
  const entry = { name, passed: Boolean(passed), ...details };
  checks.push(entry);
  if (!passed) failures.push(entry);
}

function fileEvidence(filePath, label, viewport) {
  const bytes = fs.readFileSync(filePath);
  return {
    label,
    fileName: path.basename(filePath),
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    viewport
  };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1
});
const page = await context.newPage();

page.on("console", message => {
  const item = {
    type: message.type(),
    text: message.text(),
    location: message.location()
  };
  if (message.type() === "error") consoleErrors.push(item);
  if (message.type() === "warning" || message.type() === "warn") consoleWarnings.push(item);
});
page.on("pageerror", error => {
  consoleErrors.push({ type: "pageerror", text: String(error), location: {} });
});

try {
  const response = await page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(900);

  record("page returns successfully", Boolean(response?.ok()), {
    status: response?.status() ?? null,
    url: page.url()
  });
  record("page identity is correct", (await page.title()) === "Revision 2026 Diploma Departments | POLY PMNA", {
    title: await page.title()
  });
  record("page has one primary heading", await page.locator("main h1").count() === 1, {
    h1Count: await page.locator("main h1").count()
  });
  record("directory stylesheet is loaded", await page.evaluate(() =>
    [...document.styleSheets].some(sheet => String(sheet.href || "").includes("revision-2026-directory.css"))
  ));
  record("department-only stylesheet is not loaded on directory", await page.evaluate(() =>
    ![...document.styleSheets].some(sheet => String(sheet.href || "").includes("department-semester-layout.css"))
  ));

  const cards = page.locator("[data-programme-card]");
  record("all 38 department cards render", await cards.count() === 38, {
    cardCount: await cards.count()
  });
  record("revision switch is present", await page.locator(".revision-directory-switch a").count() === 2);
  record("Revision 2026 switch is active", await page.locator(".revision-directory-switch a[aria-current='page']").getAttribute("href") === "/revision-2026.html");
  record("official source actions are present", await page.locator("#rev2026-model-qp-access a").count() === 2);

  const desktopMetrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    heroHeight: document.querySelector(".revision-directory-hero")?.getBoundingClientRect().height || 0
  }));
  record("desktop has no horizontal overflow", desktopMetrics.documentWidth <= desktopMetrics.viewportWidth + 1 && desktopMetrics.bodyWidth <= desktopMetrics.viewportWidth + 1, desktopMetrics);
  record("desktop hero is compact", desktopMetrics.heroHeight >= 190 && desktopMetrics.heroHeight <= 380, desktopMetrics);

  const firstRowCount = await cards.evaluateAll(elements => {
    if (!elements.length) return 0;
    const tops = elements.map(element => Math.round(element.getBoundingClientRect().top));
    const firstTop = Math.min(...tops);
    return tops.filter(top => Math.abs(top - firstTop) <= 2).length;
  });
  record("desktop uses a compact multi-column grid", firstRowCount >= 3, { firstRowCount });

  const search = page.locator("#programmeSearch");
  await search.fill("electrical");
  await page.waitForTimeout(180);
  const visibleElectrical = await cards.evaluateAll(elements => elements.filter(element => !element.hidden).length);
  const resultText = await page.locator("#programmeResultCount").textContent();
  record("department search filters correctly", visibleElectrical === 3, { visibleElectrical });
  record("search result count updates", String(resultText).trim() === "Showing 3 of 38 departments", { resultText: String(resultText).trim() });
  record("search query is preserved in URL", new URL(page.url()).searchParams.get("q") === "electrical", { url: page.url() });
  record("clear control appears for active search", await page.locator("#programmeSearchClear").isVisible());

  await page.locator("#programmeSearchClear").click();
  await page.waitForTimeout(120);
  const visibleAfterClear = await cards.evaluateAll(elements => elements.filter(element => !element.hidden).length);
  record("clear control restores all departments", visibleAfterClear === 38 && !new URL(page.url()).searchParams.has("q"), {
    visibleAfterClear,
    url: page.url()
  });

  await search.fill("no-such-department-xyz");
  await page.waitForTimeout(120);
  record("no-results state is visible", await page.locator("#programmeEmptyState").isVisible());
  await page.locator("#programmeEmptyClear").click();
  await page.waitForTimeout(120);
  record("no-results clear action restores directory", await cards.evaluateAll(elements => elements.filter(element => !element.hidden).length) === 38);

  const desktopScreenshot = path.join(SCREENSHOT_DIR, "revision-2026-directory-desktop.png");
  await page.screenshot({ path: desktopScreenshot, fullPage: true });
  screenshots.push(fileEvidence(desktopScreenshot, "desktop", { width: 1440, height: 1000 }));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(700);

  const mobileMetrics = await page.evaluate(() => {
    const firstCard = document.querySelector("[data-programme-card]");
    const rect = firstCard?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      firstCardLeft: rect?.left ?? null,
      firstCardRight: rect?.right ?? null,
      firstCardWidth: rect?.width ?? null
    };
  });
  record("mobile has no horizontal overflow", mobileMetrics.documentWidth <= mobileMetrics.viewportWidth + 1 && mobileMetrics.bodyWidth <= mobileMetrics.viewportWidth + 1, mobileMetrics);
  record("mobile card fits the viewport", mobileMetrics.firstCardLeft >= 0 && mobileMetrics.firstCardRight <= mobileMetrics.viewportWidth + 1, mobileMetrics);

  const mobileFirstRowCount = await cards.evaluateAll(elements => {
    if (!elements.length) return 0;
    const tops = elements.map(element => Math.round(element.getBoundingClientRect().top));
    const firstTop = Math.min(...tops);
    return tops.filter(top => Math.abs(top - firstTop) <= 2).length;
  });
  record("mobile grid uses one card per row", mobileFirstRowCount === 1, { mobileFirstRowCount });

  const menuButton = page.locator(".menu-toggle");
  record("mobile menu button is visible", await menuButton.isVisible());
  await menuButton.click();
  await page.waitForTimeout(100);
  record("mobile menu opens", await page.locator(".navlinks.open").isVisible());

  const mobileScreenshot = path.join(SCREENSHOT_DIR, "revision-2026-directory-mobile.png");
  await page.screenshot({ path: mobileScreenshot, fullPage: true });
  screenshots.push(fileEvidence(mobileScreenshot, "mobile", { width: 390, height: 844 }));

  record("no relevant console errors", consoleErrors.length === 0, { consoleErrors });
} catch (error) {
  record("QA script completed without an unhandled exception", false, { error: String(error?.stack || error) });
} finally {
  await browser.close();
}

const report = {
  page: "/revision-2026.html",
  targetFlow: "Revision 2026 directory loads → search filters departments → clear restores all results → mobile menu opens",
  status: failures.length ? "failed" : "success",
  sourceCommit: process.env.GITHUB_SHA || null,
  generatedAt: new Date().toISOString(),
  environment: {
    browser: "Playwright Chromium",
    browserPlugin: "not available; regular Playwright used",
    baseUrl: BASE_URL,
    viewports: [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 }
    ]
  },
  checks,
  failures,
  console: {
    errors: consoleErrors,
    warnings: consoleWarnings
  },
  screenshots
};

fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: report.status, checks: checks.length, failures: failures.length }, null, 2));
process.exit(failures.length ? 1 : 0);
