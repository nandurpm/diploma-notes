(() => {
  "use strict";

  if (!/\/ask-poly(?:-v2)?\.html$/i.test(location.pathname)) return;

  let knowledgePromise = null;

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function score(query, itemText) {
    const q = normalize(query);
    const t = normalize(itemText);
    if (!q || !t) return 0;
    let total = t.includes(q) ? 10 : 0;
    q.split(/\s+/).filter(Boolean).forEach((word) => {
      if (word.length < 3) return;
      if (t.includes(word)) total += word.length >= 5 ? 3 : 1;
    });
    return total;
  }

  async function loadKnowledge() {
    if (knowledgePromise) return knowledgePromise;
    knowledgePromise = fetch("/assets/data/ask-poly-knowledge.json?v=20260629-phase-1", { cache: "reload" })
      .then((response) => response.ok ? response.json() : null)
      .catch(() => null);
    return knowledgePromise;
  }

  async function searchKnowledge(query) {
    const data = await loadKnowledge();
    if (!data) return null;

    const pageMatches = (data.pages || [])
      .map((page) => ({
        page,
        score: score(query, `${page.title} ${page.summary} ${(page.keywords || []).join(" ")} ${page.url}`)
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const faqMatches = (data.faq || [])
      .map((faq) => ({ faq, score: score(query, `${faq.question} ${faq.answer}`) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    const parts = [];
    if (faqMatches.length) {
      parts.push(faqMatches.map(({ faq }) => `**${faq.question}**\n${faq.answer}`).join("\n\n"));
    }
    if (pageMatches.length) {
      parts.push(`Relevant website pages:\n${pageMatches.map(({ page }) => `- [${page.title}](${page.url}) — ${page.summary}`).join("\n")}`);
    }

    return parts.length ? {
      answer: parts.join("\n\n"),
      context: parts.join("\n\n"),
      data
    } : null;
  }

  globalThis.AskPolyKnowledge = Object.freeze({ loadKnowledge, searchKnowledge });
})();
