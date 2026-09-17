const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("assets/js/ask-poly-offline.js", "utf8");
const context = { console, globalThis: {} };
vm.createContext(context);
vm.runInContext(source, context);
const assistant = context.globalThis.AskPolyOffline;

const tests = [
  ["chain force then work", "a 50 kg object accelerates at 3 m/s2, find force then work over 10 m", ["F = ma", "150 N", "W = Fd", "1500 J"]],
  ["chain with named values", "find force then work: mass 4 kg, acceleration 2 m/s2, distance 5 m", ["8 N", "40 J"]],
  ["explicit power", "find electrical power with voltage 230 and current 2", ["P = 460 W", "P = VI"]],
  ["ohm law regression", "find resistance with voltage 12 and current 3", ["R = 4 Ω", "R = V/I"]],
  ["single force regression", "calculate force with mass 4 and acceleration 3", ["F = 12 N"]],
  ["force work kinetic chain", "a 10 kg object accelerates at 2 m/s2 through 5 m from rest; find force, work, and final kinetic energy", ["Step 1: F = ma", "20 N", "Step 2: W = Fd", "100 J", "Step 3: KE = W", "Chained calculation"]],
  ["potential energy speed chain", "a 2 kg object falls through 5 m; find gravitational potential energy and speed just before impact, ignoring losses", ["Step 1: PE = mgh", "98.0665 J", "Step 2: v =", "9.9028531242 m/s", "Chained calculation"]],
  ["potential speed custom gravity", "find potential energy and impact speed with mass 5 kg, height 10 m, gravity 9.8", ["490 J", "14 m/s"]],
  ["missing potential chain input", "find gravitational potential energy and impact speed for a 2 kg object", []],
  ["missing chain input", "a 50 kg object accelerates at 3 m/s2, find force then work", []]
];

for (const [name, question, expected] of tests) {
  const answer = assistant.answer(question, null) || "";
  for (const fragment of expected) {
    if (!answer.includes(fragment)) throw new Error(`${name}: missing ${fragment}; got ${answer}`);
  }
  if (name === "missing chain input" && answer.includes("Chained calculation:")) {
    throw new Error(`${name}: unexpectedly calculated without distance`);
  }
  console.log(`${name}: ${answer.replace(/\n/g, " | ") || "null"}`);
}

if (assistant.version !== "20260813-offline-science3") {
  throw new Error(`unexpected version: ${assistant.version}`);
}
console.log(`version: ${assistant.version}`);
console.log("All chained offline assistant tests passed.");
