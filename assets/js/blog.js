/* POLY PMNA Blog & GK catalogue.
   Sources: static starter index + published Supabase posts.
   Rendering uses DOM/textContent APIs instead of metadata HTML injection. */
(() => {
  "use strict";

  const STATIC_DATA_URL = "/data/blog-index.json";
  const SUPABASE_URL = "https://hwobooljdvynsajtrvnk.supabase.co";
  const SUPABASE_KEY = "sb_publishable_D8iv2EsMjr3VBzoDXkI7-w_1rWobLMD";
  const ALLOWED_CATEGORIES = new Set(["Study Topics","General Knowledge","Daily Blogs","Exam Tips","Announcements"]);

  const els = {
    search: document.getElementById("blog-search"), category: document.getElementById("blog-category"), featured: document.getElementById("blog-featured"),
    list: document.getElementById("blog-list"), status: document.getElementById("blog-status"), count: document.getElementById("blog-post-count"), newest: document.getElementById("blog-newest-date")
  };
  if (!els.featured || !els.list || !els.status) return;

  let posts = [];
  const safeText = value => typeof value === "string" ? value.trim() : "";

  function safeMediaUrl(value) {
    const raw = safeText(value); if (!raw) return "";
    try {
      const url = new URL(raw, location.origin);
      if (!["http:","https:"].includes(url.protocol)) return "";
      if (url.origin === location.origin || url.origin === SUPABASE_URL) return url.href;
      return "";
    } catch (_) { return ""; }
  }

  function safeSameOriginPath(value) {
    const raw = safeText(value); if (!raw) return "";
    try { const url = new URL(raw, location.origin); return url.origin === location.origin ? `${url.pathname}${url.search}${url.hash}` : ""; }
    catch (_) { return ""; }
  }

  function dateInfo(value) {
    const raw = safeText(value); if (!raw) return null;
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00Z`) : new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : { value: parsed.getTime(), iso: parsed.toISOString() };
  }

  function normalizePost(raw, index) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const title = safeText(raw.title), summary = safeText(raw.summary);
    const category = ALLOWED_CATEGORIES.has(raw.category) ? raw.category : "Announcements";
    const dynamic = !!raw.content_html;
    const slug = safeText(raw.slug);
    const url = dynamic && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? `/blog/post.html?slug=${encodeURIComponent(slug)}` : safeSameOriginPath(raw.url);
    const date = dateInfo(raw.published_at || raw.date);
    if (!title || !summary || !url || !date) return null;
    return {
      id: safeText(raw.id) || `post-${index + 1}`,
      slug,
      title, summary, category, url,
      date: raw.date || date.iso,
      dateValue: date.value,
      thumbnail: safeMediaUrl(raw.cover_url || raw.thumbnail),
      thumbnailAlt: safeText(raw.cover_alt || raw.thumbnailAlt) || title,
      featured: raw.featured === true,
      tags: Array.isArray(raw.tags) ? raw.tags.map(safeText).filter(Boolean).slice(0, 12) : []
    };
  }

  function formatDate(value) {
    const info = dateInfo(value); if (!info) return value;
    return new Intl.DateTimeFormat("en-IN", { day:"numeric", month:"short", year:"numeric", timeZone:"UTC" }).format(new Date(info.value));
  }

  function createElement(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (typeof text === "string") node.textContent = text; return node; }

  function createMedia(post, featured = false) {
    const media = createElement("div", featured ? "blog-featured-media" : "blog-card-media");
    if (post.thumbnail) { const image = document.createElement("img"); image.src = post.thumbnail; image.alt = post.thumbnailAlt; image.loading = featured ? "eager" : "lazy"; image.decoding = "async"; media.append(image); return media; }
    const mark = createElement("span", "blog-media-mark", post.category === "General Knowledge" ? "GK" : "P"); mark.setAttribute("aria-hidden", "true"); media.append(mark); return media;
  }

  function createMeta(post) {
    const row = createElement("div", "blog-meta-row"); const category = createElement("span", "blog-category-pill", post.category); const date = document.createElement("time");
    date.dateTime = post.date; date.textContent = formatDate(post.date); row.append(category, date); return row;
  }

  function createReadLink(post, label = "Read article") { const link = createElement("a", "blog-read-link", label); link.href = post.url; link.setAttribute("aria-label", `${label}: ${post.title}`); const arrow = createElement("span", "", "→"); arrow.setAttribute("aria-hidden", "true"); link.append(arrow); return link; }

  function renderFeatured(post) {
    els.featured.replaceChildren(); if (!post) { els.featured.hidden = true; return; }
    const card = createElement("article", "blog-featured-card"), copy = createElement("div", "blog-featured-copy"), heading = createElement("h2", "", post.title), summary = createElement("p", "", post.summary);
    copy.append(createMeta(post), heading, summary, createReadLink(post, "Read featured post")); card.append(createMedia(post, true), copy); els.featured.append(card); els.featured.hidden = false;
  }

  function renderCard(post) {
    const card = createElement("article", "blog-card"), body = createElement("div", "blog-card-body"), heading = createElement("h3"), titleLink = createElement("a", "blog-card-title-link", post.title);
    titleLink.href = post.url; heading.append(titleLink); body.append(createMeta(post), heading, createElement("p", "", post.summary), createReadLink(post)); card.append(createMedia(post), body); return card;
  }

  function renderMessage(className, message) { const item = createElement("div", className, message); item.setAttribute("role", className === "blog-error" ? "alert" : "status"); els.list.replaceChildren(item); }
  function selectedCategoryFromUrl() { const requested = new URLSearchParams(location.search).get("category"); return requested && ALLOWED_CATEGORIES.has(requested) ? requested : ""; }
  function syncUrl(category) { const url = new URL(location.href); category ? url.searchParams.set("category", category) : url.searchParams.delete("category"); history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`); }

  function applyFilters({ updateUrl = true } = {}) {
    const query = safeText(els.search?.value).toLocaleLowerCase("en"), category = safeText(els.category?.value); if (updateUrl) syncUrl(category);
    const filtered = posts.filter(post => { const haystack = [post.title, post.summary, post.category, ...post.tags].join(" ").toLocaleLowerCase("en"); return (!query || haystack.includes(query)) && (!category || post.category === category); });
    const featured = filtered.find(post => post.featured) || filtered[0] || null; renderFeatured(featured);
    const remaining = featured ? filtered.filter(post => post.id !== featured.id) : filtered;
    if (!remaining.length) renderMessage("blog-empty", !filtered.length ? "No posts match this search yet. Try another keyword or category." : "That is the only matching post right now. More posts are coming soon.");
    else els.list.replaceChildren(...remaining.map(renderCard));
    const suffix = filtered.length === 1 ? "post" : "posts"; els.status.textContent = `${filtered.length} ${suffix} shown${category ? ` in ${category}` : ""}${query ? ` for “${safeText(els.search?.value)}”` : ""}.`;
  }

  function updateSummary() { if (els.count) els.count.textContent = String(posts.length); if (els.newest) els.newest.textContent = posts[0] ? formatDate(posts[0].date) : "No posts yet"; }

  async function loadStaticPosts() {
    const response = await fetch(STATIC_DATA_URL, { cache:"no-cache", headers:{ Accept:"application/json" } });
    if (!response.ok) throw new Error(`Static index HTTP ${response.status}`); const payload = await response.json(); if (!Array.isArray(payload)) throw new Error("Blog index must be an array"); return payload;
  }

  async function loadPublishedPosts() {
    const query = new URLSearchParams({ status:"eq.published", select:"id,slug,title,category,summary,content_html,cover_url,cover_alt,tags,featured,published_at", order:"published_at.desc" });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?${query}`, { cache:"no-store", headers:{ apikey:SUPABASE_KEY, Accept:"application/json" } });
    if (!response.ok) throw new Error(`Published posts HTTP ${response.status}`); return response.json();
  }

  async function loadPosts() {
    renderMessage("blog-loading", "Loading the latest posts…"); els.status.textContent = "Loading posts…";
    const [staticResult, liveResult] = await Promise.allSettled([loadStaticPosts(), loadPublishedPosts()]);
    const raw = [...(staticResult.status === "fulfilled" ? staticResult.value : []), ...(liveResult.status === "fulfilled" ? liveResult.value : [])];
    if (!raw.length && staticResult.status === "rejected" && liveResult.status === "rejected") {
      console.error("POLY PMNA blog sources failed:", staticResult.reason, liveResult.reason); els.featured.hidden = true; renderMessage("blog-error", "The blog list could not be loaded right now. Please refresh the page or try again later."); els.status.textContent = "Blog catalogue unavailable."; return;
    }
    const byKey = new Map(); raw.map(normalizePost).filter(Boolean).forEach(post => byKey.set(post.slug || post.id, post));
    posts = [...byKey.values()].sort((a,b) => b.dateValue - a.dateValue || a.title.localeCompare(b.title));
    const initialCategory = selectedCategoryFromUrl(); if (els.category && initialCategory) els.category.value = initialCategory; updateSummary(); applyFilters({ updateUrl:false });
  }

  els.search?.addEventListener("input", () => applyFilters()); els.category?.addEventListener("change", () => applyFilters()); loadPosts();
})();
