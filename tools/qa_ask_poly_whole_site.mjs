import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:8000";
const OUT_DIR = process.env.QA_SCREENSHOT_DIR || "/tmp/ask-poly-whole-site-qa";
const REPORT_PATH = "reports/ask-poly-whole-site-qa.json";
const PROMPT = "Where can I find Revision 2026 Electrical & Electronics Engineering subject 1008 and what resources are available?";

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });

const checks = [];
const consoleErrors = [];
let capturedRequest = null;

function check(name, passed, details = {}) {
  checks.push({ name, passed: Boolean(passed), ...details });
  if (!passed) throw new Error(`${name} failed`);
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push({ text: message.text(), location: message.location() });
  });
  page.on("pageerror", (error) => consoleErrors.push({ text: error.message, location: {} }));

  await page.route("https://ask-poly-ai.nandakumarkdpm.workers.dev/api/ask-poly", async (route) => {
    capturedRequest = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        answer: "QA grounded answer: Revision 2026 subject 1008 was found in the current POLY PMNA website index.",
        provider: "qa-stub",
        model: "qa-grounding"
      })
    });
  });
  await page.route(/https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\/.*/, (route) => route.fulfill({ status: 204, body: "" }));

  const response = await page.goto(`${BASE_URL}/ask-poly.html`, { waitUntil: "networkidle", timeout: 60000 });
  check("Ask POLY page returns successfully", response?.status() === 200, { status: response?.status() });
  check("page title identifies Ask POLY", (await page.title()) === "Ask POLY AI | POLY PMNA", { title: await page.title() });
  check("Revision 2026 navigation exists", await page.locator('.navlinks a[href="/revision-2026.html"]').count() === 1);

  await page.waitForFunction(() => Boolean(window.AskPolyKnowledge?.getStatus), null, { timeout: 30000 });
  const status = await page.evaluate(() => window.AskPolyKnowledge.getStatus());
  check("whole-site knowledge loads", status?.ok === true, { status });
  check("knowledge contains 38 Revision 2026 programmes", status?.counts?.programmes2026 === 38, { counts: status?.counts });
  check("knowledge contains both curriculum datasets", status?.counts?.subjectRecords >= 300, { counts: status?.counts });

  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  check("desktop has no horizontal overflow", dimensions.document <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1, dimensions);

  await page.locator("#chatInput").fill(PROMPT);
  await page.locator("#sendBtn").click();
  await page.getByText("QA grounded answer:", { exact: false }).waitFor({ timeout: 30000 });

  check("AI request was sent", Boolean(capturedRequest));
  check("user question stays separate from context", capturedRequest?.message === PROMPT, { message: capturedRequest?.message });
  check("generated website context is attached", String(capturedRequest?.pageContext || "").includes("POLY PMNA WHOLE-SITE KNOWLEDGE"));
  check("Revision 2026 subject match is attached", /REV2026\s+1008/.test(String(capturedRequest?.pageContext || "")));
  check("Revision 2026 department link is attached", String(capturedRequest?.pageContext || "").includes("/revision-2026/"));
  check("current user message is not duplicated in history", !(capturedRequest?.history || []).some((item) => item?.content === PROMPT));

  await page.screenshot({ path: path.join(OUT_DIR, "ask-poly-whole-site-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
  const mobileDimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  check("mobile has no horizontal overflow", mobileDimensions.document <= mobileDimensions.viewport + 1 && mobileDimensions.body <= mobileDimensions.viewport + 1, mobileDimensions);
  check("mobile saved chats control is visible", await page.locator("#mobileChatsToggle").isVisible());
  await page.locator("#mobileChatsToggle").click();
  check("mobile saved chats panel opens", await page.locator("#savedChatsPanel").evaluate((node) => node.classList.contains("open") || node.getAttribute("aria-hidden") !== "true"));
  await page.screenshot({ path: path.join(OUT_DIR, "ask-poly-whole-site-mobile.png"), fullPage: true });

  check("no relevant console errors", consoleErrors.length === 0, { consoleErrors });

  const report = {
    page: "/ask-poly.html",
    status: "success",
    generatedAt: new Date().toISOString(),
    targetFlow: "load whole-site index -> retrieve Revision 2026 subject -> send context to AI -> render response -> mobile layout",
    checks,
    consoleErrors,
    requestContextLength: String(capturedRequest?.pageContext || "").length,
    knowledgeStatus: status,
    screenshots: [
      "ask-poly-whole-site-desktop.png",
      "ask-poly-whole-site-mobile.png"
    ]
  };
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  await context.close();
} catch (error) {
  const report = {
    page: "/ask-poly.html",
    status: "failed",
    generatedAt: new Date().toISOString(),
    error: error.stack || error.message,
    checks,
    consoleErrors,
    request: capturedRequest
  };
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
