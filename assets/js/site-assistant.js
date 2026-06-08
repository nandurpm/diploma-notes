(function () {
  "use strict";

  const ROOT = document.getElementById("polySiteAssistant");
  if (!ROOT) return;

  const KB_URL = "data/knowledge-base.json";
  const HISTORY_KEY = "polySiteAssistantHistory";
  const FILTERS = [
    "All",
    "First Year",
    "2015 Revision",
    "2021 Revision",
    "Lessons",
    "Downloads",
    "Question Papers",
    "Lab / Practical",
  ];
  const QUICK = [
    "1003 Physics",
    "1004 Chemistry",
    "Diploma notes",
    "Formula sheets",
    "Question papers",
    "Lab manuals",
    "Site map",
  ];
  const COMMANDS = new Set([
    "help",
    "site map",
    "subjects",
    "downloads",
    "question papers",
    "model question papers",
    "formula sheets",
    "practicals",
    "contact",
    "clear",
  ]);
  const NO_RESULT = "I could not find this information inside this website.";

  let knowledge = [];
  let knowledgeReady = Promise.resolve();
  let activeFilter = "All";
  let lastAnswer = "";
  let history = loadHistory();

  const button = el("button", {
    className: "poly-ai-button",
    type: "button",
    attrs: { "aria-label": "Open Ask POLY PMNA assistant", "aria-expanded": "false" },
  });
  button.append(
    el("span", { className: "poly-ai-button-mark", text: "AI", attrs: { "aria-hidden": "true" } }),
    el("span", { className: "poly-ai-button-text", text: "Ask" })
  );

  const panel = el("section", {
    className: "poly-ai-panel",
    attrs: { role: "dialog", "aria-label": "Ask POLY PMNA" },
  });

  const header = el("div", { className: "poly-ai-head" });
  header.append(
    el("div", { className: "poly-ai-avatar", text: "AI", attrs: { "aria-hidden": "true" } }),
    node("div", {}, [
      el("div", { className: "poly-ai-title", text: "Ask POLY PMNA" }),
      el("div", {
        className: "poly-ai-subtitle",
        text: "Search diploma notes, syllabus, subjects and downloads",
      }),
    ])
  );

  const copyButton = iconButton("Copy last answer", "CP");
  const clearButton = iconButton("Clear chat", "CL");
  const closeButton = iconButton("Close assistant", "X");
  header.append(copyButton, clearButton, closeButton);

  const tabs = el("div", { className: "poly-ai-tabs", attrs: { "aria-label": "Assistant filters" } });
  const body = el("div", { className: "poly-ai-body", attrs: { "aria-live": "polite" } });
  const quick = el("div", { className: "poly-ai-quick", attrs: { "aria-label": "Quick suggestions" } });
  const form = el("form", { className: "poly-ai-form" });
  const inputWrap = el("div", { className: "poly-ai-input-wrap" });
  const suggestions = el("div", { className: "poly-ai-suggestions" });
  const input = el("input", {
    attrs: {
      type: "search",
      placeholder: "Ask about 1003, notes, syllabus...",
      "aria-label": "Ask POLY PMNA",
      autocomplete: "off",
    },
  });
  const send = el("button", { className: "poly-ai-send", type: "submit", text: "Send" });

  inputWrap.append(suggestions, input);
  form.append(inputWrap, send);
  panel.append(header, tabs, body, form);
  ROOT.append(panel, button);

  FILTERS.forEach((filter) => {
    const item = el("button", { type: "button", text: filter });
    if (filter === activeFilter) item.classList.add("active");
    item.addEventListener("click", () => {
      activeFilter = filter;
      [...tabs.children].forEach((child) => child.classList.toggle("active", child === item));
      runSearch(input.value.trim(), false);
    });
    tabs.append(item);
  });

  QUICK.forEach((label) => {
    const item = el("button", { type: "button", text: label });
    item.addEventListener("click", () => {
      input.value = label;
      submitQuery(label);
    });
    quick.append(item);
  });

  button.addEventListener("click", togglePanel);
  closeButton.addEventListener("click", closePanel);
  clearButton.addEventListener("click", clearChat);
  copyButton.addEventListener("click", copyLastAnswer);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitQuery(input.value.trim());
  });
  input.addEventListener("input", updateSuggestions);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") suggestions.classList.remove("open");
  });

  init();

  async function init() {
    renderHistory();
    if (!history.length) {
      addMessage(
        "bot",
        "Hi! I can help you search POLY PMNA study materials. Ask me about subject codes, notes, syllabus, question papers, formula sheets, lesson pages, or downloads.",
        { save: true }
      );
      body.append(quick);
    }

    knowledgeReady = (async () => {
      const response = await fetch(KB_URL, { cache: "no-store" });
      knowledge = response.ok ? await response.json() : [];
    })().catch(() => {
      knowledge = [];
    });
  }

  function togglePanel() {
    const open = !panel.classList.contains("open");
    panel.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
    if (open) setTimeout(() => input.focus(), 40);
  }

  function closePanel() {
    panel.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
  }

  function submitQuery(raw) {
    const query = raw.trim();
    suggestions.classList.remove("open");
    if (!query) return;

    if (query.toLowerCase() === "clear") {
      clearChat();
      input.value = "";
      return;
    }

    addMessage("user", query, { save: true });
    knowledgeReady.then(() => runSearch(query, true));
    input.value = "";
  }

  function runSearch(query, shouldRespond) {
    if (!query || !shouldRespond) return;

    const normalized = normalize(query);
    let answer = "";
    let matches = [];

    if (COMMANDS.has(normalized)) {
      matches = commandResults(normalized);
    } else {
      matches = searchKnowledge(query);
    }

    if (!matches.length) {
      answer = NO_RESULT;
      addMessage("bot", answer, { save: true });
      lastAnswer = answer;
      return;
    }

    answer = makeAnswer(matches[0]);
    addMessage("bot", answer, { save: true });
    renderResults(matches.slice(0, 5));
    lastAnswer = answer;
  }

  function searchKnowledge(query, options = {}) {
    return knowledge
      .map((item) => ({ item, score: scoreItem(item, query) }))
      .filter((result) => result.score > 8 && (options.ignoreFilter || filterMatch(result.item)))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }

  function commandResults(command) {
    const aliases = {
      help: ["home", "diploma", "syllabus", "notes"],
      "site map": ["site map", "home", "revision", "syllabus", "materials", "contact"],
      subjects: ["subject", "1003", "1004", "mathematics", "chemistry", "physics"],
      downloads: ["download", "pdf", "notes"],
      "question papers": ["question paper", "previous papers"],
      "model question papers": ["model question paper"],
      "formula sheets": ["formula sheet", "formula"],
      practicals: ["lab", "practical", "manual"],
      contact: ["contact", "developer"],
    };
    const query = (aliases[command] || [command]).join(" ");
    return searchKnowledge(query, { ignoreFilter: true });
  }

  function scoreItem(item, query) {
    const q = normalize(query);
    const tokens = tokenize(q);
    const title = normalize(item.title);
    const code = normalize(item.subjectCode || "");
    const url = normalize(item.url || "");
    const section = normalize(item.section || "");
    const keywords = normalize((item.keywords || []).join(" "));
    const content = normalize([item.subjectName, item.summary, item.content, item.answer].filter(Boolean).join(" "));
    const haystack = `${title} ${code} ${url} ${section} ${keywords} ${content}`;
    let score = 0;

    if (q && title === q) score += 110;
    if (q && code && code === q) score += 105;
    if (q && url.includes(q)) score += 80;
    if (q && title.includes(q)) score += 65;
    if (q && keywords.includes(q)) score += 60;
    if (q && section.includes(q)) score += 35;
    if (q && content.includes(q)) score += 32;

    tokens.forEach((token) => {
      if (!token) return;
      if (code && code === token) score += 95;
      if (title.split(" ").includes(token)) score += 34;
      else if (title.includes(token)) score += 24;
      if (keywords.includes(token)) score += 30;
      if (url.includes(token)) score += 26;
      if (section.includes(token)) score += 17;
      if (content.includes(token)) score += 15;
      if (!haystack.includes(token) && fuzzyToken(token, haystack)) score += 8;
    });

    if (filterMatch(item)) score += 7;
    return score;
  }

  function filterMatch(item) {
    if (activeFilter === "All") return true;
    const blob = normalize([item.section, item.revision, item.title, item.keywords?.join(" "), item.url].join(" "));
    const map = {
      "First Year": ["first year", "common", "1001", "1002", "1003", "1004", "1005"],
      "2015 Revision": ["2015"],
      "2021 Revision": ["2021", "rev2021"],
      Lessons: ["lesson", "lessons"],
      Downloads: ["download", "pdf", "notes"],
      "Question Papers": ["question", "paper", "qp"],
      "Lab / Practical": ["lab", "practical", "manual", "workshop"],
    };
    return (map[activeFilter] || []).some((term) => blob.includes(term));
  }

  function renderResults(results) {
    const list = el("div", { className: "poly-ai-results" });
    results.forEach(({ item, score }) => {
      const confidence = Math.max(38, Math.min(99, Math.round(score)));
      const card = el("article", { className: "poly-ai-card" });
      card.append(
        node("div", { className: "poly-ai-card-top" }, [
          el("h3", { text: item.title || "Website result" }),
          el("span", { className: "poly-ai-pill", text: `${confidence}%` }),
        ]),
        el("p", { text: `${item.section || "Website"}${item.revision ? " / " + item.revision : ""}` }),
        el("p", { text: item.summary || item.answer || "Website resource from POLY PMNA." })
      );

      const links = el("div", { className: "poly-ai-links" });
      addLink(links, "Open page", item.url);
      addLink(links, "Download", item.downloadUrl, "download");
      addLink(links, "Formula", item.formulaUrl, "download");
      addLink(links, "Question bank", item.questionBankUrl, "download");
      addLink(links, "Model QP", item.modelQuestionUrl);
      if (links.children.length) card.append(links);
      list.append(card);
    });
    body.append(list);
    scrollBottom();
  }

  function addLink(parent, label, href, className) {
    if (!href) return;
    const link = el("a", { text: label, className: className || "" });
    link.href = href;
    if (/^https?:\/\//i.test(href)) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    parent.append(link);
  }

  function makeAnswer(result) {
    const item = result.item;
    return item.answer || item.summary || `${item.title} is listed inside this website.`;
  }

  function addMessage(role, text, options = {}) {
    const message = el("div", { className: `poly-ai-msg ${role}`, text });
    body.append(message);
    if (options.save) {
      history.push({ role, text });
      history = history.slice(-30);
      saveHistory();
    }
    scrollBottom();
  }

  function renderHistory() {
    body.textContent = "";
    history.forEach((item) => addMessage(item.role, item.text, { save: false }));
  }

  function clearChat() {
    history = [];
    saveHistory();
    body.textContent = "";
    addMessage(
      "bot",
      "Hi! I can help you search POLY PMNA study materials. Ask me about subject codes, notes, syllabus, question papers, formula sheets, lesson pages, or downloads.",
      { save: true }
    );
    body.append(quick);
  }

  async function copyLastAnswer() {
    const text = lastAnswer || [...history].reverse().find((item) => item.role === "bot")?.text || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = "OK";
      setTimeout(() => (copyButton.textContent = "CP"), 900);
    } catch (error) {
      copyButton.textContent = "!";
      setTimeout(() => (copyButton.textContent = "CP"), 900);
    }
  }

  function updateSuggestions() {
    const value = input.value.trim();
    suggestions.textContent = "";
    if (value.length < 2 || !knowledge.length) {
      suggestions.classList.remove("open");
      return;
    }

    searchKnowledge(value)
      .slice(0, 5)
      .forEach(({ item }) => {
        const choice = el("button", { type: "button", text: item.title });
        choice.addEventListener("click", () => {
          input.value = item.subjectCode || item.title;
          suggestions.classList.remove("open");
          submitQuery(input.value);
        });
        suggestions.append(choice);
      });

    suggestions.classList.toggle("open", suggestions.children.length > 0);
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.slice(-30) : [];
    } catch (error) {
      return [];
    }
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function scrollBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[‐‑‒–—]/g, "-")
      .replace(/[^\p{L}\p{N}\s./:&-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(value) {
    return normalize(value).split(" ").filter((token) => token.length > 1);
  }

  function fuzzyToken(token, haystack) {
    if (token.length < 5) return false;
    return haystack.split(" ").some((word) => levenshtein(token, word) <= 2);
  }

  function levenshtein(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const row = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const tmp = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return row[b.length];
  }

  function iconButton(label, text) {
    return el("button", {
      className: "poly-ai-icon",
      type: "button",
      text,
      attrs: { "aria-label": label, title: label },
    });
  }

  function node(tag, options, children) {
    const element = el(tag, options);
    children.forEach((child) => element.append(child));
    return element;
  }

  function el(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.type) element.type = options.type;
    if (Object.prototype.hasOwnProperty.call(options, "text")) element.textContent = options.text;
    Object.entries(options.attrs || {}).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }
})();
