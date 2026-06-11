(function () {
  "use strict";

  const ROOT = document.getElementById("polySiteAssistant");
  if (!ROOT) return;

  const HISTORY_KEY = "polySiteAssistantHistory";
  const EMAIL = "nandakumarmkdpm@gmail.com";
  const FILTERS = ["All", "First Year", "2021 Revision", "2015 Materials", "Lessons", "Downloads", "Question Papers", "Lab / Practical"];
  const QUICK = ["1001", "1003", "1004", "3041", "Electronics Engineering", "Download notes", "Question papers", "Contact"];
  const COMMANDS = new Set(["help", "site map", "subjects", "downloads", "download notes", "question papers", "model question papers", "2015", "2015 materials", "contact", "clear"]);

  let activeFilter = "All";
  let lastAnswer = "";
  let lastQuery = "";
  let history = loadHistory();
  let records = [];

  const button = el("button", {
    className: "poly-ai-button",
    type: "button",
    attrs: { "aria-label": "Open POLY PMNA assistant", "aria-expanded": "false" },
  });
  button.append(
    el("span", { className: "poly-ai-button-mark", text: "AI", attrs: { "aria-hidden": "true" } }),
    node("span", { className: "poly-ai-button-copy" }, [
      el("span", { className: "poly-ai-button-text", text: "Ask POLY" }),
      el("span", { className: "poly-ai-button-subtext", text: "Subject finder" }),
    ])
  );

  const panel = el("section", { className: "poly-ai-panel", attrs: { role: "dialog", "aria-label": "Ask POLY PMNA" } });
  const header = el("div", { className: "poly-ai-head" });
  header.append(
    el("div", { className: "poly-ai-avatar", text: "AI", attrs: { "aria-hidden": "true" } }),
    node("div", {}, [
      el("div", { className: "poly-ai-title", text: "Ask POLY PMNA" }),
      el("div", { className: "poly-ai-subtitle", text: "Find subjects, lessons, downloads and QP links" }),
    ])
  );

  const copyButton = iconButton("Copy last answer", "Copy");
  const clearButton = iconButton("Clear chat", "Clear");
  const closeButton = iconButton("Close assistant", "X");
  header.append(copyButton, clearButton, closeButton);

  const tabs = el("div", { className: "poly-ai-tabs", attrs: { "aria-label": "Assistant filters" } });
  const status = el("div", { className: "poly-ai-status", text: "Subject assistant ready" });
  const body = el("div", { className: "poly-ai-body", attrs: { "aria-live": "polite" } });
  const quick = el("div", { className: "poly-ai-quick", attrs: { "aria-label": "Quick suggestions" } });
  const form = el("form", { className: "poly-ai-form" });
  const inputWrap = el("div", { className: "poly-ai-input-wrap" });
  const suggestions = el("div", { className: "poly-ai-suggestions" });
  const input = el("input", {
    attrs: { type: "search", placeholder: "Type subject code, name or department...", "aria-label": "Ask POLY PMNA", autocomplete: "off" },
  });
  const send = el("button", { className: "poly-ai-send", type: "submit", text: "Search" });

  inputWrap.append(suggestions, input);
  form.append(inputWrap, send);
  panel.append(header, tabs, status, body, form);
  ROOT.append(panel, button);

  FILTERS.forEach((filter) => {
    const item = el("button", { type: "button", text: filter });
    if (filter === activeFilter) item.classList.add("active");
    item.addEventListener("click", () => {
      activeFilter = filter;
      [...tabs.children].forEach((child) => child.classList.toggle("active", child === item));
      const query = input.value.trim() || lastQuery;
      if (query) runSearch(query, false);
      else setStatus(`Filter active: ${filter}`);
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

  function init() {
    records = buildRecords();
    renderHistory();
    if (!history.length) {
      addMessage(
        "bot",
        "Hi! Type a subject code like 1001, 1003, 3041, or a department name. I can open syllabus, lessons, notes and model question papers directly.",
        { save: true }
      );
      body.append(quick);
    }
    setStatus(`${records.length} searchable records ready`);
  }

  function buildRecords() {
    const out = [];
    const seen = new Set();
    if (Array.isArray(window.SUBJECTS)) {
      window.SUBJECTS.forEach((subject) => {
        const key = [subject.revision, subject.department, subject.semester, subject.code].join(":");
        if (seen.has(key)) return;
        seen.add(key);
        const lessonUrl = safeLessonLink(subject);
        const notesUrl = safeNotesLink(subject);
        const syllabusUrl = safeSyllabusLink(subject.code);
        const modelUrl = safeModelQuestionPaperLink(subject.code);
        out.push({
          kind: "subject",
          title: `${subject.code} - ${subject.name}`,
          code: String(subject.code || ""),
          subjectName: subject.name || "",
          department: subject.department || "",
          semester: subject.semester || "",
          type: subject.type || "",
          revision: subject.revision || "",
          section: `${subject.revision || ""} / ${subject.department || ""} / ${subject.semester || ""}`,
          summary: `${subject.name} is a ${subject.type || "subject"} in ${subject.department || "Diploma"}, ${subject.semester || "semester"}.`,
          answer: `${subject.code} is ${subject.name}. Use the action buttons below to open its syllabus, lesson page, notes download or model question paper.`,
          url: lessonUrl,
          lessonUrl,
          downloadUrl: notesUrl,
          syllabusUrl,
          modelQuestionUrl: modelUrl,
          keywords: [subject.code, subject.name, subject.department, subject.semester, subject.type, subject.revision, "lesson", "download", "notes", "qp"].filter(Boolean),
        });
      });
    }

    out.push(
      pageRecord("Home", rootPath("index.html"), "Main landing page for Diploma Notes.", ["home", "site map"]),
      pageRecord("Revision 2021", rootPath("revision-2021.html"), "Open department-wise Revision 2021 subject pages.", ["2021", "revision", "departments"]),
      pageRecord("2015 Materials", rootPath("materials-2015.html"), "Open older 2015 scheme study material links.", ["2015", "materials", "legacy"]),
      pageRecord("Question Papers", rootPath("model-question-papers.html"), "Open model question paper resources.", ["question", "paper", "qp", "model"]),
      pageRecord("Help / Email", `mailto:${EMAIL}?subject=Diploma%20Notes%20Help`, "Email Nandakumar directly for corrections, missing notes or broken links.", ["contact", "email", "help"])
    );
    return out;
  }

  function pageRecord(title, url, summary, keywords) {
    return { kind: "page", title, section: "Website", summary, answer: summary, url, keywords, revision: "" };
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
    lastQuery = query;
    runSearch(query, true);
    input.value = "";
  }

  function runSearch(query, shouldRespond) {
    const normalized = normalize(query);
    let matches = COMMANDS.has(normalized) ? commandResults(normalized) : searchRecords(query);

    clearResultBlocks();
    if (!matches.length) {
      const answer = "No matching item found. Try a subject code, department name, lesson, notes, question papers, or contact.";
      if (shouldRespond) addMessage("bot", answer, { save: true });
      setStatus("No matching website record found");
      lastAnswer = answer;
      return;
    }

    const answer = makeAnswer(matches[0]);
    if (shouldRespond) addMessage("bot", answer, { save: true });
    renderResults(matches.slice(0, 7));
    setStatus(`${matches.length} result${matches.length === 1 ? "" : "s"} found`);
    lastAnswer = answer;
  }

  function searchRecords(query, options = {}) {
    return records
      .map((item) => ({ item, score: scoreItem(item, query) }))
      .filter((result) => result.score > 8 && (options.ignoreFilter || filterMatch(result.item)))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }

  function commandResults(command) {
    const aliases = {
      help: "help contact email site map subject lesson notes",
      "site map": "home revision 2021 materials 2015 question papers contact",
      subjects: "subject first year electronics engineering semester",
      downloads: "download notes pdf lesson",
      "download notes": "download notes pdf lesson",
      "question papers": "question paper qp model",
      "model question papers": "question paper qp model",
      "2015": "2015 materials legacy",
      "2015 materials": "2015 materials legacy",
      contact: "contact email help",
    };
    return searchRecords(aliases[command] || command, { ignoreFilter: true });
  }

  function scoreItem(item, query) {
    const q = normalize(query);
    const tokens = tokenize(q);
    const code = normalize(item.code || item.subjectCode || "");
    const title = normalize(item.title || "");
    const subjectName = normalize(item.subjectName || "");
    const department = normalize(item.department || "");
    const semester = normalize(item.semester || "");
    const type = normalize(item.type || "");
    const revision = normalize(item.revision || "");
    const section = normalize(item.section || "");
    const keywords = normalize((item.keywords || []).join(" "));
    const url = normalize(item.url || "");
    const haystack = `${code} ${title} ${subjectName} ${department} ${semester} ${type} ${revision} ${section} ${keywords} ${url}`;
    let score = 0;

    if (q && code === q) score += 180;
    if (q && title === q) score += 130;
    if (q && title.includes(q)) score += 80;
    if (q && subjectName.includes(q)) score += 75;
    if (q && department.includes(q)) score += 65;
    if (q && haystack.includes(q)) score += 42;

    tokens.forEach((token) => {
      if (!token) return;
      if (code === token) score += 120;
      else if (code.includes(token)) score += 70;
      if (subjectName.includes(token)) score += 35;
      if (title.includes(token)) score += 30;
      if (department.includes(token)) score += 24;
      if (semester.includes(token)) score += 18;
      if (type.includes(token)) score += 15;
      if (keywords.includes(token)) score += 18;
      if (!haystack.includes(token) && fuzzyToken(token, haystack)) score += 8;
    });

    if (filterMatch(item)) score += 6;
    return score;
  }

  function filterMatch(item) {
    if (activeFilter === "All") return true;
    const blob = normalize([item.section, item.revision, item.title, item.department, item.type, (item.keywords || []).join(" "), item.url].join(" "));
    const map = {
      "First Year": ["first year", "common", "1001", "1002", "1003", "1004", "1005"],
      "2015 Materials": ["2015", "legacy"],
      "2021 Revision": ["2021"],
      Lessons: ["lesson", "lessons"],
      Downloads: ["download", "pdf", "notes"],
      "Question Papers": ["question", "paper", "qp", "model"],
      "Lab / Practical": ["lab", "practical", "manual", "workshop"],
    };
    return (map[activeFilter] || []).some((term) => blob.includes(term));
  }

  function renderResults(results) {
    const list = el("div", { className: "poly-ai-results" });
    results.forEach(({ item, score }) => {
      const confidence = Math.max(45, Math.min(99, Math.round(score)));
      const card = el("article", { className: "poly-ai-card" });
      card.append(
        node("div", { className: "poly-ai-card-top" }, [
          el("h3", { text: item.title || "Website result" }),
          el("span", { className: "poly-ai-pill", text: `${confidence}%` }),
        ]),
        el("p", { text: item.section || "Website" }),
        el("p", { text: item.summary || item.answer || "Website resource from POLY PMNA." })
      );

      const links = el("div", { className: "poly-ai-links" });
      addLink(links, item.kind === "subject" ? "Open lesson" : "Open page", item.url);
      addLink(links, "Syllabus", item.syllabusUrl);
      addLink(links, "Download notes", item.downloadUrl, "download");
      addLink(links, "Model QP", item.modelQuestionUrl);
      if (links.children.length) card.append(links);
      list.append(card);
    });
    body.append(list);
    scrollBottom();
  }

  function clearResultBlocks() {
    body.querySelectorAll(".poly-ai-results").forEach((block) => block.remove());
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
    addMessage("bot", "Hi! Type a subject code, subject name, department, lesson, download, question paper, 2015 materials or contact.", { save: true });
    body.append(quick);
  }

  async function copyLastAnswer() {
    const text = lastAnswer || [...history].reverse().find((item) => item.role === "bot")?.text || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = "OK";
      setStatus("Last answer copied");
      setTimeout(() => (copyButton.textContent = "Copy"), 900);
    } catch (error) {
      copyButton.textContent = "!";
      setStatus("Copy is not available in this browser");
      setTimeout(() => (copyButton.textContent = "Copy"), 900);
    }
  }

  function setStatus(text) {
    status.textContent = text;
  }

  function updateSuggestions() {
    const value = input.value.trim();
    suggestions.textContent = "";
    if (value.length < 2) {
      suggestions.classList.remove("open");
      return;
    }

    searchRecords(value, { ignoreFilter: true }).slice(0, 6).forEach(({ item }) => {
      const choice = el("button", { type: "button", text: item.title });
      choice.addEventListener("click", () => {
        input.value = item.code || item.title;
        suggestions.classList.remove("open");
        submitQuery(input.value);
      });
      suggestions.append(choice);
    });

    suggestions.classList.toggle("open", suggestions.children.length > 0);
  }

  function rootPath(path) {
    const depth = window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    const prefix = depth > 0 ? "../".repeat(depth) : "";
    return `${prefix}${path}`;
  }

  function safeLessonLink(subject) {
    if (typeof window.lessonLink === "function") return window.lessonLink(subject);
    return rootPath(`lessons/lessons-${encodeURIComponent(subject.code)}.html`);
  }

  function safeNotesLink(subject) {
    if (typeof window.notesLink === "function") return window.notesLink(subject);
    const code = String(subject.code || "");
    if (code === "1003" || code === "1004") return rootPath(`notes/downloadable-notes-${encodeURIComponent(code)}.pdf`);
    return rootPath(`lessons/lessons-${encodeURIComponent(code)}.html`);
  }

  function safeSyllabusLink(code) {
    if (typeof window.syllabusLink === "function") return window.syllabusLink(code);
    return `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(code)}`;
  }

  function safeModelQuestionPaperLink(code) {
    if (typeof window.modelQuestionPaperLink === "function") return window.modelQuestionPaperLink(code);
    return `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(code)}`;
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
    return el("button", { className: "poly-ai-icon", type: "button", text, attrs: { "aria-label": label, title: label } });
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