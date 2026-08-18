/* Purpose: Ask poly v2 - Descriptive comment added for clarity */
(() => {
  "use strict";

  if (!/\/ask-poly(?:-v2)?\.html$/i.test(location.pathname)) return;

  const DB_NAME = "ask-poly-v2-db";
  const DB_VERSION = 1;
  const MAX_HISTORY = Number(window.ASK_POLY_CONFIG?.maxHistory || 12);
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
    queue: $("queueBtn")
  };

  let abortController = null;
  let messageQueue = [];

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
    let remaining = code;
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
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      if (/^\s*```/.test(line)) {
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

      if (index + 1 < lines.length && line.includes("|") && isMarkdownTableDivider(lines[index + 1])) {
        const body = [];
        index += 2;
        while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
          body.push(lines[index]);
          index += 1;
        }
        blocks.push(renderMarkdownTable(line, body));
        continue;
      }

      if (/^\s*#{1,3}\s+/.test(line)) {
        blocks.push(`<strong>${renderInlineMarkdown(line.replace(/^\s*#{1,3}\s+/, ""))}</strong>`);
      } else {
        blocks.push(renderInlineMarkdown(line));
      }
      index += 1;
    }

    return blocks.join("<br>");
  }

  function bubble(message) {
    const div = document.createElement("div");
    div.className = `ask-bubble ${message.role === "user" ? "user" : "ai"}`;
    div.innerHTML = message.role === "user" ? escapeHtml(message.content) : renderText(message.content);
    if (message.role === "assistant" && Boolean(message.meta?.error)) div.dataset.polyError = "true";
    const time = document.createElement("time");
    time.className = "ask-time";
    time.dateTime = message.createdAt;
    time.textContent = fmtTime(message.createdAt);
    div.append(time);
    div.addEventListener("click", (event) => {
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
  function setWaiting(value) {
    waiting = value;
    els.status.textContent = value ? "Checking website + thinking..." : "Ready";
    els.input.disabled = value;
    els.send.disabled = value;
  }

  function addTyping() {
    const m = document.createElement("div");
    m.id = "typingBubble";
    m.className = "ask-bubble ai";
    m.textContent = "POLY is checking the website and thinking...";
    els.messages.append(m);
    els.messages.scrollTop = els.messages.scrollHeight;
  }
  function removeTyping() { $("typingBubble")?.remove(); }

  function addStreamingBubble() {
    const div = document.createElement("div");
    div.id = "streamingBubble";
    div.className = "ask-bubble ai";
    const content = document.createElement("div");
    content.className = "ask-stream-content";
    content.textContent = "";
    div.append(content);
    els.messages.append(div);
    els.messages.scrollTop = els.messages.scrollHeight;
    return { div, content };
  }

  function updateStreamingBubble(streamBubble, text) {
    if (!streamBubble?.content) return;
    streamBubble.content.innerHTML = renderText(text || "");
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

  function shouldSearchWebsite(text) {
    const value = String(text || "").trim();
    if (!value || /^\d{1,3}$/.test(value)) return false;
    if (/\b[1-6]\d{3,4}[A-Z]?\b/i.test(value)) return true;
    return /subject|syllabus|notes|lesson|department|programme|course|semester|revision|rev\s*202[16]|sitttr|qp|question paper|mock|quiz|exam|tool|calculator|converter|materials|2015|2021|2026|broken|report|website|page|link|find|search|home|about|help|download|available/i.test(value);
  }

  async function callAI(message, history, localContext, onChunk) {
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
          pageContext: localContext || ""
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
    if (!isQueued) {
      els.input.value = "";
      autoResize();
    }
    
    await addMessage("user", clean);
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
      retrieval = shouldSearchWebsite(clean) ? await knowledgeSearch(clean) : null;
      removeTyping();
      streamBubble = addStreamingBubble();
      const result = await callAI(clean, history, retrieval?.context || "", (partial) => {
        els.status.textContent = "POLY is writing...";
        updateStreamingBubble(streamBubble, partial);
      });
      streamBubble?.div.remove();
      await addMessage("assistant", result.answer, {
        provider: result.provider,
        model: result.model,
        websiteKnowledge: Boolean(retrieval?.context),
        knowledgeVersion: retrieval?.version || ""
      });
    } catch (error) {
      removeTyping();
      streamBubble?.div.remove();
      if (error.name === "AbortError") {
        await addMessage("assistant", "Generation stopped by user.", { provider: "user-stop" });
      } else {
        const offline = window.AskPolyOffline?.answer?.(clean, retrieval);
        if (offline) {
          await addMessage("assistant", `${offline}\n\nThis answer was generated locally because the live AI provider was unavailable.`, {
            provider: "local-offline-assistant",
            error: error.message,
            knowledgeVersion: retrieval?.version || ""
          });
        } else {
          const fallback = retrieval?.fallbackAnswer || retrieval?.answer;
          if (fallback) {
            await addMessage("assistant", `${fallback}\n\nThe live AI service is temporarily unavailable, so this answer is from the current POLY PMNA website index.`, {
              provider: "local-knowledge-fallback",
              error: error.message,
              knowledgeVersion: retrieval?.version || ""
            });
          } else {
            await addMessage("assistant", "I could not reach the AI service right now. Your chat is saved. Try a website question, a calculation such as 12*8, a conversion such as 5 km to m, or a formula such as voltage 12, current 2.", { error: error.message });
          }
        }
      }
    } finally {
      setWaiting(false);
      if (els.stop) els.stop.hidden = true;
      abortController = null;
      await renderAll();
      
      // Check queue
      if (messageQueue.length > 0) {
        const nextText = messageQueue.shift();
        updateQueueStatus();
        sendMessage(nextText, true);
      } else {
        els.input.focus();
      }
    }
  }

  function updateQueueStatus() {
    if (!els.queue) return;
    if (messageQueue.length > 0) {
      els.queue.textContent = `Queued (${messageQueue.length})`;
      els.queue.classList.add("active");
    } else {
      els.queue.textContent = "Queue";
      els.queue.classList.remove("active");
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
      if (event.key === "Enter" && !event.shiftKey && !isMobile()) {
        event.preventDefault();
        els.send.click();
      }
    });
    els.input.addEventListener("input", autoResize);
    els.search.addEventListener("input", renderChats);
    els.newChat.addEventListener("click", () => createChat());
    if (els.stop) {
      els.stop.addEventListener("click", () => {
        if (abortController) abortController.abort();
      });
    }
    if (els.queue) {
      els.queue.addEventListener("click", () => {
        const text = els.input.value.trim();
        if (!text) return;
        if (!waiting && messageQueue.length === 0) {
          sendMessage(text);
        } else {
          messageQueue.push(text);
          els.input.value = "";
          autoResize();
          updateQueueStatus();
        }
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
