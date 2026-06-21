(() => {
  "use strict";

  const HISTORY_PREFIX = "askPolyGeneralHistory:v1:";
  const IS_LESSON_PAGE = /\/lessons\/[^/]+\.html$/i.test(window.location.pathname);
  const LOCAL_QUERY_PATTERN = /\b(subject|lesson|syllabus|notes|semester|department|model\s*qp|question\s*paper)\b/i;
  const SIMPLE_HELP_PATTERN = /^(hi+|hai|hlo|helo|hello|hellow|hey|help|what can you do|how to use)$/i;
  const ACKNOWLEDGEMENT_PATTERN = /^(ok|okay|okk|k|thanks|thank you|fine|good)$/i;
  const VAGUE_QUERY_PATTERN = /^(why|what|how|where|when|which|who|then|yes|no|and|so|tell|explain|why\?|what\?|how\?)$/i;

  let remoteHistory = [];
  let lastRemoteAnswer = "";

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function historyKey() {
    return `${HISTORY_PREFIX}${window.location.pathname}`;
  }

  function loadHistory() {
    try {
      const stored = JSON.parse(localStorage.getItem(historyKey()) || "[]");
      remoteHistory = Array.isArray(stored) ? stored.slice(-12) : [];
    } catch (_) {
      remoteHistory = [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(historyKey(), JSON.stringify(remoteHistory.slice(-12)));
    } catch (_) {
      // Storage restrictions must not disable the assistant.
    }
  }

  function installUiFixStyles() {
    if (document.getElementById("ask-poly-student-friendly-fixes")) return;
    const style = document.createElement("style");
    style.id = "ask-poly-student-friendly-fixes";
    style.textContent = `
      #polySiteAssistant{z-index:2147483000!important}
      #polySiteAssistant .poly-ai-panel{grid-template-rows:auto auto auto minmax(0,1fr) auto!important;height:min(620px,calc(100dvh - 92px))!important;max-height:calc(100dvh - 20px)!important}
      #polySiteAssistant .poly-ai-tabs,#polySiteAssistant .poly-ai-quick{display:flex!important;flex-wrap:nowrap!important;max-height:54px!important;min-height:0!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:thin!important;overscroll-behavior-x:contain!important;white-space:nowrap!important;padding:8px 10px!important;background:#fff!important}
      #polySiteAssistant .poly-ai-tabs button,#polySiteAssistant .poly-ai-quick button{flex:0 0 auto!important;white-space:nowrap!important}
      #polySiteAssistant .poly-ai-body{min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-gutter:stable!important;padding-bottom:10px!important}
      #polySiteAssistant .poly-ai-msg.bot{color:#53657f!important}
      #polySiteAssistant .poly-ai-msg.user{color:#fff!important}
      body.poly-ai-chat-open .app-download{opacity:0!important;pointer-events:none!important;transform:translateY(10px)!important;transition:opacity .16s ease,transform .16s ease!important}
      @media(max-width:700px){#polySiteAssistant .poly-ai-panel{height:min(620px,calc(100dvh - 20px))!important}#polySiteAssistant .poly-ai-tabs,#polySiteAssistant .poly-ai-quick{max-height:50px!important;padding:7px 9px!important}#polySiteAssistant .poly-ai-form{position:relative!important;z-index:2!important}}
    `;
    document.head.append(style);
  }

  function syncAssistantOpenState(root) {
    const apply = () => document.body.classList.toggle("poly-ai-chat-open", root.classList.contains("poly-ai-open"));
    apply();
    new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  function greetingAnswer() {
    return "Hi! I can help with maths, grammar, HTML/coding doubts and POLY PMNA subject or lesson search. Try a full question like “Why is my menu moving down?”, a maths problem like 2+25, a subject code like 3041, or a subject name like Electronics Engineering.";
  }

  function vagueQuestionAnswer(query) {
    const text = clean(query).toLowerCase().replace(/[.!?]+$/g, "");
    if (!text) return "";
    if (VAGUE_QUERY_PATTERN.test(text) || (/^(why|what|how|where|when|which|who)\b/.test(text) && text.split(" ").length <= 2)) {
      return "Please ask a complete question so I can answer correctly. Example: “Why is the menu moving down?”, “Why does current decrease when resistance increases?”, or “How to create an HTML calculator?”";
    }
    return "";
  }

  function shouldStayLocal(query) {
    const text = clean(query);
    if (!text || SIMPLE_HELP_PATTERN.test(text)) return true;
    if (/^[A-Za-z]*\d+[A-Za-z]*$/.test(text)) return true;
    return LOCAL_QUERY_PATTERN.test(text);
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "";
    const rounded = Math.round((value + Number.EPSILON) * 1e12) / 1e12;
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 12 }).format(rounded);
  }

  function extractMathExpression(query) {
    let text = clean(query).toLowerCase();
    if (!text || text.length > 120) return "";

    const percentOf = text.match(/(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)/i);
    if (percentOf) return `(${percentOf[1]}/100)*${percentOf[2]}`;

    text = text
      .replace(/[?=]/g, " ")
      .replace(/,/g, "")
      .replace(/\b(what is|whats|calculate|calc|solve|answer|find|evaluate|step by step|maths|math)\b/g, " ")
      .replace(/\bplus\b/g, "+")
      .replace(/\bminus\b/g, "-")
      .replace(/\binto\b|\bmultiplied by\b|\btimes\b/g, "*")
      .replace(/\bdivided by\b|\bover\b/g, "/")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/(?<=\d)\s*x\s*(?=\d)/g, "*")
      .replace(/\s+/g, "")
      .trim();

    if (!/[+\-*/%]/.test(text) || !/\d/.test(text)) return "";
    if (!/^[\d+\-*/().%\s]+$/.test(text)) return "";
    if (/[*\/%]{2,}|[+\-*/%.]$|^[*/%]/.test(text)) return "";
    return text;
  }

  function answerOfflineMath(query) {
    const expression = extractMathExpression(query);
    if (!expression) return "";
    try {
      const result = Function(`"use strict"; return (${expression});`)();
      const formatted = formatNumber(Number(result));
      if (!formatted) return "";
      return `${expression.replace(/\*/g, " × ").replace(/\//g, " ÷ ").replace(/\+/g, " + ").replace(/-/g, " - ").replace(/\s+/g, " ").trim()} = ${formatted}`;
    } catch (_) {
      return "";
    }
  }

  function offlineGeneralAnswer(query) {
    return vagueQuestionAnswer(query) || answerOfflineMath(query);
  }

  function onlineFailureMessage(error) {
    const status = Number(error?.status || 0);
    const message = clean(error?.message || error?.detail || "");

    if (status === 429) {
      return {
        text: "Online AI is busy because many questions were asked recently. Please wait a few minutes and try again. Local subject search, lesson search and basic maths still work.",
        status: "Online AI busy • Local mode active"
      };
    }

    if (status === 403 || /origin|allowed/i.test(message)) {
      return {
        text: "Online AI is not available for this page right now. Local subject search, lesson search and basic maths still work.",
        status: "Online AI unavailable • Local mode active"
      };
    }

    if (status === 503 || /not configured|OPENAI_API_KEY|api key/i.test(message)) {
      return {
        text: "Online AI is temporarily unavailable. You can still use local subject search, lesson search, grammar prompts, HTML prompts and basic maths.",
        status: "Online AI unavailable • Local mode active"
      };
    }

    if (status === 404 || /failed to fetch|network|load failed|abort/i.test(message)) {
      return {
        text: "Online AI could not connect right now. Local subject search, lesson search and basic maths still work. Please try the online question again later.",
        status: "Connection issue • Local mode active"
      };
    }

    return {
      text: "Online AI is temporarily unavailable. Local maths, subject search, lesson search, grammar and HTML help still work. Please try again later.",
      status: "Online AI unavailable • Local mode active"
    };
  }

  function selectedText() {
    const selection = window.getSelection();
    const text = clean(selection?.toString());
    if (!text || text.length > 2500) return "";
    const anchor = selection?.anchorNode?.parentElement;
    return anchor && !anchor.closest("#polySiteAssistant") ? text : "";
  }

  function pageContext() {
    const activePanel = document.querySelector(".panel.active") || document.querySelector("main") || document.body;
    const main = IS_LESSON_PAGE ? (activePanel || document.querySelector("main")) : document.querySelector("main");
    return clean(main?.innerText || "").slice(0, IS_LESSON_PAGE ? 12000 : 8000);
  }

  function makeMessage(body, role, text) {
    const message = document.createElement("div");
    message.className = `poly-ai-msg ${role}`;
    message.textContent = text;
    body.append(message);
    if (role === "bot") lastRemoteAnswer = text;
    body.scrollTop = body.scrollHeight;
    return message;
  }

  function appendCitations(body, citations) {
    if (!Array.isArray(citations) || !citations.length) return;
    const sources = document.createElement("div");
    sources.className = "poly-ai-sources";

    citations.slice(0, 6).forEach((citation, index) => {
      if (!citation?.url) return;
      const card = document.createElement("article");
      card.className = "poly-ai-source";

      const title = document.createElement("strong");
      title.textContent = `Web source ${index + 1}`;
      const description = document.createElement("p");
      description.textContent = citation.title || citation.url;
      const links = document.createElement("div");
      links.className = "poly-ai-links";
      const anchor = document.createElement("a");
      anchor.href = citation.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = "Open source";
      links.append(anchor);
      card.append(title, description, links);
      sources.append(card);
    });

    if (sources.childElementCount) {
      body.append(sources);
      body.scrollTop = body.scrollHeight;
    }
  }

  function addGeneralQuickPrompts(quick, input) {
    if (!quick || quick.querySelector("[data-general-ai-prompt]")) return;
    const prompts = [
      ["Maths", "Solve step by step: "],
      ["Grammar", "Correct this grammar and explain: "],
      ["HTML", "Create a complete HTML page for: "],
      ["Current affairs", "What are today's important current affairs in India?"]
    ];

    prompts.forEach(([label, prompt]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.generalAiPrompt = "true";
      button.textContent = label;
      button.addEventListener("click", () => {
        input.value = prompt;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      });
      quick.append(button);
    });
  }

  function enhanceLabels(root, configured) {
    const subtitle = root.querySelector(".poly-ai-subtitle");
    if (subtitle) subtitle.textContent = configured
      ? (IS_LESSON_PAGE ? "Lesson context + online AI" : "Student learning assistant")
      : (IS_LESSON_PAGE ? "Lesson assistant" : "Subject finder");

    const subtext = root.querySelector(".poly-ai-button-subtext");
    if (subtext) subtext.textContent = configured ? "Study helper" : (IS_LESSON_PAGE ? "Lesson doubt helper" : "Subject finder");

    const input = root.querySelector(".poly-ai-form input");
    if (input && configured) input.placeholder = IS_LESSON_PAGE
      ? "Ask lesson, maths, coding or general doubt…"
      : "Ask maths, coding, grammar, current affairs…";
  }

  function initialize(root) {
    if (!root || root.dataset.generalAiExtension === "true") return;
    const form = root.querySelector(".poly-ai-form");
    const input = form?.querySelector("input");
    const send = form?.querySelector("button[type='submit']");
    const body = root.querySelector(".poly-ai-body");
    const status = root.querySelector(".poly-ai-status");
    const quick = root.querySelector(".poly-ai-quick");
    if (!form || !input || !body || !status || !send) return;

    root.dataset.generalAiExtension = "true";
    installUiFixStyles();
    syncAssistantOpenState(root);
    loadHistory();
    const configured = Boolean(globalThis.AskPolyRemote?.isConfigured?.());
    enhanceLabels(root, configured);
    if (configured) addGeneralQuickPrompts(quick, input);

    if (quick) {
      new MutationObserver(() => {
        if (globalThis.AskPolyRemote?.isConfigured?.()) addGeneralQuickPrompts(quick, input);
      }).observe(quick, { childList: true });
    }

    form.addEventListener("submit", async (event) => {
      if (form.dataset.remoteBypass === "true") return;
      const query = clean(input.value);
      const configuredNow = Boolean(globalThis.AskPolyRemote?.isConfigured?.());
      if (!query) return;

      if (SIMPLE_HELP_PATTERN.test(query)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        input.value = "";
        makeMessage(body, "user", query);
        makeMessage(body, "bot", greetingAnswer());
        status.textContent = configuredNow ? "Online AI enabled • Local mode ready" : "Local assistant ready";
        return;
      }

      if (ACKNOWLEDGEMENT_PATTERN.test(query)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        input.value = "";
        makeMessage(body, "user", query);
        makeMessage(body, "bot", "Okay. Ask a clear question like a maths problem, HTML help, grammar correction, a subject code, or a complete why/how question.");
        status.textContent = configuredNow ? "Online AI enabled • Local mode ready" : "Local assistant ready";
        return;
      }

      const offlineAnswer = offlineGeneralAnswer(query);
      if (offlineAnswer) {
        event.preventDefault();
        event.stopImmediatePropagation();
        input.value = "";
        makeMessage(body, "user", query);
        makeMessage(body, "bot", offlineAnswer);
        status.textContent = "Answered locally";
        return;
      }

      if (!configuredNow) {
        if (shouldStayLocal(query)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        input.value = "";
        makeMessage(body, "user", query);
        makeMessage(body, "bot", "Online AI is not enabled on this page right now. Local subject search, lesson search and basic maths still work. Try a subject code, subject name, department or semester.");
        status.textContent = "Online AI off • Local mode active";
        return;
      }

      if (shouldStayLocal(query)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = "";

      makeMessage(body, "user", query);
      status.textContent = "Ask POLY AI is thinking…";
      input.disabled = true;
      send.disabled = true;

      try {
        const result = await globalThis.AskPolyRemote.ask({
          message: query,
          history: remoteHistory,
          pageTitle: document.title,
          pageUrl: window.location.href,
          selectedText: selectedText(),
          pageContext: pageContext()
        });

        if (!result?.answer) throw new Error("The AI service returned no answer.");
        makeMessage(body, "bot", result.answer);
        appendCitations(body, result.citations);
        remoteHistory.push({ role: "user", text: query }, { role: "assistant", text: result.answer });
        remoteHistory = remoteHistory.slice(-12);
        saveHistory();
        status.textContent = result.usedWeb
          ? "Answered with current web sources"
          : `Answered by Ask POLY AI${result.model ? ` • ${result.model}` : ""}`;
      } catch (error) {
        console.error("Ask POLY online AI failed.", error);
        const fallbackAnswer = offlineGeneralAnswer(query);
        if (fallbackAnswer) {
          makeMessage(body, "bot", fallbackAnswer);
          status.textContent = "Answered locally";
        } else {
          const reason = onlineFailureMessage(error);
          makeMessage(body, "bot", reason.text);
          status.textContent = reason.status;
        }
      } finally {
        input.disabled = false;
        send.disabled = false;
        input.focus();
      }
    }, true);

    const copyButton = [...root.querySelectorAll(".poly-ai-icon")].find((button) => /copy/i.test(button.textContent));
    copyButton?.addEventListener("click", async (event) => {
      if (!lastRemoteAnswer) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        await navigator.clipboard.writeText(lastRemoteAnswer);
        status.textContent = "Last answer copied";
      } catch (_) {
        status.textContent = "Copy unavailable";
      }
    }, true);

    const clearButton = [...root.querySelectorAll(".poly-ai-icon")].find((button) => /clear/i.test(button.textContent));
    clearButton?.addEventListener("click", () => {
      remoteHistory = [];
      lastRemoteAnswer = "";
      saveHistory();
    });

    if (configured) status.textContent = `${status.textContent} • Online AI enabled`;
  }

  function waitForAssistant() {
    const existing = document.getElementById("polySiteAssistant");
    if (existing?.querySelector(".poly-ai-form")) {
      initialize(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const root = document.getElementById("polySiteAssistant");
      if (!root?.querySelector(".poly-ai-form")) return;
      observer.disconnect();
      initialize(root);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", waitForAssistant, { once: true });
  else waitForAssistant();
})();
