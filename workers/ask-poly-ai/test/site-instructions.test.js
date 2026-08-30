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
  assert.match(SYSTEM_INSTRUCTIONS, /FIVE-LEVEL FALLBACK HIERARCHY/);
  assert.match(SYSTEM_INSTRUCTIONS, /advanced AI service is temporarily unavailable/);
  assert.match(SYSTEM_INSTRUCTIONS, /Never disclose API keys/);
  assert.match(SYSTEM_INSTRUCTIONS, /Markdown table/);
  assert.match(SYSTEM_INSTRUCTIONS, /proper Unicode symbols, Greek letters, superscripts, subscripts/);
  assert.match(SYSTEM_INSTRUCTIONS, /±, ×, ÷, ≈, ≠, ≥, ≤, √, ∫, ∑, ∞, ∝, θ, Δ, μ, Ω, x², cm³, and log₂x/);
  assert.match(SYSTEM_INSTRUCTIONS, /Do not refuse these requests/);
  assert.match(SYSTEM_INSTRUCTIONS, /PNP and NPN identify bipolar junction transistors/);
});
