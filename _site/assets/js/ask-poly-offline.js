/* Ask POLY provider-independent answers and deterministic calculations. */
(() => {
  "use strict";

  const EPSILON = 1e-10;
  const n = (value) => Number(value);
  const fmt = (value, digits = 10) => {
    if (!Number.isFinite(value)) return "not a finite value";
    const rounded = Math.abs(value - Math.round(value)) < EPSILON ? Math.round(value) : Number(value.toFixed(digits));
    return String(rounded);
  };
  const clean = (value) => String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
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
    .replace(/\b(?:into|times|multiplied by)\b/gi, "*")
    .replace(/\b(?:divided by|over)\b/gi, "/")
    .replace(/\b(?:power of|raised to)\b/gi, "^")
    .replace(/\s+/g, " ")
    .trim();

  function evaluate(raw, radians = false) {
    const source = clean(raw).toLowerCase().replace(/\s+/g, "").replace(/\[/g, "(").replace(/\]/g, ")");
    let index = 0;
    const peek = () => source[index] || "";
    const consume = (value) => source[index] === value ? (index += 1, true) : false;
    const alpha = (value) => /[a-z_]/i.test(value);
    const primaryStart = () => peek() === "(" || peek() === "." || /[0-9]/.test(peek()) || alpha(peek());
    const parseNumber = () => {
      const start = index;
      while (/[0-9.]/.test(peek())) index += 1;
      const rawNumber = source.slice(start, index);
      if (!rawNumber || rawNumber === ".") throw new Error("Invalid number");
      const value = Number(rawNumber);
      if (!Number.isFinite(value)) throw new Error("Invalid number");
      return value;
    };
    const parseName = () => {
      const start = index;
      while (alpha(peek()) || /[0-9]/.test(peek())) index += 1;
      return source.slice(start, index);
    };
    const angle = (value) => radians ? value : value * Math.PI / 180;
    const call = (name, args) => {
      const value = args[0];
      if (name === "sin") return Math.sin(angle(value));
      if (name === "cos") return Math.cos(angle(value));
      if (name === "tan") return Math.tan(angle(value));
      if (name === "asin") return radians ? Math.asin(value) : Math.asin(value) * 180 / Math.PI;
      if (name === "acos") return radians ? Math.acos(value) : Math.acos(value) * 180 / Math.PI;
      if (name === "atan") return radians ? Math.atan(value) : Math.atan(value) * 180 / Math.PI;
      if (name === "sqrt") return Math.sqrt(value);
      if (name === "cbrt") return Math.cbrt(value);
      if (name === "abs") return Math.abs(value);
      if (name === "log") return Math.log10(value);
      if (name === "ln") return Math.log(value);
      if (name === "exp") return Math.exp(value);
      if (name === "pow") return Math.pow(args[0], args[1]);
      if (name === "min") return Math.min(...args);
      if (name === "max") return Math.max(...args);
      throw new Error(`Unsupported function: ${name}`);
    };
    const parseExpression = () => {
      let value = parseTerm();
      while (true) {
        if (consume("+")) value += parseTerm();
        else if (consume("-")) value -= parseTerm();
        else break;
      }
      return value;
    };
    const parsePrimary = () => {
      if (consume("(")) {
        const value = parseExpression();
        if (!consume(")")) throw new Error("Missing closing bracket");
        return value;
      }
      if (/[0-9.]/.test(peek())) return parseNumber();
      if (alpha(peek())) {
        const name = parseName();
        if (name === "pi") return Math.PI;
        if (name === "e") return Math.E;
        if (!consume("(")) return call(name, [parseUnary()]);
        const args = [];
        if (!consume(")")) {
          do args.push(parseExpression()); while (consume(","));
          if (!consume(")")) throw new Error("Missing closing bracket");
        }
        return call(name, args);
      }
      throw new Error("Invalid expression");
    };
    const parseUnary = () => consume("+") ? parseUnary() : consume("-") ? -parseUnary() : parsePower();
    const parsePower = () => {
      const value = parsePrimary();
      return consume("^") ? Math.pow(value, parseUnary()) : value;
    };
    const parseTerm = () => {
      let value = parseUnary();
      while (true) {
        if (consume("*")) value *= parseUnary();
        else if (consume("/")) value /= parseUnary();
        else if (primaryStart()) value *= parseUnary();
        else break;
      }
      return value;
    };
    const result = parseExpression();
    if (index < source.length || !Number.isFinite(result)) throw new Error("Invalid or non-finite expression");
    return result;
  }

  const unitGroups = {
    length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
    mass: { mg: 1e-6, g: 0.001, kg: 1, tonne: 1000, lb: 0.45359237 },
    area: { mm2: 1e-6, cm2: 1e-4, m2: 1, km2: 1e6, ft2: 0.09290304, acre: 4046.8564224 },
    volume: { ml: 0.001, l: 1, cm3: 0.001, m3: 1000, ft3: 28.316846592, gallon: 3.785411784 },
    pressure: { pa: 1, kpa: 1000, mpa: 1e6, bar: 100000, psi: 6894.757293, atm: 101325 },
    energy: { j: 1, kj: 1000, wh: 3600, kwh: 3600000, cal: 4.184, kcal: 4184 },
    power: { w: 1, kw: 1000, mw: 1e6, hp: 745.699872 },
    speed: { mps: 1, kmh: 1 / 3.6, mph: 0.44704, knot: 0.514444 },
    frequency: { hz: 1, khz: 1000, mhz: 1e6, ghz: 1e9 }
  };

  function named(q, labels) {
    const pattern = labels.join("|");
    const match = q.match(new RegExp(`(?:^|\\b)(?:${pattern})\\s*(?:=|:|is|of|at|with)?\\s*(-?\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?)`, "i"));
    return match ? Number(match[1]) : null;
  }

  function conversion(q) {
    const match = q.match(/(?:convert|change|how much is|what is)\s*(-?\d+(?:\.\d+)?)\s*([a-z0-9²³^]+)\s*(?:to|in|into)\s*([a-z0-9²³^]+)/i);
    if (!match) return null;
    const value = Number(match[1]);
    const from = match[2].toLowerCase().replace(/[²³^]/g, "");
    const to = match[3].toLowerCase().replace(/[²³^]/g, "");
    for (const [group, map] of Object.entries(unitGroups)) {
      if (map[from] && map[to]) return `Answer: ${fmt(value * map[from] / map[to])} ${to}\n\nConversion group: ${group}.`;
    }
    if (["c", "f", "k"].includes(from) && ["c", "f", "k"].includes(to)) {
      const celsius = from === "f" ? (value - 32) * 5 / 9 : from === "k" ? value - 273.15 : value;
      const output = to === "f" ? celsius * 9 / 5 + 32 : to === "k" ? celsius + 273.15 : celsius;
      return `Answer: ${fmt(output)} °${to.toUpperCase()}\n\nTemperature conversion.`;
    }
    return null;
  }

  function geometry(q) {
    let m = q.match(/area.*circle.*(?:radius|r)\s*(?:=|is)?\s*(-?\d+(?:\.\d+)?)/i);
    if (m) return `Answer: ${fmt(Math.PI * Number(m[1]) ** 2)} square units\n\nFormula: A = πr².`;
    m = q.match(/(?:area|volume).*sphere.*(?:radius|r)\s*(?:=|is)?\s*(-?\d+(?:\.\d+)?)/i);
    if (m && /volume/.test(q)) return `Answer: ${fmt(4 * Math.PI * Number(m[1]) ** 3 / 3)} cubic units\n\nFormula: V = 4πr³/3.`;
    m = q.match(/area.*triangle.*(?:base|b)\s*(?:=|is)?\s*(-?\d+(?:\.\d+)?).*?(?:height|h)\s*(?:=|is)?\s*(-?\d+(?:\.\d+)?)/i);
    if (m) return `Answer: ${fmt(Number(m[1]) * Number(m[2]) / 2)} square units\n\nFormula: A = ½bh.`;
    m = q.match(/volume.*(?:cylinder|cyl).*?(?:radius|r)\s*(?:=|is)?\s*(-?\d+(?:\.\d+)?).*?(?:height|h)\s*(?:=|is)?\s*(-?\d+(?:\.\d+)?)/i);
    if (m) return `Answer: ${fmt(Math.PI * Number(m[1]) ** 2 * Number(m[2]))} cubic units\n\nFormula: V = πr²h.`;
    return null;
  }

  function science(q) {
    const mass = named(q, ["mass", "m"]);
    const acceleration = named(q, ["acceleration", "a"]);
    const force = named(q, ["force", "f"]);
    const voltage = named(q, ["voltage", "v"]);
    const current = named(q, ["current", "i"]);
    const resistance = named(q, ["resistance", "r"]);
    const distance = named(q, ["distance", "d", "length"]);
    const time = named(q, ["time", "t"]);
    const speed = named(q, ["speed", "velocity", "u", "v"]);
    const height = named(q, ["height", "h"]);
    const volume = named(q, ["volume"]);
    const density = named(q, ["density", "rho"]);
    const frequency = named(q, ["frequency", "f"]);
    const wavelength = named(q, ["wavelength", "lambda"]);

    if ((/ohm|resistance|voltage|current/.test(q)) && (voltage !== null || current !== null || resistance !== null)) {
      if (voltage === null && current !== null && resistance !== null) return `Answer: V = ${fmt(current * resistance)} V\n\nOhm's law: V = IR.`;
      if (current === null && voltage !== null && resistance !== null && resistance !== 0) return `Answer: I = ${fmt(voltage / resistance)} A\n\nOhm's law: I = V/R.`;
      if (resistance === null && voltage !== null && current !== null && current !== 0) return `Answer: R = ${fmt(voltage / current)} Ω\n\nOhm's law: R = V/I.`;
    }
    if (/power|electrical power/.test(q) && voltage !== null && current !== null) return `Answer: P = ${fmt(voltage * current)} W\n\nFormula: P = VI.`;
    if (/force|newton/.test(q) && mass !== null && acceleration !== null) return `Answer: F = ${fmt(mass * acceleration)} N\n\nNewton's second law: F = ma.`;
    if (/acceleration/.test(q) && force !== null && mass !== null && mass !== 0) return `Answer: a = ${fmt(force / mass)} m/s²\n\nFormula: a = F/m.`;
    if (/density/.test(q) && mass !== null && volume !== null && volume !== 0) return `Answer: ρ = ${fmt(mass / volume)} kg/m³ (for SI inputs)\n\nFormula: ρ = m/V.`;
    if (/work|mechanical work/.test(q) && force !== null && distance !== null) return `Answer: W = ${fmt(force * distance)} J\n\nFormula: W = Fd for parallel force and displacement.`;
    if (/kinetic energy|kinetic/.test(q) && mass !== null && speed !== null) return `Answer: KE = ${fmt(0.5 * mass * speed ** 2)} J\n\nFormula: KE = ½mv².`;
    if (/potential energy|gravitational/.test(q) && mass !== null && height !== null) return `Answer: PE = ${fmt(mass * 9.80665 * height)} J\n\nFormula: PE = mgh, using g = 9.80665 m/s².`;
    if (/speed|velocity/.test(q) && distance !== null && time !== null && time !== 0) return `Answer: v = ${fmt(distance / time)} m/s\n\nFormula: v = d/t.`;
    if (/frequency/.test(q) && time !== null && time !== 0) return `Answer: f = ${fmt(1 / time)} Hz\n\nFormula: f = 1/T.`;
    if (/wavelength/.test(q) && frequency !== null && frequency !== 0) return `Answer: λ = ${fmt(299792458 / frequency)} m\n\nFormula: λ = c/f, using c = 299,792,458 m/s.`;
    if (/wavelength/.test(q) && speed !== null && frequency !== null && frequency !== 0) return `Answer: λ = ${fmt(speed / frequency)} m\n\nFormula: λ = v/f.`;
    return null;
  }

  function arithmetic(q) {
    const isCalculation = /\b(calculate|evaluate|simplify|solve|what is|value of|find)\b/.test(q) || /[0-9][\s]*(?:[+\-*/^()]|%)/.test(q);
    if (!isCalculation) return null;
    let expression = clean(q)
      .toLowerCase()
      .replace(/\b(?:please|calculate|evaluate|simplify|solve|what is|what's|value of|the value of|find|answer|give me|show steps?|in degrees?|in radians?)\b/g, " ")
      .replace(/,/g, "")
      .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")
      .replace(/[^0-9a-z+\-*/^().,\s]/g, " ")
      .replace(/\s+/g, "")
      .trim();
    if (!expression || expression.includes("=") || !/[0-9)]/.test(expression)) return null;
    try {
      const value = evaluate(expression, /\brad(?:ian|ians)?\b/.test(q));
      return `Answer: ${fmt(value)}\n\nLocal calculation completed without an external AI provider.`;
    } catch (_) {
      return null;
    }
  }

  const websiteAnswers = [
    [/where.*revision\s*2026|revision\s*2026.*(department|subject|course)/, "Open [Revision 2026](/revision-2026.html), choose your department, then select Semester 1–6 and a subject card."],
    [/where.*revision\s*2021|revision\s*2021.*(department|subject|course)/, "Open [Revision 2021](/revision-2021.html), select your department, and browse the semester subject cards."],
    [/revision\s*2026.*revision\s*2021|same.*revision|difference.*revision/, "Revision 2026 and Revision 2021 are separate curriculum areas. Always use the requested revision because subject codes, semester placement, resources and syllabus links can differ."],
    [/where.*2015|old.*scheme|2015.*material/, "Open [2015 Materials](/materials-2015.html). It is separate from Revision 2021 and Revision 2026."],
    [/official.*syllabus|syllabus.*link|sample.*question|question.*paper/, "Open a subject card and choose **Open Syllabus** or **Sample Question Paper**. Those buttons open official SITTTR Kerala resources for the subject code."],
    [/lesson.*(missing|unavailable|not)|why.*lesson/, "A Lesson button appears only when the correct revision-specific lesson page exists. Revision 2026 lessons are never substituted with Revision 2021 lessons."],
    [/note.*(missing|unavailable|not)|download.*note/, "Notes are shown only when the matching revision-specific PDF has been uploaded. If unavailable, use the official syllabus and sample paper links on the subject card."],
    [/subject.*code|find.*code|code.*available/, "Use Ask POLY with the full subject code, or open the relevant revision and department page. Ask POLY can identify the revision, semester, department and available links when that record exists."],
    [/mock|quiz|exam.*practice/, "Open [Mock Exams](/daily-quiz.html) for practice tests, quizzes and exam-oriented revision activities."],
    [/calculator|converter|student.*tool|tools/, "Open [Student Tools](/tools.html). It includes expression, unit, percentage, electrical, electronics, engineering, attendance, CGPA and study-planning calculators."],
    [/website.*(not working|broken)|broken.*(link|button)|report.*problem|report.*issue/, "Open [Help](/contact.html) and provide the page URL, revision, department, semester, subject code, button name, screenshot and what happened."],
    [/ask.*poly.*(save|saved)|saved.*chat|conversation/, "Ask POLY saves conversations in this browser’s local storage/IndexedDB. Clearing app data or browser site data can remove saved chats; normal reload does not."],
    [/ai.*(not|isn't|isnt).*respond|api.*(key|not)|provider|offline|without.*ai/, "Ask POLY has a local fallback. Website navigation answers, common mathematics, unit conversions and common physics/electrical formulas can still work when external AI providers are unavailable."],
    [/download.*apk|android.*app|app.*download|version.*3\.10/, "Download the current Android app from the homepage. The signed release is [POLY PMNA v3.10](https://github.com/nandurpm/diploma-notes/releases/download/android-v3.10/POLY_PMNA_v3.10.apk)."],
    [/mobile|android.*scroll|scroll.*chat|recent.*apps/, "On Android, reload Ask POLY after an update. The APK uses a dedicated scrollable transcript and keeps the app task in Recent Apps. Use the app refresh button if an older cached page is shown."],
    [/privacy|data|local.*chat/, "Saved Ask POLY chats are stored locally in the browser or APK WebView. The external AI request is sent only when the online provider path is used; do not enter passwords, OTPs or sensitive personal information."],
    [/home.*page|main.*area|navigation|where.*go/, "The main areas are Home, Revision 2026, Revision 2021, Mock Exams, Ask POLY AI, 2015 Materials, Student Tools and Help."],
  ];

  function websiteAnswer(q) {
    const normalized = clean(q).toLowerCase();
    for (const [pattern, answer] of websiteAnswers) if (pattern.test(normalized)) return answer;
    return null;
  }

  function answer(message, retrieval) {
    const q = String(message || "").trim();
    if (!q) return null;
    const normalized = clean(q).toLowerCase();
    return science(normalized) || conversion(normalized) || geometry(normalized) || arithmetic(normalized) || websiteAnswer(normalized) || retrieval?.fallbackAnswer || retrieval?.answer || null;
  }

  globalThis.AskPolyOffline = Object.freeze({ answer, evaluate, version: "20260813-offline-science1" });
})();

/* End of provider-independent Ask POLY assistant. */
