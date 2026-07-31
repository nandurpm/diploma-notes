/* Purpose: Ask poly rich renderer - Descriptive comment added for clarity */
(() => {
  "use strict";

  const IS_ANDROID_APP = /PolytechnicStudyHubAndroid\//i.test(navigator.userAgent);
  const PLACEHOLDER_HOSTS = new Set(["example.com", "www.example.com", "example.org", "www.example.org", "example.net", "www.example.net"]);
  const DOWNLOAD_PATTERN = /\.(?:apk|zip|pdf|docx?|xlsx?|pptx?|csv|txt|json|xml|ya?ml|md|html?|css|m?js|java|kt|py|c|cc|cpp|h|hpp|ino)(?:$|[?#])/i;
  const DEFAULT_FILE = { html: "index.html", css: "styles.css", js: "script.js", javascript: "script.js", json: "data.json", py: "script.py", python: "script.py", java: "Main.java", kt: "Main.kt", kotlin: "Main.kt", c: "main.c", cpp: "main.cpp", xml: "file.xml", md: "README.md", markdown: "README.md" };

  function linkInfo(value) {
    try {
      const url = new URL(String(value || "").trim(), location.href);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return {
        url,
        placeholder: PLACEHOLDER_HOSTS.has(url.hostname.toLowerCase()),
        download: DOWNLOAD_PATTERN.test(url.pathname + url.search + url.hash),
        sameOrigin: url.origin === location.origin
      };
    } catch (_) {
      return null;
    }
  }

  function appendLink(parent, label, href) {
    const info = linkInfo(href);
    if (!info) {
      parent.append(document.createTextNode(label || href));
      return;
    }

    if (info.placeholder) {
      const fake = document.createElement("span");
      fake.className = "poly-ai-placeholder-link";
      fake.textContent = label || info.url.href;
      fake.title = "This is only an example URL; no real file exists here.";
      const warning = document.createElement("span");
      warning.className = "poly-ai-placeholder-warning";
      warning.textContent = "Example link only — the AI did not create a real file.";
      parent.append(fake, warning);
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = info.url.href;
    anchor.textContent = label || info.url.href;
    anchor.rel = "noopener noreferrer";
    anchor.target = IS_ANDROID_APP ? "_self" : (info.sameOrigin ? "_self" : "_blank");
    if (info.download) {
      anchor.className = "poly-ai-download-link";
      if (info.sameOrigin) anchor.download = info.url.pathname.split("/").pop() || "download";
    }
    parent.append(anchor);
  }

  function appendInline(parent, value) {
    const text = String(value || "");
    const pattern = /(\[([^\]\n]+)\]\(([^)\s]+)\)|`([^`\n]+)`|\*\*([^*\n]+)\*\*|https?:\/\/[^\s<]+)/g;
    let cursor = 0;
    let match;

    while ((match = pattern.exec(text))) {
      if (match.index > cursor) parent.append(document.createTextNode(text.slice(cursor, match.index)));
      if (match[2] !== undefined) {
        appendLink(parent, match[2], match[3]);
      } else if (match[4] !== undefined) {
        const code = document.createElement("code");
        code.textContent = match[4];
        parent.append(code);
      } else if (match[5] !== undefined) {
        const strong = document.createElement("strong");
        strong.textContent = match[5];
        parent.append(strong);
      } else {
        let url = match[0];
        let punctuation = "";
        while (/[.,!?;:]$/.test(url)) {
          punctuation = url.slice(-1) + punctuation;
          url = url.slice(0, -1);
        }
        appendLink(parent, url, url);
        if (punctuation) parent.append(document.createTextNode(punctuation));
      }
      cursor = pattern.lastIndex;
    }
    if (cursor < text.length) parent.append(document.createTextNode(text.slice(cursor)));
  }

  function appendParagraph(parent, lines) {
    if (!lines.length) return;
    const p = document.createElement("p");
    lines.forEach((line, index) => {
      if (index) p.append(document.createElement("br"));
      appendInline(p, line);
    });
    parent.append(p);
  }

  function renderText(parent, source) {
    const lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
    let paragraph = [];
    let list = null;
    let listTag = "";
    const flush = () => { appendParagraph(parent, paragraph); paragraph = []; };

    for (const line of lines) {
      if (!line.trim()) {
        flush();
        list = null;
        listTag = "";
        continue;
      }

      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        flush();
        list = null;
        const h = document.createElement(`h${Math.min(heading[1].length + 2, 6)}`);
        appendInline(h, heading[2]);
        parent.append(h);
        continue;
      }

      const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
      const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (unordered || ordered) {
        flush();
        const desired = ordered ? "ol" : "ul";
        if (!list || listTag !== desired) {
          list = document.createElement(desired);
          listTag = desired;
          parent.append(list);
        }
        const li = document.createElement("li");
        appendInline(li, (unordered || ordered)[1]);
        list.append(li);
        continue;
      }

      list = null;
      listTag = "";
      paragraph.push(line);
    }
    flush();
  }

  function fileDetails(info) {
    const value = String(info || "").trim();
    const explicit = value.match(/(?:filename|file)\s*[:=]\s*["']?([A-Za-z0-9._-]+)/i)?.[1];
    const token = value.match(/\b([A-Za-z0-9_-]+\.(?:html?|css|m?js|json|xml|ya?ml|md|txt|py|java|kt|c|cc|cpp|h|hpp|ino))\b/i)?.[1];
    const language = (value.split(/\s+/)[0] || "text").toLowerCase().replace(/[^a-z0-9+#.-]/g, "");
    const filename = explicit || token || DEFAULT_FILE[language] || "code.txt";
    const mime = filename.endsWith(".html") ? "text/html" : filename.endsWith(".css") ? "text/css" : /\.m?js$/.test(filename) ? "text/javascript" : filename.endsWith(".json") ? "application/json" : "text/plain";
    return { filename, language, mime };
  }

  function downloadFile(filename, content, mime) {
    const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
    setTimeout(() => { URL.revokeObjectURL(url); anchor.remove(); }, 1500);
  }

  function renderCode(parent, info, source) {
    const details = fileDetails(info);
    const section = document.createElement("section");
    section.className = "poly-ai-code-block";
    const header = document.createElement("div");
    header.className = "poly-ai-code-header";
    const label = document.createElement("span");
    label.textContent = details.filename;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Download file";
    button.addEventListener("click", () => downloadFile(details.filename, source, details.mime));
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.dataset.language = details.language;
    code.textContent = source.replace(/^\n|\n$/g, "");
    pre.append(code);
    header.append(label, button);
    section.append(header, pre);
    parent.append(section);
  }

  function enhance(message) {
    if (!(message instanceof HTMLElement) || !message.matches(".poly-ai-msg.bot") || message.dataset.richRendered === "true") return;
    const source = message.textContent || "";
    message.dataset.richRendered = "true";
    message.classList.add("poly-ai-rich-message");
    message.replaceChildren();

    const fences = /```([^\n`]*)\n?([\s\S]*?)```/g;
    let cursor = 0;
    let match;
    while ((match = fences.exec(source))) {
      renderText(message, source.slice(cursor, match.index));
      renderCode(message, match[1], match[2]);
      cursor = fences.lastIndex;
    }
    renderText(message, source.slice(cursor));
  }

  function scan(root = document) {
    if (root instanceof HTMLElement) enhance(root);
    root.querySelectorAll?.(".poly-ai-msg.bot").forEach(enhance);
  }

  function start() {
    scan();
    new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) scan(node);
    }))).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
