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
    clear: $("clearChatBtn"),
    send: $("sendBtn")
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

  function renderText(text) {
    let textToRender = text;
    const codeBlockCount = (text.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      textToRender += "\n```";
    }
    let html = escapeHtml(textToRender);
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/(^|\n)#{1,3}\s+([^\n]+)/g, "$1<strong>$2</strong>");
    return html.replace(/\n/g, "<br>");
  }

  function bubble(message) {
    const div = document.createElement("div");
    div.className = `ask-bubble ${message.role === "user" ? "user" : "ai"}`;
    div.innerHTML = message.role === "user" ? escapeHtml(message.content) : renderText(message.content);
    const time = document.createElement("time");
    time.className = "ask-time";
    time.dateTime = message.createdAt;
    time.textContent = fmtTime(message.createdAt);
    div.append(time);
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
    els.clear.disabled = value;
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

  async function callAI(message, history, localContext) {
    const endpoint = window.ASK_POLY_CONFIG?.endpoint;
    if (!endpoint) throw new Error("Ask POLY endpoint is missing.");
    const timeoutMs = Number(window.ASK_POLY_CONFIG?.timeoutMs || 30000);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(5000, timeoutMs));
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          message,
          history,
          pageTitle: "Ask POLY whole-site knowledge",
          pageContext: localContext || ""
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.error || `AI failed with HTTP ${response.status}`);
      return {
        answer: data.answer || data.message || data.reply || "No answer received.",
        provider: data.provider || "ai",
        model: data.model || ""
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async function sendMessage(text) {
    if (waiting || !text.trim()) return;
    const clean = text.trim();
    els.input.value = "";
    autoResize();
    await addMessage("user", clean);
    await updateChatTitleFromMessage(activeChatId, clean);
    await renderMessages();
    await renderChats();
    setWaiting(true);
    addTyping();

    let retrieval = null;
    try {
      const messages = await getMessages(activeChatId);
      const previousMessages = messages.slice(0, -1).slice(-MAX_HISTORY);
      const history = previousMessages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
      retrieval = shouldSearchWebsite(clean) ? await knowledgeSearch(clean) : null;

      const endpoint = window.ASK_POLY_CONFIG?.endpoint;
      if (!endpoint) throw new Error("Ask POLY endpoint is missing.");
      const timeoutMs = Number(window.ASK_POLY_CONFIG?.timeoutMs || 30000);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.max(5000, timeoutMs));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          message: clean,
          history,
          stream: true,
          pageTitle: "Ask POLY whole-site knowledge",
          pageContext: retrieval?.context || ""
        })
      });

      removeTyping();

      const contentType = response.headers.get("Content-Type") || "";
      if (response.ok && contentType.includes("text/event-stream")) {
        clearTimeout(timer);

        const bubbleDiv = document.createElement("div");
        bubbleDiv.className = "ask-bubble ai streaming";
        els.messages.append(bubbleDiv);
        els.messages.scrollTop = els.messages.scrollHeight;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              if (trimmed.startsWith("data: ")) {
                const dataStr = trimmed.slice(6);
                if (dataStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  const chunk = parsed.response || parsed.choices?.[0]?.delta?.content || parsed.text || "";
                  if (chunk) {
                    fullText += chunk;
                    bubbleDiv.innerHTML = renderText(fullText);
                    els.messages.scrollTop = els.messages.scrollHeight;
                  }
                } catch (_) {
                  // Ignore partial or malformed JSON during streaming
                }
              }
            }
          }
        } catch (streamError) {
          console.error("Error while reading response stream:", streamError);
        } finally {
          reader.releaseLock();
        }

        bubbleDiv.remove();

        await addMessage("assistant", fullText || "I couldn't generate a response.", {
          provider: "streamed-ai",
          model: "streamed-model",
          websiteKnowledge: Boolean(retrieval?.context),
          knowledgeVersion: retrieval?.version || ""
        });

      } else {
        clearTimeout(timer);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || data.error || `AI failed with HTTP ${response.status}`);

        const answer = data.answer || data.message || data.reply || "No answer received.";

        const bubbleDiv = document.createElement("div");
        bubbleDiv.className = "ask-bubble ai typewriter";
        els.messages.append(bubbleDiv);
        els.messages.scrollTop = els.messages.scrollHeight;

        const words = answer.split(" ");
        let currentText = "";
        let wordIndex = 0;

        await new Promise((resolve) => {
          const intervalId = setInterval(() => {
            if (wordIndex < words.length) {
              currentText += (wordIndex > 0 ? " " : "") + words[wordIndex];
              bubbleDiv.innerHTML = renderText(currentText);
              els.messages.scrollTop = els.messages.scrollHeight;
              wordIndex++;
            } else {
              clearInterval(intervalId);
              resolve();
            }
          }, 30);
        });

        bubbleDiv.remove();

        await addMessage("assistant", answer, {
          provider: data.provider || "ai",
          model: data.model || "",
          websiteKnowledge: Boolean(retrieval?.context),
          knowledgeVersion: retrieval?.version || ""
        });
      }

    } catch (error) {
      removeTyping();
      const fallback = retrieval?.fallbackAnswer || retrieval?.answer;
      if (fallback) {
        await addMessage("assistant", `${fallback}\n\nThe live AI service is temporarily unavailable, so this answer is from the current POLY PMNA website index.`, {
          provider: "local-knowledge-fallback",
          error: error.message,
          knowledgeVersion: retrieval?.version || ""
        });
      } else {
        await addMessage("assistant", "I could not reach the AI service right now. Your chat is saved. You can still open Revision 2026, Revision 2021, Student Tools, Mock Exams, 2015 Materials or Help from the menu.", { error: error.message });
      }
    } finally {
      setWaiting(false);
      await renderAll();
      els.input.focus();
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
    els.clear.addEventListener("click", async () => {
      if (!confirm("Clear this saved chat?")) return;
      await deleteChat(activeChatId);
      await chooseChatAfterDelete(activeChatId);
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
