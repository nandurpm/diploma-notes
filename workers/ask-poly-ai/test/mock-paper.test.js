/* Purpose: Mock paper - Descriptive comment added for clarity */
import test from "node:test";
import assert from "node:assert/strict";

import { QUESTION_BANK, MOCK_PAPER, MOCK_INSTRUCTIONS } from "../src/mock-paper.js";

test("every question has a well-formed shape", () => {
  for (const question of QUESTION_BANK) {
    assert.equal(typeof question.id, "string");
    assert.ok(question.id.length > 0);
    assert.ok(["A", "B", "C"].includes(question.section));
    assert.equal(typeof question.maxMarks, "number");
    assert.ok(question.maxMarks > 0);
    assert.equal(typeof question.question, "string");
    assert.ok(Array.isArray(question.modelPoints) && question.modelPoints.length > 0);
    assert.ok(Array.isArray(question.rubric) && question.rubric.length > 0);
  }
});

test("question ids are unique", () => {
  const ids = QUESTION_BANK.map((question) => question.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("section composition matches the official pattern", () => {
  const bySection = (section) => QUESTION_BANK.filter((question) => question.section === section);
  assert.equal(bySection("A").length, 9);
  assert.equal(bySection("B").length, 10);
  assert.equal(bySection("C").length, 12);
  assert.ok(bySection("A").every((question) => question.maxMarks === 1));
  assert.ok(bySection("B").every((question) => question.maxMarks === 3));
  assert.ok(bySection("C").every((question) => question.maxMarks === 7));
});

test("MOCK_PAPER metadata is frozen and self-consistent", () => {
  assert.ok(Object.isFrozen(MOCK_PAPER));
  assert.equal(MOCK_PAPER.subjectCode, "1004");
  assert.equal(MOCK_PAPER.totalMarks, 75);
  assert.equal(MOCK_PAPER.questions, QUESTION_BANK);
  assert.deepEqual(MOCK_PAPER.partAIds, QUESTION_BANK.filter((q) => q.section === "A").map((q) => q.id));
  assert.equal(MOCK_PAPER.partAIds.length, 9);
  assert.equal(MOCK_PAPER.partBIds.length, 10);
  assert.deepEqual(MOCK_PAPER.pairs, ["C1", "C2", "C3", "C4", "C5", "C6"]);
});

test("the official selection (9 A + 8 B + 6 C) sums to the total marks", () => {
  const marks = 9 * 1 + 8 * 3 + 6 * 7;
  assert.equal(marks, MOCK_PAPER.totalMarks);
});

test("each Part C pair has exactly two OR-choice questions", () => {
  for (const pair of MOCK_PAPER.pairs) {
    const members = QUESTION_BANK.filter((question) => question.pair === pair);
    assert.equal(members.length, 2, `pair ${pair} should have two options`);
  }
});

test("evaluator instructions describe the 75-mark structure", () => {
  assert.match(MOCK_INSTRUCTIONS, /75/);
  assert.match(MOCK_INSTRUCTIONS, /Applied Chemistry/);
});
