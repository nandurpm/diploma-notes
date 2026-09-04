/* Purpose: Ask poly v2 - Descriptive comment added for clarity */
(() => {
  "use strict";

  if (!/\/ask-poly(?:-v2)?\.html$/i.test(location.pathname)) return;

  const DB_NAME = "ask-poly-v2-db";
  const DB_VERSION = 1;
  // Keep browser history aligned with the Worker and Supabase relay validators.
  const MAX_HISTORY = Math.min(6, Math.max(0, Number(window.ASK_POLY_CONFIG?.maxHistory || 6)));
  const MAX_QUEUE = 8;
  let dbPromise = null;
  let activeChatId = null;
  let waiting = false;
  let activeController = null;
  let stopRequested = false;
  const pendingMessages = [];

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
    queue: $("queueBtn"),
    stop: $("stopBtn")
  };

  if (!els.form || !els.messages || !els.input) return;

  function now() { return new Date().toISOString(); }
  function id() { return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
  function fmtTime(value) { return new Date(value || Date.now()).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  function isMobile() { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ""); }

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
    const chat = { id: id(), title, createdAt: now(), updatedAt: now() };
    await putChat(chat);
    activeChatId = chat.id;
    await addMessage("assistant", "Hi. I am Ask POLY AI. I can guide you through Revision 2026, Revision 2021, 2015 materials, subjects, lessons, notes, mock exams, tools and the rest of POLY PMNA. This chat is saved in your browser.");
    await renderAll();
  }

  async function updateChatTitleFromMessage(chatId, text) {
    const chat = await getChat(chatId);
    if (!chat) return;
    if (chat.title && chat.title !== "New chat") {
      chat.updatedAt = now();
      await putChat(chat);
      return;
    }
    chat.title = String(text || "New chat").replace(/\s+/g, " ").trim().slice(0, 42) || "New chat";
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
    { pattern: /(#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)/g, cls: "hl-comment" },
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
    let remaining = code;
    /* Collect string and comment tokens first so their contents are never keyword-colored */
    const stringCommentPattern = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|"""[\s\S]*?"""|'''[\s\S]*?'''|#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)/g;
    let match;
    let cursor = 0;
    const spans = [];
    while ((match = stringCommentPattern.exec(remaining)) !== null) {
      spans.push({ start: match.index, end: match.index + match[0].length, cls: /^\s*[#\/\/\/\*]|^<!--|^-->/.test(match[0]) ? "hl-comment" : "hl-string" });
    }
    stringCommentPattern.lastIndex = 0;
    /* Keyword and number highlighting on segments not inside spans */
    const keywords = LANGUAGE_KEYWORDS[lang] || null;
    let out = "";
    cursor = 0;
    for (const span of spans) {
      out += highlightKeywordsAndNumbers(remaining.slice(cursor, span.start), keywords);
      out += `<span class="${span.cls}">${remaining.slice(span.start, span.end)}</span>`;
      cursor = span.end;
    }
    out += highlightKeywordsAndNumbers(remaining.slice(cursor), keywords);
    return out;
  }
  function highlightKeywordsAndNumbers(segment, keywords) {
    let html = segment.replace(/\b(\d[\d._]*)\b/g, '<span class="hl-number">$1</span>');
    if (keywords) {
      const kwPattern = new RegExp(`\\b(${keywords})\\b`, "g");
      /* Apply keywords without touching already-highlighted numbers: split on hl-number spans */
      const parts = html.split(/(<span class="hl-number">[\s\S]*?<\/span>)/);
      html = parts.map((part) => part.startsWith("<span class=\"hl-number\"") ? part : part.replace(kwPattern, '<span class="hl-keyword">$1</span>')).join("");
    }
    return html;
  }
  function renderCodeBlock(codeLines) {
    const firstLine = codeLines[0] || "";
    const langMatch = /^\s*([a-z0-9+._#-]+)\s*$/i.exec(firstLine);
    const hasLang = langMatch && codeLines.length > 1;
    const language = hasLang ? langMatch[1] : "";
    const code = (hasLang ? codeLines.slice(1) : codeLines).join("\n").trim();
    if (!code) return "";
    const label = language ? `<span class="ask-code-lang">${escapeHtml(language)}</span>` : "";
    const copyBtn = `<button type="button" class="ask-code-copy" aria-label="Copy code">Copy</button>`;
    return `<figure class="ask-code"><figcaption><span class="ask-code-head">${label}Code</span>${copyBtn}</figcaption><pre><code class="hljs">${highlightCode(code, language)}</code></pre></figure>`;
  }

  function renderInlineMarkdown(value) {
    let html = escapeHtml(value);
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
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

  function renderText(text) {
    const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
    const blocks = [];
    let paragraphLines = [];

    function flushParagraph() {
      if (!paragraphLines.length) return;
      blocks.push(`<p>${paragraphLines.map(renderInlineMarkdown).join("<br>")}</p>`);
      paragraphLines = [];
    }

    let index = 0;
    while (index < lines.length) {
      const line = lines[index];

      /* Blank line: paragraph break */
      if (!line.trim()) {
        flushParagraph();
        index += 1;
        continue;
      }

      /* Fenced code block */
      if (/^\s*```/.test(line)) {
        flushParagraph();
        const code = [];
        index += 1;
        while (index < lines.length && !/^\s*```/.test(lines[index])) {
          code.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) index += 1;
        blocks.push(renderCodeBlock(code));
        continue;
      }

      /* Markdown table */
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

      /* Horizontal rule: ---, ***, ___ (allow spaces between chars) */
      if (/^\s*([-*_])\s*(?:\1\s*){2,}$/.test(line)) {
        flushParagraph();
        blocks.push("<hr>");
        index += 1;
        continue;
      }

      /* Headings: # .. #### */
      const headingMatch = /^\s*(#{1,4})\s+(.+?)\s*#*\s*$/.exec(line);
      if (headingMatch) {
        flushParagraph();
        const level = Math.min(4, headingMatch[1].length);
        blocks.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
        index += 1;
        continue;
      }

      /* Blockquote: consecutive lines starting with > */
      if (/^\s*>\s?/.test(line)) {
        flushParagraph();
        const quoteLines = [];
        while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
          quoteLines.push(lines[index].replace(/^\s*>\s?/, ""));
          index += 1;
        }
        blocks.push(`<blockquote><p>${quoteLines.map(renderInlineMarkdown).join("<br>")}</p></blockquote>`);
        continue;
      }

      /* Unordered list: consecutive lines starting with -, * or • */
      if (/^\s*[-*•]\s+/.test(line)) {
        flushParagraph();
        const items = [];
        while (index < lines.length && /^\s*[-*•]\s+/.test(lines[index])) {
          items.push(`<li>${renderInlineMarkdown(lines[index].replace(/^\s*[-*•]\s+/, ""))}</li>`);
          index += 1;
        }
        blocks.push(`<ul>${items.join("")}</ul>`);
        continue;
      }

      /* Ordered list: consecutive lines starting with 1. / 1) */
      if (/^\s*\d+[.)]\s+/.test(line)) {
        flushParagraph();
        const items = [];
        while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
          items.push(`<li>${renderInlineMarkdown(lines[index].replace(/^\s*\d+[.)]\s+/, ""))}</li>`);
          index += 1;
        }
        blocks.push(`<ol>${items.join("")}</ol>`);
        continue;
      }

      /* Plain text line: accumulate into the current paragraph */
      paragraphLines.push(line);
      index += 1;
    }

    flushParagraph();
    return `<div class="ask-response-body">${blocks.join("")}</div>`;
  }

  function bubble(message) {
    const div = document.createElement("div");
    div.className = `ask-bubble ${message.role === "user" ? "user" : "ai"}`;
    div.innerHTML = message.role === "user" ? escapeHtml(message.content) : renderText(message.content);
    if (message.role === "assistant" && Boolean(message.meta?.error)) div.dataset.polyError = "true";
    const diagramIntent = message.meta?.diagram || message.meta?.diagramIntent;
    const staleSavedDiagram = diagramIntent?.type === "flowchart" && diagramIntent?.variant === "odd_even" && /current generation/i.test(String(message.content || ""));
    if (message.role === "assistant" && diagramIntent && !staleSavedDiagram && window.AskPolyDiagrams?.render) {
      try {
        const diagramHtml = window.AskPolyDiagrams.render(diagramIntent);
        if (diagramHtml) div.insertAdjacentHTML("beforeend", diagramHtml);
      } catch (error) {
        console.warn("Ask POLY diagram render failed", error);
      }
    }
    const time = document.createElement("time");
    time.className = "ask-time";
    time.dateTime = message.createdAt;
    time.textContent = fmtTime(message.createdAt);
    div.append(time);
    div.addEventListener("click", (event) => {
      const diagramControl = event.target.closest("[data-diagram-action]");
      if (diagramControl) {
        event.stopPropagation();
        window.AskPolyDiagrams?.handle?.(
          diagramControl.dataset.diagramAction,
          diagramControl.closest(".ask-diagram")
        );
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
    els.messages.scrollTop = els.messages.scrollHeight;
    const chat = await getChat(activeChatId);
    els.title.textContent = chat?.title || "Ask POLY Chat";
    els.sub.textContent = `${messages.length} saved messages · whole-site knowledge`;
  }

  async function chooseChatAfterDelete(deletedId) {
    const chats = (await getAll("chats")).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (deletedId === activeChatId) activeChatId = chats[0]?.id || null;
    if (!activeChatId) await createChat();
    else await renderAll();
  }

  async function deleteSavedChat(chat) {
    if (!confirm(`Delete saved chat "${chat.title || "New chat"}"?`)) return;
    await deleteChat(chat.id);
    await chooseChatAfterDelete(chat.id);
  }

  async function renderChats() {
    const q = (els.search.value || "").toLowerCase().trim();
    const chats = (await getAll("chats"))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .filter((c) => !q || `${c.title} ${c.updatedAt}`.toLowerCase().includes(q));
    els.list.replaceChildren();
    chats.forEach((chat) => {
      const container = document.createElement("div");
      container.className = "ask-item-wrap";

      const btn = document.createElement("button");
      btn.className = `ask-item ${chat.id === activeChatId ? "active" : ""}`;
      btn.type = "button";
      btn.innerHTML = `<strong>${escapeHtml(chat.title || "New chat")}</strong><small>${escapeHtml(fmtTime(chat.updatedAt))}</small>`;
      btn.addEventListener("click", async () => { activeChatId = chat.id; await renderAll(); });

      const del = document.createElement("button");
      del.className = "ask-delete";
      del.type = "button";
      del.setAttribute("aria-label", `Delete ${chat.title || "saved chat"}`);
      del.textContent = "×";
      del.addEventListener("click", async (event) => { event.stopPropagation(); await deleteSavedChat(chat); });

      container.append(btn, del);
      els.list.append(container);
    });
  }

  function setPrompts(items) {
    if (!els.prompts) return;
    els.prompts.replaceChildren();
    items.forEach(([label, prompt]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", () => { els.input.value = prompt; autoResize(); els.input.focus(); });
      els.prompts.append(b);
    });
  }

  function defaultPrompts() {
    return [
      ["REV2026 subjects", "Show the Revision 2026 Electrical and Electronics Engineering subjects semester-wise."],
      ["Compare revisions", "How is Revision 2026 different from Revision 2021?"],
      ["Find subject code", "Find subject code 1008 and tell me which revision, semester and resources are available."],
      ["Website guide", "Explain all important areas of the POLY PMNA website and where I should go for each task."]
    ];
  }

  async function renderAll() { await renderChats(); await renderMessages(); setPrompts(defaultPrompts()); }
  function setWaiting(value, mode = "thinking") {
    waiting = value;
    els.status.textContent = !value ? "Ready" : mode === "website" ? "Checking POLY website…" : "POLY is thinking…";
    els.input.disabled = false;
    els.send.disabled = false;
    if (els.stop) els.stop.hidden = !value;
  }

  function updateQueueControl() {
    if (!els.queue) return;
    els.queue.textContent = pendingMessages.length ? `Queued (${pendingMessages.length})` : "Queue empty";
    els.queue.hidden = pendingMessages.length === 0;
  }

  function addTyping(mode = "thinking") {
    const m = document.createElement("div");
    m.id = "typingBubble";
    m.className = "ask-bubble ai";
    m.textContent = mode === "website" ? "POLY is checking the website and thinking…" : "POLY is thinking…";
    els.messages.append(m);
    els.messages.scrollTop = els.messages.scrollHeight;
  }
  function removeTyping() { $("typingBubble")?.remove(); }
  function updateStreamingAnswer(text) {
    removeTyping();
    let bubble = $("streamingAnswerBubble");
    if (!bubble) {
      bubble = document.createElement("div");
      bubble.id = "streamingAnswerBubble";
      bubble.className = "ask-bubble ai";
      bubble.innerHTML = '<div class="ask-response-body ask-streaming-body"></div>';
      els.messages.append(bubble);
    }
    bubble.querySelector(".ask-response-body").textContent = text;
    els.messages.scrollTop = els.messages.scrollHeight;
  }
  function removeStreamingAnswer() { $("streamingAnswerBubble")?.remove(); }

  async function knowledgeSearch(message) {
    try {
      if (window.AskPolyKnowledge?.searchKnowledge) return await window.AskPolyKnowledge.searchKnowledge(message);
    } catch (error) {
      console.error("Ask POLY website retrieval failed", error);
    }
    return null;
  }

  function shouldSearchWebsite(text) {
    const value = String(text || "").trim();
    if (!value || /^\d{1,3}$/.test(value)) return false;
    if (/\b[1-6]\d{3,4}[A-Z]?\b/i.test(value)) return true;
    return /subject|syllabus|notes|lesson|department|programme|course|semester|revision|rev\s*202[16]|sitttr|qp|question paper|mock|quiz|exam|tool|calculator|converter|materials|2015|2021|2026|broken|report|website|page|link|find|search|home|about|help|download|available/i.test(value);
  }

  function preferredResponseLanguage(message) {
    const text = String(message || "").trim();
    if (/[\u0D00-\u0D7F]/.test(text)) return "ml";
    if (/\b(?:in|to)\s+malayalam\b|\bmalayalam\s+(?:please|answer|reply|explanation|translation|meaning)\b|\b(?:reply|answer|respond|explain|translate)\s+(?:this\s+)?(?:in|to)\s+malayalam\b/i.test(text)) return "ml";
    return "en";
  }

  function createSmoothDeltaHandler(onDelta) {
    let displayed = "";
    let pending = "";
    const flush = async () => {
      if (!pending) return;
      displayed += pending;
      pending = "";
      await onDelta(displayed);
    };
    return {
      push: async (delta) => {
        pending += delta;
        if (pending.length >= 28 || /[\\s.!?,;:\n]$/.test(pending)) await flush();
      },
      flush,
      value: () => displayed + pending
    };
  }

  async function readSseAnswer(response, onDelta) {
    if (!response.body) throw new Error("Streaming response body is missing.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answer = "";
    const consume = async (event) => {
      const data = event.split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n").trim();
      if (!data || data === "[DONE]") return data === "[DONE]";
      try {
        const payload = JSON.parse(data);
        const delta = payload?.delta?.content
          || payload?.choices?.[0]?.delta?.content
          || payload?.response
          || payload?.text
          || "";
        if (delta) { answer += delta; await onDelta(delta); }
      } catch (_) {
        // Ignore malformed keep-alive/event fragments.
      }
      return false;
    };
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || "";
      for (const event of events) if (await consume(event)) return answer;
      if (done) {
        if (buffer.trim()) await consume(buffer);
        return answer;
      }
    }
  }

  async function callAI(message, history, localContext, onDelta = async () => {}) {
    const endpoint = window.ASK_POLY_CONFIG?.endpoint;
    if (!endpoint) throw new Error("Ask POLY endpoint is missing.");
    const generationRequest = /(?:flowchart|flow chart).*(?:current generation|electric(?:al)? current.*(?:produc|generat))|(?:current generation|electric(?:al)? current.*(?:produc|generat)).*(?:flowchart|flow chart)/i.test(message);
    const inductionRequest = /electromagnetic induction|faraday(?:'s|s)? law|lenz(?:'s|s)? law|induced emf|magnetic flux/i.test(message);
    const solarRequest = /solar panel|photovoltaic|solar cell|\bPV\b/i.test(message);
    const aiMessage = generationRequest
      ? `${message}\n\nInterpret this as how electrical power is produced, not merely how current flows in a battery circuit. Explain the sequence from an energy source or prime mover to the generator, voltage transformation, transmission, and consumers.`
      : inductionRequest
        ? `${message}\n\nUse scientifically checked units and arithmetic. Magnetic flux Φ is measured in webers (Wb), while magnetic flux density B is measured in tesla (T). Apply Faraday's law ε = −N ΔΦ/Δt and include the time interval. Show the substitution and verify the result. For example, if a 100-turn coil's flux changes from 0 Wb to 5 Wb in 2 s, ΔΦ/Δt = 2.5 Wb/s and the induced EMF magnitude is 250 V; do not write 500 V or label flux in tesla unless flux density and area are provided.`
        : solarRequest
          ? `${message}\n\nExplain the photovoltaic effect precisely. Light creates electron–hole pairs in the semiconductor, and the p–n junction's built-in electric field separates the charges. Electrons move toward the n-type side and holes toward the p-type side inside the cell. Distinguish this microscopic electron movement from conventional current: conventional current is defined in the direction positive charge would move, opposite to electron flow in the external circuit. State that a solar cell produces DC, and mention the inverter only when discussing conversion to AC.`
          : message;
    const timeoutMs = Number(window.ASK_POLY_CONFIG?.timeoutMs || 30000);
    const controller = new AbortController();
    activeController = controller;
    const timer = setTimeout(() => controller.abort(), Math.max(5000, timeoutMs));
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          message: aiMessage,
          history,
          preferredLanguage: preferredResponseLanguage(message),
          pageTitle: "Ask POLY whole-site knowledge",
          pageContext: localContext || "",
          stream: true
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || data.error || `AI failed with HTTP ${response.status}`);
      }
      if ((response.headers.get("content-type") || "").includes("text/event-stream")) {
        const smooth = createSmoothDeltaHandler(onDelta);
        const answer = await readSseAnswer(response, smooth.push);
        await smooth.flush();
        return {
          answer: answer || "No answer received.",
          provider: response.headers.get("X-Ask-Poly-Provider") || "ai",
          model: response.headers.get("X-Ask-Poly-Model") || ""
        };
      }
      const data = await response.json().catch(() => ({}));
      const answer = data.answer || data.message || data.reply || "No answer received.";
      await onDelta(answer);
      return { answer, provider: data.provider || "ai", model: data.model || "" };
    } finally {
      if (activeController === controller) activeController = null;
      clearTimeout(timer);
    }
  }

  async function sendMessage(text, fromQueue = false) {
    if (!text.trim()) return;
    if (waiting && !fromQueue) {
      if (pendingMessages.length >= MAX_QUEUE) return;
      pendingMessages.push(text.trim());
      els.input.value = "";
      autoResize();
      updateQueueControl();
      return;
    }
    const clean = text.trim();
    els.input.value = "";
    autoResize();
    await addMessage("user", clean);
    await updateChatTitleFromMessage(activeChatId, clean);
    await renderMessages();
    await renderChats();
    const usesWebsite = shouldSearchWebsite(clean);
    setWaiting(true, usesWebsite ? "website" : "thinking");
    addTyping(usesWebsite ? "website" : "thinking");

    let retrieval = null;
    // Detect flowchart/circuit/diagram-drawing intent from the question itself so the
    // matching SVG figure renders next to the AI's answer.
    let diagramIntent = null;
    try {
      diagramIntent = window.AskPolyDiagrams?.detectIntent?.(clean) || null;
    } catch (error) {
      console.warn("Ask POLY diagram intent detection failed", error);
    }
    try {
      const messages = await getMessages(activeChatId);
      const previousMessages = messages.slice(0, -1).slice(-MAX_HISTORY);
      // Older saved chats may contain long generated source lists. Trim each entry
      // before sending it so one oversized answer cannot block future questions.
      const history = previousMessages
        .map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "").slice(0, 1000)
        }))
        .filter((m) => m.content.trim());
      retrieval = usesWebsite ? await knowledgeSearch(clean) : null;
      const result = await callAI(clean, history, retrieval?.context || "", updateStreamingAnswer);
      removeTyping();
      removeStreamingAnswer();
      await addMessage("assistant", result.answer, {
        provider: result.provider,
        model: result.model,
        websiteKnowledge: Boolean(retrieval?.context),
        knowledgeVersion: retrieval?.version || "",
        diagramIntent,
        diagram: diagramIntent || undefined
      });
    } catch (error) {
      removeTyping();
      if (stopRequested) {
        await addMessage("assistant", "Generation stopped. Your message remains saved.", { stopped: true });
        return;
      }
      const offline = window.AskPolyOffline?.answer?.(clean, retrieval);
      if (offline) {
        await addMessage("assistant", `${offline}\n\nThis answer was generated locally because the live AI provider was unavailable.`, {
          provider: "local-offline-assistant",
          error: error.message,
          knowledgeVersion: retrieval?.version || "",
          diagramIntent,
          diagram: diagramIntent || undefined
        });
      } else {
        const fallback = retrieval?.fallbackAnswer || retrieval?.answer;
        if (fallback) {
          await addMessage("assistant", `${fallback}\n\nThe live AI service is temporarily unavailable, so this answer is from the current POLY PMNA website index.`, {
            provider: "local-knowledge-fallback",
            error: error.message,
            knowledgeVersion: retrieval?.version || "",
            diagramIntent,
            diagram: diagramIntent || undefined
          });
        } else {
          await addMessage("assistant", "I could not reach the AI service right now. Your chat is saved. Try a website question, a calculation such as 12*8, a conversion such as 5 km to m, or a formula such as voltage 12, current 2.", {
            error: error.message,
            diagramIntent,
            diagram: diagramIntent || undefined
          });
        }
      }
    } finally {
      setWaiting(false);
      stopRequested = false;
      await renderAll();
      els.input.focus();
      const nextText = pendingMessages.shift();
      updateQueueControl();
      if (nextText) await sendMessage(nextText, true);
    }
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
      els.sub.textContent = `Whole-site knowledge · ${counts.pages || 0} pages · ${counts.subjectRecords || 0} subject records`;
    } catch (error) {
      console.warn("Ask POLY knowledge status update failed", error);
    }
  }

  async function init() {
    await openDB();
    const chats = (await getAll("chats")).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (chats.length) activeChatId = chats[0].id;
    else await createChat();
    els.form.addEventListener("submit", (event) => { event.preventDefault(); sendMessage(els.input.value); });
    els.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        els.send.click();
      }
    });
    els.input.addEventListener("input", autoResize);
    els.search.addEventListener("input", renderChats);
    els.newChat.addEventListener("click", () => createChat());
    els.stop?.addEventListener("click", () => {
      stopRequested = true;
      activeController?.abort();
    });
    els.queue?.addEventListener("click", () => {
      pendingMessages.length = 0;
      updateQueueControl();
    });
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
