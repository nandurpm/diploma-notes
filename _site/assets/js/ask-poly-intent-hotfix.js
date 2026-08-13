/* Purpose: Ask poly intent hotfix - Descriptive comment added for clarity */
(() => {
  "use strict";

  if (!/\/ask-poly\.html$/i.test(location.pathname)) return;

  const SITE_WORDS = /\b(subject|subjects|syllabus|notes|note|lesson|lessons|download|department|semester|revision|rev\s*2021|sitttr|sample\s*qp|question\s*paper|mock|quiz|exam|tool|calculator|materials?|2015|broken|report|website|site|page|link|open|find|search)\b/i;
  const CODE_PATTERN = /\b\d{4}[a-z]?\b/i;
  const CASUAL_OR_MATH = /\b(hi|hello|hey|how are you|what are you|who are you|ask me|math|maths|problem|calculate|answer|solve|joke|story|poem|translate|explain this|i said|i am not asking)\b/i;

  function shouldUseWebsiteSearch(message) {
    const text = String(message || "").trim();
    if (!text) return false;
    if (/^\d{1,3}$/.test(text)) return false;
    if (CASUAL_OR_MATH.test(text) && !SITE_WORDS.test(text) && !CODE_PATTERN.test(text)) return false;
    if (CODE_PATTERN.test(text) && /\b(subject|syllabus|notes|lesson|code|course|qp|question paper)\b/i.test(text)) return true;
    return SITE_WORDS.test(text);
  }

  function extractUserMessage(payload) {
    return String(payload?.history?.at?.(-1)?.content || payload?.message || "")
      .replace(/[\s\S]*User question:\s*/i, "")
      .replace(/[\s\S]*Question:\s*/i, "")
      .split("--- ASK POLY INTERFACE REQUIREMENTS ---")[0]
      .trim();
  }

  function installHotfix() {
    if (window.ASK_POLY_INTENT_HOTFIX_INSTALLED) return;
    window.ASK_POLY_INTENT_HOTFIX_INSTALLED = true;
    window.ASK_POLY_SHOULD_WEBSITE_SEARCH = shouldUseWebsiteSearch;

    const originalFetch = window.fetch.bind(window);
    window.fetch = function patchedAskPolyFetch(input, init = {}) {
      try {
        const url = typeof input === "string" ? input : input?.url || "";
        const endpoint = window.ASK_POLY_CONFIG?.endpoint || "";
        const isAskPoly = endpoint && String(url).includes(endpoint);
        if (isAskPoly && init?.body) {
          const payload = JSON.parse(init.body);
          const message = extractUserMessage(payload);
          if (!shouldUseWebsiteSearch(message)) {
            payload.localContext = "";
            if (typeof payload.message === "string") {
              payload.message = payload.message
                .replace(/\nRelevant website data:\n[\s\S]*?\n\nUser question:/, "\nUser question:")
                .replace("Your job is to guide students through this website and Kerala Polytechnic study navigation.", "Your main job is website guidance, but for casual conversation or simple math practice, answer the user directly and do not search website subjects.");
            }
            init = { ...init, body: JSON.stringify(payload) };
          }
        }
      } catch (error) {
        console.warn("Ask POLY intent hotfix skipped fetch patch", error);
      }
      return originalFetch(input, init);
    };
  }

  installHotfix();
})();
