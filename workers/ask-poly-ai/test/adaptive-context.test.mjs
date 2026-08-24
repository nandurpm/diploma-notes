import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import vm from "node:vm";

const loaderSource = await fs.readFile(new URL("../../../assets/js/ask-poly-knowledge-loader.js", import.meta.url), "utf8");
const fixture = {
  version: "test",
  generatedAt: "now",
  counts: { pages: 1, subjectRecords: 1 },
  rules: ["Use official links."],
  siteFacts: [{ topic: "website", fact: "POLY PMNA provides revision resources." }],
  faq: [],
  programmes: [],
  subjects: [{ revision: "2026", code: "1001", name: "Engineering Mathematics", department: "Computer Engineering", semester: "Semester 1", type: "Course", syllabusUrl: "/syllabus.pdf", questionPaperUrl: "/qp.pdf", lessonAvailable: true, lessonUrl: "/lesson.html", notesAvailable: true, notesUrl: "/notes.pdf", departmentUrl: "/department.html", syllabusDetails: { sourceUrl: "/syllabus.pdf", outcomes: [{ code: "M1", title: "Algebra", modules: [{ code: "M1.1", title: "Matrices" }] }] } }],
  pages: [{ title: "Ask POLY", heading: "AI assistant", summary: "Ask questions about the website", keywords: ["help"], category: "website", url: "/ask-poly.html", content: "Website help content." }]
};

function createContext() {
  const context = { console, location: { pathname: "/ask-poly.html" }, document: { getElementById: () => null }, fetch: async () => ({ ok: true, json: async () => fixture }) };
  context.globalThis = context;
  vm.runInNewContext(loaderSource, context, { filename: "ask-poly-knowledge-loader.js" });
  return context.globalThis.AskPolyKnowledge;
}

test("adaptive context uses smaller budget for general website questions", async () => {
  const api = createContext();
  const result = await api.searchKnowledge("How can I get help?");
  assert.equal(result.intent, "generalWebsite");
  assert.equal(result.contextBudget, 7000);
  assert.ok(result.contextChars <= result.contextBudget);
});

test("course and lesson questions retain larger grounded budgets", async () => {
  const api = createContext();
  const course = await api.searchKnowledge("What is subject 1001 in semester 1?");
  const lesson = await api.searchKnowledge("Explain the modules and learning outcomes of lesson 1001");
  assert.equal(course.intent, "course");
  assert.equal(course.contextBudget, 11000);
  assert.equal(lesson.intent, "lesson");
  assert.equal(lesson.contextBudget, 14000);
  assert.ok(lesson.matchCounts.subjects >= 1);
});
