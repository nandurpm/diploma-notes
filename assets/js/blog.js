/* POLY PMNA Blog & GK catalogue.
   Data source: /data/blog-index.json
   Rendering intentionally uses DOM/textContent APIs instead of HTML injection. */
(() => {
  "use strict";

  const DATA_URL = "/data/blog-index.json";
  const ALLOWED_CATEGORIES = new Set([
    "Study Topics",
    "General Knowledge",
    "Daily Blogs",
    "Exam Tips",
    "Announcements"
  ]);

  const els = {
    search: document.getElementById("blog-search"),
    category: document.getElementById("blog-category"),
    featured: document.getElementById("blog-featured"),
    list: document.getElementById("blog-list"),
    status: document.getElementById("blog-status"),
    count: document.getElementById("blog-post-count"),
    newest: document.getElementById("blog-newest-date")
  };

  if (!els.featured || !els.list || !els.status) return;

  let posts = [];

  const safeText = value => typeof value === "string" ? value.trim() : "";

  function safeSameOriginPath(value) {
    const raw = safeText(value);
    if (!raw) return "";
    try {
      const url = new URL(raw, window.location.origin);
      if (url.origin !== window.location.origin) return "";
      return `${url.pathname}${url.search}${url.hash}`;
    } catch (_) {
      return "";
    }
  }

  function validDate(value) {
    const raw = safeText(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const parsed = new Date(`${raw}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function normalizePost(raw, index) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const title = safeText(raw.title);
    const summary = safeText(raw.summary);
    const category = ALLOWED_CATEGORIES.has(raw.category) ? raw.category : "Announcements";
    const url = safeSameOriginPath(raw.url);
    const date = validDate(raw.date);
    if (!title || !summary || !url || !date) return null;

    return {
      id: safeText(raw.id) || `post-${index + 1}`,
      title,
      summary,
      category,
      url,
      date: raw.date,
      dateValue: date.getTime(),
      thumbnail: safeSameOriginPath(raw.thumbnail),
      thumbnailAlt: safeText(raw.thumbnailAlt) || title,
      featured: raw.featured === true,
      tags: Array.isArray(raw.tags) ? raw.tags.map(safeText).filter(Boolean).slice(0, 12) : []
    };
  }

  function formatDate(value) {
    const date = validDate(value);
    if (!date) return value;
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    }).format(date);
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function createMedia(post, featured = false) {
    const media = createElement("div", featured ? "blog-featured-media" : "blog-card-media");
    if (post.thumbnail) {
      const image = document.createElement("img");
      image.src = post.thumbnail;
      image.alt = post.thumbnailAlt;
      image.loading = featured ? "eager" : "lazy";
      image.decoding = "async";
      media.append(image);
      return media;
    }

    const mark = createElement("span", "blog-media-mark", post.category === "General Knowledge" ? "GK" : "P");
    mark.setAttribute("aria-hidden", "true");
    media.append(mark);
    return media;
  }

  function createMeta(post) {
    const row = createElement("div", "blog-meta-row");
    const category = createElement("span", "blog-category-pill", post.category);
    const date = document.createElement("time");
    date.dateTime = post.date;
    date.textContent = formatDate(post.date);
    row.append(category, date);
    return row;
  }

  function createReadLink(post, label = "Read article") {
    const link = createElement("a", "blog-read-link", label);
    link.href = post.url;
    link.setAttribute("aria-label", `${label}: ${post.title}`);
    const arrow = createElement("span", "", "→");
    arrow.setAttribute("aria-hidden", "true");
    link.append(arrow);
    return link;
  }

  function renderFeatured(post) {
    els.featured.replaceChildren();
    if (!post) {
      els.featured.hidden = true;
      return;
    }

    const card = createElement("article", "blog-featured-card");
    const copy = createElement("div", "blog-featured-copy");
    const heading = createElement("h2", "", post.title);
    const summary = createElement("p", "", post.summary);
    copy.append(createMeta(post), heading, summary, createReadLink(post, "Read featured post"));
    card.append(createMedia(post, true), copy);
    els.featured.append(card);
    els.featured.hidden = false;
  }

  function renderCard(post) {
    const card = createElement("article", "blog-card");
    const body = createElement("div", "blog-card-body");
    const heading = createElement("h3");
    const titleLink = createElement("a", "blog-card-title-link", post.title);
    titleLink.href = post.url;
    heading.append(titleLink);
    const summary = createElement("p", "", post.summary);
    body.append(createMeta(post), heading, summary, createReadLink(post));
    card.append(createMedia(post), body);
    return card;
  }

  function renderMessage(className, message) {
    const item = createElement("div", className, message);
    item.setAttribute("role", className === "blog-error" ? "alert" : "status");
    els.list.replaceChildren(item);
  }

  function selectedCategoryFromUrl() {
    const requested = new URLSearchParams(window.location.search).get("category");
    return requested && ALLOWED_CATEGORIES.has(requested) ? requested : "";
  }

  function syncUrl(category) {
    const url = new URL(window.location.href);
    if (category) url.searchParams.set("category", category);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function applyFilters({ updateUrl = true } = {}) {
    const query = safeText(els.search?.value).toLocaleLowerCase("en");
    const category = safeText(els.category?.value);
    if (updateUrl) syncUrl(category);

    const filtered = posts.filter(post => {
      const haystack = [post.title, post.summary, post.category, ...post.tags].join(" ").toLocaleLowerCase("en");
      return (!query || haystack.includes(query)) && (!category || post.category === category);
    });

    const featured = filtered.find(post => post.featured) || filtered[0] || null;
    renderFeatured(featured);

    const remaining = featured ? filtered.filter(post => post.id !== featured.id) : filtered;
    if (!remaining.length) {
      if (!filtered.length) {
        renderMessage("blog-empty", "No posts match this search yet. Try another keyword or category.");
      } else {
        renderMessage("blog-empty", "That is the only matching post right now. More posts are coming soon.");
      }
    } else {
      els.list.replaceChildren(...remaining.map(renderCard));
    }

    const suffix = filtered.length === 1 ? "post" : "posts";
    els.status.textContent = `${filtered.length} ${suffix} shown${category ? ` in ${category}` : ""}${query ? ` for “${safeText(els.search?.value)}”` : ""}.`;
  }

  function updateSummary() {
    if (els.count) els.count.textContent = String(posts.length);
    if (els.newest) els.newest.textContent = posts[0] ? formatDate(posts[0].date) : "No posts yet";
  }

  async function loadPosts() {
    renderMessage("blog-loading", "Loading the latest posts…");
    els.status.textContent = "Loading posts…";

    try {
      const response = await fetch(DATA_URL, {
        cache: "no-cache",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload)) throw new Error("Blog index must be an array");

      posts = payload
        .map(normalizePost)
        .filter(Boolean)
        .sort((a, b) => b.dateValue - a.dateValue || a.title.localeCompare(b.title));

      const initialCategory = selectedCategoryFromUrl();
      if (els.category && initialCategory) els.category.value = initialCategory;
      updateSummary();
      applyFilters({ updateUrl: false });
    } catch (error) {
      console.error("POLY PMNA blog index failed to load:", error);
      els.featured.hidden = true;
      renderMessage("blog-error", "The blog list could not be loaded right now. Please refresh the page or try again later.");
      els.status.textContent = "Blog catalogue unavailable.";
    }
  }

  els.search?.addEventListener("input", () => applyFilters());
  els.category?.addEventListener("change", () => applyFilters());

  loadPosts();
})();
