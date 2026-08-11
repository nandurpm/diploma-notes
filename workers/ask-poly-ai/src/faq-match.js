/* Purpose: Matches an incoming user question against the preloaded FAQ_ENTRIES
 * in faq-data.js. Runs before any AI provider is called, so a matched
 * question gets an instant, guaranteed-consistent answer with zero AI cost.
 *
 * Matching strategy (kept deliberately simple/fast for a Worker):
 * 1. Normalize both the incoming question and every stored phrasing
 *    (lowercase, strip punctuation, collapse whitespace).
 * 2. Exact match first (cheap, catches most real cases).
 * 3. If no exact match, fall back to word-overlap scoring so close
 *    paraphrases still match (e.g. missing a word, different word order).
 */
import { FAQ_ENTRIES } from "./faq-data.js";

const OVERLAP_THRESHOLD = 0.72; // 0-1. Raise to be stricter, lower to catch more paraphrases.

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return new Set(normalize(text).split(" ").filter(Boolean));
}

function overlapScore(aTokens, bTokens) {
  if (!aTokens.size || !bTokens.size) return 0;
  let shared = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) shared += 1;
  }
  return shared / Math.max(aTokens.size, bTokens.size);
}

// Build a lookup table once per Worker instance (module scope), not per request.
const exactLookup = new Map();
const tokenizedEntries = [];

for (const entry of FAQ_ENTRIES) {
  for (const phrasing of entry.questions || []) {
    const normalized = normalize(phrasing);
    if (normalized) exactLookup.set(normalized, entry);
  }
  tokenizedEntries.push({
    entry,
    tokenSets: (entry.questions || []).map((phrasing) => tokenize(phrasing))
  });
}

/**
 * Returns { answer, provider, ... } if the message matches a preloaded
 * FAQ entry, otherwise null (caller should continue to the next fallback,
 * e.g. local math, then the AI providers).
 */
export function matchFaq(message) {
  const normalized = normalize(message);
  if (!normalized) return null;

  const exact = exactLookup.get(normalized);
  if (exact) return buildFaqResult(exact);

  const messageTokens = tokenize(message);
  let best = null;
  let bestScore = 0;

  for (const { entry, tokenSets } of tokenizedEntries) {
    for (const tokenSet of tokenSets) {
      const score = overlapScore(messageTokens, tokenSet);
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
  }

  if (best && bestScore >= OVERLAP_THRESHOLD) return buildFaqResult(best);
  return null;
}

function buildFaqResult(entry) {
  return {
    answer: entry.answer,
    citations: [],
    usedWeb: false,
    provider: "preloaded-faq",
    model: "ask-poly-faq",
    responseId: entry.id || ""
  };
}
