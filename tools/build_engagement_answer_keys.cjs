#!/usr/bin/env node
"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "assets/js/quiz-bank.js");
const outputPath = path.join(root, "assets/js/quiz-engagement-answers.js");
const source = fs.readFileSync(sourcePath, "utf8");
const context = { window: {} };
vm.runInNewContext(source, context, { filename: sourcePath });
const bank = context.window.POLY_QUIZ_BANK;
if (!bank || !bank.questions || typeof bank.questions !== "object") {
  throw new Error("Protected quiz bank did not expose questions");
}

const keys = {};
let questionCount = 0;
for (const [subjectCode, questions] of Object.entries(bank.questions)) {
  if (!Array.isArray(questions)) continue;
  for (const question of questions) {
    if (!question || typeof question.id !== "string" || !Number.isInteger(question.answer)) {
      throw new Error(`Invalid engagement answer key for ${subjectCode}:${question?.id || "unknown"}`);
    }
    if (question.answer < 0 || question.answer >= question.options.length) {
      throw new Error(`Out-of-range engagement answer key for ${subjectCode}:${question.id}`);
    }
    keys[`${subjectCode}:${question.id}`] = question.answer;
    questionCount += 1;
  }
}

const output = `/* Generated from quiz-bank.js for browser-only Weekly Challenge and 90-second Time Trial grading. */\nwindow.POLY_QUIZ_ENGAGEMENT_KEYS = Object.freeze(${JSON.stringify(keys, null, 2)});\n`;
fs.writeFileSync(outputPath, output, "utf8");
console.log(JSON.stringify({ output: path.relative(root, outputPath), questionCount, keyCount: Object.keys(keys).length }, null, 2));
