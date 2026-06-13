(() => {
  "use strict";

  const rootElement = document.getElementById("polySiteAssistant");
  if (!rootElement) return;

  const AVAILABLE_LESSONS = new Set([
    "1001", "1002", "1003", "1004", "1005", "1006", "2003",
    "2031", "2041", "3023", "3031", "3032", "3041", "3044",
    "3045", "3046", "3047"
  ]);
  const SEPARATE_PDFS = new Set(["1003", "1004"]);
  const HISTORY_KEY = "polySiteAssistantHistory";

  let history = [];
  let lastAnswer = "";

  function installCriticalStyles() {
    if (document.getElementById("polyAssistantCriticalStyles")) return;
    const style = document.createElement("style");
    style.id = "polyAssistantCriticalStyles";
    style.textContent = `
      #polySiteAssistant{position:fixed;right:18px;bottom:18px;z-index:2147483000;width:max-content;height:max-content;font-family:Inter,"Segoe UI",system-ui,sans-serif;color:#0f172a}
      #polySiteAssistant *{box-sizing:border-box}
      #polySiteAssistant .poly-ai-panel[hidden]{display:none!important}
      #polySiteAssistant .poly-ai-button{display:inline-flex;align-items:center;gap:9px;min-width:142px;height:58px;padding:8px 15px 8px 9px;border:0;border-radius:18px;color:#fff;background:linear-gradient(135deg,#1d4ed8,#0891b2 55%,#059669);box-shadow:0 18px 42px rgba(29,78,216,.3);cursor:pointer;font:900 .92rem/1 Inter,"Segoe UI",sans-serif}
      #polySiteAssistant .poly-ai-button-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:rgba(255,255,255,.18);font-size:.9rem}
      #polySiteAssistant .poly-ai-panel{position:absolute;right:0;bottom:70px;width:min(430px,calc(100vw - 28px));height:min(650px,calc(100vh - 105px));display:grid;grid-template-rows:auto auto 1fr auto;overflow:hidden;border:1px solid rgba(148,163,184,.42);border-radius:24px;background:#fff;box-shadow:0 30px 80px rgba(15,23,42,.26)}
      #polySiteAssistant .poly-ai-head{display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:center;padding:14px;color:#fff;background:linear-gradient(135deg,#1d4ed8,#0f766e)}
      #polySiteAssistant .poly-ai-title{font-weight:900}
      #polySiteAssistant .poly-ai-icon{min-width:32px;height:32px;padding:0 8px;border:1px solid rgba(255,255,255,.28);border-radius:10px;color:#fff;background:rgba(255,255,255,.13);cursor:pointer;font-weight:850}
      #polySiteAssistant .poly-ai-status{padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#475569;background:#f8fafc;font-size:.76rem;font-weight:800}
      #polySiteAssistant .poly-ai-body{min-height:0;overflow-y:auto;padding:13px;background:linear-gradient(180deg,#eff6ff,#fff)}
      #polySiteAssistant .poly-ai-msg{max-width:92%;margin:0 0 10px;padding:10px 12px;border-radius:15px;font-size:.86rem;line-height:1.5}
      #polySiteAssistant .poly-ai-msg.bot{border:1px solid #dbeafe;background:#fff;box-shadow:0 8px 22px rgba(15,23,42,.07)}
      #polySiteAssistant .poly-ai-msg.user{margin-left:auto;color:#fff;background:linear-gradient(135deg,#2563eb,#0891b2)}
      #polySiteAssistant .poly-ai-results{display:grid;gap:9px;margin:7px 0 13px}
      #polySiteAssistant .poly-ai-card{padding:11px;border:1px solid #dbe3ef;border-radius:16px;background:#fff;box-shadow:0 8px 20px rgba(15,23,42,.07)}
      #polySiteAssistant .poly-ai-card h3{margin:0;color:#0f172a;font-size:.92rem}
      #polySiteAssistant .poly-ai-card p{margin:6px 0 0;color:#475569;font-size:.8rem}
      #polySiteAssistant .poly-ai-links{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
      #polySiteAssistant .poly-ai-links a,#polySiteAssistant .poly-ai-links .unavailable{padding:7px 9px;border-radius:10px;font-size:.75rem;font-weight:900;text-decoration:none}
      #polySiteAssistant .poly-ai-links a{color:#fff;background:linear-gradient(135deg,#2563eb,#0891b2)}
      #polySiteAssistant .poly-ai-links .unavailable{color:#64748b;background:#e2e8f0}
      #polySiteAssistant .poly-ai-form{display:grid;grid-template-columns:1fr auto;gap:8px;padding:11px;border-top:1px solid #e2e8f0;background:#fff}
      #polySiteAssistant .poly-ai-form input{width:100%;min-height:44px;padding:0 12px;border:1px solid #cbd5e1;border-radius:14px;color:#0f172a;background:#fff;font:inherit}
      #polySiteAssistant .poly-ai-send{min-height:44px;padding:0 15px;border:0;border-radius:14px;color:#fff;background:linear-gradient(135deg,#2563eb,#0d9488);cursor:pointer;font-weight:900}
      @media(max-width:620px){#polySiteAssistant{right:10px;bottom:10px}#polySiteAssistant .poly-ai-button{min-width:54px;width:54px;height:54px;padding:6px;border-radius:19px}#polySiteAssistant .poly-ai-button-text{display:none}#polySiteAssistant .poly-ai-panel{position:fixed;left:10px;right:10px;bottom:72px;width:auto;height:min(560px,calc(100svh - 88px));border-radius:20px}#polySiteAssistant .poly-ai-form{grid-template-columns:1fr}}
    `;
    document.head.append(style);
  }

  installCriticalStyles();

  function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.text !== undefined) element.textContent = options.text;
    if (options.type) element.type = options.type;
    Object.entries(options.attributes || {}).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function pathDepth() {
    return window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
  }

  function localPath(path) {
    return `${pathDepth() ? "../".repeat(pathDepth()) : ""}${path}`;
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}\s./:&-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getSubjects() {
    if (Array.isArray(window.SUBJECTS)) return window.SUBJECTS;
    try {
      if (typeof SUBJECTS !== "undefined" && Array.isArray(SUBJECTS)) return SUBJECTS;
    } catch (_) {
      // The shared subject data is unavailable on this page.
    }
    return [];
  }

  const openButton = createElement("button", {
    className: "poly-ai-button",
    type: "button",
    attributes: {
      "aria-label": "Open Ask POLY assistant",
      "aria-expanded": "false",
      "aria-controls": "polyAiPanel"
    }
  });
  openButton.append(
    createElement("span", { className: "poly-ai-button-mark", text: "AI" }),
    createElement("span", { className: "poly-ai-button-text", text: "Ask POLY" })
  );

  const panel = createElement("section", {
    className: "poly-ai-panel",
    attributes: {
      id: "polyAiPanel",
      role: "dialog",
      "aria-label": "Ask POLY PMNA"
    }
  });
  panel.hidden = true;

  const header = createElement("div", { className: "poly-ai-head" });
  const title = createElement("div", { className: "poly-ai-title", text: "Ask POLY PMNA" });
  const copyButton = createElement("button", { className: "poly-ai-icon", type: "button", text: "Copy" });
  const clearButton = createElement("button", { className: "poly-ai-icon", type: "button", text: "Clear" });
  const closeButton = createElement("button", {
    className: "poly-ai-icon",
    type: "button",
    text: "×",
    attributes: { "aria-label": "Close assistant" }
  });
  header.append(title, copyButton, clearButton, closeButton);

  const status = createElement("div", { className: "poly-ai-status", text: "Subject assistant ready" });
  const messageBody = createElement("div", { className: "poly-ai-body", attributes: { "aria-live": "polite" } });
  const form = createElement("form", { className: "poly-ai-form" });
  const input = createElement("input", {
    attributes: {
      type: "search",
      placeholder: "Type subject code, name or department…",
      autocomplete: "off",
      "aria-label": "Search diploma subjects"
    }
  });
  const sendButton = createElement("button", { className: "poly-ai-send", type: "submit", text: "Search" });
  form.append(input, sendButton);
  panel.append(header, status, messageBody, form);
  rootElement.replaceChildren(panel, openButton);

  const records = getSubjects().map((subject) => {
    const code = String(subject.code || "");
    const available = AVAILABLE_LESSONS.has(code);
    const lesson = available
      ? (subject.lessonFile
        ? localPath(String(subject.lessonFile).replace(/^\/+/, ""))
        : localPath(`lessons/lessons-${encodeURIComponent(code)}.html`))
      : "";
    const notes = SEPARATE_PDFS.has(code)
      ? localPath(`notes/downloadable-notes-${code}.pdf`)
      : lesson;

    return {
      ...subject,
      code,
      available,
      lesson,
      notes,
      title: `${code} — ${subject.name}`,
      searchBlob: normalize([code, subject.name, subject.department, subject.semester, subject.type, subject.revision].join(" "))
    };
  });

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-30)));
  }

  function addMessage(role, text, persist = true) {
    messageBody.append(createElement("div", { className: `poly-ai-msg ${role}`, text }));
    if (persist) {
      history.push({ role, text });
      saveHistory();
    }
    messageBody.scrollTop = messageBody.scrollHeight;
  }

  function addLink(parent, label, href) {
    if (!href) return;
    const anchor = createElement("a", { text: label, attributes: { href } });
    if (/^https?:/i.test(href)) {
      anchor.target = "_blank";
      anchor.rel = "noopener";
    }
    parent.append(anchor);
  }

  function addUnavailable(parent, text) {
    parent.append(createElement("span", {
      className: "unavailable",
      text,
      attributes: { "aria-disabled": "true" }
    }));
  }

  function renderResults(items) {
    messageBody.querySelectorAll(".poly-ai-results").forEach((element) => element.remove());
    const results = createElement("div", { className: "poly-ai-results" });

    items.slice(0, 7).forEach((subject) => {
      const card = createElement("article", { className: "poly-ai-card" });
      card.append(
        createElement("h3", { text: subject.title }),
        createElement("p", { text: [subject.revision, subject.department, subject.semester].filter(Boolean).join(" / ") }),
        createElement("p", { text: subject.available ? "Lesson available." : "Lesson not available yet." })
      );

      const links = createElement("div", { className: "poly-ai-links" });
      if (subject.available) addLink(links, "Open lesson", subject.lesson);
      else addUnavailable(links, "Lesson unavailable");

      addLink(links, "Syllabus", `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(subject.code)}`);
      if (subject.notes) addLink(links, "Download notes", subject.notes);
      else addUnavailable(links, "Notes unavailable");
      addLink(links, "Model QP", `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=${encodeURIComponent(subject.code)}`);

      card.append(links);
      results.append(card);
    });

    messageBody.append(results);
    messageBody.scrollTop = messageBody.scrollHeight;
  }

  function searchSubjects(rawValue) {
    const normalized = normalize(rawValue);
    const tokens = normalized.split(" ").filter(Boolean);

    return records
      .map((subject) => {
        let score = 0;
        if (subject.code === normalized) score += 200;
        if (normalize(subject.title).includes(normalized)) score += 80;
        if (subject.searchBlob.includes(normalized)) score += 50;
        tokens.forEach((token) => {
          if (subject.code === token) score += 120;
          if (subject.searchBlob.includes(token)) score += 20;
        });
        return { subject, score };
      })
      .filter((item) => item.score > 8)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.subject);
  }

  function runSearch(rawValue) {
    const text = String(rawValue || "").trim();
    if (!text) return;

    addMessage("user", text);
    const items = searchSubjects(text);
    if (!items.length) {
      lastAnswer = "No matching item found.";
      addMessage("bot", lastAnswer);
      status.textContent = "No matching website record found";
      return;
    }

    lastAnswer = items[0].available
      ? `${items[0].code} is ${items[0].name}. The lesson is available.`
      : `${items[0].code} is ${items[0].name}. Lesson not available yet.`;
    addMessage("bot", lastAnswer);
    renderResults(items);
    status.textContent = `${items.length} result${items.length === 1 ? "" : "s"} found`;
  }

  function setOpen(open) {
    panel.hidden = !open;
    panel.classList.toggle("open", open);
    openButton.setAttribute("aria-expanded", String(open));
    if (open) window.setTimeout(() => input.focus(), 30);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch(input.value);
    input.value = "";
  });

  openButton.addEventListener("click", () => setOpen(panel.hidden));
  closeButton.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });

  clearButton.addEventListener("click", () => {
    history = [];
    saveHistory();
    messageBody.textContent = "";
    addMessage("bot", "Type a subject code or name. Missing lessons will not open.");
    status.textContent = `${records.length} searchable records ready`;
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(lastAnswer || "");
      status.textContent = "Last answer copied";
    } catch (_) {
      status.textContent = "Copy unavailable";
    }
  });

  try {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (!Array.isArray(history)) history = [];
  } catch (_) {
    history = [];
  }

  history.slice(-30).forEach((message) => addMessage(message.role, message.text, false));
  if (!history.length) {
    addMessage("bot", "Hi! Type a subject code or name. I only show lesson buttons for files that are actually available.");
  }
  status.textContent = `${records.length} searchable records ready`;
})();