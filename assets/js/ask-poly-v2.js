/* Purpose: Ask poly v2 - Descriptive comment added for clarity */
(() => {
  "use strict";

  if (!/\/ask-poly(?:-v2)?\.html$/i.test(location.pathname)) return;

  const DB_NAME = "ask-poly-v2-db";
  const DB_VERSION = 1;
  // The primary Worker and Supabase relay both validate history at a maximum of six entries.
  const MAX_HISTORY = Math.min(6, Math.max(0, Number(window.ASK_POLY_CONFIG?.maxHistory || 6)));
  const MAX_QUEUE = 8;
  let dbPromise = null;
  let activeChatId = null;
  let waiting = false;

  const $ = (id) => document.getElementById(id);
  const els = {
    list: $("chatList"),
    search: $("chatSearch"),
    messages: $("chatMessages"),
    form: $("chatForm"),
    input: $("chatInput"),
    status: $("chatStatus"),
    title: $("chatTitle"),
    sub: $("chatSub"),
    prompts: $("quickPrompts"),
    newChat: $("newChatBtn"),
    send: $("sendBtn"),
    stop: $("stopBtn"),
    queue: $("queueBtn"),
    department: $("departmentContext"),
    contextDepartment: $("contextDepartment"),
    contextSemester: $("contextSemester"),
    contextRevision: $("contextRevision"),
    contextMode: $("contextMode"),
    pageContextNotice: $("pageContextNotice"),
    toolsToggle: $("toolsToggle"),
    toolsPanel: $("askToolsPanel"),
    markTarget: $("markTarget"),
    learningLevel: $("learningLevel"),
    dataSaver: $("dataSaverToggle"),
    attachment: $("askAttachment"),
    attachmentBtn: $("attachmentBtn"),
    voiceInput: $("voiceInputBtn"),
    readAloud: $("readAloudBtn"),
    attachmentStatus: $("attachmentStatus")
  };

  let abortController = null;
  let messageQueue = [];
  let stopRequested = false;
  let departmentRegistry = null;
  let activeDepartment = null;
  const DEFAULT_CONTEXT = { department: null, semester: "", revision: "", mode: "explain", marks: "", level: "intermediate", page: null };
  let learningContext = { ...DEFAULT_CONTEXT };
  let activeAttachment = null;
  let latestAssistantText = "";
  let speechRecognition = null;
  let dataSaverEnabled = localStorage.getItem("ask-poly-data-saver") === "1";

  if (!els.form || !els.messages || !els.input) return;

  function now() { return new Date().toISOString(); }
  function id() { return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
  function fmtTime(value) { return new Date(value || Date.now()).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  function isMobile() { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ""); }

  const MODE_LABELS = {
    explain: "Explain", exam: "Exam Answer", "short-note": "Short Note", "step-by-step": "Step-by-Step",
    numerical: "Numerical", viva: "Viva", diagram: "Diagram", revision: "Revision", practice: "Practice",
    teach: "Teach Me", simpler: "I don't understand", "real-world": "Real-world example", mistakes: "Common mistakes",
    compare: "Compare", "check-answer": "Check My Answer", lab: "Lab Mode", troubleshoot: "Troubleshoot", drawing: "Drawing Assistant",
    formula: "Formula Sheet", notes: "Study Notes", "study-plan": "Study Plan", "previous-questions": "Previous Questions"
  };

  function contextSnapshot() {
    return {
      department: learningContext.department ? { code: learningContext.department.code, displayName: learningContext.department.displayName } : null,
      semester: learningContext.semester || "",
      revision: learningContext.revision || "",
      mode: learningContext.mode || "explain",
      marks: learningContext.marks || "",
      level: learningContext.level || "intermediate",
      page: learningContext.page || null
    };
  }

  function modeLabel(mode) { return MODE_LABELS[mode] || MODE_LABELS.explain; }

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("chats")) {
          const chats = db.createObjectStore("chats", { keyPath: "id" });
          chats.createIndex("updatedAt", "updatedAt");
          chats.createIndex("title", "title");
        }
        if (!db.objectStoreNames.contains("messages")) {
          const messages = db.createObjectStore("messages", { keyPath: "id" });
          messages.createIndex("chatId", "chatId");
          messages.createIndex("createdAt", "createdAt");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function tx(storeName, mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(storeName, mode);
      const store = t.objectStore(storeName);
      const result = fn(store);
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
    });
  }

  async function getAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(storeName, "readonly");
      const req = t.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function getChat(chatId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction("chats", "readonly");
      const req = t.objectStore("chats").get(chatId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function getMessages(chatId) {
    const all = await getAll("messages");
    return all.filter((m) => m.chatId === chatId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  async function putChat(chat) { await tx("chats", "readwrite", (s) => s.put(chat)); }
  async function putMessage(message) { await tx("messages", "readwrite", (s) => s.put(message)); }

  async function deleteChat(chatId) {
    const db = await openDB();
    const messages = await getMessages(chatId);
    await new Promise((resolve, reject) => {
      const t = db.transaction(["chats", "messages"], "readwrite");
      t.objectStore("chats").delete(chatId);
      messages.forEach((m) => t.objectStore("messages").delete(m.id));
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
    });
  }

  async function createChat(title = "New chat") {
    const chat = { id: id(), title, createdAt: now(), updatedAt: now(), department: null, semester: "", revision: "", mode: "explain", page: null };
    await putChat(chat);
    activeChatId = chat.id;
    await addMessage("assistant", "Hi. I am Ask POLY AI. I can guide you through Revision 2026, Revision 2021, 2015 materials, subjects, lessons, notes, mock exams, tools and the rest of POLY PMNA. This chat is saved in your browser.");
    await renderAll();
  }

  async function persistDepartment(department) {
    if (!department || department.ambiguous || !activeChatId) return;
    activeDepartment = department;
    learningContext.department = department;
    await persistLearningContext();
  }

  async function persistLearningContext() {
    if (!activeChatId) return;
    const chat = await getChat(activeChatId);
    if (!chat) return;
    chat.department = learningContext.department ? { code: learningContext.department.code, displayName: learningContext.department.displayName, normalizedName: learningContext.department.normalizedName } : null;
    chat.semester = learningContext.semester || "";
    chat.revision = learningContext.revision || "";
    chat.mode = learningContext.mode || "explain";
    chat.marks = learningContext.marks || "";
    chat.level = learningContext.level || "intermediate";
    chat.page = learningContext.page || null;
    chat.updatedAt = now();
    await putChat(chat);
  }

  async function restoreLearningContext(chat) {
    const stored = chat || await getChat(activeChatId);
    const storedDepartment = stored?.department?.code && departmentRegistry?.get(stored.department.code)
      ? { ...departmentRegistry.get(stored.department.code), source: "saved-context" }
      : null;
    activeDepartment = storedDepartment;
    learningContext = {
      ...DEFAULT_CONTEXT,
      department: storedDepartment,
      semester: stored?.semester || "",
      revision: stored?.revision || "",
      mode: stored?.mode || "explain",
      marks: stored?.marks || "",
      level: stored?.level || "intermediate",
      page: stored?.page || null
    };
    updateContextUI();
  }

  async function updateDepartmentContextFromChat() {
    const chat = await getChat(activeChatId);
    const messages = activeChatId ? await getMessages(activeChatId) : [];
    const stored = chat?.department;
    if (chat) {
      learningContext.semester = chat.semester || learningContext.semester || "";
      learningContext.revision = chat.revision || learningContext.revision || "";
      learningContext.mode = chat.mode || learningContext.mode || "explain";
      learningContext.marks = chat.marks || learningContext.marks || "";
      learningContext.level = chat.level || learningContext.level || "intermediate";
      learningContext.page = chat.page || learningContext.page || null;
    }
    activeDepartment = stored?.code && departmentRegistry?.get(stored.code)
      ? { ...departmentRegistry.get(stored.code), source: "saved-context" }
      : null;
    learningContext.department = activeDepartment;
    for (const message of messages.filter((item) => item.role === "user")) {
      const detected = departmentRegistry?.find(message.content, activeDepartment);
      if (detected && !detected.ambiguous && detected.code !== activeDepartment?.code && detected.source !== "saved-context") activeDepartment = detected;
    }
    if (activeDepartment && chat && chat.department?.code !== activeDepartment.code) await persistDepartment(activeDepartment);
    learningContext.department = activeDepartment;
    updateDepartmentUI();
    updateContextUI();
    return activeDepartment;
  }

  function updateDepartmentUI() {
    if (!els.department) return;
    if (!activeDepartment?.displayName) {
      els.department.hidden = true;
      els.department.textContent = "";
      return;
    }
    els.department.hidden = false;
    els.department.textContent = `Department: ${activeDepartment.displayName}`;
    els.department.title = "Saved department context for this chat. Say 'actually, I am studying ...' to change it.";
  }

  function populateDepartmentSelector() {
    if (!els.contextDepartment || !departmentRegistry?.choices) return;
    const current = els.contextDepartment.value;
    els.contextDepartment.replaceChildren(new Option("Auto Detect", ""));
    departmentRegistry.choices().forEach((item) => els.contextDepartment.add(new Option(item.displayName, item.code)));
    els.contextDepartment.value = current || learningContext.department?.code || "";
  }

  function updateContextUI() {
    if (els.contextDepartment) els.contextDepartment.value = learningContext.department?.code || "";
    if (els.contextSemester) els.contextSemester.value = learningContext.semester || "";
    if (els.contextRevision) els.contextRevision.value = learningContext.revision || "";
    if (els.contextMode) els.contextMode.value = learningContext.mode || "explain";
    if (els.markTarget) els.markTarget.value = learningContext.marks || "";
    if (els.learningLevel) els.learningLevel.value = learningContext.level || "intermediate";
    if (els.dataSaver) els.dataSaver.checked = dataSaverEnabled;
    document.body.classList.toggle("ask-data-saver", dataSaverEnabled);
    if (els.pageContextNotice) {
      const page = learningContext.page;
      els.pageContextNotice.hidden = !page;
      els.pageContextNotice.textContent = page ? `Page context: ${page.subject || page.topic || page.title || "Current POLY PMNA page"}${page.semester ? ` · ${page.semester}` : ""}${page.revision ? ` · Revision ${page.revision}` : ""}` : "";
    }
  }

  async function setLearningContext(partial = {}, persist = true) {
    if (Object.prototype.hasOwnProperty.call(partial, "department")) {
      learningContext.department = partial.department || null;
      activeDepartment = learningContext.department;
    }
    if (Object.prototype.hasOwnProperty.call(partial, "semester")) learningContext.semester = partial.semester || "";
    if (Object.prototype.hasOwnProperty.call(partial, "revision")) learningContext.revision = partial.revision || "";
    if (Object.prototype.hasOwnProperty.call(partial, "mode")) learningContext.mode = MODE_LABELS[partial.mode] ? partial.mode : "explain";
    if (Object.prototype.hasOwnProperty.call(partial, "marks")) learningContext.marks = String(partial.marks || "");
    if (Object.prototype.hasOwnProperty.call(partial, "level")) learningContext.level = ["beginner", "intermediate", "advanced"].includes(partial.level) ? partial.level : "intermediate";
    if (Object.prototype.hasOwnProperty.call(partial, "page")) learningContext.page = partial.page || null;
    updateDepartmentUI();
    updateContextUI();
    if (persist) await persistLearningContext();
    await renderChats();
    await renderMessages();
  }

  async function applyPageContextFromQuery() {
    const params = new URLSearchParams(location.search);
    const ask = params.get("ask");
    const departmentCode = params.get("department") || params.get("departmentCode");
    const department = departmentCode && departmentRegistry?.get(departmentCode)
      ? { ...departmentRegistry.get(departmentCode), source: "page-context" }
      : null;
    const page = (params.get("pageTitle") || params.get("subject") || params.get("topic") || params.get("page"))
      ? { title: params.get("pageTitle") || "POLY PMNA page", subject: params.get("subject") || "", topic: params.get("topic") || "", semester: params.get("semester") || "", revision: params.get("revision") || "", url: params.get("pageUrl") || document.referrer || "" }
      : null;
    const contextPatch = {};
    if (departmentCode) contextPatch.department = department;
    if (params.has("semester")) contextPatch.semester = params.get("semester") || "";
    if (params.has("revision")) contextPatch.revision = params.get("revision") || "";
    if (params.has("mode")) contextPatch.mode = params.get("mode") || "explain";
    if (page) contextPatch.page = page;
    if (Object.keys(contextPatch).length) await setLearningContext(contextPatch, false);
    if (ask) {
      els.input.value = ask;
      autoResize();
    }
    if (department || page || ask) await persistLearningContext();
  }

  function departmentClarification(candidateResult) {
    const names = (candidateResult?.candidates || []).map((item) => item.displayName).filter(Boolean);
    const list = names.length ? `Possible matches: ${names.join(", ")}.` : "Please choose one of the supported departments.";
    return `Which department are you studying? I want to keep the explanation specific without assuming the wrong programme. ${list}`;
  }

  async function updateChatTitleFromMessage(chatId, text) {
    const chat = await getChat(chatId);
    if (!chat) return;
    if (chat.title && chat.title !== "New chat") {
      chat.updatedAt = now();
      await putChat(chat);
      return;
    }
    const cleanTitle = String(text || "New chat").replace(/\s+/g, " ").trim();
    const lowerTitle = cleanTitle.toLowerCase();
    const topic = cleanTitle.replace(/^(please\s+)?(draw|explain|describe|show|solve|calculate|give|tell me)\s+/i, "").trim();
    const suffix = /draw|diagram|sketch|waveform|circuit/.test(lowerTitle) ? " — Diagram" : /solve|calculate|numerical|voltage|current|resistance/.test(lowerTitle) ? " — Numerical" : /exam|important questions|mark/.test(lowerTitle) ? " — Exam Prep" : "";
    chat.title = `${topic || cleanTitle}${suffix}`.slice(0, 64) || "New chat";
    chat.updatedAt = now();
    await putChat(chat);
  }

  async function addMessage(role, content, meta = {}) {
    if (!activeChatId) await createChat();
    const message = { id: id(), chatId: activeChatId, role, content, createdAt: now(), meta };
    await putMessage(message);
    const chat = await getChat(activeChatId);
    if (chat) { chat.updatedAt = now(); await putChat(chat); }
    return message;
  }

  const escapeHtml = window.PolyUtils.escapeHtml;

  function splitMarkdownRow(line) {
    let value = String(line || "").trim();
    if (!value.includes("|")) return [];
    if (value.startsWith("|")) value = value.slice(1);
    if (value.endsWith("|") && !value.endsWith("\\|")) value = value.slice(0, -1);
    return value.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, "|").trim());
  }

  function isMarkdownTableDivider(line) {
    const cells = splitMarkdownRow(line);
    return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  /* Lightweight code syntax highlighting for Ask POLY code fences.
   * Returns HTML with <span class="hl-*> wrappers; colors are defined in
   * ask-poly-main.css (.ask-code .hl-keyword, .hl-string, ...). */
  const HIGHLIGHT_RULES = [
    /* strings (must come first) */
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|"""[\s\S]*?"""|'''[\s\S]*?''')/g, cls: "hl-string" },
    /* comments */
    { pattern: /(#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?--!?>)/g, cls: "hl-comment" },
    /* numbers */
    { pattern: /\b(\d[\d._]*)\b/g, cls: "hl-number" }
  ];
  const LANGUAGE_KEYWORDS = {
    python: "and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|True|False|None|print|input|float|int|str|range|len|self|math|def|if|else|elif|for|while|import|from|return|break|continue|pass|try|except|finally|raise|with|as|async|await|True|False|None|bool|list|dict|set|tuple",
    py: "python",
    javascript: "async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|from|function|if|import|in|instanceof|let|new|null|of|return|static|super|switch|this|throw|true|try|typeof|undefined|var|void|while|with|yield|console|function|=>",
    js: "javascript",
    typescript: "javascript|interface|type|namespace|abstract|implements|private|protected|public|readonly",
    ts: "typescript",
    java: "abstract|assert|boolean|break|byte|case|catch|char|class|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|true|false|String|System|Scanner|Math",
    c: "auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|#include|#define|#ifndef|#endif|#pragma|NULL|printf|scanf|return",
    cpp: "asm|catch|class|const_cast|delete|dynamic_cast|explicit|export|friend|inline|mutable|namespace|new|operator|private|protected|public|register|reinterpret_cast|static_cast|template|throw|try|typeid|typename|using|virtual|goto|bool|true|false|nullptr|std|cout|cin|endl|include|define",
    html: "html|head|body|div|span|a|p|img|ul|ol|li|table|thead|tbody|tr|th|td|form|input|button|select|option|textarea|script|style|link|meta|title|br|hr|h1|h2|h3|h4|h5|h6|nav|header|footer|main|section|article|aside",
    css: "align-items|background|border|color|display|flex|font-size|font-weight|height|justify-content|margin|padding|position|width|height|px|em|rem|%|!important|rgba|var|@media|@keyframes|display|flex|grid|none|auto|relative|absolute|fixed|sticky|inherit|initial|unset|hover|focus|active|media|keyframes|import|font-face",
    sql: "SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|IS|NULL|AS|ORDER|BY|GROUP|HAVING|LIMIT|COUNT|SUM|AVG|MAX|MIN|DISTINCT|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|UNION|ALL|EXISTS|BETWEEN|LIKE|ANY|ASC|DESC|INTEGER|VARCHAR|TEXT|REAL|BLOB|DATETIME|BOOLEAN",
    json: "true|false|null",
    bash: "if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|export|local|source|cd|ls|cat|echo|grep|sed|awk|find|cp|mv|rm|mkdir|chmod|sudo|apt|pip|npm|git|curl|wget",
    sh: "bash",
    xml: "html|head|body|div|span|p|a|img|ul|ol|li|table|form|input|button|script|style|link|meta|title|version|encoding"
  };
  function highlightCode(code, language) {
    const lang = String(language || "").toLowerCase().trim();
    let tokens = [];
    let remaining = String(code || "");
    /* Collect string and comment tokens first so their contents are never keyword-colored */
    const stringCommentPattern = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|"""[\s\S]*?"""|'''[\s\S]*?'''|#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)/g;
    let match;
    let cursor = 0;
    const spans = [];
    while ((match = stringCommentPattern.exec(remaining)) !== null) {
      const token = match[0];
      const isComment = token.startsWith('#') || token.startsWith('//') || token.startsWith('/*') || token.startsWith('<!--');
      spans.push({ start: match.index, end: match.index + token.length, cls: isComment ? "hl-comment" : "hl-string" });
    }
    stringCommentPattern.lastIndex = 0;
    /* Keyword and number highlighting on segments not inside spans */
    const keywords = LANGUAGE_KEYWORDS[lang] || null;
    let out = "";
    cursor = 0;
    for (const span of spans) {
      out += highlightKeywordsAndNumbers(remaining.slice(cursor, span.start), keywords);
      out += `<span class="${span.cls}">${escapeHtml(remaining.slice(span.start, span.end))}</span>`;
      cursor = span.end;
    }
    out += highlightKeywordsAndNumbers(remaining.slice(cursor), keywords);
    return out;
  }
  function highlightKeywordsAndNumbers(segment, keywords) {
    let html = escapeHtml(segment).replace(/\b(\d[\d._]*)\b/g, '<span class="hl-number">$1</span>');
    if (keywords) {
      const kwPattern = new RegExp(`\\b(${keywords})\\b`, "g");
      /* Apply keywords without touching already-highlighted numbers: split on hl-number spans */
      const parts = html.split(/(<span class="hl-number">[\s\S]*?<\/span>)/);
      html = parts.map((part) => part.startsWith("<span class=\"hl-number\"") ? part : part.replace(kwPattern, '<span class="hl-keyword">$1</span>')).join("");
    }
    return html;
  }
  function looksLikeAsciiDiagram(code) {
    const value = String(code || "");
    return /[┌┐└┘│─━→←↑↓]/.test(value)
      || /(?:\+[-=]{2,}\+|\|[^\n|]{1,}\|)/.test(value)
      || /(?:\|[><]+\||\-\-+\s*(?:\||>|<)|(?:VCC|GND|Vin|Vout)\s*(?:\||↓|↑|-->|->))/i.test(value);
  }

  function renderCodeBlock(codeLines, options = {}) {
    const firstLine = codeLines[0] || "";
    const langMatch = /^\s*([a-z0-9+._#-]+)\s*$/i.exec(firstLine);
    const hasLang = langMatch && codeLines.length > 1;
    const language = hasLang ? langMatch[1] : "";
    const code = (hasLang ? codeLines.slice(1) : codeLines).join("\n").trim();
    if (!code) return "";
    if (options.diagramIntent && looksLikeAsciiDiagram(code)) {
      return `<p class="ask-diagram-fallback-note">The graphical diagram above replaces the text sketch.</p>`;
    }
    const label = language ? `<span class="ask-code-lang">${escapeHtml(language)}</span>` : "";
    const copyBtn = `<button type="button" class="ask-code-copy" aria-label="Copy code">Copy</button>`;
    return `<figure class="ask-code"><figcaption><span class="ask-code-head">${label}Code</span>${copyBtn}</figcaption><pre><code class="hljs">${highlightCode(code, language)}</code></pre></figure>`;
  }

  function renderInlineMarkdown(value) {
    let html = escapeHtml(value);
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+|data:image\/[^;]+;base64,[^\s)]+)\)/g, '<img src="$2" alt="$1" class="ask-generated-image" loading="lazy">');
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    html = html.replace(/_([^_\n]+)_/g, "<em>$1</em>");
    return html;
  }

  function renderMarkdownTable(headerLine, bodyLines) {
    const headers = splitMarkdownRow(headerLine);
    const rows = bodyLines.map(splitMarkdownRow).filter((cells) => cells.length > 0);
    const headerHtml = headers.map((cell) => `<th scope="col">${renderInlineMarkdown(cell)}</th>`).join("");
    const bodyHtml = rows.map((cells) => {
      const padded = headers.map((_, index) => cells[index] || "");
      return `<tr>${padded.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join("")}</tr>`;
    }).join("");
    return `<div class="ask-table-wrap" role="region" aria-label="Response table" tabindex="0"><table class="ask-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
  }

  function renderText(text, options = {}) {
    const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
    const blocks = [];
    let index = 0;
    let paragraph = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      const value = paragraph.join("\n").trim();
      if (value) blocks.push(`<p>${value.split("\n").map(renderInlineMarkdown).join("<br>")}</p>`);
      paragraph = [];
    };

    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        flushParagraph();
        index += 1;
        continue;
      }

      if (/^\s*```/.test(line)) {
        flushParagraph();
        const code = [];
        index += 1;
        while (index < lines.length && !/^\s*```/.test(lines[index])) {
          code.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) index += 1;
        blocks.push(renderCodeBlock(code, options));
        continue;
      }

      if (index + 1 < lines.length && line.includes("|") && isMarkdownTableDivider(lines[index + 1])) {
        flushParagraph();
        const body = [];
        index += 2;
        while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
          body.push(lines[index]);
          index += 1;
        }
        blocks.push(renderMarkdownTable(line, body));
        continue;
      }

      const heading = /^\s*(#{1,4})\s+(.+)$/.exec(line);
      if (heading) {
        flushParagraph();
        const level = Math.min(4, heading[1].length);
        blocks.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
        index += 1;
        continue;
      }

      if (/^\s*>\s?/.test(line)) {
        flushParagraph();
        const quote = [];
        while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
          quote.push(renderInlineMarkdown(lines[index].replace(/^\s*>\s?/, "")));
          index += 1;
        }
        blocks.push(`<blockquote>${quote.join("<br>")}</blockquote>`);
        continue;
      }

      const unordered = /^\s*[-*•]\s+(.+)$/.exec(line);
      const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
      if (unordered || ordered) {
        flushParagraph();
        const items = [];
        const pattern = unordered ? /^\s*[-*•]\s+(.+)$/ : /^\s*\d+[.)]\s+(.+)$/;
        while (index < lines.length) {
          const item = pattern.exec(lines[index]);
          if (!item) break;
          items.push(`<li>${renderInlineMarkdown(item[1])}</li>`);
          index += 1;
        }
        blocks.push(`<${unordered ? "ul" : "ol"}>${items.join("")}</${unordered ? "ul" : "ol"}>`);
        continue;
      }

      if (/^\s*(---+|___+|\*\s*\*\s*\*)\s*$/.test(line)) {
        flushParagraph();
        blocks.push("<hr>");
        index += 1;
        continue;
      }

      paragraph.push(line);
      index += 1;
    }

    flushParagraph();
    return blocks.join("");
  }

  function renderDepartmentChoices(candidates = []) {
    const items = candidates.filter((item) => item?.displayName).slice(0, 6);
    if (!items.length) return "";
    return `<div class="ask-department-choices" aria-label="Choose your department"><strong>Choose your department</strong><div>${items.map((item) => `<button type="button" data-department-choice="${escapeHtml(item.displayName)}">${escapeHtml(item.displayName)}</button>`).join("")}</div></div>`;
  }

  function sourceItems(meta = {}) {
    const sources = Array.isArray(meta.sources) ? meta.sources : [];
    return sources.filter((item) => item?.title && item?.url).slice(0, 6);
  }

  function renderKnowledgeIndicator(meta = {}) {
    if (meta.error && !meta.websiteKnowledge) return `<div class="ask-knowledge-indicator warning">⚠️ Live AI was unavailable; please verify this answer.</div>`;
    if (meta.websiteKnowledge) return `<div class="ask-knowledge-indicator grounded">✓ Based on POLY PMNA resources used for this answer</div>`;
    return `<div class="ask-knowledge-indicator general">ℹ General engineering knowledge; no POLY PMNA source was required</div>`;
  }

  function renderSources(meta = {}) {
    const sources = sourceItems(meta);
    if (!sources.length) return "";
    return `<section class="ask-sources" aria-label="Sources used"><strong>Sources used</strong><ul>${sources.map((item) => `<li>${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>` : escapeHtml(item.title)}${item.detail ? ` · ${escapeHtml(item.detail)}` : ""}</li>`).join("")}</ul></section>`;
  }

  function followUpActions(content = "", meta = {}) {
    const value = String(content || "").toLowerCase();
    const actions = [];
    if (/transformer/.test(value)) actions.push(["Construction", "Explain the construction of the topic above with exam points."] , ["Working", "Explain the working of the topic above step by step."], ["Losses", "Explain the losses and efficiency of the topic above."], ["Draw Diagram", "Draw a clear labelled diagram of the topic above."]);
    else if (/diode|rectifier|zener/.test(value)) actions.push(["Symbol", "Show the symbol and terminals for the topic above."], ["Working", "Explain the working of the topic above."], ["Applications", "List the applications of the topic above."], ["Draw Circuit", "Draw a labelled circuit for the topic above."]);
    else if (/beam|stress|concrete|survey|structure/.test(value)) actions.push(["Exam Answer", "Rewrite the answer above as a 5-mark exam answer."], ["Draw Diagram", "Draw a clear labelled engineering diagram for the topic above."], ["Important Formula", "List the important formulas for the topic above."]);
    else actions.push(["I don't understand", "I don't understand the previous answer. Explain it using a different approach, analogy, simple example, and short summary."], ["Real-world example", "Give a relevant real-world example of the previous answer for my department."], ["Common mistakes", "List useful common mistakes and corrections for the previous topic."], ["Exam Answer", "Rewrite the previous answer as an exam-ready answer."], ["Convert to Notes", "Convert the previous answer into concise study notes."]);
    if (meta.diagramIntent) actions.unshift(["Exam Answer", "Write an exam-ready answer for the diagram above."]);
    return actions.slice(0, 5);
  }

  function renderResponseActions(message) {
    if (!message.meta?.error) return "";
    return `<div class="ask-response-actions" aria-label="Response actions"><button type="button" data-retry-message="true">Retry</button></div>`;
  }

  function downloadMarkdown(filename, text) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function answerTitle(message) {
    const first = String(message?.content || "").split(/\r?\n/).map((line) => line.replace(/^#+\s*/, "").trim()).find(Boolean) || "POLY AI answer";
    return first.slice(0, 90);
  }

  function saveAnswerAsNote(message) {
    const notes = JSON.parse(localStorage.getItem("ask-poly-saved-notes") || "[]");
    notes.unshift({ id: id(), title: answerTitle(message), content: String(message.content || ""), savedAt: now(), context: contextSnapshot() });
    localStorage.setItem("ask-poly-saved-notes", JSON.stringify(notes.slice(0, 40)));
    setAttachmentStatus("Answer saved locally as a study note.", "ready");
  }

  function exportAnswerAsNote(message) {
    const title = answerTitle(message);
    const sourceText = message.meta?.sources?.length ? `\n\n## Sources\n${message.meta.sources.map((source) => `- [${source.title}](${source.url})`).join("\n")}` : "";
    const text = `# ${title}\n\n${String(message.content || "").trim()}${sourceText}\n`;
    downloadMarkdown(`${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "poly-note"}.md`, text);
    setAttachmentStatus("Study note exported as Markdown.", "ready");
  }

  async function reportMistake(message) {
    const reason = window.prompt("What should POLY AI check? You can leave this blank.", "");
    if (reason === null) return;
    const question = (await getMessages(activeChatId)).filter((item) => item.role === "user").slice(-1)[0]?.content || "";
    const report = [`POLY PMNA Ask POLY mistake report`, `Page: ${location.href}`, `Mode: ${modeLabel(learningContext.mode)}`, `Question: ${question}`, `Answer: ${message.content}`, reason.trim() ? `Student note: ${reason.trim()}` : ""].filter(Boolean).join("\n\n");
    try { await navigator.clipboard?.writeText(report); } catch (_) { window.prompt("Copy this report into the POLY PMNA Help form:", report); return; }
    els.status.textContent = "Report details copied. Open Help and paste them into the discussion form.";
    window.open("/contact.html?from=ask-poly", "_blank", "noopener");
  }

  function actionPrompt(action, content) {
    const text = String(action || "");
    return text.replace(/the previous answer|the answer above|the topic above/gi, "the previous Ask POLY answer");
  }

  function bubble(message) {
    const div = document.createElement("div");
    const isUser = message.role === "user";
    div.className = `ask-bubble ${isUser ? "user" : "ai"}`;
    const label = `<div class="ask-message-label">${isUser ? "You" : "POLY AI"}</div>`;
    const diagramIntent = message.meta?.diagramIntent || null;
    const diagramHtml = !isUser && diagramIntent && (!dataSaverEnabled || diagramIntent.type === "flowchart") && window.AskPolyDiagrams
      ? window.AskPolyDiagrams.render(diagramIntent)
      : "";
    const departmentChoices = !isUser ? renderDepartmentChoices(message.meta?.departmentClarification?.candidates || []) : "";
    const evidence = !isUser && (message.meta?.provider || message.meta?.websiteKnowledge || message.meta?.error || message.meta?.sources?.length);
    const knowledge = evidence ? renderKnowledgeIndicator(message.meta) : "";
    const sources = !isUser ? renderSources(message.meta) : "";
    const actions = !isUser && (String(message.content || "").length > 120 || diagramIntent || message.meta?.websiteKnowledge) ? renderResponseActions(message) : "";
    div.innerHTML = isUser
      ? `${label}<div class="ask-message-text">${escapeHtml(message.content)}</div>`
      : `${label}<div class="ask-response-body">${diagramHtml}${knowledge}${renderText(message.content, { diagramIntent })}${departmentChoices}${sources}${actions}</div>`;
    if (message.role === "assistant" && Boolean(message.meta?.error)) div.dataset.polyError = "true";
    const time = document.createElement("time");
    time.className = "ask-time";
    time.dateTime = message.createdAt;
    time.textContent = fmtTime(message.createdAt);
    div.append(time);
    div.addEventListener("click", async (event) => {
      const departmentButton = event.target.closest("[data-department-choice]");
      if (departmentButton) {
        event.preventDefault();
        els.input.value = `I am studying ${departmentButton.dataset.departmentChoice}. `;
        autoResize();
        els.input.focus();
        return;
      }
      const retryButton = event.target.closest("[data-retry-message]");
      if (retryButton) {
        event.preventDefault();
        const previous = (await getMessages(activeChatId)).filter((item) => item.role === "user").slice(-1)[0]?.content || "";
        els.input.value = previous;
        autoResize();
        els.input.focus();
        return;
      }
      const examCopyButton = event.target.closest("[data-copy-exam]");
      if (examCopyButton) {
        event.preventDefault();
        const cleanedAnswer = String(message.content || "").replace(/^(sure|certainly|here(?:'s| is)[^\n]*\n)/i, "").trim();
        const diagramText = message.meta?.diagramIntent && window.AskPolyDiagrams?.textFor ? `\n\n${window.AskPolyDiagrams.textFor(message.meta.diagramIntent)}` : "";
        const cleaned = `${cleanedAnswer}${diagramText}`.trim();
        try { await navigator.clipboard.writeText(cleaned); examCopyButton.textContent = "Copied"; setTimeout(() => { examCopyButton.textContent = "Copy exam answer"; }, 1100); } catch (_) {}
        return;
      }
      const saveNoteButton = event.target.closest("[data-save-note]");
      if (saveNoteButton) { event.preventDefault(); saveAnswerAsNote(message); saveNoteButton.textContent = "Saved"; return; }
      const exportNoteButton = event.target.closest("[data-export-note]");
      if (exportNoteButton) { event.preventDefault(); exportAnswerAsNote(message); return; }
      const reportButton = event.target.closest("[data-report-mistake]");
      if (reportButton) {
        event.preventDefault();
        await reportMistake(message);
        return;
      }
      const responseAction = event.target.closest("[data-response-action]");
      if (responseAction) {
        event.preventDefault();
        els.input.value = actionPrompt(responseAction.dataset.responseAction, message.content);
        autoResize();
        els.input.focus();
        return;
      }
      const diagramButton = event.target.closest("[data-diagram-action]");
      if (diagramButton && window.AskPolyDiagrams) {
        event.preventDefault();
        event.stopPropagation();
        window.AskPolyDiagrams.handle(diagramButton.dataset.diagramAction, diagramButton.closest(".ask-diagram"));
        return;
      }
      const target = event.target.closest("button.ask-code-copy");
      if (!target) return;
      const code = target.closest(".ask-code")?.querySelector("code");
      if (!code) return;
      event.stopPropagation();
      navigator.clipboard.writeText(code.textContent).then(() => {
        target.textContent = "Copied";
        setTimeout(() => { target.textContent = "Copy"; }, 1100);
      }).catch(() => {});
    });
    if (message.role === "assistant") {
      const copy = document.createElement("button");
      copy.className = "ask-copy";
      copy.type = "button";
      copy.textContent = "Copy";
      copy.addEventListener("click", async () => {
        await navigator.clipboard.writeText(message.content);
        copy.textContent = "Copied";
        setTimeout(() => { copy.textContent = "Copy"; }, 1100);
      });
      div.append(copy);
    }
    return div;
  }

  async function renderMessages() {
    const messages = await getMessages(activeChatId);
    els.messages.replaceChildren();
    messages.forEach((m) => els.messages.append(bubble(m)));
    latestAssistantText = messages.filter((m) => m.role === "assistant" && !m.meta?.error).slice(-1)[0]?.content || "";
    els.messages.scrollTop = els.messages.scrollHeight;
    const chat = await getChat(activeChatId);
    els.title.textContent = chat?.title || "Ask POLY Chat";
    els.sub.textContent = `${messages.length} saved messages · whole-site knowledge${activeDepartment?.displayName ? ` · ${activeDepartment.displayName}` : ""}`;
  }

  async function chooseChatAfterDelete(deletedId) {
    const chats = (await getAll("chats")).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (deletedId === activeChatId) activeChatId = chats[0]?.id || null;
    if (!activeChatId) await createChat();
    else await renderAll();
  }

  async function deleteSavedChat(chat) {
    if (waiting) {
      els.status.textContent = "Finish or stop the current response before deleting a chat.";
      return;
    }
    if (!confirm(`Delete saved chat "${chat.title || "New chat"}"?`)) return;
    await deleteChat(chat.id);
    await chooseChatAfterDelete(chat.id);
  }

  async function renameChat(chat) {
    if (!chat || waiting) return;
    const title = window.prompt("Rename saved chat", chat.title || "New chat");
    if (title === null) return;
    const value = title.replace(/\s+/g, " ").trim().slice(0, 80);
    if (!value) return;
    chat.title = value;
    chat.updatedAt = now();
    await putChat(chat);
    await renderChats();
    if (chat.id === activeChatId) await renderMessages();
  }

  async function togglePinChat(chat) {
    if (!chat || waiting) return;
    chat.pinned = !chat.pinned;
    chat.updatedAt = now();
    await putChat(chat);
    await renderChats();
  }

  async function exportChat(chat) {
    if (!chat) return;
    const messages = await getMessages(chat.id);
    const lines = [`# ${chat.title || "Ask POLY chat"}`, "", `Context: ${chat.department?.displayName || "Auto Detect"} · ${chat.semester || "Any semester"} · ${chat.revision || "Any revision"} · ${modeLabel(chat.mode)} · ${chat.marks ? `${chat.marks} marks` : "Any marks"} · ${chat.level || "intermediate"}`, ""];
    messages.forEach((message) => {
      lines.push(`## ${message.role === "assistant" ? "POLY AI" : "You"}`);
      lines.push(message.content || "");
      if (message.meta?.sources?.length) lines.push(`\nSources: ${message.meta.sources.map((source) => `${source.title} (${source.url})`).join("; ")}`);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(chat.title || "ask-poly-chat").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "ask-poly-chat"}.md`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function renderChats() {
    const q = (els.search.value || "").toLowerCase().trim();
    const chats = (await getAll("chats"))
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.updatedAt) - new Date(a.updatedAt))
      .filter((c) => !q || `${c.title} ${c.updatedAt}`.toLowerCase().includes(q));
    els.list.replaceChildren();
    chats.forEach((chat) => {
      const container = document.createElement("div");
      container.className = "ask-item-wrap";

      const btn = document.createElement("button");
      btn.className = `ask-item ${chat.id === activeChatId ? "active" : ""}`;
      btn.type = "button";
      btn.setAttribute("aria-current", chat.id === activeChatId ? "true" : "false");
      btn.disabled = waiting;
      const departmentLabel = chat.department?.displayName ? ` · ${chat.department.displayName}` : "";
      btn.innerHTML = `<strong>${chat.pinned ? "📌 " : ""}${escapeHtml(chat.title || "New chat")}</strong><small>${escapeHtml(fmtTime(chat.updatedAt) + departmentLabel + (chat.mode ? ` · ${modeLabel(chat.mode)}` : ""))}</small>`;
      btn.addEventListener("click", async () => {
        if (waiting) {
          els.status.textContent = "Finish or stop the current response before switching chats.";
          return;
        }
        activeChatId = chat.id;
        await renderAll();
      });

      const actions = document.createElement("div");
      actions.className = "ask-item-actions";
      const rename = document.createElement("button");
      rename.className = "ask-chat-action";
      rename.type = "button";
      rename.setAttribute("aria-label", `Rename ${chat.title || "saved chat"}`);
      rename.title = "Rename chat";
      rename.textContent = "✎";
      rename.disabled = waiting;
      rename.addEventListener("click", async (event) => { event.stopPropagation(); await renameChat(chat); });
      const pin = document.createElement("button");
      pin.className = "ask-chat-action";
      pin.type = "button";
      pin.setAttribute("aria-label", `${chat.pinned ? "Unpin" : "Pin"} ${chat.title || "saved chat"}`);
      pin.title = chat.pinned ? "Unpin chat" : "Pin chat";
      pin.textContent = chat.pinned ? "📌" : "☆";
      pin.disabled = waiting;
      pin.addEventListener("click", async (event) => { event.stopPropagation(); await togglePinChat(chat); });
      const exportButton = document.createElement("button");
      exportButton.className = "ask-chat-action";
      exportButton.type = "button";
      exportButton.setAttribute("aria-label", `Export ${chat.title || "saved chat"}`);
      exportButton.title = "Export Markdown";
      exportButton.textContent = "↓";
      exportButton.addEventListener("click", async (event) => { event.stopPropagation(); await exportChat(chat); });
      actions.append(rename, pin, exportButton);
      const del = document.createElement("button");
      del.className = "ask-delete";
      del.type = "button";
      del.setAttribute("aria-label", `Delete ${chat.title || "saved chat"}`);
      del.disabled = waiting;
      del.textContent = "×";
      del.addEventListener("click", async (event) => { event.stopPropagation(); await deleteSavedChat(chat); });

      container.append(btn, actions, del);
      els.list.append(container);
    });
  }

  function setPrompts(items) {
    els.prompts.replaceChildren();
    items.forEach(([label, prompt]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      if (["Explain", "Exam Answer", "Malayalam", "Diagram", "Solve", "Viva", "Revision"].includes(label)) b.classList.add("ask-action-primary");
      b.addEventListener("click", () => { els.input.value = prompt; autoResize(); els.input.focus(); });
      els.prompts.append(b);
    });
  }

  const TOOL_PROMPTS = {
    teach: "Teach me this topic interactively. Start by asking one diagnostic question about what I already know, then adapt the explanation to my level.",
    simpler: "I don't understand the previous answer. Explain the same concept using a different approach: simpler language, a real-world analogy, one simple diagram if useful, and a short summary.",
    "real-world": "Give a relevant real-world example of the previous topic, preferably connected to my department. Explain how the concept appears in practical work or daily life.",
    mistakes: "List only the useful common mistakes students make in this topic and how to avoid them. Do not force this section if it is not technically relevant.",
    exam: "What should I write in the exam for this topic? Give a direct exam-ready answer with only relevant sections, no conversational filler.",
    compare: "Compare the two concepts in my question in a clean table. Include an optional exam-answer version below the table.",
    "check-answer": "Check my answer below for correctness, missing points, terminology, formulas, structure, and exam suitability. Do not claim an official mark unless a marking scheme is supplied. Then give an improved exam answer.\n\nMy answer:\n",
    lab: "Use Lab Mode for this experiment or topic. Include only supported sections such as Aim, Apparatus, Theory, Formula, Connection Diagram, Procedure, Observation, Calculation, Result, Precautions, and Viva Questions. Do not invent experiment-specific values or unsafe procedures.",
    viva: "Start a viva session one question at a time. Ask the first question now. After I answer, evaluate it as Correct, Partially correct, or Incorrect, explain briefly, and continue.",
    troubleshoot: "Troubleshoot this practical problem with a safe ordered checklist. Include safety precautions and never recommend live high-voltage testing or bypassing protective equipment.",
    drawing: "Act as the department-aware Technical Drawing Assistant. Produce or select a verified graphical diagram when supported, with labels, orientation, and concise drawing notes. State limitations if the request is ambiguous.",
    formula: "Create a formula sheet for this topic or subject. Organize formula, variable meanings, units, and a short note. Do not invent formulas; flag what should be verified.",
    notes: "Convert the previous answer into concise study notes with only relevant sections: Topic, Definition, Principle, Construction, Working, Formula, Applications, Advantages, Disadvantages, and Exam Points.",
    practice: "Generate practice questions for this topic using the active department, semester, level, and marks context. Group them as Easy, Medium, and Hard. Do not reveal answers unless I ask Show Answer.",
    "study-plan": "Create a realistic study plan using the number of days, hours per day, subject, exam date, and difficulty given in my message. Link POLY PMNA resources only when actually available.",
    "previous-questions": "Find actual related previous questions from POLY PMNA resources when available. Show question, exam/year, marks, subject/topic, and source link. Never invent a previous question.",
    revision: "Create a small optional Daily Revision set for this topic: three to five questions or recall prompts, one key formula or diagram cue, and a short recommended-revision note. Do not claim the student is weak; say they may benefit from reviewing a topic only when conversation evidence supports it."
  };

  function toolPrompt(tool) {
    const mark = learningContext.marks ? ` Target answer length and depth: ${learningContext.marks} mark${learningContext.marks === "1" ? "" : "s"}.` : "";
    const level = learningContext.level ? ` Student level: ${learningContext.level}.` : "";
    return `${TOOL_PROMPTS[tool] || "Explain this topic for a Polytechnic student."}${mark}${level}`;
  }

  async function chooseTool(tool) {
    const mode = Object.prototype.hasOwnProperty.call(MODE_LABELS, tool) ? tool : "explain";
    await setLearningContext({ mode }, true);
    const prompt = toolPrompt(tool);
    els.input.value = prompt;
    autoResize();
    els.input.focus();
    if (els.status) els.status.textContent = `${modeLabel(mode)} ready · add your topic, then Send`;
  }

  function setAttachmentStatus(text, state = "") {
    if (!els.attachmentStatus) return;
    els.attachmentStatus.textContent = text;
    if (state) els.attachmentStatus.dataset.state = state;
    else delete els.attachmentStatus.dataset.state;
  }

  async function hasAllowedSignature(file) {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const ascii = String.fromCharCode(...bytes);
    if (file.type === "application/pdf") return ascii.startsWith("%PDF-");
    if (file.type === "image/png") return bytes.length >= 8 && bytes[0] === 0x89 && ascii.slice(1, 4) === "PNG";
    if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (file.type === "image/webp") return ascii.slice(0, 4) === "RIFF" && ascii.slice(8, 12) === "WEBP";
    return false;
  }

  async function handleAttachment(file) {
    if (!file) return;
    const allowedTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
    const safeName = typeof file.name === "string" && file.name.length > 0 && file.name.length <= 120 && !/[\\/\u0000-\u001F\u007F]/.test(file.name);
    const extension = String(file.name || "").toLowerCase().split(".").pop();
    const allowedExtensions = new Set(["pdf", "png", "jpg", "jpeg", "webp"]);
    if (!safeName || !allowedTypes.has(file.type) || !allowedExtensions.has(extension)) {
      activeAttachment = null; setAttachmentStatus("Only valid PNG, JPEG, WebP, or PDF files are supported.", "error"); return;
    }
    if (!Number.isInteger(file.size) || file.size <= 0 || file.size > 1800000) {
      activeAttachment = null; setAttachmentStatus("File is too large or empty. Choose a file under 1.8 MB.", "error"); return;
    }
    try {
      if (!(await hasAllowedSignature(file))) throw new Error("File signature mismatch.");
    } catch (_) {
      activeAttachment = null; setAttachmentStatus("The file type could not be verified safely.", "error"); return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      activeAttachment = { name: file.name.slice(0, 120), type: file.type, size: file.size, dataUrl: file.type.startsWith("image/") ? String(reader.result || "").slice(0, 1200000) : "" };
      setAttachmentStatus(`${file.name} attached. Choose Explain, Solve, Extract Text, Translate, Create Notes, Check Answer, or Check Diagram in your message.`, "ready");
      els.input.value = els.input.value.trim() || `Explain the uploaded ${file.type === "application/pdf" ? "PDF" : "image"}. State clearly what can and cannot be read.`;
      autoResize();
    };
    reader.onerror = () => { activeAttachment = null; setAttachmentStatus("The file could not be read in this browser.", "error"); };
    reader.readAsDataURL(file);
  }

  function chooseAttachmentTool(tool) {
    if (!activeAttachment) { setAttachmentStatus("Upload an image or PDF first.", "error"); return; }
    const prompts = {
      explain: `Explain the uploaded ${activeAttachment.type === "application/pdf" ? "PDF" : "image"} for a Polytechnic student. If the file cannot be inspected, say so clearly and ask me to paste the relevant text.`,
      extract: "Extract the readable text from the uploaded file. Preserve headings, formulas, units, and labels. If text extraction is unavailable, explain the limitation instead of guessing.",
      translate: "Translate the readable text in the uploaded file into simple Malayalam-English or English as appropriate. Keep technical terms and units accurate. If the file cannot be inspected, say so clearly.",
      notes: "Convert the readable content in the uploaded file into concise exam-ready study notes. State clearly if the file content could not be inspected.",
      "check-answer": "Check the uploaded answer for correctness, missing points, formula and exam suitability. Do not claim official marks without a marking scheme, and state clearly if the file cannot be inspected.",
      "check-diagram": "Check the uploaded diagram for labels, symbols, direction, units, connections, and common Polytechnic exam mistakes. If the image cannot be inspected, say so clearly instead of guessing."
    };
    els.input.value = prompts[tool] || prompts.explain;
    autoResize();
    els.input.focus();
    setAttachmentStatus(`${modeLabel(tool === "check-diagram" ? "drawing" : tool === "check-answer" ? "check-answer" : "explain")} action ready for ${activeAttachment.name}.`, "ready");
  }

  function startVoiceInput() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setAttachmentStatus("Voice input is unavailable in this browser. Keyboard input still works.", "error"); return; }
    if (speechRecognition) { speechRecognition.stop(); speechRecognition = null; return; }
    speechRecognition = new Recognition();
    speechRecognition.lang = /[\u0D00-\u0D7F]/.test(els.input.value) ? "ml-IN" : "en-IN";
    speechRecognition.interimResults = true;
    speechRecognition.continuous = false;
    speechRecognition.onstart = () => setAttachmentStatus("Listening… speak your Polytechnic question.", "ready");
    speechRecognition.onresult = (event) => { els.input.value = Array.from(event.results).map((result) => result[0]?.transcript || "").join(" "); autoResize(); };
    speechRecognition.onerror = () => setAttachmentStatus("Voice input was not available. You can type the question instead.", "error");
    speechRecognition.onend = () => { speechRecognition = null; setAttachmentStatus("Voice input ready when you need it."); };
    speechRecognition.start();
  }

  function readLatestAnswer() {
    if (!latestAssistantText) { setAttachmentStatus("There is no assistant answer to read yet.", "error"); return; }
    if (!window.speechSynthesis) { setAttachmentStatus("Read-aloud is unavailable in this browser.", "error"); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latestAssistantText.replace(/[#*_`]/g, " "));
    utterance.lang = /[\u0D00-\u0D7F]/.test(latestAssistantText) ? "ml-IN" : "en-IN";
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
    setAttachmentStatus("Reading the latest answer aloud.", "ready");
  }

  function defaultPrompts() {
    const context = learningContext.department?.displayName ? ` for ${learningContext.department.displayName}` : "";
    return [
      ["Explain", `Explain a Polytechnic topic${context} in simple words.`],
      ["Exam Answer", "Write a 5-mark exam answer for this topic."],
      ["Short Note", "Convert this topic into a compact exam-ready short note."],
      ["Malayalam", "Explain this topic in simple Malayalam, keeping useful technical terms in English."],
      ["Diagram", "Draw a clear labelled diagram for this topic."],
      ["Solve", "Solve this numerical step by step with formula, substitution and units."],
      ["Find POLY resource", "Find the relevant POLY PMNA subject, semester, syllabus and available resources."],
      ["Mock exam", "Open the POLY PMNA mock exams and suggest a practice plan for this topic."]
    ];
  }

  async function renderAll() { await updateDepartmentContextFromChat(); populateDepartmentSelector(); updateContextUI(); await renderChats(); await renderMessages(); updateQueueStatus(); }

  function queueSuffix() {
    return messageQueue.length ? ` · ${messageQueue.length} queued` : "";
  }

  function setWaiting(value) {
    waiting = Boolean(value);
    els.form?.toggleAttribute("data-generating", waiting);
    /* Keep the textarea available while a response is running so a student
     * can prepare and queue the next question without interrupting the stream. */
    els.input.disabled = false;
    els.send.disabled = waiting;
    if (els.queue) els.queue.disabled = false;
    if (els.stop) {
      els.stop.hidden = !waiting;
      els.stop.disabled = false;
      els.stop.textContent = waiting ? "Stop generating" : "Stop";
    }
    updateQueueStatus();
    if (waiting) els.status.textContent = `🔎 Checking POLY PMNA${queueSuffix()} · 🧠 thinking...`;
  }

  function addTyping() {
    const m = document.createElement("div");
    m.id = "typingBubble";
    m.className = "ask-bubble ai";
    m.textContent = "🔎 Checking POLY PMNA resources…  🧠 Thinking…  ✍️ Preparing a student-friendly answer…";
    els.messages.append(m);
    els.messages.scrollTop = els.messages.scrollHeight;
  }
  function removeTyping() { $("typingBubble")?.remove(); }

  function addStreamingBubble(diagramIntent = null) {
    const div = document.createElement("div");
    div.id = "streamingBubble";
    div.className = "ask-bubble ai";
    const label = document.createElement("div");
    label.className = "ask-message-label";
    label.textContent = "POLY AI";
    const content = document.createElement("div");
    content.className = "ask-stream-content ask-response-body";
    content.textContent = "";
    div.append(label, content);
    div.dataset.diagramIntent = diagramIntent ? JSON.stringify(diagramIntent) : "";
    els.messages.append(div);
    els.messages.scrollTop = els.messages.scrollHeight;
    return { div, content, diagramIntent };
  }

  function updateStreamingBubble(streamBubble, text) {
    if (!streamBubble?.content) return;
    const diagramIntent = streamBubble.diagramIntent || null;
    streamBubble.content.innerHTML = renderText(text || "", { diagramIntent });
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function streamChunkFromPayload(payload) {
    if (!payload) return "";
    if (typeof payload === "string") return payload;
    return payload.response
      || payload.answer
      || payload.delta?.content
      || payload.choices?.[0]?.delta?.content
      || payload.result?.response
      || "";
  }

  async function readAnswerStream(response, onChunk) {
    if (!response.body?.getReader) throw new Error("The AI stream is unavailable.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answer = "";
    const consumeEvent = (eventText) => {
      const data = eventText.split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n")
        .trim();
      if (!data || data === "[DONE]") return data === "[DONE]";
      let payload = data;
      try { payload = JSON.parse(data); } catch (_) {}
      const chunk = String(streamChunkFromPayload(payload) || "");
      if (chunk) {
        answer += chunk;
        onChunk?.(answer);
      }
      return false;
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || "";
      for (const event of events) if (consumeEvent(event)) return answer.trim();
      if (done) break;
    }
    if (buffer.trim()) consumeEvent(buffer);
    return answer.trim();
  }

  async function knowledgeSearch(message) {
    try {
      if (window.AskPolyKnowledge?.searchKnowledge) return await window.AskPolyKnowledge.searchKnowledge(message);
    } catch (error) {
      console.error("Ask POLY website retrieval failed", error);
    }
    return null;
  }

  function buildSourceMeta(retrieval) {
    if (!retrieval?.matches) return [];
    const sources = [];
    for (const { item } of retrieval.matches.subjects || []) {
      const links = [["Syllabus", item.syllabusUrl], ["Lesson", item.lessonUrl], ["Notes", item.notesUrl], ["Sample paper", item.questionPaperUrl], ["Department", item.departmentUrl]];
      links.forEach(([kind, url]) => { if (url && url !== "unavailable") sources.push({ title: `REV${item.revision} ${item.code || ""} — ${item.name} · ${kind}`, url, detail: `${item.department || "Department"} · ${item.semester || "Semester"}` }); });
    }
    for (const { item } of retrieval.matches.programmes || []) if (item.url) sources.push({ title: `REV${item.revision} ${item.name}`, url: item.url, detail: "POLY PMNA programme" });
    for (const { item } of retrieval.matches.pages || []) if (item.url) sources.push({ title: item.title, url: item.url, detail: item.category || "POLY PMNA page" });
    const seen = new Set();
    return sources.filter((item) => { if (seen.has(item.url)) return false; seen.add(item.url); return /^https?:\/\//i.test(item.url) || item.url.startsWith("/"); }).slice(0, 6);
  }

  function shouldSearchWebsite(text) {
    const value = String(text || "").trim();
    if (!value || /^\d{1,3}$/.test(value)) return false;
    if (/\b[1-6]\d{3,4}[A-Z]?\b/i.test(value)) return true;
    return /subject|syllabus|notes|lesson|department|programme|course|semester|revision|rev\s*202[16]|sitttr|qp|question paper|mock|quiz|exam|previous|past question|question bank|model paper|sample paper|tool|calculator|converter|materials|2015|2021|2026|broken|report|website|page|link|find|search|home|about|help|download|available/i.test(value);
  }

  async function callAI(message, history, localContext, onChunk, diagramIntent = null, department = null, attachment = null) {
    const endpoint = window.ASK_POLY_CONFIG?.endpoint;
    if (!endpoint) throw new Error("Ask POLY endpoint is missing.");
    const timeoutMs = Number(window.ASK_POLY_CONFIG?.timeoutMs || 45000);
    abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), Math.max(10000, timeoutMs));
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/json"
        },
        cache: "no-store",
        signal: abortController.signal,
        body: JSON.stringify({
          message,
          history,
          stream: true,
          pageTitle: "Ask POLY whole-site knowledge",
          pageContext: localContext || "",
          departmentContext: department ? { code: department.code, displayName: department.displayName } : null,
          learningContext: contextSnapshot(),
          answerMode: learningContext.mode || "explain",
          preferredLanguage: /[\u0D00-\u0D7F]/.test(message) ? "ml" : "en",
          dataSaver: dataSaverEnabled,
          marks: learningContext.marks || "",
          learningLevel: learningContext.level || "intermediate",
          // The API receives metadata only; raw file/data-URL content never leaves the browser.
          attachment: attachment ? { name: attachment.name, type: attachment.type, size: attachment.size } : null,
          diagramRequest: diagramIntent ? { ...diagramIntent, department: department?.displayName || "" } : null
        })
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || data.error || `AI failed with HTTP ${response.status}`);
      }
      if (contentType.includes("text/event-stream")) {
        const answer = await readAnswerStream(response, onChunk);
        if (!answer) throw new Error("The AI stream returned an empty response.");
        return {
          answer,
          provider: response.headers.get("X-Ask-Poly-Provider") || "ai-stream",
          model: response.headers.get("X-Ask-Poly-Model") || "",
          streamed: true
        };
      }
      const data = await response.json().catch(() => ({}));
      return {
        answer: data.answer || data.message || data.reply || "No answer received.",
        provider: data.provider || "ai",
        model: data.model || "",
        streamed: false
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async function sendMessage(text, isQueued = false) {
    if (!text.trim()) return;
    if (waiting && !isQueued) {
      // If already waiting and not explicitly from queue, do nothing (should use queue button)
      return;
    }
    
    const clean = text.trim();
    const attachment = activeAttachment;
    const detectedDepartment = departmentRegistry?.find(clean, activeDepartment) || null;
    if (detectedDepartment?.ambiguous) {
      if (!isQueued) {
        els.input.value = "";
        autoResize();
      }
      await addMessage("user", clean, { departmentQuery: true });
      await updateChatTitleFromMessage(activeChatId, clean);
      await addMessage("assistant", departmentClarification(detectedDepartment), {
        provider: "department-context",
        departmentClarification: { candidates: detectedDepartment.candidates || [] }
      });
      await renderAll();
      return;
    }
    const resolvedDepartment = detectedDepartment && detectedDepartment.source !== "saved-context"
      ? detectedDepartment
      : activeDepartment;
    if (detectedDepartment && !detectedDepartment.ambiguous && detectedDepartment.code !== activeDepartment?.code) await persistDepartment(detectedDepartment);
    const diagramIntent = window.AskPolyDiagrams?.detectIntent?.(clean, { department: resolvedDepartment }) || null;
    const departmentMeta = resolvedDepartment ? { department: { code: resolvedDepartment.code, displayName: resolvedDepartment.displayName } } : {};
    const contextMeta = { learningContext: contextSnapshot(), answerMode: learningContext.mode || "explain" };
    const diagramMeta = { ...departmentMeta, ...contextMeta, ...(diagramIntent ? { diagramIntent } : {}) };
    if (!isQueued) {
      els.input.value = "";
      autoResize();
    }
    
    await addMessage("user", clean, { ...departmentMeta, ...contextMeta, ...(attachment ? { attachment: { name: attachment.name, type: attachment.type, size: attachment.size } } : {}) });
    await updateChatTitleFromMessage(activeChatId, clean);
    await renderMessages();
    await renderChats();
    setWaiting(true);
    addTyping();
    if (els.stop) els.stop.hidden = false;

    let retrieval = null;
    let streamBubble = null;
    try {
      const messages = await getMessages(activeChatId);
      const previousMessages = messages.slice(0, -1).slice(-MAX_HISTORY);
      const history = previousMessages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
      const retrievalQuery = [clean, learningContext.department?.displayName, learningContext.semester, learningContext.revision, learningContext.page?.subject, learningContext.page?.topic].filter(Boolean).join(" ");
      const useWebsiteKnowledge = shouldSearchWebsite(clean) || Boolean(learningContext.department || learningContext.semester || learningContext.revision || learningContext.page);
      retrieval = useWebsiteKnowledge ? await knowledgeSearch(retrievalQuery) : null;
      removeTyping();
      streamBubble = addStreamingBubble(diagramIntent);
      const pageContext = learningContext.page ? `Page handoff context: ${JSON.stringify(learningContext.page)}` : "";
      const result = await callAI(clean, history, [retrieval?.context || "", pageContext].filter(Boolean).join("\n\n"), (partial) => {
        els.status.textContent = `POLY is writing${queueSuffix()}...`;
        updateStreamingBubble(streamBubble, partial);
      }, diagramIntent, resolvedDepartment, attachment);
      streamBubble?.div.remove();
      await addMessage("assistant", result.answer, {
        ...diagramMeta,
        provider: result.provider,
        model: result.model,
        websiteKnowledge: Boolean(retrieval?.context) && result.provider !== "local-math",
        sources: result.provider === "local-math" ? [] : buildSourceMeta(retrieval),
        answerMode: learningContext.mode || "explain",
        learningContext: contextSnapshot(),
        ...(attachment ? { attachment: { name: attachment.name, type: attachment.type, size: attachment.size } } : {}),
        knowledgeVersion: retrieval?.version || ""
      });
    } catch (error) {
      removeTyping();
      streamBubble?.div.remove();
      if (error.name === "AbortError" && stopRequested) {
        await addMessage("assistant", "Generation stopped by user. You can review the partial response above or ask again.", { ...diagramMeta, provider: "user-stop" });
      } else {
        const offline = window.AskPolyOffline?.answer?.(clean, retrieval);
        if (offline) {
          await addMessage("assistant", `${offline}\n\nThis answer was generated locally because the live AI provider was unavailable.`, {
            ...diagramMeta,
            provider: "local-offline-assistant",
            error: error.message,
            sources: buildSourceMeta(retrieval),
            answerMode: learningContext.mode || "explain",
            learningContext: contextSnapshot(),
            websiteKnowledge: Boolean(retrieval?.context),
            knowledgeVersion: retrieval?.version || ""
          });
        } else {
          const fallback = retrieval?.fallbackAnswer || retrieval?.answer;
          if (fallback) {
            await addMessage("assistant", `${fallback}\n\nThe live AI service is temporarily unavailable, so this answer is from the current POLY PMNA website index.`, {
              ...diagramMeta,
              provider: "local-knowledge-fallback",
              error: error.message,
              sources: buildSourceMeta(retrieval),
              answerMode: learningContext.mode || "explain",
              learningContext: contextSnapshot(),
              websiteKnowledge: Boolean(retrieval?.context),
              knowledgeVersion: retrieval?.version || ""
            });
          } else {
            await addMessage("assistant", "I could not reach the AI service right now. Your chat is saved. Try a website question, a calculation such as 12*8, a conversion such as 5 km to m, or a formula such as voltage 12, current 2.", { ...diagramMeta, error: error.message });
          }
        }
      }
    } finally {
      setWaiting(false);
      if (els.stop) els.stop.hidden = true;
      abortController = null;
      await renderAll();
      
      stopRequested = false;
      activeAttachment = null;
      if (els.attachment) els.attachment.value = "";
      setAttachmentStatus("Tools are optional. Choose one only when it helps.");
      if (messageQueue.length > 0) {
        const nextText = messageQueue.shift();
        updateQueueStatus();
        await sendMessage(nextText, true);
      } else {
        els.input.focus();
      }
    }
  }

  function updateQueueStatus() {
    if (!els.queue) return;
    const count = messageQueue.length;
    els.queue.textContent = count ? `Queue (${count})` : "Queue message";
    els.queue.classList.toggle("active", count > 0);
    els.queue.dataset.count = String(count);
    els.queue.setAttribute("aria-label", count
      ? `${count} message${count === 1 ? "" : "s"} queued; current response will continue`
      : (waiting ? "Add the current message to the queue" : "Send the current message"));
    els.queue.title = count
      ? `${count} queued message${count === 1 ? "" : "s"}`
      : (waiting ? "Add this message to the pending queue" : "Send this message");
    if (!waiting) els.status.textContent = count ? `${count} message${count === 1 ? "" : "s"} queued` : "Ready";
  }

  function autoResize() {
    els.input.style.height = "auto";
    els.input.style.height = `${Math.min(els.input.scrollHeight, 180)}px`;
  }

  async function updateKnowledgeStatus() {
    try {
      const status = await window.AskPolyKnowledge?.getStatus?.();
      if (!status?.ok) return;
      const counts = status.counts || {};
      els.status.title = `Website index ${status.version || ""}; ${counts.pages || 0} pages; ${counts.subjectRecords || 0} subject records`;
      els.sub.textContent = `Whole-site knowledge · ${counts.pages || 0} pages · ${counts.subjectRecords || 0} subject records${activeDepartment?.displayName ? ` · ${activeDepartment.displayName}` : ""}`;
    } catch (error) {
      console.warn("Ask POLY knowledge status update failed", error);
    }
  }

  function bindLearningTools() {
    els.toolsToggle?.addEventListener("click", () => {
      const open = els.toolsPanel?.hasAttribute("hidden");
      if (els.toolsPanel) els.toolsPanel.hidden = !open;
      if (els.toolsToggle) { els.toolsToggle.setAttribute("aria-expanded", String(open)); els.toolsToggle.textContent = open ? "Hide tools" : "Show tools"; }
    });
    document.querySelectorAll("[data-poly-tool]").forEach((button) => button.addEventListener("click", () => chooseTool(button.dataset.polyTool)));
    document.querySelectorAll("[data-attachment-tool]").forEach((button) => button.addEventListener("click", () => chooseAttachmentTool(button.dataset.attachmentTool)));
    els.markTarget?.addEventListener("change", () => setLearningContext({ marks: els.markTarget.value }));
    els.learningLevel?.addEventListener("change", () => setLearningContext({ level: els.learningLevel.value }));
    els.dataSaver?.addEventListener("change", () => { dataSaverEnabled = Boolean(els.dataSaver.checked); localStorage.setItem("ask-poly-data-saver", dataSaverEnabled ? "1" : "0"); updateContextUI(); setAttachmentStatus(dataSaverEnabled ? "Data saver enabled: lighter diagrams and fewer optional effects." : "Data saver disabled.", "ready"); });
    els.attachmentBtn?.addEventListener("click", () => els.attachment?.click());
    els.attachment?.addEventListener("change", () => handleAttachment(els.attachment.files?.[0]));
    els.voiceInput?.addEventListener("click", startVoiceInput);
    els.readAloud?.addEventListener("click", readLatestAnswer);
  }

  async function init() {
    departmentRegistry = await window.AskPolyDepartments?.ready || { entries: [], find: (text, current) => current || null, get: () => null, choices: () => [] };
    populateDepartmentSelector();
    await openDB();
    const chats = (await getAll("chats")).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (chats.length) activeChatId = chats[0].id;
    else await createChat();
    await applyPageContextFromQuery();
    bindLearningTools();
    const contextControls = [els.contextDepartment, els.contextSemester, els.contextRevision, els.contextMode].filter(Boolean);
    contextControls.forEach((control) => control.addEventListener("change", async () => {
      const department = els.contextDepartment?.value ? departmentRegistry?.get(els.contextDepartment.value) : null;
      await setLearningContext({
        department: department ? { ...department, source: "manual-context" } : null,
        semester: els.contextSemester?.value || "",
        revision: els.contextRevision?.value || "",
        mode: els.contextMode?.value || "explain",
        marks: els.markTarget?.value || learningContext.marks || "",
        level: els.learningLevel?.value || learningContext.level || "intermediate"
      });
      els.status.textContent = `Context saved · ${modeLabel(learningContext.mode)}`;
    }));
    els.form.addEventListener("submit", (event) => { event.preventDefault(); sendMessage(els.input.value); });
    els.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !isMobile()) {
        event.preventDefault();
        els.send.click();
      }
    });
    els.input.addEventListener("input", autoResize);
    els.search.addEventListener("input", renderChats);
    els.newChat.addEventListener("click", async () => {
      if (waiting) {
        els.status.textContent = "Finish or stop the current response before starting a new chat.";
        return;
      }
      await createChat();
    });
    if (els.stop) {
      els.stop.addEventListener("click", () => {
        if (!abortController || !waiting) return;
        stopRequested = true;
        els.stop.disabled = true;
        els.stop.textContent = "Stopping...";
        els.status.textContent = "Stopping generation...";
        abortController.abort();
      });
    }
    await renderAll();
    await updateKnowledgeStatus();
    autoResize();
    els.input.focus();
  }

  init().catch((error) => {
    console.error(error);
    els.status.textContent = "Storage error";
  });
})();
