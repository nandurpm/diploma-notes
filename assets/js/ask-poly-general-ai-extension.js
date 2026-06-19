(() => {
  "use strict";

  const HISTORY_PREFIX = "askPolyGeneralHistory:v1:";
  const IS_LESSON_PAGE = /\/lessons\/[^/]+\.html$/i.test(window.location.pathname);
  const LOCAL_QUERY_PATTERN = /\b(subject|lesson|syllabus|notes|semester|department|model\s*qp|question\s*paper)\b/i;
  const SIMPLE_HELP_PATTERN = /^(hi|hello|hey|help|what can you do|how to use)$/i;
  const ACKNOWLEDGEMENT_PATTERN = /^(ok|okay|okk|k|thanks|thank you|fine|good)$/i;

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
    return answerOfflineMath(query);
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
      ? (IS_LESSON_PAGE ? "Lesson context + general AI" : "Student learning assistant")
      : (IS_LESSON_PAGE ? "Lesson assistant" : "Subject finder");

    const subtext = root.querySelector(".poly-ai-button-subtext");
    if (subtext) subtext.textContent = configured ? "Study & general AI" : (IS_LESSON_PAGE ? "Lesson doubt helper" : "Subject finder");

    const input = root.querySelector(".poly-ai-form input");
    if (input && configured) input.placeholder = IS_LESSON_PAGE
      ? "Ask lesson, maths, coding or general doubt…"
      : "Ask maths, coding, grammar, current affairs…";
  }

  function runLocalAssistant(form, input, query) {
    input.value = query;
    form.dataset.remoteBypass = "true";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    delete form.dataset.remoteBypass;
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

      if (ACKNOWLEDGEMENT_PATTERN.test(query)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        input.value = "";
        makeMessage(body, "user", query);
        makeMessage(body, "bot", "Okay. Ask a clear question like a maths problem, HTML help, grammar correction, or a subject code.");
        status.textContent = configuredNow ? "Ask POLY AI ready" : "Local assistant ready";
        return;
      }

      const offlineAnswer = offlineGeneralAnswer(query);
      if (offlineAnswer) {
        event.preventDefault();
        event.stopImmediatePropagation();
        input.value = "";
        lastRemoteAnswer = offlineAnswer;
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
        makeMessage(body, "bot", "Online AI is not available now. Local subject and lesson search still works; try a subject code, subject name, department or semester.");
        status.textContent = "Online AI unavailable";
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
        lastRemoteAnswer = result.answer;
        makeMessage(body, "bot", result.answer);
        appendCitations(body, result.citations);
        remoteHistory.push({ role: "user", text: query }, { role: "assistant", text: result.answer });
        remoteHistory = remoteHistory.slice(-12);
        saveHistory();
        status.textContent = result.usedWeb
          ? "Answered with current web sources"
          : `Answered by Ask POLY AI${result.model ? ` • ${result.model}` : ""}`;
      } catch (error) {
        console.error("Ask POLY general AI failed.", error);
        const fallbackAnswer = offlineGeneralAnswer(query);
        if (fallbackAnswer) {
          lastRemoteAnswer = fallbackAnswer;
          makeMessage(body, "bot", fallbackAnswer);
          status.textContent = "Answered locally";
        } else {
          makeMessage(body, "bot", error?.status === 429
            ? "Online AI received too many questions recently. Local subject and lesson search still works."
            : "Online AI is temporarily unavailable. General AI questions need the online service; local subject and lesson search still works.");
          status.textContent = "Online AI temporarily unavailable";
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
        status.textContent = "Last AI answer copied";
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

    if (configured) status.textContent = `${status.textContent} • General AI online`;
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
