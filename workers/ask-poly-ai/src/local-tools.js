/* Purpose: Answers arithmetic, percentage, ratio, average, unit-conversion,
 * basic electrical/mechanical-formula, and date/time questions WITHOUT
 * calling any AI provider. Meant to run in the same fallback chain as
 * faq-match.js — try FAQ match first, then this file, then (only if
 * still unmatched) fall through to the AI providers.
 *
 * Everything here is pure JS + regex, so it works even if the AI provider
 * API key is missing, rate-limited, or not responding.
 *
 * Usage (in your Worker's request handler):
 *
 *   import { matchFaq } from "./faq-match.js";
 *   import { matchLocalTools } from "./local-tools.js";
 *
 *   let result = matchFaq(message);
 *   if (!result) result = matchLocalTools(message);
 *   if (!result) result = await callAiProvider(message); // existing code
 *
 * matchLocalTools() returns the same shape as matchFaq():
 *   { answer, citations, usedWeb, provider, model, responseId }
 * or null if nothing in this file could handle the message.
 */

const TIMEZONE = "Asia/Kolkata"; // Kerala Polytechnic students -> IST

// -----------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------

function buildResult(answer, tag) {
  return {
    answer,
    citations: [],
    usedWeb: false,
    provider: "local-tools",
    model: "ask-poly-local",
    responseId: tag || ""
  };
}

function round(n, dp = 4) {
  const f = Math.pow(10, dp);
  const r = Math.round((n + Number.EPSILON) * f) / f;
  // Strip trailing zeros like 4.5000 -> 4.5
  return parseFloat(r.toFixed(dp));
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

// -----------------------------------------------------------------------
// 1. SAFE ARITHMETIC EXPRESSION EVALUATOR
//    Supports + - * / % ^ ( ) and sqrt()/abs()/pow(a,b)/mod(a,b).
//    No eval()/Function() — hand-written recursive-descent parser only.
// -----------------------------------------------------------------------

function tokenizeExpr(input) {
  const tokens = [];
  const re = /\s*(\d+\.?\d*|\.\d+|[+\-*/^%(),]|[a-zA-Z]+)\s*/g;
  let match;
  let lastIndex = 0;
  while ((match = re.exec(input)) !== null) {
    if (match.index !== lastIndex) return null; // unrecognized char in between
    tokens.push(match[1]);
    lastIndex = re.lastIndex;
  }
  if (lastIndex !== input.length) return null;
  return tokens;
}

function evaluateExpression(exprStr) {
  const tokens = tokenizeExpr(exprStr);
  if (!tokens || !tokens.length) return null;

  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpression() {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = next();
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm() {
    let value = parsePower();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = next();
      const rhs = parsePower();
      if (op === "*") value = value * rhs;
      else if (op === "/") {
        if (rhs === 0) throw new Error("Division by zero");
        value = value / rhs;
      } else {
        if (rhs === 0) throw new Error("Division by zero");
        value = value % rhs;
      }
    }
    return value;
  }

  function parsePower() {
    const base = parseUnary();
    if (peek() === "^") {
      next();
      const exp = parsePower(); // right-associative
      return Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary() {
    if (peek() === "-") {
      next();
      return -parseUnary();
    }
    if (peek() === "+") {
      next();
      return parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const t = peek();
    if (t === undefined) throw new Error("Unexpected end of expression");

    if (t === "(") {
      next();
      const v = parseExpression();
      if (peek() !== ")") throw new Error("Missing closing parenthesis");
      next();
      return v;
    }

    if (/^[a-zA-Z]+$/.test(t)) {
      const fn = next().toLowerCase();
      if (peek() !== "(") throw new Error(`Expected '(' after ${fn}`);
      next();
      const args = [parseExpression()];
      while (peek() === ",") {
        next();
        args.push(parseExpression());
      }
      if (peek() !== ")") throw new Error("Missing closing parenthesis");
      next();
      switch (fn) {
        case "sqrt":
          return Math.sqrt(args[0]);
        case "abs":
          return Math.abs(args[0]);
        case "pow":
          return Math.pow(args[0], args[1]);
        case "mod":
          return args[0] % args[1];
        case "log":
          return Math.log10(args[0]);
        case "ln":
          return Math.log(args[0]);
        default:
          throw new Error(`Unknown function ${fn}`);
      }
    }

    if (/^\d/.test(t) || t.startsWith(".")) {
      next();
      return parseFloat(t);
    }

    throw new Error(`Unexpected token ${t}`);
  }

  const result = parseExpression();
  if (pos !== tokens.length) return null; // leftover tokens = not a clean expression
  if (!isFinite(result)) return null;
  return result;
}

/** Only treat a message as "pure arithmetic" if, after stripping a leading
 *  "what is / calculate / evaluate / solve", the remainder looks like a
 *  math expression (digits, operators, parens, known function names only).
 */
function tryArithmetic(message) {
  const cleaned = message
    .trim()
    .replace(/^(what\s*is|calculate|evaluate|solve|find|compute)\b[:\s]*/i, "")
    .replace(/\?+$/, "")
    .trim();

  if (!cleaned) return null;
  // Must contain at least one digit and one operator/function to avoid
  // accidentally treating plain text as math.
  const looksLikeMath = /\d/.test(cleaned) && /[+\-*/^%()]|sqrt|abs|pow|mod|log|ln/i.test(cleaned);
  if (!looksLikeMath) return null;
  // Reject if it contains letters that aren't one of our known functions
  // (avoids swallowing sentences that merely contain numbers).
  const strippedFns = cleaned.replace(/\b(sqrt|abs|pow|mod|log|ln)\b/gi, "");
  if (/[a-zA-Z]/.test(strippedFns)) return null;

  let value;
  try {
    value = evaluateExpression(cleaned);
  } catch {
    return null;
  }
  if (value === null || value === undefined) return null;

  return buildResult(`${cleaned} = ${round(value)}`, "arithmetic");
}

// -----------------------------------------------------------------------
// 2. PERCENTAGE / RATIO / AVERAGE
// -----------------------------------------------------------------------

function tryPercentage(message) {
  const m = message.toLowerCase();

  // "X% of Y" or "X percent of Y"
  let match = m.match(/([\d.]+)\s*(?:%|percent)\s*of\s*([\d.]+)/);
  if (match) {
    const [, x, y] = match;
    const result = (parseFloat(x) / 100) * parseFloat(y);
    return buildResult(`${x}% of ${y} = ${round(result)}`, "percentage-of");
  }

  // "what percent is X of Y" / "X is what percent of Y" / "X out of Y percent"
  match = m.match(/(?:what\s*percent(?:age)?\s*is\s*)?([\d.]+)\s*(?:out\s*of|\/)\s*([\d.]+)(?:\s*(?:as a percent|percent|%))?/);
  if (match && (m.includes("percent") || m.includes("%") || m.includes("out of"))) {
    const [, x, y] = match;
    const yNum = parseFloat(y);
    if (yNum !== 0) {
      const result = (parseFloat(x) / yNum) * 100;
      return buildResult(`${x} out of ${y} = ${round(result)}%`, "percentage-fraction");
    }
  }

  // "increase X by Y%" / "decrease X by Y%"
  match = m.match(/(increase|decrease)\s+([\d.]+)\s+by\s+([\d.]+)\s*%/);
  if (match) {
    const [, dir, x, pct] = match;
    const xNum = parseFloat(x);
    const pctNum = parseFloat(pct);
    const result = dir === "increase" ? xNum * (1 + pctNum / 100) : xNum * (1 - pctNum / 100);
    return buildResult(`${x} ${dir}d by ${pct}% = ${round(result)}`, "percentage-change");
  }

  return null;
}

function tryRatio(message) {
  const m = message.toLowerCase();
  const match = m.match(/ratio\s*(?:of|between)?\s*([\d.]+)\s*(?:to|:|and)\s*([\d.]+)/);
  if (!match) return null;
  const a = parseFloat(match[1]);
  const b = parseFloat(match[2]);
  if (!a || !b) return null;
  const divisor = gcd(Math.round(a), Math.round(b));
  const simplified = `${Math.round(a) / divisor}:${Math.round(b) / divisor}`;
  return buildResult(`Ratio of ${match[1]} to ${match[2]} = ${simplified} (decimal ${round(a / b)})`, "ratio");
}

function tryAverage(message) {
  const m = message.toLowerCase();
  if (!/\baverage\b|\bmean\b/.test(m)) return null;
  const numsMatch = message.match(/-?\d+\.?\d*/g);
  if (!numsMatch || numsMatch.length < 2) return null;
  const nums = numsMatch.map(Number);
  const sum = nums.reduce((a, b) => a + b, 0);
  const avg = sum / nums.length;
  return buildResult(`Average of ${nums.join(", ")} = ${round(avg)}`, "average");
}

// -----------------------------------------------------------------------
// 3. UNIT CONVERSION (length, mass, temperature, area, volume, speed, pressure)
// -----------------------------------------------------------------------

const LENGTH_TO_M = {
  mm: 0.001, millimeter: 0.001, millimeters: 0.001,
  cm: 0.01, centimeter: 0.01, centimeters: 0.01,
  m: 1, meter: 1, meters: 1, metre: 1, metres: 1,
  km: 1000, kilometer: 1000, kilometers: 1000, kilometre: 1000, kilometres: 1000,
  in: 0.0254, inch: 0.0254, inches: 0.0254,
  ft: 0.3048, foot: 0.3048, feet: 0.3048,
  yd: 0.9144, yard: 0.9144, yards: 0.9144,
  mi: 1609.34, mile: 1609.34, miles: 1609.34
};

const MASS_TO_G = {
  mg: 0.001, milligram: 0.001, milligrams: 0.001,
  g: 1, gram: 1, grams: 1,
  kg: 1000, kilogram: 1000, kilograms: 1000,
  ton: 1000000, tonne: 1000000, tonnes: 1000000, "metric ton": 1000000,
  lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
  oz: 28.3495, ounce: 28.3495, ounces: 28.3495
};

const AREA_TO_M2 = {
  "sq mm": 0.000001, "sq cm": 0.0001, "sq m": 1, "sq km": 1000000,
  "sq ft": 0.092903, "sq feet": 0.092903, "sq yd": 0.836127, "sq in": 0.00064516,
  acre: 4046.86, hectare: 10000, cent: 40.4686 // "cent" is common in Kerala land measurement
};

const VOLUME_TO_L = {
  ml: 0.001, milliliter: 0.001, milliliters: 0.001,
  l: 1, liter: 1, liters: 1, litre: 1, litres: 1,
  "cu m": 1000, "cubic meter": 1000, "cubic metre": 1000,
  "cu ft": 28.3168, "cubic feet": 28.3168, "cubic foot": 28.3168,
  gallon: 3.78541, gallons: 3.78541
};

const SPEED_TO_MS = {
  "m/s": 1, "km/h": 0.277778, kmph: 0.277778, "mph": 0.44704, "mi/h": 0.44704
};

const PRESSURE_TO_PA = {
  pa: 1, pascal: 1, kpa: 1000, bar: 100000, atm: 101325, psi: 6894.76
};

function convertWithTable(value, fromUnit, toUnit, table) {
  const f = table[fromUnit];
  const t = table[toUnit];
  if (f === undefined || t === undefined) return null;
  return (value * f) / t;
}

function convertTemperature(value, fromUnit, toUnit) {
  // Normalize to Celsius first
  let celsius;
  if (fromUnit === "c") celsius = value;
  else if (fromUnit === "f") celsius = ((value - 32) * 5) / 9;
  else if (fromUnit === "k") celsius = value - 273.15;
  else return null;

  if (toUnit === "c") return celsius;
  if (toUnit === "f") return (celsius * 9) / 5 + 32;
  if (toUnit === "k") return celsius + 273.15;
  return null;
}

const TEMP_ALIASES = {
  c: "c", celsius: "c", "°c": "c",
  f: "f", fahrenheit: "f", "°f": "f",
  k: "k", kelvin: "k"
};

function normalizeUnit(u) {
  return u.trim().toLowerCase().replace(/s$/, (m, offset, str) => {
    // don't strip trailing 's' from short symbol-like units (e.g. "ft", "in" already handled by table having both forms)
    return str.length > 3 ? "" : m;
  });
}

function tryUnitConversion(message) {
  const m = message.toLowerCase();
  const match = m.match(/(-?[\d.]+)\s*([a-zA-Z°/ ]+?)\s+(?:to|in|into)\s+([a-zA-Z°/ ]+?)(?:\?|$|,|\.)/);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const fromRaw = match[2].trim();
  const toRaw = match[3].trim();

  // Temperature first (special formula, not a plain multiplier table)
  if (TEMP_ALIASES[fromRaw] && TEMP_ALIASES[toRaw]) {
    const result = convertTemperature(value, TEMP_ALIASES[fromRaw], TEMP_ALIASES[toRaw]);
    if (result !== null) {
      return buildResult(`${value} ${fromRaw} = ${round(result, 2)} ${toRaw}`, "convert-temp");
    }
  }

  const tables = [
    { table: LENGTH_TO_M, label: "length" },
    { table: MASS_TO_G, label: "mass" },
    { table: AREA_TO_M2, label: "area" },
    { table: VOLUME_TO_L, label: "volume" },
    { table: SPEED_TO_MS, label: "speed" },
    { table: PRESSURE_TO_PA, label: "pressure" }
  ];

  const fromKey = fromRaw.replace(/\s+/g, " ");
  const toKey = toRaw.replace(/\s+/g, " ");

  for (const { table } of tables) {
    if (table[fromKey] !== undefined && table[toKey] !== undefined) {
      const result = convertWithTable(value, fromKey, toKey, table);
      if (result !== null) {
        return buildResult(`${value} ${fromRaw} = ${round(result, 4)} ${toRaw}`, "convert-unit");
      }
    }
  }

  return null;
}

// -----------------------------------------------------------------------
// 4. ELECTRICAL / MECHANICAL FORMULAS (Ohm's Law, Power)
// -----------------------------------------------------------------------

function extractLabeled(message, patterns) {
  const out = {};
  for (const [key, re] of Object.entries(patterns)) {
    const m = message.match(re);
    if (m) out[key] = parseFloat(m[1]);
  }
  return out;
}

function tryOhmsLaw(message) {
  const m = message.toLowerCase();
  // Power questions use the same V/I/R letters but a different formula —
  // let tryElectricalPower (checked first) own those.
  if (/\bpower\b/.test(m)) return null;

  const vals = extractLabeled(m, {
    v: /(?:voltage|\bv)\s*(?:=|is|:)?\s*([\d.]+)\s*v?\b/,
    i: /(?:current|\bi)\s*(?:=|is|:)?\s*([\d.]+)\s*a?\b/,
    r: /(?:resistance|\br)\s*(?:=|is|:)?\s*([\d.]+)\s*(?:ohm|ω)?\b/
  });

  const known = Object.keys(vals).length;
  if (known !== 2) return null;

  if (vals.v !== undefined && vals.i !== undefined) {
    const r = vals.v / vals.i;
    return buildResult(`R = V / I = ${vals.v} / ${vals.i} = ${round(r)} ohm`, "ohms-law-r");
  }
  if (vals.v !== undefined && vals.r !== undefined) {
    const i = vals.v / vals.r;
    return buildResult(`I = V / R = ${vals.v} / ${vals.r} = ${round(i)} A`, "ohms-law-i");
  }
  if (vals.i !== undefined && vals.r !== undefined) {
    const v = vals.i * vals.r;
    return buildResult(`V = I x R = ${vals.i} x ${vals.r} = ${round(v)} V`, "ohms-law-v");
  }
  return null;
}

function tryElectricalPower(message) {
  const m = message.toLowerCase();
  if (!/\bpower\b/.test(m)) return null;

  const vals = extractLabeled(m, {
    v: /(?:voltage|\bv)\s*(?:=|is|:)?\s*([\d.]+)\s*v?\b/,
    i: /(?:current|\bi)\s*(?:=|is|:)?\s*([\d.]+)\s*a?\b/,
    r: /(?:resistance|\br)\s*(?:=|is|:)?\s*([\d.]+)\s*(?:ohm|ω)?\b/
  });

  if (vals.v !== undefined && vals.i !== undefined) {
    const p = vals.v * vals.i;
    return buildResult(`P = V x I = ${vals.v} x ${vals.i} = ${round(p)} W`, "power-vi");
  }
  if (vals.i !== undefined && vals.r !== undefined) {
    const p = vals.i * vals.i * vals.r;
    return buildResult(`P = I^2 x R = ${vals.i}^2 x ${vals.r} = ${round(p)} W`, "power-i2r");
  }
  if (vals.v !== undefined && vals.r !== undefined) {
    const p = (vals.v * vals.v) / vals.r;
    return buildResult(`P = V^2 / R = ${vals.v}^2 / ${vals.r} = ${round(p)} W`, "power-v2r");
  }
  return null;
}

// -----------------------------------------------------------------------
// 5. DATE / TIME
// -----------------------------------------------------------------------

function nowIST() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE }));
}

function formatDate(d) {
  return d.toLocaleDateString("en-IN", { timeZone: TIMEZONE, weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatTime(d) {
  return d.toLocaleTimeString("en-IN", { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

function tryDateTime(message) {
  const m = message.toLowerCase().trim();

  // Days between two ISO-ish dates: "days between 2026-01-01 and 2026-03-15"
  let match = m.match(/(?:days?\s*between)\s*([\d]{4}-[\d]{2}-[\d]{2})\s*(?:and|to)\s*([\d]{4}-[\d]{2}-[\d]{2})/);
  if (match) {
    const d1 = new Date(match[1]);
    const d2 = new Date(match[2]);
    if (!isNaN(d1) && !isNaN(d2)) {
      const days = Math.round((d2 - d1) / 86400000);
      return buildResult(`Difference between ${match[1]} and ${match[2]} = ${Math.abs(days)} days`, "date-diff");
    }
  }

  // Day of week for a specific date: "what day of the week is 2026-08-15"
  match = m.match(/what\s*day\s*(?:of the week\s*)?(?:is|was)\s*([\d]{4}-[\d]{2}-[\d]{2})/);
  if (match) {
    const d = new Date(match[1]);
    if (!isNaN(d)) {
      const weekday = d.toLocaleDateString("en-IN", { weekday: "long", timeZone: "UTC" });
      return buildResult(`${match[1]} is a ${weekday}`, "date-weekday");
    }
  }

  // Add/subtract N days to/from a date: "add 30 days to 2026-08-11"
  match = m.match(/(add|subtract)\s*(\d+)\s*days?\s*(?:to|from)\s*([\d]{4}-[\d]{2}-[\d]{2})/);
  if (match) {
    const [, op, days, dateStr] = match;
    const d = new Date(dateStr);
    if (!isNaN(d)) {
      d.setUTCDate(d.getUTCDate() + (op === "add" ? 1 : -1) * parseInt(days, 10));
      const resultStr = d.toISOString().slice(0, 10);
      return buildResult(`${dateStr} ${op === "add" ? "+" : "-"} ${days} days = ${resultStr}`, "date-add");
    }
  }

  // Current date / time / day-of-week "now"
  const now = nowIST();
  if (/\b(today'?s?\s*date|current\s*date|what.?s\s*the\s*date|what\s*is\s*today|date\s*today)\b/.test(m)) {
    return buildResult(`Today's date is ${formatDate(now)} (IST).`, "date-today");
  }
  if (/\b(current\s*time|what\s*time\s*is\s*it|time\s*now|what.?s\s*the\s*time)\b/.test(m)) {
    return buildResult(`The current time is ${formatTime(now)} IST.`, "time-now");
  }
  if (/\b(what\s*day\s*is\s*(it|today)|which\s*day\s*is\s*today)\b/.test(m)) {
    return buildResult(`Today is ${now.toLocaleDateString("en-IN", { timeZone: TIMEZONE, weekday: "long" })}.`, "day-today");
  }
  if (/\b(current\s*date\s*and\s*time|date\s*and\s*time\s*now|today.?s\s*date\s*and\s*time)\b/.test(m)) {
    return buildResult(`It is currently ${formatDate(now)}, ${formatTime(now)} IST.`, "datetime-now");
  }

  return null;
}

// -----------------------------------------------------------------------
// PUBLIC ENTRY POINT
// -----------------------------------------------------------------------

/**
 * Tries every local handler in order and returns the first match.
 * Returns null if nothing here can answer the message (caller should
 * fall through to the AI provider).
 */
export function matchLocalTools(message) {
  if (!message || !String(message).trim()) return null;

  const handlers = [
    tryDateTime,
    tryPercentage,
    tryRatio,
    tryAverage,
    tryUnitConversion,
    tryElectricalPower, // checked before Ohm's law: both parse V/I/R labels
    tryOhmsLaw,
    tryArithmetic // keep generic arithmetic last so labeled formulas above win first
  ];

  for (const handler of handlers) {
    try {
      const result = handler(message);
      if (result) return result;
    } catch {
      // A handler throwing (e.g. bad expression) just means "no match" —
      // never let a local-tools error block the AI fallback.
      continue;
    }
  }

  return null;
}
