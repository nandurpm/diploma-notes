/* POLY PMNA — canonical department context for Ask POLY AI */
(() => {
  "use strict";

  const DATA_URL = "/assets/data/revision-2026-programmes.json";
  const ALIASES_BY_CODE = {
    AR: ["arch", "architecture student"],
    AI: ["ai student", "artificial intelligence student"],
    AM: ["aiml", "ai ml", "ai and ml", "artificial intelligence machine learning"],
    RA: ["automation robotics", "robotics student"],
    AU: ["auto student", "automobile student", "automotive"],
    BM: ["biomedical", "biomed"],
    CH: ["chemical"],
    CV: ["civil environmental"],
    CR: ["civil rural"],
    CE: ["civil student", "civil"],
    CL: ["civil planning"],
    CO: ["civil construction", "construction technology"],
    CP: ["commercial practice student"],
    CB: ["cabm", "computer application business management"],
    CT: ["computer engineering student"],
    CS: ["cse", "computer science", "computer science engineering"],
    CZ: ["cse aiml", "cse ai ml", "computer science ai ml"],
    CG: ["cst", "computer science technology"],
    CF: ["cyber security", "cyber forensics"],
    EE: ["eee", "electrical electronics", "electrical and electronics"],
    EG: ["electrical student", "electrical"],
    EV: ["ev technology", "electric vehicle technology", "electric vehicles"],
    EC: ["ece", "electronics communication", "electronics and communication"],
    ET: ["electronics computer", "electronics and computer"],
    EL: ["electronics student", "electronics"],
    ES: ["embedded", "embedded systems"],
    FS: ["fire safety", "fire technology"],
    FT: ["food technology", "food processing"],
    IF: ["it student", "it", "information technology"],
    IE: ["instrumentation"],
    IC: ["ic design", "integrated circuit", "integrated circuits"],
    ID: ["interior design"],
    ME: ["mechanical student", "mechanical"],
    MA: ["mechanical automobile", "mechanical auto"],
    MC: ["mechatronics student"],
    MI: ["microelectronics", "micro electronics"],
    PL: ["polymer student", "polymer technology"],
    PT: ["printing student", "printing technology"],
    RP: ["rpa", "robotic process automation"],
    TT: ["textile student", "textile technology", "textile"],
    TD: ["tool and die", "tool die"],
    WP: ["wood paper", "wood and paper"]
  };

  const EXPLICIT_CUES = /(?:\bi am\b|\bi'm\b|\bim\b|\bi study\b|\bi'm studying\b|\bstudying\b|\bstudent\b|\bmy (?:department|dept|branch|major)\b|\b(?:department|dept|branch|major) (?:is|:)|\bi am in\b|\bi'm in\b|\bim in\b|\bbelongs? to\b|\bfrom the\b|\bഎന്റെ\b|\bഞാൻ\b|\bവിദ്യാർത്ഥി\b|\bstudent ആണ്\b|\bstudent ആണു\b|\bലെ\b|\bയിൽ\b)/i;
  const CHANGE_CUES = /(?:\bactually\b|\bnow\b|\bchange\b|\bswitch\b|\bnot .*[,;]|\binstead\b|\bപക്ഷേ\b|\bഇപ്പോൾ\b)/i;

  function normalize(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[()/,.;:]+/g, " ")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isExplicit(text) {
    const value = normalize(text);
    const malayalamCue = /ഞാൻ|വിദ്യാർത്ഥി|വിദ്യാർത്ഥിനി|ആണ്|ആണു|ലെ|യിൽ|പഠിക്കുന്നു|പഠിക്കുന്ന|ഡിപ്പാർട്ട്മെന്റ്|ബ്രാഞ്ച്/i.test(value);
    const labeledDepartment = /^\s*(?:department|dept|branch|major)\s+/.test(value);
    return EXPLICIT_CUES.test(value) || malayalamCue || labeledDepartment || /^\s*(?:i am|i'm|im|studying|student)\b/i.test(value);
  }

  function buildRegistry(payload) {
    const programmes = Array.isArray(payload?.programmes) ? payload.programmes : [];
    const byCode = new Map(programmes.map((item) => [String(item.officialCode || "").toUpperCase(), item]));
    const entries = programmes.map((item) => ({
      code: item.officialCode,
      displayName: item.name,
      normalizedName: normalize(item.name),
      slug: item.slug,
      aliases: (ALIASES_BY_CODE[item.officialCode] || []).map(normalize)
    }));

    function find(text, current = null) {
      const raw = String(text || "").trim();
      const value = normalize(raw);
      if (!value) return current ? { ...current, source: "saved-context" } : null;
      const explicit = isExplicit(raw);
      const exact = entries
        .filter((entry) => value === entry.normalizedName || value.includes(entry.normalizedName))
        .sort((a, b) => b.normalizedName.length - a.normalizedName.length);
      if (exact.length && (explicit || value === exact[0].normalizedName)) {
        const selected = exact[0];
        return { ...selected, source: "canonical-name", changed: Boolean(current && current.code !== selected.code) };
      }

      const aliasMatches = [];
      for (const entry of entries) {
        for (const alias of entry.aliases) {
          if (value === alias || (explicit && value.includes(alias))) aliasMatches.push({ entry, alias });
        }
      }
      aliasMatches.sort((a, b) => b.alias.length - a.alias.length);
      if (aliasMatches.length) {
        const unique = [...new Map(aliasMatches.map((match) => [match.entry.code, match.entry])).values()];
        if (unique.length === 1) {
          const selected = unique[0];
          return { ...selected, source: "alias", changed: Boolean(current && current.code !== selected.code) };
        }
        return { ambiguous: true, candidates: unique.slice(0, 5), source: "ambiguous-alias" };
      }

      if (explicit) {
        const broad = entries.filter((entry) => {
          const words = entry.normalizedName.split(" ");
          return words.length === 1 && words[0].length > 4 && value.includes(words[0]);
        });
        if (broad.length > 1) return { ambiguous: true, candidates: broad.slice(0, 5), source: "ambiguous-context" };
      }
      return current ? { ...current, source: "saved-context" } : null;
    }

    function get(code) { return byCode.get(String(code || "").toUpperCase()) || null; }
    function choices() { return entries.slice(); }
    return { entries, find, get, choices };
  }

  const ready = fetch(DATA_URL, { cache: "no-store" })
    .then((response) => { if (!response.ok) throw new Error(`Department registry unavailable (${response.status})`); return response.json(); })
    .then(buildRegistry)
    .catch((error) => {
      console.warn("Ask POLY department registry failed", error);
      return { entries: [], find: (text, current) => current || null, get: () => null, choices: () => [] };
    });

  window.AskPolyDepartments = { ready, normalize, explicitCue: isExplicit };
})();
