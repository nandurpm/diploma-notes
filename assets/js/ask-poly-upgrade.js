/* Purpose: Ask poly upgrade - Descriptive comment added for clarity */
(() => {
  "use strict";

  if (!/\/ask-poly\.html$/i.test(location.pathname)) return;

  const SITE_CONTEXT = `You are Ask POLY, the website assistant for polypmna.dpdns.org / Polytechnic Study Hub.
Answer only as a guide for this website and Kerala Polytechnic study navigation.
Website structure:
- Home: Quick Subject Finder for Revision 2021 subjects.
- Revision 2021: department cards open /revision-2021/department-view.html?dept=SLUG.
- Department viewer: Semester 1 to Semester 6 subject cards.
- Open Syllabus and Sample QP are official SITTTR links.
- View Lessons appears only when a local /lessons/lessons-CODE.html file exists.
- Download Notes appears only when a local /notes/downloadable-notes-CODE.pdf file exists.
- Mock Exams are at /daily-quiz.html.
- 2015 Materials are at /materials-2015.html.
- Tools are at /tools.html.
- Help and issue reporting are at /contact.html.
Rules:
- Never invent lesson pages, notes PDFs, ZIP files, download links, or source files.
- If a lesson/notes button is missing, say that local file is not uploaded yet.
- For broken links, ask for page URL, subject code, button name, screenshot, and what happened.
- Keep answers short, practical, and student-friendly.`;

  const QUICK = [
    ["Find subjects", "Where can I find Revision 2021 Computer Engineering subjects?"],
    ["Missing notes", "Why is the Download Notes button missing for some subjects?"],
    ["Mock exams", "Explain how to use the mock exams page."],
    ["Electrical tools", "Which tools are useful for electrical and electronics students?"],
    ["Report issue", "I found a broken link. What details should I send?"]
  ];

  function $(id) { return document.getElementById(id); }

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
    html = html.replace(/(^|\n)###\s+([^\n]+)/g, "$1<strong>$2</strong>");
    html = html.replace(/(^|\n)##\s+([^\n]+)/g, "$1<strong>$2</strong>");
    html = html.replace(/(^|\n)#\s+([^\n]+)/g, "$1<strong>$2</strong>");
    html = html.replace(/\n/g, "<br>");
    return html;
  }

  function localAnswer(message) {
    const q = String(message || "").toLowerCase();
    if (q.includes("lesson") || q.includes("notes") || q.includes("download")) {
      return "Lesson and Notes buttons appear only when the local file is uploaded. If a button is missing, use Open Syllabus or Sample QP for now, or report the missing file on the Help page.";
    }
    if (q.includes("revision") || q.includes("department") || q.includes("subject") || q.includes("semester")) {
      return "Open Revision 2021, choose your department, and the department viewer will show Semester 1 to Semester 6 subject cards. You can also use the homepage Quick Subject Finder to search by subject code or title.";
    }
    if (q.includes("mock") || q.includes("quiz") || q.includes("exam")) {
      return "Open Mock Exams from the top menu or go to /daily-quiz.html. It is for quiz and exam practice.";
    }
    if (q.includes("tool") || q.includes("calculator") || q.includes("electrical") || q.includes("electronics")) {
      return "Open /tools.html. For electrical/electronics students, use calculators, converters, academic helpers and the POLY Website Guide card inside Tools.";
    }
    if (q.includes("broken") || q.includes("report") || q.includes("wrong") || q.includes("not working")) {
      return "To report a problem, open /contact.html and send: page URL, subject code, button/link name, screenshot, and what happened. That is enough to fix it properly.";
    }
    if (q.includes("sitttr") || q.includes("syllabus") || q.includes("question paper") || q.includes("qp")) {
      return "Use Open Syllabus and Sample QP buttons on each subject card. They point to official SITTTR pages. For local lessons/notes, buttons appear only when files are uploaded.";
    }
    return "I can help with polypmna.dpdns.org navigation: Revision 2021 subjects, syllabus links, available lessons/notes, mock exams, 2015 materials, tools and issue reporting.";
  }

  function installStyle() {
    if ($("askPolyUpgradeStyle")) return;
    const style = document.createElement("style");
    style.id = "askPolyUpgradeStyle";
    style.textContent = `
      .ask-upgrade-toolbar{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 0}.ask-upgrade-toolbar button{border:1px solid rgba(37,99,235,.18);border-radius:999px;background:#fff;color:#1e3a8a;font-weight:850;padding:9px 13px;cursor:pointer}.chat-actions{display:flex;gap:8px;margin-top:8px}.chat-actions button{border:0;border-radius:999px;background:rgba(29,78,216,.10);color:#1e3a8a;font-weight:850;padding:7px 10px;cursor:pointer}.bubble pre{background:#0f172a;color:#e2e8f0;border-radius:14px;padding:12px;overflow:auto}.bubble code{background:rgba(15,23,42,.08);border-radius:6px;padding:2px 5px}.bubble a{color:#1d4ed8;font-weight:800}.ask-status-note{font-size:13px;color:#64748b;margin:8px 0 0}.chat-form button.secondary{background:#fff;color:#1e3a8a;border:1px solid rgba(37,99,235,.18)}
    `;
    document.head.append(style);
  }

  function addBubble(box, role, text) {
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

  function enhance() {
    const box = $("chatBox");
    const oldForm = $("chatForm");
    const input = $("chatInput");
    const status = $("chatStatus");
    const send = $("sendBtn");
    if (!box || !oldForm || !input || !status || !send) return;
    if (oldForm.dataset.upgraded === "true") return;

    installStyle();

    const hero = document.querySelector(".page-title");
    if (hero && !$("askPolyStatusNote")) {
      const note = document.createElement("p");
      note.id = "askPolyStatusNote";
      note.className = "ask-status-note";
      note.textContent = "This assistant is tuned for polypmna.dpdns.org. It will not invent missing local notes or lesson files.";
      hero.append(note);
    }

    const promptRow = document.querySelector(".hint-row");
    if (promptRow) {
      promptRow.replaceChildren();
      QUICK.forEach(([label, prompt]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.dataset.prompt = prompt;
        button.addEventListener("click", () => { input.value = prompt; input.focus(); });
        promptRow.append(button);
      });
    }

    const form = oldForm.cloneNode(true);
    form.dataset.upgraded = "true";
    oldForm.replaceWith(form);
    const newInput = form.querySelector("#chatInput");
    const newSend = form.querySelector("#sendBtn");

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "secondary";
    clear.textContent = "Clear";
    clear.addEventListener("click", () => {
      box.innerHTML = "";
      addBubble(box, "ai", "Chat cleared. Ask me about subjects, syllabus, lessons, notes, mock exams, tools or issue reporting.");
      history.length = 0;
      newInput.focus();
    });
    form.append(clear);

    const history = [];

    async function ask(message) {
      addBubble(box, "user", message);
      history.push({ role: "user", content: message });
      newInput.value = "";
      newSend.disabled = true;
      status.textContent = "Thinking...";

      try {
        const remote = window.AskPolyRemote;
        if (!remote?.isConfigured?.()) throw new Error("Ask POLY remote is not configured.");
        const payloadMessage = `${SITE_CONTEXT}\n\nUser question: ${message}`;
        const data = await remote.ask({ message: payloadMessage, history });
        const reply = data?.answer || data?.message || data?.reply || localAnswer(message);
        addBubble(box, "ai", reply);
        history.push({ role: "assistant", content: reply });
        status.textContent = "Ready";
      } catch (error) {
        console.warn("Ask POLY remote failed. Using local website guide.", error);
        addBubble(box, "ai", localAnswer(message));
        status.textContent = "Local guide";
      } finally {
        newSend.disabled = false;
        newInput.focus();
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = newInput.value.trim();
      if (message) ask(message);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhance, { once: true });
  else enhance();
})();
