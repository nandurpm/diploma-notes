import { chromium } from "playwright";
import fs from "node:fs/promises";

const BASE = process.env.AUDIT_BASE || "https://polypmna.dpdns.org";
const viewports = [
  { name: "mobile-375", width: 375, height: 812, isMobile: true },
  { name: "mobile-390", width: 390, height: 844, isMobile: true },
  { name: "tablet-768", width: 768, height: 1024, isMobile: false },
  { name: "desktop-1280", width: 1280, height: 900, isMobile: false },
];
const pages = [
  { name: "home", path: "/?audit=full-site-20260822" },
  { name: "about", path: "/about.html?audit=full-site-20260822" },
  { name: "contact", path: "/contact.html?audit=full-site-20260822" },
  { name: "revision-2026", path: "/revision-2026.html?audit=full-site-20260822" },
  { name: "revision-2021", path: "/revision-2021.html?audit=full-site-20260822" },
  { name: "model-question-papers", path: "/model-question-papers.html?audit=full-site-20260822" },
  { name: "daily-quiz", path: "/daily-quiz.html?audit=full-site-20260822" },
  { name: "ask-poly", path: "/ask-poly.html?audit=full-site-20260822" },
  { name: "tools", path: "/tools.html?audit=full-site-20260822" },
  { name: "tools-catalog", path: "/tools-catalog.html?audit=full-site-20260822" },
  { name: "materials-2015", path: "/materials-2015.html?audit=full-site-20260822" },
  { name: "study-materials", path: "/study-materials.html?audit=full-site-20260822" },
  { name: "syllabus", path: "/syllabus.html?audit=full-site-20260822" },
  { name: "previous-question-papers", path: "/previous-question-papers.html?audit=full-site-20260822" },
  { name: "privacy", path: "/privacy.html?audit=full-site-20260822" },
  { name: "terms", path: "/terms.html?audit=full-site-20260822" },
  { name: "disclaimer", path: "/disclaimer.html?audit=full-site-20260822" },
  { name: "revision-2026-architecture", path: "/revision-2026/architecture.html?audit=full-site-20260822" },
  { name: "revision-2021-architecture", path: "/revision-2021/architecture.html?audit=full-site-20260822" },
];
const selectedPageNames = process.env.AUDIT_PAGES ? new Set(process.env.AUDIT_PAGES.split(",").map((name) => name.trim()).filter(Boolean)) : null;
const pagesToAudit = selectedPageNames ? pages.filter((page) => selectedPageNames.has(page.name)) : pages;

function visible(rect) {
  return rect.width > 0 && rect.height > 0 && rect.visibility !== "hidden" && rect.display !== "none" && Number(rect.opacity) > 0;
}

function intersects(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

async function waitForPage(page) {
  await page.waitForLoadState("load").catch(() => {});
  await page.waitForTimeout(900);
}

async function inspect(page, pageInfo, viewport) {
  const errors = [];
  const onPageError = (error) => errors.push(`pageerror: ${error.message}`);
  page.on("pageerror", onPageError);
  await page.goto(`${BASE}${pageInfo.path}`, { waitUntil: "commit", timeout: 60000 });
  await waitForPage(page);

  const snapshot = await page.evaluate(() => {
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height, display: s.display, visibility: s.visibility, opacity: s.opacity };
    };
    const accessibleName = (el) => {
      const labelledBy = el.getAttribute("aria-labelledby");
      const labelledText = labelledBy ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ") : "";
      const explicitLabel = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent || "" : "";
      const wrappingLabel = el.closest("label")?.textContent || "";
      return (el.getAttribute("aria-label") || labelledText || explicitLabel || wrappingLabel || el.getAttribute("title") || el.getAttribute("placeholder") || el.textContent || "").replace(/\s+/g, " ").trim();
    };
    const interactive = [...document.querySelectorAll("a[href], button, input, select, textarea, [role=button]")].map((el) => ({
      tag: el.tagName.toLowerCase(),
      name: accessibleName(el),
      href: el.getAttribute("href") || "",
      rect: rect(el),
      disabled: el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true",
    }));
    const visibleInteractive = interactive.filter((item) => !item.disabled && item.rect.width > 0 && item.rect.height > 0 && item.rect.visibility !== "hidden" && item.rect.display !== "none" && Number(item.rect.opacity) > 0);
    const duplicateIds = [...document.querySelectorAll("[id]")].map((el) => el.id).filter((id, index, ids) => ids.indexOf(id) !== index);
    const formControls = [...document.querySelectorAll("input, select, textarea")].map((el) => ({
      tag: el.tagName.toLowerCase(),
      id: el.id,
      name: accessibleName(el),
      labelled: Boolean(el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest("label")),
    }));
    const images = [...document.images].map((img) => ({ src: img.currentSrc || img.src, alt: img.getAttribute("alt"), decorative: img.getAttribute("aria-hidden") === "true" }));
    const focusables = [...document.querySelectorAll("[tabindex]")].map((el) => Number(el.getAttribute("tabindex"))).filter((value) => Number.isFinite(value));
    const isVisible = (item) => item.rect.width > 0 && item.rect.height > 0 && item.rect.visibility !== "hidden" && item.rect.display !== "none" && Number(item.rect.opacity) > 0;
    const intersectsRects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const actionBoxes = [...document.querySelectorAll(".subject-card .action-row > *, .btn, .btn-primary-gradient, .btn-outline-glow, .btn-cta-primary, .btn-cta-secondary, .btn-initiative-social")].map((el) => ({ name: accessibleName(el), rect: rect(el) })).filter(isVisible);
    const actionOverlaps = [];
    for (let i = 0; i < actionBoxes.length; i += 1) for (let j = i + 1; j < actionBoxes.length; j += 1) if (intersectsRects(actionBoxes[i].rect, actionBoxes[j].rect)) actionOverlaps.push({ first: actionBoxes[i].name, second: actionBoxes[j].name });
    return {
      title: document.title,
      url: location.href,
      lang: document.documentElement.getAttribute("lang") || "",
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body?.scrollWidth || 0,
      hasViewportMeta: Boolean(document.querySelector('meta[name="viewport"]')),
      h1Count: document.querySelectorAll("h1").length,
      mainCount: document.querySelectorAll("main").length,
      navCount: document.querySelectorAll("nav").length,
      hasSkipLink: Boolean(document.querySelector(".skip-link, a[href^=\"#main\"]")),
      missingImageAlt: images.filter((item) => !item.decorative && item.alt === null).slice(0, 20),
      unnamedInteractive: visibleInteractive.filter((item) => !item.name).slice(0, 20),
      unlabeledFormControls: formControls.filter((item) => !item.labelled).slice(0, 20),
      duplicateIds: [...new Set(duplicateIds)].slice(0, 20),
      positiveTabindexes: focusables.filter((value) => value > 0),
      smallTouchTargets: visibleInteractive.filter((item) => item.rect.width < 40 || item.rect.height < 40).slice(0, 30),
      actionOverlaps: actionOverlaps.slice(0, 20),
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      visibleInteractiveCount: visibleInteractive.length,
    };
  });

  const checks = [
    { check: "document-title", passed: Boolean(snapshot.title.trim()) },
    { check: "document-language", passed: Boolean(snapshot.lang) },
    { check: "viewport-meta", passed: snapshot.hasViewportMeta },
    { check: "single-h1", passed: snapshot.h1Count === 1, count: snapshot.h1Count },
    { check: "main-landmark", passed: snapshot.mainCount >= 1, count: snapshot.mainCount },
    { check: "skip-link", passed: snapshot.hasSkipLink },
    { check: "all-content-images-have-alt", passed: snapshot.missingImageAlt.length === 0, issues: snapshot.missingImageAlt },
    { check: "interactive-controls-have-accessible-names", passed: snapshot.unnamedInteractive.length === 0, issues: snapshot.unnamedInteractive },
    { check: "form-controls-labelled", passed: snapshot.unlabeledFormControls.length === 0, issues: snapshot.unlabeledFormControls },
    { check: "no-duplicate-ids", passed: snapshot.duplicateIds.length === 0, issues: snapshot.duplicateIds },
    { check: "no-positive-tabindex", passed: snapshot.positiveTabindexes.length === 0, issues: snapshot.positiveTabindexes },
    { check: "no-mobile-horizontal-overflow", passed: snapshot.horizontalOverflow <= 2, overflowPx: snapshot.horizontalOverflow },
    { check: "action-controls-do-not-overlap", passed: snapshot.actionOverlaps.length === 0, issues: snapshot.actionOverlaps },
  ];
  page.off("pageerror", onPageError);
  return { page: pageInfo.name, path: pageInfo.path, viewport, finalUrl: page.url(), snapshot, checks, pageErrors: errors };
}

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of viewports) {
    for (const pageInfo of pagesToAudit) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1, isMobile: viewport.isMobile });
      const page = await context.newPage();
      results.push(await inspect(page, pageInfo, viewport));
      await page.close();
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const summary = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  viewports,
  pages: pagesToAudit,
  resultCount: results.length,
  passed: results.every((result) => result.checks.every((check) => check.passed) && result.pageErrors.length === 0),
  results,
};
await fs.writeFile("reports/full-site-mobile-accessibility-audit-2026-08-22.json", `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ generatedAt: summary.generatedAt, resultCount: summary.resultCount, passed: summary.passed, failedChecks: results.flatMap((result) => result.checks.filter((check) => !check.passed).map((check) => ({ page: result.page, viewport: result.viewport.name, ...check }))).slice(0, 80) }, null, 2));
if (!summary.passed) process.exitCode = 1;
