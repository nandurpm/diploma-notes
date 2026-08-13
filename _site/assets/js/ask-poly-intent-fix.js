/* Purpose: Ask poly intent fix - Descriptive comment added for clarity */
(() => {
  "use strict";

  if (!/\/ask-poly(?:-v2)?\.html$/i.test(location.pathname)) return;

  function normalize(text) {
    return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function looksLikeAcademicProblem(text) {
    const q = normalize(text);
    return /\b(find|solve|calculate|evaluate|simplify|prove|derive|differentiate|integrate|factor|expand|determine)\b/.test(q)
      && (/\\vec|\\hat|\\lambda|\\mu|\^|\+|=|\(|\)|\bline\b|\blines\b|\bdistance\b|\bvector\b|\bmatrix\b|\bintegral\b|\bderivative\b|\bsum\b|\bnumbers?\b|\bangle\b|\btriangle\b|\bcircle\b/.test(q));
  }

  function isWebsiteIntent(text) {
    const q = normalize(text);
    if (!q || /^\d{1,3}$/.test(q)) return false;
    if (looksLikeAcademicProblem(q)) return false;

    const siteTerms = /\b(subjects?|syllabus|notes?|lessons?|departments?|semesters?|revision\s*2021|sitttr|qp|question\s*paper|model\s*question|mock\s*exams?|quiz|tools?|materials?\s*2015|broken\s*links?|report\s*issue|download\s*notes?)\b/;
    const pageIntent = /\b(open|show|where|find|search|link|page|website)\b.*\b(home|revision|materials|tools|ask\s*poly|mock|notes?|syllabus|subject|department)\b/;
    return siteTerms.test(q) || pageIntent.test(q);
  }

  function install() {
    const api = window.AskPolyKnowledge;
    if (!api || typeof api.searchKnowledge !== "function" || api.__intentFixed) return false;
    const original = api.searchKnowledge.bind(api);
    window.AskPolyKnowledge = Object.freeze({
      ...api,
      __intentFixed: true,
      async searchKnowledge(message) {
        return isWebsiteIntent(message) ? original(message) : null;
      }
    });
    return true;
  }

  if (!install()) {
    const timer = setInterval(() => {
      if (install()) clearInterval(timer);
    }, 30);
    setTimeout(() => clearInterval(timer), 3000);
  }
})();
