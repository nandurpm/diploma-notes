/* Purpose: Ask math - Descriptive comment added for clarity */
import test from "node:test";
import assert from "node:assert/strict";

import { __testables as T } from "../src/ask-handler.js";

test("roundSmart normalises integers, decimals and non-finite values", () => {
  assert.equal(T.roundSmart(4), "4");
  assert.equal(T.roundSmart(4.00000000001), "4");
  assert.equal(T.roundSmart(1.5), "1.5");
  assert.equal(T.roundSmart(2.50000000001), "2.5");
  assert.equal(T.roundSmart(Infinity), "Infinity");
  assert.equal(T.roundSmart(NaN), "NaN");
});

test("cleanMathInput normalises unicode operators and word operators", () => {
  assert.equal(T.cleanMathInput("3 × 4"), "3 * 4");
  assert.equal(T.cleanMathInput("8 ÷ 2"), "8 / 2");
  assert.equal(T.cleanMathInput("π"), "pi");
  assert.equal(T.cleanMathInput("√9"), "sqrt9");
  assert.equal(T.cleanMathInput("5²"), "5^2");
  assert.equal(T.cleanMathInput("2 plus 3 minus 1"), "2 + 3 - 1");
  assert.equal(T.cleanMathInput("6 divided by 2"), "6 / 2");
});

test("isMathLike detects arithmetic and math keywords, rejects prose", () => {
  assert.equal(T.isMathLike("2 + 2"), true);
  assert.equal(T.isMathLike("solve for x"), true);
  assert.equal(T.isMathLike("area of a circle radius 5"), true);
  assert.equal(T.isMathLike("what is 10% of 40"), true);
  assert.equal(T.isMathLike("hello how are you today"), false);
});

test("evalMathExpression respects precedence, powers and grouping", () => {
  assert.equal(T.evalMathExpression("2 + 3 * 4"), 14);
  assert.equal(T.evalMathExpression("(2 + 3) * 4"), 20);
  assert.equal(T.evalMathExpression("2^10"), 1024);
  assert.equal(T.evalMathExpression("sqrt(16)"), 4);
  assert.equal(T.evalMathExpression("-2 * -3"), 6);
});

test("evalMathExpression supports implicit multiplication and constants", () => {
  assert.equal(T.evalMathExpression("2(3)"), 6);
  assert.ok(Math.abs(T.evalMathExpression("pi") - Math.PI) < 1e-9);
  assert.ok(Math.abs(T.evalMathExpression("2 pi") - 2 * Math.PI) < 1e-9);
});

test("evalMathExpression treats trig arguments as degrees by default and radians on request", () => {
  assert.ok(Math.abs(T.evalMathExpression("sin(30)") - 0.5) < 1e-9);
  assert.ok(Math.abs(T.evalMathExpression("cos(0)") - 1) < 1e-9);
  assert.ok(Math.abs(T.evalMathExpression("sin(pi/2)", {}, { radians: true }) - 1) < 1e-9);
});

test("evalMathExpression throws on malformed input", () => {
  assert.throws(() => T.evalMathExpression("2 +"));
  assert.throws(() => T.evalMathExpression("(1 + 2"));
  assert.throws(() => T.evalMathExpression("foo(2)"));
});

test("tryPercentage handles the common phrasings", () => {
  assert.match(T.tryPercentage("10% of 50"), /Answer: 5\b/);
  assert.match(T.tryPercentage("what percentage is 25 of 200"), /Answer: 12\.5%/);
  assert.match(T.tryPercentage("80 increased by 10%"), /Answer: 88\b/);
  assert.match(T.tryPercentage("80 decreased by 10%"), /Answer: 72\b/);
  assert.equal(T.tryPercentage("just some words"), null);
});

test("tryEquation solves linear equations", () => {
  assert.match(T.tryEquation("2x + 3 = 7"), /Answer: x = 2\b/);
  assert.match(T.tryEquation("3x = 9"), /Answer: x = 3\b/);
});

test("tryEquation solves quadratics with an explicit leading coefficient", () => {
  assert.match(T.tryEquation("2x^2 - 10x + 12 = 0"), /x = 3 or x = 2/);
  assert.match(T.tryEquation("1x^2 - 4 = 0"), /x = 2 or x = -2/);
});

test("tryEquation returns null for non-equation input", () => {
  assert.equal(T.tryEquation("2 + 2"), null);
});

test("parsePolynomialTerms and polynomialToString round-trip a polynomial", () => {
  const coeffs = T.parsePolynomialTerms("2x^2 + 3x - 5");
  assert.equal(coeffs.get(2), 2);
  assert.equal(coeffs.get(1), 3);
  assert.equal(coeffs.get(0), -5);
  assert.equal(T.polynomialToString(coeffs), "2x^2 +3x -5");
  assert.equal(T.polynomialToString(new Map()), "0");
});

test("tryCalculus differentiates and integrates polynomials", () => {
  assert.equal(T.tryCalculus("differentiate x^2 + 3x"), "Answer: 2x +3");
  assert.equal(T.tryCalculus("integrate x"), "Answer: 0.5x^2 + C");
  assert.equal(T.tryCalculus("what is the capital of India"), null);
});

test("tryGeometry computes standard shape formulas", () => {
  assert.equal(T.tryGeometry("area of square side 4").split("\n")[0], "Answer: 16");
  assert.equal(T.tryGeometry("area of triangle base 4 height 5").split("\n")[0], "Answer: 10");
  assert.equal(T.tryGeometry("area of rectangle length 4 width 5").split("\n")[0], "Answer: 20");
  assert.equal(
    T.tryGeometry("area of circle radius 7").split("\n")[0],
    `Answer: ${T.roundSmart(Math.PI * 49)}`
  );
  assert.equal(T.tryGeometry("what colour is a circle"), null);
});

test("expressionCandidate strips question words and units", () => {
  assert.equal(T.expressionCandidate("what is 2 + 2 degrees"), "2+2");
  assert.equal(T.expressionCandidate("please calculate 3 * 4"), "3*4");
});

test("tryArithmetic evaluates plain and percentage expressions", () => {
  assert.equal(T.tryArithmetic("calculate 2 + 2"), "Answer: 4");
  assert.equal(T.tryArithmetic("50% + 10"), "Answer: 10.5");
  assert.equal(T.tryArithmetic("x + y"), null);
});

test("localMathAnswer wraps deterministic answers and ignores prose", () => {
  const result = T.localMathAnswer("what is 2 + 2");
  assert.equal(result.answer, "Answer: 4");
  assert.equal(result.provider, "local-math");
  assert.equal(result.usedWeb, false);
  assert.deepEqual(result.citations, []);
  assert.equal(T.localMathAnswer("tell me a joke"), null);
});

test("sanitizeHistory clamps, normalises roles and drops empties", () => {
  assert.deepEqual(T.sanitizeHistory("not an array"), []);
  const cleaned = T.sanitizeHistory([
    { role: "user", text: "one" },
    { role: "assistant", content: "two" },
    { role: "weird", text: "three" },
    { role: "user", text: "" }
  ]);
  assert.deepEqual(cleaned, [
    { role: "user", content: "one" },
    { role: "assistant", content: "two" },
    { role: "user", content: "three" }
  ]);
});

test("sanitizeHistory keeps only the last four entries", () => {
  const history = Array.from({ length: 6 }, (_, index) => ({ role: "user", text: `m${index}` }));
  const cleaned = T.sanitizeHistory(history);
  assert.equal(cleaned.length, 4);
  assert.equal(cleaned[0].content, "m2");
  assert.equal(cleaned[3].content, "m5");
});
