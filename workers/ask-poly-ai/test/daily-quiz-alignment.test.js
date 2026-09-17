/* Purpose: Keep client and server daily-quiz ordering identical. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { selectedQuestions } from '../src/daily-quiz.js';

const publicSource = await fs.readFile(new URL('../../../assets/js/quiz-bank-public.js', import.meta.url), 'utf8');
const publicContext = { window: {} };
vm.runInNewContext(publicSource, publicContext, { filename: 'quiz-bank-public.js' });
const publicBank = publicContext.window.POLY_QUIZ_BANK;

function hash(value) {
  let h = 2166136261;
  for (const character of String(value)) {
    h ^= character.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function clientSelection(code, date) {
  const daily = shuffle(publicBank.questions[code] || [], rng(hash(date + code))).slice(0, 10);
  return daily.map((question) => ({
    id: question.id,
    options: shuffle(question.options.map((text) => ({ text })), rng(hash(date + code + question.id + ':single'))).map((option) => option.text)
  }));
}

test('client and Worker daily quiz ordering stay aligned', () => {
  const dates = ['2026-01-01', '2026-08-15', '2026-12-31'];
  const subjects = Object.keys(publicBank.questions).filter((code) => (publicBank.questions[code] || []).length >= 10);

  for (const date of dates) {
    for (const code of subjects) {
      const client = clientSelection(code, date);
      const worker = selectedQuestions(code, date, 'first').map((question) => ({
        id: question.id,
        options: question.options
      }));
      assert.deepEqual(worker, client, `${code} differs for ${date}`);
    }
  }
});
