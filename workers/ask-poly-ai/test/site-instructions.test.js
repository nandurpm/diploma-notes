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
  assert.match(SYSTEM_INSTRUCTIONS, /API FAILURE FALLBACK/);
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

test("system instructions cover complete 36-section master prompt structure and rules", () => {
  assert.match(SYSTEM_INSTRUCTIONS, /1\. COMPLETE WEBSITE KNOWLEDGE/);
  assert.match(SYSTEM_INSTRUCTIONS, /2\. BUILD A LOCAL WEBSITE KNOWLEDGE SNAPSHOT/);
  assert.match(SYSTEM_INSTRUCTIONS, /3\. DAILY KNOWLEDGE REFRESH/);
  assert.match(SYSTEM_INSTRUCTIONS, /4\. DAILY SCHEDULER/);
  assert.match(SYSTEM_INSTRUCTIONS, /5\. SCHEDULE GENERATION RULES/);
  assert.match(SYSTEM_INSTRUCTIONS, /6\. EXAMPLE DAILY SCHEDULE/);
  assert.match(SYSTEM_INSTRUCTIONS, /7\. RESOURCE-AWARE SCHEDULING/);
  assert.match(SYSTEM_INSTRUCTIONS, /8\. FULL WEBSITE SEARCH/);
  assert.match(SYSTEM_INSTRUCTIONS, /9\. FUZZY SEARCH/);
  assert.match(SYSTEM_INSTRUCTIONS, /10\. REVISION-AWARE ANSWERS/);
  assert.match(SYSTEM_INSTRUCTIONS, /11\. API FAILURE FALLBACK/);
  assert.match(SYSTEM_INSTRUCTIONS, /12\. OFFLINE \/ API-INDEPENDENT MODE/);
  assert.match(SYSTEM_INSTRUCTIONS, /13\. WHEN THE API IS AVAILABLE/);
  assert.match(SYSTEM_INSTRUCTIONS, /14\. WEBSITE FACTS VS AI KNOWLEDGE/);
  assert.match(SYSTEM_INSTRUCTIONS, /15\. NO-HALLUCINATION RULE/);
  assert.match(SYSTEM_INSTRUCTIONS, /16\. RESOURCE LINK GENERATION/);
  assert.match(SYSTEM_INSTRUCTIONS, /17\. STUDY ASSISTANT MODE/);
  assert.match(SYSTEM_INSTRUCTIONS, /18\. STUDENT-FRIENDLY RESPONSE STYLE/);
  assert.match(SYSTEM_INSTRUCTIONS, /19\. MULTILINGUAL SUPPORT/);
  assert.match(SYSTEM_INSTRUCTIONS, /20\. DAILY STUDY RECOMMENDATION/);
  assert.match(SYSTEM_INSTRUCTIONS, /21\. EXAM PREPARATION MODE/);
  assert.match(SYSTEM_INSTRUCTIONS, /22\. RESOURCE RECOMMENDATION/);
  assert.match(SYSTEM_INSTRUCTIONS, /23\. SMART QUESTION UNDERSTANDING/);
  assert.match(SYSTEM_INSTRUCTIONS, /24\. CONTEXT AWARENESS/);
  assert.match(SYSTEM_INSTRUCTIONS, /25\. DAILY AUTOMATED KNOWLEDGE TASK/);
  assert.match(SYSTEM_INSTRUCTIONS, /26\. KNOWLEDGE VERSION/);
  assert.match(SYSTEM_INSTRUCTIONS, /27\. CACHE FREQUENT QUESTIONS/);
  assert.match(SYSTEM_INSTRUCTIONS, /28\. DETERMINISTIC FALLBACK RESPONSES/);
  assert.match(SYSTEM_INSTRUCTIONS, /29\. API ERROR HANDLING/);
  assert.match(SYSTEM_INSTRUCTIONS, /30\. RESPONSE PRIORITY/);
  assert.match(SYSTEM_INSTRUCTIONS, /31\. USER-FACING API FAILURE MESSAGE/);
  assert.match(SYSTEM_INSTRUCTIONS, /32\. SECURITY/);
  assert.match(SYSTEM_INSTRUCTIONS, /33\. DATA INTEGRITY/);
  assert.match(SYSTEM_INSTRUCTIONS, /34\. NEVER LOSE WORKING KNOWLEDGE/);
  assert.match(SYSTEM_INSTRUCTIONS, /35\. FINAL RESPONSE QUALITY/);
  assert.match(SYSTEM_INSTRUCTIONS, /36\. MAIN GOAL/);
  assert.match(SYSTEM_INSTRUCTIONS, /Make the entire Poly PMNA website searchable, understandable, useful, and available to students at all times/);
});
