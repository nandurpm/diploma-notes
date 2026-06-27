(() => {
  "use strict";

  const MAX_INPUT_CHARS = 1200;

  const WEBSITE_CONTEXT = `
You are Ask POLY, the website assistant for polypmna.dpdns.org / Polytechnic Study Hub.
Your job is to guide students through this website and Kerala Polytechnic study navigation.
Website structure:
- Home has Quick Subject Finder.
- Revision 2021 opens department cards and the stable department viewer: /revision-2021/department-view.html?dept=SLUG.
- Department viewer shows Semester 1 to Semester 6 subject cards.
- Open Syllabus and Sample QP are official SITTTR links.
- View Lessons appears only when a local /lessons/lessons-CODE.html file exists.
- Download Notes appears only when a local /notes/downloadable-notes-CODE.pdf file exists.
- Mock Exams are at /daily-quiz.html.
- 2015 Materials are at /materials-2015.html.
- Tools are at /tools.html.
- Help and issue reporting are at /contact.html.
Rules:
- Never invent local lesson pages, notes PDFs, ZIP files, source files, or download URLs.
- If a lesson or notes button is missing, say the local file is not uploaded yet.
- For broken links, ask for page URL, subject code, button/link name, screenshot, and what happened.
- Keep answers short, clear, practical, and student-friendly.
`;

  const RESPONSE_FORMAT_GUIDANCE = `
--- ASK POLY INTERFACE REQUIREMENTS ---
Use Markdown links only for real, accessible URLs. Never invent a download URL and never use example.com, example.org or example.net as a file link. Do not claim that a ZIP, PDF or other file was created unless a real URL exists. When the user asks for downloadable source code, provide each file in a fenced code block and include its filename in the fence, for example: \`\`\`html filename=index.html. The website will add a Download file button to each fenced code block.
--- END INTERFACE REQUIREMENTS ---`;

  function currentConfig() {
    const config = globalThis.ASK_POLY_CONFIG || {};
    return {
      endpoint: String(config.endpoint || "").trim(),
      timeoutMs: Math.max(5000, Number(config.timeoutMs || 60000)),
      maxHistory: Math.max(0, Math.min(20, Number(config.maxHistory || 12)))
    };
  }

  function validEndpoint(endpoint) {
    if (!endpoint) return false;
    try {
      const url = new URL(endpoint, window.location.href);
      return url.protocol === "https:"
        || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
    } catch (_) {
      return false;
    }
  }

  function guidedMessage(message) {
    return `${WEBSITE_CONTEXT}\n\nUser question:\n${String(message || "").trim()}\n\n${RESPONSE_FORMAT_GUIDANCE}`;
  }

  async function ask(payload) {
    const config = currentConfig();
    if (!validEndpoint(config.endpoint)) return null;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          ...payload,
          message: guidedMessage(payload.message),
          history: Array.isArray(payload.history) ? payload.history.slice(-config.maxHistory) : []
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.error || `Ask POLY AI failed with HTTP ${response.status}.`);
        error.status = response.status;
        error.detail = data.detail || "";
        throw error;
      }
      return data;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  globalThis.AskPolyRemote = Object.freeze({
    isConfigured: () => validEndpoint(currentConfig().endpoint),
    endpoint: () => currentConfig().endpoint,
    ask
  });

  function localAnswer(message) {
    const q = String(message || "").toLowerCase();
    if (q.includes("lesson") || q.includes("notes") || q.includes("download")) return "Lesson and Notes buttons appear only when the local file is uploaded. If the button is missing, use Open Syllabus or Sample QP for now, or report the missing file on the Help page.";
    if (q.includes("revision") || q.includes("department") || q.includes("subject") || q.includes("semester")) return "Open Revision 2021, choose your department, and the department viewer will show Semester 1 to Semester 6 subject cards. You can also use the homepage Quick Subject Finder to search by subject code or title.";
    if (q.includes("mock") || q.includes("quiz") || q.includes("exam")) return "Open Mock Exams from the top menu or go to /daily-quiz.html. It is for quiz and exam practice.";
    if (q.includes("tool") || q.includes("calculator") || q.includes("electrical") || q.includes("electronics")) return "Open /tools.html. For electrical/electronics students, use calculators, converters, academic helpers, and the POLY Website Guide inside Tools.";
    if (q.includes("broken") || q.includes("report") || q.includes("wrong") || q.includes("not working")) return "To report a problem, open /contact.html and send: page URL, subject code, button/link name, screenshot, and what happened.";
    if (q.includes("sitttr") || q.includes("syllabus") || q.includes("question paper") || q.includes("qp")) return "Use Open Syllabus and Sample QP buttons on each subject card. They point to official SITTTR pages. Local lessons/notes appear only when uploaded.";
    return "I can help with polypmna.dpdns.org navigation: Revision 2021 subjects, syllabus links, available lessons/notes, mock exams, 2015 materials, tools and issue reporting.";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderMarkdownLite(text) {
    let html = escapeHtml(text);
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/(^|\n)#{1,3}\s+([^\n]+)/g, "$1<strong>$2</strong>");
    return html.replace(/\n/g, "<br>");
  }

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  }

  function upgradeAskPolyPage() {
    if (!/\/ask-poly\.html$/i.test(location.pathname)) return;
    const box = document.getElementById("chatBox");
    const oldForm = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");
    const status = document.getElementById("chatStatus");
    if (!box || !oldForm || !input || !status || oldForm.dataset.polyUpgraded === "true") return;

    const style = document.createElement("style");
    style.textContent = `.chat-actions{display:flex;gap:8px;margin-top:8px}.chat-actions button{border:0;border-radius:999px;background:rgba(29,78,216,.10);color:#1e3a8a;font-weight:850;padding:7px 10px;cursor:pointer}.bubble pre{background:#0f172a;color:#e2e8f0;border-radius:14px;padding:12px;overflow:auto}.bubble code{background:rgba(15,23,42,.08);border-radius:6px;padding:2px 5px}.bubble a{color:#1d4ed8;font-weight:800}.ask-status-note,.ask-char-counter{font-size:13px;color:#64748b;margin:8px 0 0}.ask-char-counter.over{color:#b42318;font-weight:800}.chat-form button.secondary{background:#fff;color:#1e3a8a;border:1px solid rgba(37,99,235,.18)}.poly-typing{display:inline-flex;align-items:center;gap:5px}.poly-typing i{width:7px;height:7px;border-radius:50%;background:#1d4ed8;display:inline-block;animation:polyBlink 1s infinite ease-in-out}.poly-typing i:nth-child(2){animation-delay:.15s}.poly-typing i:nth-child(3){animation-delay:.3s}@keyframes polyBlink{0%,80%,100%{opacity:.28;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}.chat-form textarea:disabled{opacity:.72;background:#f8fafc}`;
    document.head.append(style);

    const noteTarget = document.querySelector(".page-title");
    if (noteTarget && !document.getElementById("askPolyStatusNote")) {
      const note = document.createElement("p");
      note.id = "askPolyStatusNote";
      note.className = "ask-status-note";
      note.textContent = "Tuned for polypmna.dpdns.org. It will not invent missing local notes or lesson files.";
      noteTarget.append(note);
    }

    const form = oldForm.cloneNode(true);
    form.dataset.polyUpgraded = "true";
    oldForm.replaceWith(form);
    const newInput = form.querySelector("#chatInput");
    const newSend = form.querySelector("#sendBtn");
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "secondary";
    clear.textContent = "Clear";
    form.append(clear);

    const counter = document.createElement("p");
    counter.className = "ask-char-counter";
    counter.setAttribute("aria-live", "polite");
    form.after(counter);

    newInput.maxLength = MAX_INPUT_CHARS;
    newInput.placeholder = "Ask about subjects, syllabus, notes, mock exams, tools or website help...";

    const quick = [
      ["Find subjects", "Where can I find Revision 2021 Computer Engineering subjects?"],
      ["Missing notes", "Why is the Download Notes button missing for some subjects?"],
      ["Mock exams", "Explain how to use the mock exams page."],
      ["Electrical tools", "Which tools are useful for electrical and electronics students?"],
      ["Report issue", "I found a broken link. What details should I send?"]
    ];
    const promptRow = document.querySelector(".hint-row");
    if (promptRow) {
      promptRow.replaceChildren();
      quick.forEach(([label, prompt]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.addEventListener("click", () => { newInput.value = prompt; updateCounter(); newInput.focus(); });
        promptRow.append(button);
      });
    }

    const history = [];
    let typingBubble = null;
    let waiting = false;

    function updateCounter() {
      const count = newInput.value.length;
      counter.textContent = `${count}/${MAX_INPUT_CHARS} characters`;
      counter.classList.toggle("over", count > MAX_INPUT_CHARS * 0.9);
      if (!waiting) newSend.disabled = count === 0 || count > MAX_INPUT_CHARS;
    }

    function setWaiting(value) {
      waiting = value;
      newInput.disabled = value;
      newSend.disabled = value || newInput.value.trim().length === 0 || newInput.value.length > MAX_INPUT_CHARS;
      clear.disabled = value;
      status.textContent = value ? "POLY is thinking..." : "Ready";
    }

    function addTyping() {
      removeTyping();
      typingBubble = document.createElement("div");
      typingBubble.className = "bubble ai";
      typingBubble.innerHTML = '<span class="poly-typing">POLY is thinking <i></i><i></i><i></i></span>';
      box.append(typingBubble);
      box.scrollTop = box.scrollHeight;
    }

    function removeTyping() {
      if (typingBubble) typingBubble.remove();
      typingBubble = null;
    }

    function addBubble(role, text) {
      const wrap = document.createElement("div");
      wrap.className = `bubble ${role === "user" ? "user" : "ai"}`;
      if (role === "ai") wrap.innerHTML = renderMarkdownLite(text);
      else wrap.textContent = text;
      if (role === "ai") {
        const actions = document.createElement("div");
        actions.className = "chat-actions";
        const copy = document.createElement("button");
        copy.type = "button";
        copy.textContent = "Copy";
        copy.addEventListener("click", async () => {
          try { await navigator.clipboard.writeText(text); copy.textContent = "Copied"; setTimeout(() => copy.textContent = "Copy", 1200); }
          catch { copy.textContent = "Copy failed"; }
        });
        actions.append(copy);
        wrap.append(actions);
      }
      box.append(wrap);
      box.scrollTop = box.scrollHeight;
    }

    async function run(message) {
      if (waiting) return;
      const clean = String(message || "").trim();
      if (!clean) return;
      if (clean.length > MAX_INPUT_CHARS) {
        status.textContent = "Message too long";
        return;
      }

      addBubble("user", clean);
      history.push({ role: "user", content: clean });
      newInput.value = "";
      updateCounter();
      setWaiting(true);
      addTyping();

      try {
        const data = await ask({ message: clean, history });
        const reply = data?.answer || data?.message || data?.reply || localAnswer(clean);
        removeTyping();
        addBubble("ai", reply);
        history.push({ role: "assistant", content: reply });
        status.textContent = "Ready";
      } catch (error) {
        console.warn("Ask POLY remote failed. Using local website guide.", error);
        removeTyping();
        addBubble("ai", localAnswer(clean));
        status.textContent = "Local guide";
      } finally {
        setWaiting(false);
        updateCounter();
        newInput.focus();
      }
    }

    clear.addEventListener("click", () => {
      if (waiting) return;
      history.length = 0;
      box.innerHTML = "";
      addBubble("ai", "Chat cleared. Ask me about subjects, syllabus, lessons, notes, mock exams, tools or issue reporting.");
      newInput.focus();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      run(newInput.value);
    });

    newInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !isMobileDevice()) {
        event.preventDefault();
        newSend.click();
      }
    });

    newInput.addEventListener("input", updateCounter);
    updateCounter();
    requestAnimationFrame(() => newInput.focus());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", upgradeAskPolyPage, { once: true });
  else upgradeAskPolyPage();
})();
