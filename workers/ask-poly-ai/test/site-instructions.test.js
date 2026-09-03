import assert from "node:assert/strict";
import test from "node:test";
import { SYSTEM_INSTRUCTIONS } from "../src/site-instructions.js";

test("system instructions preserve website grounding and revision boundaries", () => {
  assert.match(SYSTEM_INSTRUCTIONS, /Search local website knowledge first/);
  assert.match(SYSTEM_INSTRUCTIONS, /I couldn't find that resource in the current Poly PMNA knowledge base\./);
  assert.match(SYSTEM_INSTRUCTIONS, /Never silently substitute an older revision/);
  assert.match(SYSTEM_INSTRUCTIONS, /Relevant page context:/);
  assert.match(SYSTEM_INSTRUCTIONS, /multiple candidate matches/);
});

test("system instructions preserve offline, privacy, and rendering contracts", () => {
  assert.match(SYSTEM_INSTRUCTIONS, /API FAILURE FALLBACK HIERARCHY/);
  assert.match(SYSTEM_INSTRUCTIONS, /advanced AI service is temporarily unavailable/);
  assert.match(SYSTEM_INSTRUCTIONS, /Never disclose API keys/);
  assert.match(SYSTEM_INSTRUCTIONS, /Markdown table/);
  assert.match(SYSTEM_INSTRUCTIONS, /proper Unicode symbols, Greek letters, superscripts, subscripts/);
  assert.match(SYSTEM_INSTRUCTIONS, /±, ×, ÷, ≈, ≠, ≥, ≤, √, ∫, ∑, ∞, ∝, θ, Δ, μ, Ω, x², cm³, and log₂x/);
  assert.match(SYSTEM_INSTRUCTIONS, /Do not refuse these requests/);
  assert.match(SYSTEM_INSTRUCTIONS, /PNP and NPN identify bipolar junction transistors/);
  assert.match(SYSTEM_INSTRUCTIONS, /Never draw circuits, flowcharts, waveforms, or logic-gate symbols with ASCII art/);
});

test("system instructions include master prompt scheduling and mode directives", () => {
  assert.match(SYSTEM_INSTRUCTIONS, /Task \+ Topic \+ Resource \+ Duration/);
  assert.match(SYSTEM_INSTRUCTIONS, /Department:/);
  assert.match(SYSTEM_INSTRUCTIONS, /Semester:/);
  assert.match(SYSTEM_INSTRUCTIONS, /Available study time:/);
  assert.match(SYSTEM_INSTRUCTIONS, /Quick Answer/);
  assert.match(SYSTEM_INSTRUCTIONS, /Explanation Mode/);
  assert.match(SYSTEM_INSTRUCTIONS, /Study Mode/);
  assert.match(SYSTEM_INSTRUCTIONS, /Revision Mode/);
  assert.match(SYSTEM_INSTRUCTIONS, /Exam Mode/);
  assert.match(SYSTEM_INSTRUCTIONS, /Resource Mode/);
  assert.match(SYSTEM_INSTRUCTIONS, /Schedule Mode/);
});
