/* Purpose: Ask poly ai worker - Descriptive comment added for clarity */
// Ask POLY Cloudflare Worker
// Multi-provider fallback: Website/RAG context -> Cache -> Local deterministic maths -> NVIDIA -> OpenAI -> Gemini -> OpenRouter -> safe local fallback.
// Keep all API keys as Cloudflare Worker secrets. Never put keys in frontend files.

/* List of domains authorized to call this worker */
const ALLOWED_ORIGINS = new Set([
  "https://polypmna.dpdns.org",
  "https://www.polypmna.dpdns.org",
  "http://localhost:8787"
]);

/* Configuration for various AI model providers used as fallbacks */
const MODEL_CONFIG = {
  nvidia: {
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    model: "meta/llama-3.1-70b-instruct"
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4.1-mini"
  },
  gemini: {
    model: "gemini-1.5-flash"
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "qwen/qwen-2.5-72b-instruct"
  }
};

const EPSILON = 1e-9;

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://polypmna.dpdns.org";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonResponse(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function roundSmart(value) {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 1e-10) return String(rounded);
  return String(Number(value.toFixed(10))).replace(/\.0+$/, "");
}

/* Pre-processes natural language math queries into standard mathematical notation */
function cleanMathInput(value) {
  return String(value || "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/×|∙|·/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/\bplus\b/gi, "+")
    .replace(/\bminus\b/gi, "-")
    .replace(/\binto\b|\btimes\b|\bmultiplied by\b/gi, "*")
    .replace(/\bdivided by\b|\bover\b/gi, "/")
    .replace(/\bpower of\b|\braised to\b/gi, "^")
    .replace(/\s+/g, " ")
    .trim();
}

function isMathLike(text) {
  const q = cleanMathInput(text).toLowerCase();
  return /[0-9][\s]*(?:[+\-*/^=()]|%)/.test(q)
    || /\b(solve|calculate|evaluate|simplify|differentiate|derivative|integrate|integral|equation|quadratic|percentage|percent|area|perimeter|volume|sin|cos|tan|log|ln|sqrt|root)\b/.test(q)
    || /\b\d+(?:\.\d+)?\s*%\s*of\s*\d/.test(q);
}

/* Recursive descent parser to evaluate mathematical expressions locally */
function evalMathExpression(source, vars = {}, options = {}) {
  const trigInRadians = Boolean(options.radians);
  const s = cleanMathInput(source).toLowerCase().replace(/\s+/g, "").replace(/\[/g, "(").replace(/\]/g, ")");
  let i = 0;
  const peek = () => s[i] || "";
  const consume = (ch) => (s[i] === ch ? (i += 1, true) : false);
  const isAlpha = (ch) => /[a-z_]/i.test(ch);
  const atPrimaryStart = () => peek() === "(" || peek() === "." || /[0-9]/.test(peek()) || isAlpha(peek());

  function parseNumber() {
    const start = i;
    while (/[0-9.]/.test(peek())) i += 1;
    const raw = s.slice(start, i);
    const value = Number(raw);
    if (!raw || raw === "." || !Number.isFinite(value)) throw new Error("Invalid number");
    return value;
  }

  function parseName() {
    const start = i;
    while (isAlpha(peek())) i += 1;
    return s.slice(start, i);
  }

  function trig(value) {
    return trigInRadians ? value : value * Math.PI / 180;
  }

  function applyFunction(name, value) {
    if (name === "sin") return Math.sin(trig(value));
    if (name === "cos") return Math.cos(trig(value));
    if (name === "tan") return Math.tan(trig(value));
    if (name === "asin") return trigInRadians ? Math.asin(value) : Math.asin(value) * 180 / Math.PI;
    if (name === "acos") return trigInRadians ? Math.acos(value) : Math.acos(value) * 180 / Math.PI;
    if (name === "atan") return trigInRadians ? Math.atan(value) : Math.atan(value) * 180 / Math.PI;
    if (name === "sqrt") return Math.sqrt(value);
    if (name === "abs") return Math.abs(value);
    if (name === "log") return Math.log10(value);
    if (name === "ln") return Math.log(value);
    if (name === "exp") return Math.exp(value);
    throw new Error(`Unknown function ${name}`);
  }

  function parsePrimary() {
    if (consume("(")) {
      const value = parseExpression();
      if (!consume(")")) throw new Error("Missing closing bracket");
      return value;
    }
    if (/[0-9.]/.test(peek())) return parseNumber();
    if (isAlpha(peek())) {
      const name = parseName();
      if (name === "pi") return Math.PI;
      if (name === "e") return Math.E;
      if (Object.prototype.hasOwnProperty.call(vars, name)) return Number(vars[name]);
      const known = new Set(["sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "abs", "log", "ln", "exp"]);
      if (known.has(name)) {
        let argument;
        if (consume("(")) {
          argument = parseExpression();
          if (!consume(")")) throw new Error("Missing closing bracket");
        } else {
          argument = parseUnary();
        }
        return applyFunction(name, argument);
      }
      throw new Error(`Unknown symbol ${name}`);
    }
    throw new Error("Invalid expression");
  }

  function parseUnary() {
    if (consume("+")) return parseUnary();
    if (consume("-")) return -parseUnary();
    return parsePower();
  }

  function parsePower() {
    let value = parsePrimary();
    if (consume("^")) value = Math.pow(value, parseUnary());
    return value;
  }

  function parseTerm() {
    let value = parseUnary();
    while (true) {
      if (consume("*")) value *= parseUnary();
      else if (consume("/")) value /= parseUnary();
      else if (atPrimaryStart()) value *= parseUnary();
      else break;
    }
    return value;
  }

  function parseExpression() {
    let value = parseTerm();
    while (true) {
      if (consume("+")) value += parseTerm();
      else if (consume("-")) value -= parseTerm();
      else break;
    }
    return value;
  }

  const result = parseExpression();
  if (i < s.length) throw new Error(`Unexpected "${s.slice(i)}"`);
  if (!Number.isFinite(result)) throw new Error("Result is not finite");
  return result;
}

function tryPercentage(text) {
  const q = cleanMathInput(text).toLowerCase();
  let m = q.match(/(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)/);
  if (m) {
    const p = Number(m[1]);
    const n = Number(m[2]);
    return `Answer: ${roundSmart(n * p / 100)}\n\n${p}% of ${n} = ${roundSmart(n * p / 100)}`;
  }
  m = q.match(/(?:what\s+percentage\s+is|percentage\s+of)\s*(-?\d+(?:\.\d+)?)\s*(?:of|from|\/)\s*(-?\d+(?:\.\d+)?)/);
  if (m) {
    const part = Number(m[1]);
    const total = Number(m[2]);
    if (Math.abs(total) < EPSILON) return null;
    return `Answer: ${roundSmart(part / total * 100)}%\n\n${part} is ${roundSmart(part / total * 100)}% of ${total}.`;
  }
  return null;
}

function equationParts(raw) {
  const eq = cleanMathInput(raw)
    .toLowerCase()
    .replace(/\b(solve|find|value|of|for|x|y|equation|simultaneous|linear|quadratic)\b(?=.*=)/g, " ")
    .replace(/\s+/g, "");
  const split = eq.split("=");
  if (split.length !== 2 || !split[0] || !split[1]) return null;
  return split;
}

function coeffOneVar(left, right) {
  const f = (x) => evalMathExpression(`(${left})-(${right})`, { x });
  const y0 = f(0), y1 = f(1), y2 = f(2), y3 = f(3);
  const a = (y2 - 2 * y1 + y0) / 2;
  const b = y1 - y0 - a;
  const c = y0;
  if (Math.abs((a * 9 + b * 3 + c) - y3) > 1e-6) return null;
  return { a, b, c };
}

function coeffTwoVar(left, right) {
  const f = (x, y) => evalMathExpression(`(${left})-(${right})`, { x, y });
  const c = f(0, 0);
  const a = f(1, 0) - c;
  const b = f(0, 1) - c;
  if (Math.abs((a * 2 + b * 3 + c) - f(2, 3)) > 1e-6) return null;
  return { a, b, c };
}

function tryEquation(text) {
  const q = cleanMathInput(text).toLowerCase();
  if (!q.includes("=") || !/[xy]/.test(q)) return null;
  const equations = q.replace(/\band\b/gi, ";").split(/[;\n,]+/).map((part) => part.trim()).filter((part) => part.includes("="));

  if (equations.length >= 2 && /x/.test(q) && /y/.test(q)) {
    const p1 = equationParts(equations[0]);
    const p2 = equationParts(equations[1]);
    if (p1 && p2) {
      const e1 = coeffTwoVar(p1[0], p1[1]);
      const e2 = coeffTwoVar(p2[0], p2[1]);
      if (e1 && e2) {
        const d = e1.a * e2.b - e2.a * e1.b;
        if (Math.abs(d) < EPSILON) return "Answer: no unique solution\n\nThe two equations are parallel or dependent.";
        const x = ((-e1.c) * e2.b - (-e2.c) * e1.b) / d;
        const y = (e1.a * (-e2.c) - e2.a * (-e1.c)) / d;
        return `Answer: x = ${roundSmart(x)}, y = ${roundSmart(y)}`;
      }
    }
  }

  const parts = equationParts(equations[0] || q);
  if (!parts) return null;
  const coeff = coeffOneVar(parts[0], parts[1]);
  if (!coeff) return null;
  const { a, b, c } = coeff;
  if (Math.abs(a) < EPSILON) {
    if (Math.abs(b) < EPSILON) return Math.abs(c) < EPSILON ? "Answer: infinitely many solutions." : "Answer: no solution.";
    return `Answer: x = ${roundSmart(-c / b)}`;
  }
  const disc = b * b - 4 * a * c;
  if (disc >= -EPSILON) {
    const d = Math.max(0, disc);
    const x1 = (-b + Math.sqrt(d)) / (2 * a);
    const x2 = (-b - Math.sqrt(d)) / (2 * a);
    return Math.abs(x1 - x2) < EPSILON
      ? `Answer: x = ${roundSmart(x1)}`
      : `Answer: x = ${roundSmart(x1)} or x = ${roundSmart(x2)}`;
  }
  const real = -b / (2 * a);
  const imag = Math.sqrt(-disc) / (2 * Math.abs(a));
  return `Answer: x = ${roundSmart(real)} ± ${roundSmart(imag)}i`;
}

function parsePolynomialTerms(expression) {
  const expr = cleanMathInput(expression).toLowerCase().replace(/\s+/g, "").replace(/-/g, "+-");
  const terms = expr.split("+").filter(Boolean);
  const coeffs = new Map();
  for (let term of terms) {
    term = term.replace(/\*/g, "");
    if (!term.includes("x")) {
      const value = Number(term);
      if (!Number.isFinite(value)) return null;
      coeffs.set(0, (coeffs.get(0) || 0) + value);
      continue;
    }
    const m = term.match(/^(-?\d*(?:\.\d+)?)?x(?:\^(-?\d+))?$/);
    if (!m) return null;
    const coef = m[1] === "" || m[1] == null ? 1 : (m[1] === "-" ? -1 : Number(m[1]));
    const power = m[2] == null ? 1 : Number(m[2]);
    if (!Number.isFinite(coef) || !Number.isFinite(power)) return null;
    coeffs.set(power, (coeffs.get(power) || 0) + coef);
  }
  return coeffs;
}

function polyToString(coeffs) {
  const powers = [...coeffs.keys()].filter((power) => Math.abs(coeffs.get(power)) > EPSILON).sort((a, b) => b - a);
  if (!powers.length) return "0";
  return powers.map((power, index) => {
    const coef = coeffs.get(power);
    const sign = coef < 0 ? "-" : (index === 0 ? "" : "+");
    const abs = Math.abs(coef);
    const body = power === 0 ? roundSmart(abs) : power === 1 ? (Math.abs(abs - 1) < EPSILON ? "x" : `${roundSmart(abs)}x`) : (Math.abs(abs - 1) < EPSILON ? `x^${power}` : `${roundSmart(abs)}x^${power}`);
    return `${sign}${body}`;
  }).join(" ");
}

function tryCalculus(text) {
  const q = cleanMathInput(text).toLowerCase();
  const derivative = /\b(differentiate|derivative|d\/dx)\b/.test(q);
  const integral = /\b(integrate|integral|∫)\b/.test(q);
  if (!derivative && !integral) return null;
  const expression = q.replace(/\b(differentiate|derivative|find|the|of|d\/dx|with respect to x|wrt x|integrate|integral|∫|dx)\b/g, " ").replace(/\s+/g, "").trim();
  if (!expression || !expression.includes("x")) return null;
  const coeffs = parsePolynomialTerms(expression);
  if (!coeffs) return null;
  const result = new Map();
  for (const [power, coefficient] of coeffs.entries()) {
    if (derivative) {
      if (power !== 0) result.set(power - 1, (result.get(power - 1) || 0) + coefficient * power);
    } else {
      result.set(power + 1, (result.get(power + 1) || 0) + coefficient / (power + 1));
    }
  }
  return `Answer: ${polyToString(result)}${integral ? " + C" : ""}`;
}

function tryGeometry(text) {
  const q = cleanMathInput(text).toLowerCase();
  let m = q.match(/area\s+of\s+(?:a\s+)?circle.*?(?:radius|r)\s*=?\s*(-?\d+(?:\.\d+)?)/);
  if (m) return `Answer: ${roundSmart(Math.PI * Number(m[1]) ** 2)}\n\nArea of circle = πr²`;
  m = q.match(/area\s+of\s+(?:a\s+)?triangle.*?(?:base|b)\s*=?\s*(-?\d+(?:\.\d+)?).*?(?:height|h)\s*=?\s*(-?\d+(?:\.\d+)?)/);
  if (m) return `Answer: ${roundSmart(0.5 * Number(m[1]) * Number(m[2]))}\n\nArea of triangle = ½ × base × height`;
  m = q.match(/area\s+of\s+(?:a\s+)?rectangle.*?(?:length|l)\s*=?\s*(-?\d+(?:\.\d+)?).*?(?:breadth|width|b|w)\s*=?\s*(-?\d+(?:\.\d+)?)/);
  if (m) return `Answer: ${roundSmart(Number(m[1]) * Number(m[2]))}\n\nArea of rectangle = length × breadth`;
  return null;
}

function expressionCandidate(text) {
  return cleanMathInput(text)
    .toLowerCase()
    .replace(/\b(please|pls|kindly|calculate|evaluate|simplify|find|answer|what is|what's|value of|the value of|give|me|show|step|steps|solve|degrees?|radians?|rad)\b/g, " ")
    .replace(/[?]/g, " ")
    .replace(/[^0-9a-z+\-*/^().,% ]/g, " ")
    .replace(/\s+/g, "")
    .replace(/,$/, "");
}

function tryArithmetic(text) {
  let expr = expressionCandidate(text);
  if (!expr || expr.includes("=") || !/[0-9)]/.test(expr) || !/[+\-*/^()]|sin|cos|tan|sqrt|log|ln|abs|pi|%/.test(expr)) return null;
  expr = expr.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
  const allowed = new Set(["sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "abs", "log", "ln", "exp", "pi", "e"]);
  if ((expr.match(/[a-z_]+/g) || []).some((word) => !allowed.has(word))) return null;
  const value = evalMathExpression(expr, {}, { radians: /\b(rad|radian|radians)\b/i.test(text) });
  return `Answer: ${roundSmart(value)}`;
}

function localMathAnswer(message) {
  const q = normalizeText(message);
  if (!isMathLike(q)) return null;
  for (const solver of [tryPercentage, tryEquation, tryCalculus, tryGeometry, tryArithmetic]) {
    try {
      const answer = solver(q);
      if (answer) return { answer, provider: "local-math", cached: false };
    } catch (_) {}
  }
  return null;
}

function hashKey(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `ask-poly:${(hash >>> 0).toString(16)}`;
}

function buildMessages(message, history = []) {
  const system = `You are Ask POLY, the official website assistant for polypmna.dpdns.org / Polytechnic Study Hub.
Answer clearly and practically for Kerala Polytechnic students.
For mathematics, give the direct answer first, then only the necessary steps. Solve arithmetic, algebra, percentages, trigonometry, calculus and engineering calculations accurately.
Do not invent missing local lesson pages, notes PDFs, ZIP files, or download links.
If local notes or lessons are unavailable, say they are not uploaded yet.
For official syllabus and sample question papers, direct users to SITTTR links shown on the subject cards.
Keep answers short unless the user asks for detail.`;

  const safeHistory = Array.isArray(history) ? history.slice(-8).map((item) => ({
    role: item.role === "assistant" ? "assistant" : "user",
    content: normalizeText(item.content).slice(0, 2000)
  })).filter((item) => item.content) : [];

  return [
    { role: "system", content: system },
    ...safeHistory,
    { role: "user", content: normalizeText(message).slice(0, 6000) }
  ];
}

async function withTimeout(promise, ms = 22000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function callNvidia(env, messages) {
  if (!env.NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY secret missing");
  return withTimeout(async (signal) => {
    const response = await fetch(MODEL_CONFIG.nvidia.url, {
      method: "POST",
      signal,
      headers: {
        "Authorization": `Bearer ${env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.NVIDIA_MODEL || MODEL_CONFIG.nvidia.model,
        messages,
        temperature: 0.15,
        max_tokens: 1200
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`NVIDIA failed ${response.status}: ${data.error?.message || data.detail || "unknown"}`);
    const answer = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";
    if (!answer.trim()) throw new Error("NVIDIA returned empty answer");
    return { answer, provider: "nvidia" };
  });
}

async function callOpenAI(env, messages) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY secret missing");
  return withTimeout(async (signal) => {
    const response = await fetch(MODEL_CONFIG.openai.url, {
      method: "POST",
      signal,
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || MODEL_CONFIG.openai.model,
        messages,
        temperature: 0.15,
        max_tokens: 1200
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`OpenAI failed ${response.status}: ${data.error?.message || "unknown"}`);
    const answer = data.choices?.[0]?.message?.content || "";
    if (!answer.trim()) throw new Error("OpenAI returned empty answer");
    return { answer, provider: "openai" };
  });
}

async function callGemini(env, messages) {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY secret missing");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL || MODEL_CONFIG.gemini.model}:generateContent?key=${env.GEMINI_API_KEY}`;
  const text = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
  return withTimeout(async (signal) => {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: { temperature: 0.15, maxOutputTokens: 1200 }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Gemini failed ${response.status}: ${data.error?.message || "unknown"}`);
    const answer = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
    if (!answer.trim()) throw new Error("Gemini returned empty answer");
    return { answer, provider: "gemini" };
  });
}

async function callOpenRouter(env, messages) {
  if (!env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY secret missing");
  return withTimeout(async (signal) => {
    const response = await fetch(MODEL_CONFIG.openrouter.url, {
      method: "POST",
      signal,
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://polypmna.dpdns.org",
        "X-Title": "Ask POLY"
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL || MODEL_CONFIG.openrouter.model,
        messages,
        temperature: 0.15,
        max_tokens: 1200
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`OpenRouter failed ${response.status}: ${data.error?.message || "unknown"}`);
    const answer = data.choices?.[0]?.message?.content || "";
    if (!answer.trim()) throw new Error("OpenRouter returned empty answer");
    return { answer, provider: "openrouter" };
  });
}

function localFallback(message) {
  const math = localMathAnswer(message);
  if (math) return math.answer;
  const q = normalizeText(message).toLowerCase();
  if (/subject|syllabus|notes|lesson|department|semester|sitttr|qp|question paper/.test(q)) {
    return "AI providers are temporarily unavailable, but you can still use the website: open Revision 2021, choose your department, and use the subject cards for Open Syllabus and Sample QP. Lesson/Notes buttons appear only when local files are uploaded.";
  }
  if (/mock|quiz|exam/.test(q)) return "AI providers are temporarily unavailable. For exam practice, open the Mock Exams page from the top menu.";
  if (/tool|calculator/.test(q)) return "AI providers are temporarily unavailable. Open the Tools page for calculators and student helpers.";
  if (/broken|report|not working/.test(q)) return "AI providers are temporarily unavailable. To report an issue, open Help and send the page URL, subject code, button name, screenshot, and what happened.";
  return "AI providers are temporarily unavailable. Try again later, or use Revision 2021, Tools, Mock Exams, and Help from the top menu.";
}

async function getCached(env, key) {
  if (!env.ASK_POLY_CACHE) return null;
  try {
    const value = await env.ASK_POLY_CACHE.get(key, "json");
    if (value?.answer) return value;
  } catch (_) {}
  return null;
}

async function putCached(env, key, value) {
  if (!env.ASK_POLY_CACHE) return;
  try {
    await env.ASK_POLY_CACHE.put(key, JSON.stringify(value), { expirationTtl: 60 * 60 * 12 });
  } catch (_) {}
}

async function handleAsk(request, env) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 40_000) return jsonResponse(request, { error: "Message too large" }, 413);

  const body = await request.json().catch(() => null);
  const message = normalizeText(body?.message);
  const history = Array.isArray(body?.history) ? body.history : [];

  if (!message) return jsonResponse(request, { error: "Empty message" }, 400);
  if (message.length > 7000) return jsonResponse(request, { error: "Message too long" }, 413);

  const math = localMathAnswer(message);
  if (math) return jsonResponse(request, math, 200);

  const cacheKey = hashKey(`${message}|${history.slice(-2).map((m) => m.content).join("|")}`);
  const cached = await getCached(env, cacheKey);
  if (cached) return jsonResponse(request, { ...cached, cached: true });

  const messages = buildMessages(message, history);
  const errors = [];
  const providers = [callNvidia, callOpenAI, callGemini, callOpenRouter];

  for (const provider of providers) {
    try {
      const result = await provider(env, messages);
      const response = { answer: result.answer, provider: result.provider, cached: false };
      await putCached(env, cacheKey, response);
      return jsonResponse(request, response);
    } catch (error) {
      errors.push(error.message || String(error));
    }
  }

  const fallback = { answer: localFallback(message), provider: "local-fallback", cached: false, errors: errors.slice(0, 4) };
  return jsonResponse(request, fallback, 200);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(request) });

    const url = new URL(request.url);
    if (url.pathname !== "/api/ask-poly") {
      return jsonResponse(request, { error: "Not found" }, 404);
    }
    if (request.method !== "POST") {
      return jsonResponse(request, { error: "Method not allowed" }, 405);
    }

    try {
      return await handleAsk(request, env);
    } catch (error) {
      return jsonResponse(request, {
        answer: "Ask POLY backend had an internal error. Use website search, Revision 2021, Tools, or Help page for now.",
        provider: "error-fallback",
        error: error.message || String(error)
      }, 200);
    }
  }
};
