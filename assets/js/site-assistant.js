/* =========================================================
   POLY SITE ASSISTANT — In-Page AI Help Panel
   ---------------------------------------------------------
   Provides an interactive floating assistant panel on every
   page (portal and lesson). The panel lets students ask
   questions and receives answers generated from the page's
   own content (lessons) and the global subject knowledge base.

   Key capabilities:
   - Indexes lesson page content into searchable chunks
   - Matches user queries against lesson content and synonyms
   - Renders a collapsible chat-like panel with query input
   - Shows answer previews with source attribution
   - Maintains per-page query history in sessionStorage
   - Supports both English and Malayalam search terms

   Loaded by:
   - assets/js/site-assistant-loader.js (lazy loads this script)

   Related files:
   - assets/css/site-assistant.css
   - assets/css/site-assistant-fix.css
   - assets/js/subjects.js (subject knowledge base)
   - assets/js/asset-manifest.js (asset index)
   - data/knowledge-base.json (global site knowledge)

   Warning: This script indexes DOM content and performs
   text matching. Changes to the indexing logic affect
   answer quality across all pages.
   ========================================================= */
(() => {
  "use strict";

  const ASSISTANT_VERSION = "3.0";
  const IS_LESSON_PAGE = /\/lessons\/[^/]+\.html$/i.test(window.location.pathname)
    || Boolean(document.querySelector("main.shell, .lesson-layout, .panel[data-module], .panel[id]"));
  const HISTORY_KEY = `polySiteAssistantHistory:v3:${window.location.pathname}`;
  const STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "can", "could", "define", "describe",
    "do", "does", "explain", "for", "from", "give", "how", "i", "in", "is", "it", "list",
    "me", "of", "on", "or", "please", "show", "state", "tell", "that", "the", "their", "this",
    "to", "what", "when", "where", "which", "why", "with", "would", "you", "your", "about"
  ]);
  const SYNONYMS = new Map([
    ["formula", ["equation", "expression", "relationship"]],
    ["equation", ["formula", "expression"]],
    ["working", ["operation", "principle", "function"]],
    ["uses", ["applications", "application", "purpose"]],
    ["advantages", ["benefits", "merits"]],
    ["disadvantages", ["limitations", "demerits"]],
    ["difference", ["compare", "comparison", "versus"]],
    ["exam", ["question", "revision", "answer", "important"]],
    ["meaning", ["definition", "simple", "malayalam"]]
  ]);

  let history = [];
  let lastAnswer = "";
  let subjectRecords = [];
  let lessonChunks = [];
  let selectedLessonText = "";
  let lessonObserver = null;
  let rebuildTimer = 0;

  function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.text !== undefined) element.textContent = options.text;
    if (options.type) element.type = options.type;
    Object.entries(options.attributes || {}).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalize(value) {
    return cleanText(value)
      .toLocaleLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}\s./:&=+×÷Ωωπ√°%-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(value) {
    const base = normalize(value).split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token));
    const expanded = new Set(base);
    base.forEach((token) => (SYNONYMS.get(token) || []).forEach((synonym) => expanded.add(synonym)));
    return [...expanded];
  }

  function truncate(value, maximum = 360) {
    const text = cleanText(value);
    if (text.length <= maximum) return text;
    return `${text.slice(0, maximum).replace(/\s+\S*$/, "")}…`;
  }

  function installStyles() {
    if (document.getElementById("polyAssistantCriticalStyles")) return;
    const style = document.createElement("style");
    style.id = "polyAssistantCriticalStyles";
    style.textContent = `
      #polySiteAssistant{position:fixed;right:18px;bottom:18px;z-index:2147483000;width:max-content;max-width:calc(100vw - 24px);height:max-content;font-family:Inter,"Segoe UI",system-ui,sans-serif;color:#0f172a}
      #polySiteAssistant *{box-sizing:border-box}
      #polySiteAssistant .poly-ai-panel[hidden]{display:none!important}
      #polySiteAssistant .poly-ai-button{display:inline-flex;align-items:center;gap:9px;min-width:152px;height:60px;padding:8px 15px 8px 9px;border:0;border-radius:19px;color:#fff;background:linear-gradient(135deg,#1d4ed8,#0891b2 55%,#059669);box-shadow:0 18px 42px rgba(29,78,216,.3);cursor:pointer;font:900 .92rem/1 Inter,"Segoe UI",sans-serif}
      #polySiteAssistant .poly-ai-button-mark{display:grid;place-items:center;width:43px;height:43px;border-radius:14px;background:rgba(255,255,255,.18);font-size:.9rem}
      #polySiteAssistant .poly-ai-button-copy{display:grid;gap:3px;text-align:left}
      #polySiteAssistant .poly-ai-button-subtext{font-size:.65rem;font-weight:750;opacity:.82}
      #polySiteAssistant .poly-ai-panel{position:absolute;right:0;bottom:72px;width:min(430px,calc(100vw - 24px));max-width:calc(100vw - 24px);height:min(680px,calc(100dvh - 110px));max-height:calc(100dvh - 24px);display:grid;grid-template-rows:auto auto auto 1fr auto;overflow:hidden;overscroll-behavior:contain;border:1px solid rgba(148,163,184,.42);border-radius:24px;background:#fff;box-shadow:0 30px 80px rgba(15,23,42,.28)}
      #polySiteAssistant .poly-ai-head{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:8px;align-items:center;padding:14px;color:#fff;background:linear-gradient(135deg,#1d4ed8,#0f766e)}
      #polySiteAssistant .poly-ai-title{overflow:hidden;font-weight:950;text-overflow:ellipsis;white-space:nowrap}.poly-ai-subtitle{margin-top:3px;font-size:.7rem;font-weight:750;opacity:.82}
      #polySiteAssistant .poly-ai-icon{min-width:32px;height:32px;padding:0 8px;border:1px solid rgba(255,255,255,.28);border-radius:10px;color:#fff;background:rgba(255,255,255,.13);cursor:pointer;font-weight:850}
      #polySiteAssistant .poly-ai-status{padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#475569;background:#f8fafc;font-size:.74rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #polySiteAssistant .poly-ai-quick{display:flex;flex-wrap:wrap;gap:7px;max-height:96px;overflow-x:hidden;overflow-y:auto;padding:9px 11px;border-bottom:1px solid #e2e8f0;background:#fff;scrollbar-width:thin}
      #polySiteAssistant .poly-ai-quick button{flex:0 0 auto;padding:7px 10px;border:1px solid #bfdbfe;border-radius:999px;color:#1e40af;background:#eff6ff;cursor:pointer;font-size:.72rem;font-weight:850}
      #polySiteAssistant .poly-ai-body{min-height:0;overflow-x:hidden;overflow-y:auto;padding:13px;background:linear-gradient(180deg,#eff6ff,#fff)}
      #polySiteAssistant .poly-ai-msg{max-width:94%;margin:0 0 10px;padding:10px 12px;border-radius:15px;font-size:.86rem;line-height:1.55;overflow-wrap:anywhere;white-space:pre-wrap;word-break:break-word}
      #polySiteAssistant .poly-ai-msg.bot{border:1px solid #dbeafe;background:#fff;box-shadow:0 8px 22px rgba(15,23,42,.07)}
      #polySiteAssistant .poly-ai-msg.user{margin-left:auto;color:#fff;background:linear-gradient(135deg,#2563eb,#0891b2)}
      #polySiteAssistant .poly-ai-sources,#polySiteAssistant .poly-ai-results{display:grid;gap:9px;margin:7px 0 13px}
      #polySiteAssistant .poly-ai-source,#polySiteAssistant .poly-ai-card{padding:11px;border:1px solid #dbe3ef;border-radius:16px;background:#fff;box-shadow:0 8px 20px rgba(15,23,42,.07)}
      #polySiteAssistant .poly-ai-source strong,#polySiteAssistant .poly-ai-card h3{display:block;margin:0;color:#0f172a;font-size:.88rem}
      #polySiteAssistant .poly-ai-source p,#polySiteAssistant .poly-ai-card p{margin:6px 0 0;color:#475569;font-size:.78rem;line-height:1.45}
      #polySiteAssistant .poly-ai-links{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
      #polySiteAssistant .poly-ai-links a,#polySiteAssistant .poly-ai-links button,#polySiteAssistant .poly-ai-links .unavailable{padding:7px 9px;border:0;border-radius:10px;font-size:.73rem;font-weight:900;text-decoration:none}
      #polySiteAssistant .poly-ai-links a,#polySiteAssistant .poly-ai-links button{color:#fff;background:linear-gradient(135deg,#2563eb,#0891b2);cursor:pointer}
      #polySiteAssistant .poly-ai-links .unavailable{color:#64748b;background:#e2e8f0}
      #polySiteAssistant .poly-ai-form{display:grid;grid-template-columns:1fr auto;gap:8px;padding:11px;border-top:1px solid #e2e8f0;background:#fff}
      #polySiteAssistant .poly-ai-form input{width:100%;min-height:46px;padding:0 12px;border:1px solid #cbd5e1;border-radius:14px;color:#0f172a;background:#fff;font:inherit}
      #polySiteAssistant .poly-ai-send{min-height:46px;padding:0 15px;border:0;border-radius:14px;color:#fff;background:linear-gradient(135deg,#2563eb,#0d9488);cursor:pointer;font-weight:900}
      .poly-ai-source-highlight{outline:4px solid rgba(37,99,235,.3)!important;outline-offset:5px;transition:outline-color .25s ease}
      @media(max-width:700px){#polySiteAssistant{right:10px;bottom:10px;max-width:calc(100vw - 20px)}#polySiteAssistant.poly-ai-open .poly-ai-button{display:none}#polySiteAssistant .poly-ai-button{min-width:56px;width:56px;height:56px;padding:6px;border-radius:19px}#polySiteAssistant .poly-ai-button-copy{display:none}#polySiteAssistant .poly-ai-panel{position:fixed;left:10px;right:10px;bottom:max(10px,env(safe-area-inset-bottom));width:auto;max-width:none;height:min(640px,calc(100dvh - 20px));max-height:calc(100dvh - 20px);border-radius:20px}#polySiteAssistant .poly-ai-form{grid-template-columns:minmax(0,1fr) auto}}
      @media print{#polySiteAssistant{display:none!important}}
    `;
    document.head.append(style);
  }

  function ensureRoot() {
    let root = document.getElementById("polySiteAssistant");
    if (!root) {
      root = document.createElement("div");
      root.id = "polySiteAssistant";
      document.body.append(root);
    }
    return root;
  }

  function loadScriptOnce(src, readyCheck) {
    if (readyCheck()) return Promise.resolve();
    const existing = [...document.scripts].find((script) => new URL(script.src || "", window.location.href).pathname === src);
    if (existing) {
      return new Promise((resolve) => {
        if (readyCheck()) resolve();
        else {
          existing.addEventListener("load", resolve, { once: true });
          window.setTimeout(resolve, 3000);
        }
      });
    }
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", resolve, { once: true });
      document.head.append(script);
      window.setTimeout(resolve, 4000);
    });
  }

  function getSubjects() {
    if (Array.isArray(globalThis.SUBJECTS)) return globalThis.SUBJECTS;
    try {
      if (typeof SUBJECTS !== "undefined" && Array.isArray(SUBJECTS)) return SUBJECTS;
    } catch (_) {
      // Shared subject data has not loaded yet.
    }
    return [];
  }

  function getLessonTitle() {
    return cleanText(document.querySelector(".hero h1, main h1, h1")?.textContent || document.title.replace(/\s*[|–—-].*$/, ""));
  }

  function getLessonCode() {
    const visible = cleanText(document.querySelector(".course-code, [data-course-code]")?.textContent);
    return visible.match(/[A-Za-z0-9-]+/)?.[0]
      || window.location.pathname.match(/lessons-([A-Za-z0-9-]+)\.html/i)?.[1]
      || document.title.match(/\b([A-Za-z]*\d+[A-Za-z]*)\b/)?.[1]
      || "";
  }

  const lessonTitle = getLessonTitle();
  const lessonCode = getLessonCode();
  const rootElement = ensureRoot();
  installStyles();

  const openButton = createElement("button", {
    className: "poly-ai-button",
    type: "button",
    attributes: { "aria-label": "Open Ask POLY assistant", "aria-expanded": "false", "aria-controls": "polyAiPanel" }
  });
  openButton.append(
    createElement("span", { className: "poly-ai-button-mark", text: "AI" }),
    (() => {
      const copy = createElement("span", { className: "poly-ai-button-copy" });
      copy.append(
        createElement("span", { className: "poly-ai-button-text", text: "Ask POLY" }),
        createElement("span", { className: "poly-ai-button-subtext", text: IS_LESSON_PAGE ? "Lesson doubt helper" : "Subject finder" })
      );
      return copy;
    })()
  );

  const panel = createElement("section", {
    className: "poly-ai-panel",
    attributes: { id: "polyAiPanel", role: "dialog", "aria-label": "Ask POLY PMNA" }
  });
  panel.hidden = true;

  const header = createElement("div", { className: "poly-ai-head" });
  const headingCopy = createElement("div");
  headingCopy.append(
    createElement("div", { className: "poly-ai-title", text: "Ask POLY PMNA" }),
    createElement("div", { className: "poly-ai-subtitle", text: IS_LESSON_PAGE ? "Answers from this lesson" : "Local website assistant" })
  );
  const copyButton = createElement("button", { className: "poly-ai-icon", type: "button", text: "Copy", attributes: { "aria-label": "Copy last answer" } });
  const clearButton = createElement("button", { className: "poly-ai-icon", type: "button", text: "Clear", attributes: { "aria-label": "Clear conversation history" } });
  const closeButton = createElement("button", { className: "poly-ai-icon", type: "button", text: "×", attributes: { "aria-label": "Close assistant" } });
  header.append(headingCopy, copyButton, clearButton, closeButton);

  const status = createElement("div", { className: "poly-ai-status", text: "Loading local study data…" });
  const quickPrompts = createElement("div", { className: "poly-ai-quick", attributes: { "aria-label": "Quick questions" } });
  const messageBody = createElement("div", { className: "poly-ai-body", attributes: { "aria-live": "polite" } });
  const form = createElement("form", { className: "poly-ai-form" });
  const input = createElement("input", {
    attributes: {
      type: "search",
      placeholder: IS_LESSON_PAGE ? "Ask a doubt from this lesson…" : "Type subject code, name or department…",
      autocomplete: "off",
      "aria-label": IS_LESSON_PAGE ? "Ask a lesson doubt" : "Search diploma subjects"
    }
  });
  const sendButton = createElement("button", { className: "poly-ai-send", type: "submit", text: "Ask" });
  form.append(input, sendButton);
  panel.append(header, status, quickPrompts, messageBody, form);
  rootElement.replaceChildren(panel, openButton);

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-40)));
    } catch (_) {
      // Private browsing or storage restrictions should not disable the assistant.
    }
  }

  function addMessage(role, text, persist = true) {
    const normalizedText = cleanText(text);
    if (!normalizedText) return;
    messageBody.append(createElement("div", { className: `poly-ai-msg ${role}`, text: normalizedText }));
    if (persist) {
      history.push({ role, text: normalizedText });
      saveHistory();
    }
    messageBody.scrollTop = messageBody.scrollHeight;
  }

  function addUnavailable(parent, text) {
    parent.append(createElement("span", { className: "unavailable", text, attributes: { "aria-disabled": "true" } }));
  }

  function addLink(parent, label, href) {
    if (!href) return;
    const anchor = createElement("a", { text: label, attributes: { href } });
    if (/^https?:/i.test(href)) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
    parent.append(anchor);
  }

  function activePanel() {
    return document.querySelector(".panel.active, .panel:not([hidden])[aria-hidden='false']") || document.querySelector(".panel.active");
  }

  function activePanelLabel() {
    const current = activePanel();
    if (!current) return "";
    const button = [...document.querySelectorAll("[data-target]")].find((item) => item.dataset.target === current.id);
    return cleanText(button?.textContent || current.querySelector("h2, h3")?.textContent || current.id);
  }

  function revealSource(sourceId) {
    const target = document.getElementById(sourceId);
    if (!target) return;
    const sourcePanel = target.closest(".panel");
    if (sourcePanel?.id) {
      const tab = [...document.querySelectorAll("[data-target]")].find((item) => item.dataset.target === sourcePanel.id);
      if (tab) tab.click();
      else {
        document.querySelectorAll(".panel").forEach((item) => item.classList.toggle("active", item === sourcePanel));
      }
    }
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("poly-ai-source-highlight");
      window.setTimeout(() => target.classList.remove("poly-ai-source-highlight"), 3500);
    }, 100);
  }

  function addSources(sources) {
    if (!sources?.length) return;
    const container = createElement("div", { className: "poly-ai-sources" });
    sources.slice(0, 3).forEach((source) => {
      const card = createElement("article", { className: "poly-ai-source" });
      card.append(
        createElement("strong", { text: source.title || "Lesson source" }),
        createElement("p", { text: truncate(source.text, 170) })
      );
      const links = createElement("div", { className: "poly-ai-links" });
      const button = createElement("button", { type: "button", text: "Open source section" });
      button.addEventListener("click", () => revealSource(source.id));
      links.append(button);
      card.append(links);
      container.append(card);
    });
    messageBody.append(container);
    messageBody.scrollTop = messageBody.scrollHeight;
  }

  function buildSubjectRecords() {
    const manifest = globalThis.POLY_ASSET_MANIFEST || {};
    const lessonCodes = new Set((manifest.lessonCodes || []).map(String));
    const notesCodes = new Set((manifest.notesCodes || []).map(String));
    if (lessonCode) lessonCodes.add(String(lessonCode));

    const seen = new Set();
    subjectRecords = getSubjects().filter((subject) => {
      const key = [subject.revision, subject.department, subject.semester, subject.code].join(":");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((subject) => {
      const code = String(subject.code || "");
      return {
        ...subject,
        code,
        lessonAvailable: lessonCodes.has(code),
        notesAvailable: notesCodes.has(code),
        searchBlob: normalize([code, subject.name, subject.department, subject.semester, subject.type, subject.revision].join(" "))
      };
    });
  }

  function isSkippedContent(element) {
    return Boolean(element.closest("#polySiteAssistant, nav, header, footer, script, style, .tabs, .topbar"));
  }

  function buildLessonChunks() {
    if (!IS_LESSON_PAGE) {
      lessonChunks = [];
      return;
    }
    const contentRoot = document.querySelector("main.shell, main, .shell") || document.body;
    const elements = [...contentRoot.querySelectorAll("h1,h2,h3,h4,p,li,tr,.formula-card,.answer-card,.info-box,.ml,.success,.warning,.source-line")];
    const chunks = [];
    const seen = new Set();
    let currentHeading = lessonTitle || "Lesson";
    let sourceCounter = 0;

    // PERFORMANCE OPTIMIZATION: Cache [data-target] panel buttons in a Map outside the main loop.
    // This avoids performing a slow O(N) DOM lookup and document-wide querySelectorAll for every single
    // content element indexed, cutting DOM overhead dramatically and converting lookups to O(1).
    const panelButtonsMap = new Map();
    document.querySelectorAll("[data-target]").forEach((item) => {
      const targetId = item.getAttribute("data-target");
      if (targetId && !panelButtonsMap.has(targetId)) {
        panelButtonsMap.set(targetId, item);
      }
    });

    elements.forEach((element) => {
      if (isSkippedContent(element)) return;
      if (/^H[1-4]$/.test(element.tagName)) {
        currentHeading = cleanText(element.textContent) || currentHeading;
        return;
      }
      if (element.matches("p,li,tr") && element.parentElement?.closest(".formula-card,.answer-card,.info-box,.ml,.success,.warning")
        && element.closest(".formula-card,.answer-card,.info-box,.ml,.success,.warning") !== element) return;

      const text = element.tagName === "TR"
        ? cleanText([...element.children].map((cell) => cell.textContent).join(" | "))
        : cleanText(element.textContent);
      if (text.length < 8 || text.length > 1800) return;
      const fingerprint = normalize(text).slice(0, 260);
      if (!fingerprint || seen.has(fingerprint)) return;
      seen.add(fingerprint);

      const panelElement = element.closest(".panel");
      const panelId = panelElement?.id || "";
      const panelButton = panelId ? panelButtonsMap.get(panelId) : null;
      const panelLabel = cleanText(panelButton?.textContent || panelElement?.querySelector("h2, h3")?.textContent || "");
      const localHeading = cleanText(element.closest(".card,.answer-card,.info-box")?.querySelector("h2,h3,h4,b")?.textContent || currentHeading);
      const sourceTitle = [...new Set([panelLabel, localHeading].filter(Boolean))].join(" — ") || lessonTitle || "Lesson source";

      sourceCounter += 1;
      if (!element.id) element.id = `poly-lesson-source-${sourceCounter}`;
      chunks.push({
        id: element.id,
        element,
        text,
        normalized: normalize(`${sourceTitle} ${text}`),
        title: sourceTitle,
        heading: normalize(sourceTitle),
        panelId
      });
    });
    lessonChunks = chunks;
    updateStatus();
  }

  function scheduleLessonRebuild() {
    window.clearTimeout(rebuildTimer);
    rebuildTimer = window.setTimeout(buildLessonChunks, 350);
  }

  function observeLesson() {
    if (!IS_LESSON_PAGE || lessonObserver) return;
    const contentRoot = document.querySelector("main.shell, main, .shell");
    if (!contentRoot) return;
    lessonObserver = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.type === "childList" || mutation.type === "characterData")) {
        scheduleLessonRebuild();
      }
    });
    lessonObserver.observe(contentRoot, { childList: true, subtree: true, characterData: true });
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-target], .tab-btn")) window.setTimeout(updateStatus, 80);
    });
  }

  function scoreSentence(sentence, tokens) {
    const normalizedSentence = normalize(sentence);
    return tokens.reduce((score, token) => score + (normalizedSentence.includes(token) ? 1 : 0), 0);
  }

  function extractBestText(text, tokens) {
    const cleaned = cleanText(text);
    if (cleaned.length <= 330) return cleaned;
    const sentences = cleaned.match(/[^.!?]+[.!?]?/g)?.map(cleanText).filter(Boolean) || [cleaned];
    const ranked = sentences
      .map((sentence, index) => ({ sentence, index, score: scoreSentence(sentence, tokens) }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, 2)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.sentence)
      .join(" ");
    return truncate(ranked || cleaned, 520);
  }

  function lessonIntent(query) {
    const normalizedQuery = normalize(query);
    return {
      summary: /\b(summary|summarise|summarize|overview|this lesson about)\b/.test(normalizedQuery),
      formulas: /\b(formula|formulas|equation|equations|formula bank)\b/.test(normalizedQuery),
      exam: /\b(exam|important question|important questions|revision|question bank|answer key)\b/.test(normalizedQuery),
      current: /\b(current module|current section|this module|this section)\b/.test(normalizedQuery),
      selected: /\b(selected text|this text|selection)\b/.test(normalizedQuery)
    };
  }

  function answerFromLesson(query) {
    if (!IS_LESSON_PAGE || !lessonChunks.length) return null;
    const intent = lessonIntent(query);
    const queryTokens = tokenize(query);
    let candidates = lessonChunks;

    if (intent.selected && selectedLessonText) {
      const selectedNormalized = normalize(selectedLessonText);
      const selectedMatch = lessonChunks.find((chunk) => chunk.normalized.includes(selectedNormalized.slice(0, 100)));
      if (selectedMatch) candidates = [selectedMatch, ...lessonChunks.filter((chunk) => chunk.panelId === selectedMatch.panelId && chunk.id !== selectedMatch.id)];
    } else if (intent.formulas) {
      candidates = lessonChunks.filter((chunk) => /formula|equation|reactance|impedance|power|=|ω|π|√/i.test(`${chunk.title} ${chunk.text}`));
    } else if (intent.exam) {
      candidates = lessonChunks.filter((chunk) => /exam|revision|question|answer|important|preparation|mark/i.test(`${chunk.title} ${chunk.text}`));
    } else if (intent.current) {
      const currentPanelId = activePanel()?.id || "";
      candidates = lessonChunks.filter((chunk) => chunk.panelId === currentPanelId);
    } else if (intent.summary) {
      candidates = lessonChunks.filter((chunk) => /overview|objective|outcome|module map|subject title|course/i.test(`${chunk.title} ${chunk.text}`));
    }
    if (!candidates.length) candidates = lessonChunks;

    const activePanelId = activePanel()?.id || "";
    const normalizedQuery = normalize(query);
    const ranked = candidates.map((chunk) => {
      let score = 0;
      if (normalizedQuery.length > 3 && chunk.normalized.includes(normalizedQuery)) score += 120;
      queryTokens.forEach((token) => {
        if (chunk.heading.includes(token)) score += 28;
        if (chunk.normalized.includes(token)) score += 13;
        if (new RegExp(`(^|\\s)${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|\\s)`, "i").test(chunk.normalized)) score += 7;
      });
      if (activePanelId && chunk.panelId === activePanelId) score += 5;
      if (intent.formulas && /formula|=|ω|π|√/.test(`${chunk.title} ${chunk.text}`)) score += 35;
      if (intent.exam && /exam|question|revision|answer/i.test(`${chunk.title} ${chunk.text}`)) score += 35;
      if (intent.summary && /overview|objective|outcome|module map/i.test(`${chunk.title} ${chunk.text}`)) score += 35;
      if (intent.current && chunk.panelId === activePanelId) score += 50;
      if (intent.selected && selectedLessonText && chunk.normalized.includes(normalize(selectedLessonText).slice(0, 80))) score += 100;
      return { chunk, score };
    }).sort((a, b) => b.score - a.score);

    const commandIntent = intent.summary || intent.formulas || intent.exam || intent.current || intent.selected;
    if (!ranked.length || (!commandIntent && ranked[0].score < 10)) return null;
    const bestScore = ranked[0].score || 1;
    const selected = [];
    const fingerprints = new Set();
    for (const item of ranked) {
      if (!commandIntent && item.score < Math.max(8, bestScore * 0.35)) continue;
      const fingerprint = item.chunk.normalized.slice(0, 120);
      if (fingerprints.has(fingerprint)) continue;
      fingerprints.add(fingerprint);
      selected.push(item.chunk);
      if (selected.length >= (intent.formulas || intent.exam ? 3 : 2)) break;
    }
    if (!selected.length) return null;

    const answerParts = selected.map((chunk) => extractBestText(chunk.text, queryTokens)).filter(Boolean);
    let prefix = "Based on this lesson:";
    if (intent.summary) prefix = `${lessonTitle || "This lesson"} — summary:`;
    else if (intent.formulas) prefix = "Important formula information from this lesson:";
    else if (intent.exam) prefix = "From the lesson’s exam and revision content:";
    else if (intent.current) prefix = `From ${activePanelLabel() || "the current section"}:`;
    else if (intent.selected) prefix = "Context for the selected lesson text:";

    return {
      answer: `${prefix} ${answerParts.join(" ")}`,
      sources: selected
    };
  }

  function searchSubjects(query) {
    const normalizedQuery = normalize(query);
    const tokens = tokenize(query);
    return subjectRecords.map((subject) => {
      let score = 0;
      if (normalize(subject.code) === normalizedQuery) score += 220;
      if (normalize(subject.name) === normalizedQuery) score += 150;
      if (subject.searchBlob.includes(normalizedQuery)) score += 70;
      tokens.forEach((token) => {
        if (normalize(subject.code) === token) score += 130;
        if (normalize(subject.name).includes(token)) score += 35;
        if (normalize(subject.department).includes(token)) score += 28;
        if (subject.searchBlob.includes(token)) score += 14;
      });
      return { subject, score };
    }).filter((item) => item.score > 8).sort((a, b) => b.score - a.score).map((item) => item.subject);
  }

  function renderSubjectResults(items) {
    messageBody.querySelectorAll(".poly-ai-results").forEach((element) => element.remove());
    const results = createElement("div", { className: "poly-ai-results" });
    items.slice(0, 7).forEach((subject) => {
      const card = createElement("article", { className: "poly-ai-card" });
      card.append(
        createElement("h3", { text: `${subject.code} — ${subject.name}` }),
        createElement("p", { text: [subject.revision, subject.department, subject.semester].filter(Boolean).join(" / ") }),
        createElement("p", { text: subject.lessonAvailable ? "Lesson available." : "Lesson not available yet." })
      );
      const links = createElement("div", { className: "poly-ai-links" });
      if (subject.lessonAvailable) addLink(links, "Open lesson", `/lessons/lessons-${encodeURIComponent(subject.code)}.html`);
      else addUnavailable(links, "Lesson unavailable");
      const syllabusUrl = String(subject.revision) === "2021"
        ? "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2021"
        : `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(subject.code)}`;
      addLink(links, "Syllabus", syllabusUrl);
      if (subject.notesAvailable) addLink(links, "Download notes", `/notes/downloadable-notes-${encodeURIComponent(subject.code)}.pdf`);
      else addUnavailable(links, "Notes unavailable");
      addLink(links, "Model QP", `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(subject.code)}`);
      card.append(links);
      results.append(card);
    });
    messageBody.append(results);
    messageBody.scrollTop = messageBody.scrollHeight;
  }

  function looksLikeGeneralHelp(query) {
    return /^(hi|hello|hey|help|what can you do|how to use)$/i.test(cleanText(query));
  }

  function runQuery(rawValue, options = {}) {
    const query = cleanText(rawValue);
    if (!query) return;
    if (!options.silentUser) addMessage("user", query);

    if (looksLikeGeneralHelp(query)) {
      lastAnswer = IS_LESSON_PAGE
        ? "Ask a doubt using the exact technical term, request formulas, exam questions, the current module, or select lesson text and ask me to explain it. I answer only from the content available on this lesson page."
        : "Search by subject code, subject name, department or semester. I can open available lessons, notes, syllabus and model question papers.";
      addMessage("bot", lastAnswer);
      updateStatus();
      return;
    }

    const lessonResult = answerFromLesson(query);
    if (lessonResult) {
      lastAnswer = lessonResult.answer;
      addMessage("bot", lastAnswer);
      addSources(lessonResult.sources);
      status.textContent = `Answered from ${lessonResult.sources.length} lesson source${lessonResult.sources.length === 1 ? "" : "s"}`;
      return;
    }

    const subjects = searchSubjects(query);
    if (subjects.length) {
      const first = subjects[0];
      lastAnswer = first.lessonAvailable
        ? `${first.code} is ${first.name}. Its lesson is available.`
        : `${first.code} is ${first.name}. The lesson is not available yet.`;
      addMessage("bot", lastAnswer);
      renderSubjectResults(subjects);
      status.textContent = `${subjects.length} subject result${subjects.length === 1 ? "" : "s"}`;
      return;
    }

    lastAnswer = IS_LESSON_PAGE
      ? "I could not find that answer in this lesson. Try the exact technical term, ask about a formula, or open the related module and ask again."
      : "No matching subject or website record was found. Try a subject code, subject name, department or semester.";
    addMessage("bot", lastAnswer);
    status.textContent = "No matching local content found";
  }

  function captureSelection() {
    if (!IS_LESSON_PAGE) return;
    const selection = window.getSelection();
    const text = cleanText(selection?.toString());
    if (!text || text.length < 3 || text.length > 900) return;
    const anchor = selection.anchorNode?.parentElement;
    if (anchor && !anchor.closest("#polySiteAssistant") && anchor.closest("main, .shell")) {
      selectedLessonText = text;
      renderQuickPrompts();
      status.textContent = "Selected lesson text ready to explain";
    }
  }

  function renderQuickPrompts() {
    quickPrompts.replaceChildren();
    const labels = IS_LESSON_PAGE
      ? [
          ...(selectedLessonText ? ["Explain selected text"] : []),
          "Explain this lesson",
          "Important formulas",
          "Exam questions",
          "Current module"
        ]
      : ["1001", "3041", "Electronics Engineering", "Available lessons"];
    labels.forEach((label) => {
      const button = createElement("button", { type: "button", text: label });
      button.addEventListener("click", () => runQuery(label));
      quickPrompts.append(button);
    });
  }

  function updateStatus() {
    if (IS_LESSON_PAGE) {
      const current = activePanelLabel();
      status.textContent = `${lessonTitle || "Lesson"}${lessonCode ? ` (${lessonCode})` : ""} • ${lessonChunks.length} sections indexed${current ? ` • ${current}` : ""}`;
    } else {
      const manifest = globalThis.POLY_ASSET_MANIFEST || {};
      status.textContent = `${subjectRecords.length} subjects • ${(manifest.lessonCodes || []).length} lessons synced`;
    }
  }

  function setOpen(open) {
    panel.hidden = !open;
    panel.classList.toggle("open", open);
    rootElement.classList.toggle("poly-ai-open", open);
    openButton.setAttribute("aria-expanded", String(open));
    if (open) {
      captureSelection();
      window.setTimeout(() => input.focus(), 30);
    } else if (document.activeElement && panel.contains(document.activeElement)) {
      // ACCESSIBILITY: Return keyboard focus to the trigger button when the panel closes
      openButton.focus();
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runQuery(input.value);
    input.value = "";
  });
  openButton.addEventListener("click", () => setOpen(panel.hidden));
  closeButton.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });
  document.addEventListener("selectionchange", () => {
    if (!panel.hidden) window.setTimeout(captureSelection, 30);
  });

  clearButton.addEventListener("click", () => {
    history = [];
    selectedLessonText = "";
    saveHistory();
    messageBody.replaceChildren();
    renderQuickPrompts();
    const message = IS_LESSON_PAGE
      ? "Ask a doubt from this lesson. I will answer from the lesson text and show the source section."
      : "Type a subject code, name, department or semester.";
    addMessage("bot", message);
    updateStatus();
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(lastAnswer || "");
      status.textContent = "Last answer copied";
    } catch (_) {
      status.textContent = "Copy unavailable";
    }
  });

  async function bootstrap() {
    await Promise.all([
      loadScriptOnce("/assets/js/subjects.js", () => getSubjects().length > 0),
      loadScriptOnce("/assets/js/asset-manifest.js", () => Boolean(globalThis.POLY_ASSET_MANIFEST))
    ]);
    buildSubjectRecords();
    buildLessonChunks();
    observeLesson();
    renderQuickPrompts();

    try {
      history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (!Array.isArray(history)) history = [];
    } catch (_) {
      history = [];
    }
    history.slice(-40).forEach((message) => addMessage(message.role, message.text, false));
    if (!history.length) {
      addMessage(
        "bot",
        IS_LESSON_PAGE
          ? `Hi! I have indexed ${lessonChunks.length} sections from ${lessonTitle || "this lesson"}. Ask a doubt, request formulas or exam questions, or select text and ask me to explain it.`
          : "Hi! Search a subject code, name, department or semester. Lesson and notes availability updates from the repository automatically."
      );
    }
    updateStatus();

    const ask = new URLSearchParams(window.location.search).get("ask");
    if (ask) {
      setOpen(true);
      window.setTimeout(() => runQuery(ask), 120);
    }
  }

  bootstrap().catch((error) => {
    console.error("Ask POLY initialization failed.", error);
    status.textContent = "Local assistant could not finish loading";
    addMessage("bot", "The local study assistant could not finish loading. Refresh the page and try again.");
  });

  globalThis.POLY_ASSISTANT_VERSION = ASSISTANT_VERSION;
})();
