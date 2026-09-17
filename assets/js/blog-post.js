(() => {
  "use strict";
  const cfg = window.POLY_BLOG_CONFIG;
  if (!cfg) return;

  const $ = id => document.getElementById(id);
  const allowedTags = new Set(["P", "H2", "H3", "H4", "UL", "OL", "LI", "STRONG", "B", "EM", "I", "U", "S", "BLOCKQUOTE", "A", "BR", "HR", "PRE", "CODE", "MARK"]);
  const alignableTags = new Set(["P", "H2", "H3", "H4", "BLOCKQUOTE", "PRE"]);
  const slug = new URLSearchParams(location.search).get("slug") || "";

  function safeHref(raw) {
    try {
      const u = new URL(raw, location.origin);
      return ["http:", "https:"].includes(u.protocol) ? u.href : "";
    } catch (_) {
      return "";
    }
  }

  function sanitizeHtml(input) {
    const parsed = new DOMParser().parseFromString(`<div>${input || ""}</div>`, "text/html");
    const root = document.createElement("div");
    function copy(node, target) {
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          target.append(document.createTextNode(child.textContent || ""));
          return;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        if (!allowedTags.has(child.tagName)) {
          copy(child, target);
          return;
        }
        const clean = document.createElement(child.tagName.toLowerCase());
        if (child.tagName === "A") {
          const href = safeHref(child.getAttribute("href") || "");
          if (href) {
            clean.href = href;
            clean.rel = "noopener noreferrer";
            if (new URL(href).origin !== location.origin) clean.target = "_blank";
          }
        }
        if (alignableTags.has(child.tagName)) {
          const align = child.dataset.align;
          if (["left", "center", "right"].includes(align)) clean.dataset.align = align;
        }
        copy(child, clean);
        target.append(clean);
      });
    }
    copy(parsed.body.firstElementChild, root);
    return root.innerHTML;
  }

  const formatDate = iso => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  const setMeta = (selector, attr, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };
  const languageLabel = value => ({ en: "English", ml: "Malayalam", mixed: "English + Malayalam" }[value] || "English");

  async function load() {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("This article link is invalid.");
    const params = new URLSearchParams({
      slug: `eq.${slug}`,
      status: "eq.published",
      select: "slug,title,category,summary,content_html,cover_url,cover_alt,tags,featured,published_at,seo_title,seo_description,author_name,content_language,source_label,source_url",
      limit: "1"
    });
    const response = await fetch(`${cfg.supabaseUrl}/rest/v1/${cfg.postsTable}?${params}`, {
      headers: { apikey: cfg.publishableKey, Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("The article could not be loaded right now.");
    const rows = await response.json();
    const post = rows?.[0];
    if (!post) throw new Error("This post is not published or could not be found.");

    const canonical = `https://polypmna.dpdns.org/blog/post.html?slug=${encodeURIComponent(post.slug)}`;
    const seoTitle = post.seo_title || post.title;
    const seoDescription = post.seo_description || post.summary;
    document.title = `${seoTitle} | POLY PMNA`;
    document.documentElement.lang = post.content_language === "ml" ? "ml" : "en";
    $("post-canonical").href = canonical;
    $("post-description").content = seoDescription;
    setMeta("#post-og-title", "content", seoTitle);
    setMeta("#post-og-description", "content", seoDescription);
    setMeta("#post-og-url", "content", canonical);
    setMeta("#post-twitter-title", "content", seoTitle);
    setMeta("#post-twitter-description", "content", seoDescription);

    const image = safeHref(post.cover_url || "") || "https://polypmna.dpdns.org/assets/media/poly-pmna-study-hub-social-card.png";
    setMeta("#post-og-image", "content", image);
    setMeta("#post-twitter-image", "content", image);

    $("breadcrumb-title").textContent = post.title;
    $("post-category").textContent = post.category;
    $("aside-category").textContent = post.category;
    $("post-title").textContent = post.title;
    $("post-summary").textContent = post.summary;
    $("post-author-inline").textContent = post.author_name ? `By ${post.author_name}` : "";
    $("aside-author").textContent = post.author_name || "POLY PMNA";
    $("aside-language").textContent = languageLabel(post.content_language);
    const formatted = formatDate(post.published_at);
    $("post-date").dateTime = post.published_at;
    $("post-date").textContent = formatted;
    $("aside-date").dateTime = post.published_at;
    $("aside-date").textContent = formatted;
    $("post-content").innerHTML = sanitizeHtml(post.content_html);

    if (post.cover_url) {
      const cover = $("post-cover");
      cover.src = safeHref(post.cover_url);
      cover.alt = post.cover_alt || post.title;
      cover.hidden = !cover.src;
    }

    const source = safeHref(post.source_url || "");
    if (source) {
      const card = $("post-source-card");
      const link = $("post-source-link");
      link.href = source;
      link.textContent = post.source_label || new URL(source).hostname;
      card.hidden = false;
    }

    $("post-loading").hidden = true;
    $("post-shell").hidden = false;
  }

  load().catch(error => {
    $("post-loading").hidden = true;
    $("post-error").textContent = error.message;
    $("post-error").hidden = false;
  });
})();
