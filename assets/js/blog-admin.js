(() => {
  "use strict";

  const cfg = window.POLY_BLOG_CONFIG;
  if (!cfg) return;

  const $ = id => document.getElementById(id);
  const els = {
    loginPanel: $("login-panel"), loginForm: $("login-form"), loginStatus: $("login-status"),
    publisher: $("publisher"), identity: $("admin-identity"), logout: $("logout"), newPost: $("new-post"), refresh: $("refresh-posts"),
    list: $("post-list"), count: $("post-count"), search: $("post-search"), statusFilter: $("post-status-filter"), categoryFilter: $("post-category-filter"),
    statTotal: $("stat-total"), statPublished: $("stat-published"), statDrafts: $("stat-drafts"), statFeatured: $("stat-featured"),
    form: $("post-form"), editorHeading: $("editor-heading"), state: $("editor-state"), dirtyState: $("dirty-state"),
    id: $("post-id"), title: $("post-title"), slug: $("post-slug"), category: $("post-category"), tags: $("post-tags"), summary: $("post-summary"),
    content: $("post-content"), cover: $("cover-image"), coverAlt: $("cover-alt"), coverCurrent: $("cover-current"), coverPreview: $("cover-preview"), coverPlaceholder: $("cover-placeholder"), removeCover: $("remove-cover"),
    featured: $("post-featured"), author: $("post-author"), language: $("post-language"), seoTitle: $("post-seo-title"), seoDescription: $("post-seo-description"), sourceLabel: $("post-source-label"), sourceUrl: $("post-source-url"),
    titleCount: $("title-count"), summaryCount: $("summary-count"), seoTitleCount: $("seo-title-count"), seoDescriptionCount: $("seo-description-count"),
    wordCount: $("word-count"), charCount: $("char-count"), readTime: $("read-time"), autosaveStatus: $("autosave-status"),
    preview: $("preview-post"), saveDraft: $("save-draft"), publish: $("publish-post"), unpublish: $("unpublish-post"), remove: $("delete-post"), editorStatus: $("editor-status"),
    htmlToggle: $("toggle-html-source"), htmlSource: $("post-html-source"), fontName: $("font-name"), fontSize: $("font-size"), fontColor: $("font-color"), insertTable: $("insert-table"), previewDialog: $("preview-dialog"), previewContent: $("preview-content"), addLink: $("add-link"), highlightText: $("highlight-text"),
    recoveryPanel: $("recovery-panel"), restoreRecovery: $("restore-recovery"), discardRecovery: $("discard-recovery")
  };

  let session = null;
  let posts = [];
  let currentPost = null;
  let slugTouched = false;
  let coverRemoved = false;
  let previewObjectUrl = "";
  let dirty = false;
  let recoveryTimer = null;
  let htmlMode = false;

  const RECOVERY_KEY = "poly_blog_admin_recovery_v2";
  const categories = new Set(["Study Topics", "General Knowledge", "Daily Blogs", "Exam Tips", "Announcements"]);
  const allowedTags = new Set(["P", "H2", "H3", "H4", "UL", "OL", "LI", "STRONG", "B", "EM", "I", "U", "S", "BLOCKQUOTE", "A", "BR", "HR", "PRE", "CODE", "MARK", "SPAN", "FONT", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD"]);
  const alignableTags = new Set(["P", "H2", "H3", "H4", "BLOCKQUOTE", "PRE"]);

  const setStatus = (el, message, type = "") => {
    el.textContent = message;
    el.className = `admin-status${type ? ` ${type}` : ""}`;
  };

  const slugify = value => String(value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);
  const tagsFromInput = value => [...new Set(String(value || "").split(",").map(v => v.trim()).filter(Boolean))].slice(0, 12);
  const authHeaders = (extra = {}) => ({ apikey: cfg.publishableKey, Authorization: `Bearer ${session.access_token}`, ...extra });
  const safeText = value => typeof value === "string" ? value.trim() : "";

  async function api(path, options = {}) {
    const response = await fetch(`${cfg.supabaseUrl}${path}`, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } });
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const data = await response.json();
        message = data.message || data.error_description || data.error || message;
      } catch (_) {}
      throw new Error(message);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

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
        const clean = document.createElement(child.tagName === "FONT" ? "span" : child.tagName.toLowerCase());
        if (child.tagName === "FONT") {
          const face = (child.getAttribute("face") || "").replace(/[^a-zA-Z0-9 ,_-]/g, "").trim();
          const color = (child.getAttribute("color") || "").trim();
          const size = (child.getAttribute("size") || "").trim();
          if (face) clean.style.fontFamily = face;
          if (/^#[0-9a-f]{6}$/i.test(color)) clean.style.color = color;
          if (/^[1-7]$/.test(size)) clean.style.fontSize = ({"1":".75rem","2":"1rem","3":"1.15rem","4":"1.35rem","5":"1.6rem","6":"2rem","7":"2.5rem"})[size];
        }
        if (child.tagName === "SPAN") {
          const sourceStyle = child.getAttribute("style") || "";
          const safeStyle = sourceStyle.split(";").map(part => part.trim()).filter(Boolean).map(part => {
            const [property, ...rest] = part.split(":");
            const value = rest.join(":").trim();
            const key = property.trim().toLowerCase();
            if (!["color", "background-color", "font-family", "font-size", "font-weight", "font-style", "text-decoration"].includes(key)) return "";
            if (!value || /url\s*\(|expression\s*\(|javascript:/i.test(value)) return "";
            return `${key}:${value.replace(/[<>]/g, "")}`;
          }).filter(Boolean).join(";");
          if (safeStyle) clean.setAttribute("style", safeStyle);
        }
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

  function syncHtmlSourceToVisual() {
    if (!htmlMode) return;
    els.content.innerHTML = sanitizeHtml(els.htmlSource.value);
  }
  function toggleHtmlMode() {
    if (htmlMode) {
      syncHtmlSourceToVisual();
      els.htmlSource.hidden = true;
      els.content.hidden = false;
      els.htmlToggle.textContent = "HTML";
      els.htmlToggle.classList.remove("active");
      htmlMode = false;
      markDirty();
    } else {
      els.htmlSource.value = sanitizeHtml(els.content.innerHTML);
      els.content.hidden = true;
      els.htmlSource.hidden = false;
      els.htmlToggle.textContent = "Visual";
      els.htmlToggle.classList.add("active");
      htmlMode = true;
      els.htmlSource.focus();
    }
  }

  function markDirty() {
    dirty = true;
    els.dirtyState.textContent = "Unsaved changes";
    els.dirtyState.classList.add("unsaved");
    scheduleRecovery();
    updateMetrics();
  }

  function markSaved() {
    dirty = false;
    els.dirtyState.textContent = "All changes saved";
    els.dirtyState.classList.remove("unsaved");
  }

  function updateMetrics() {
    const text = (els.content.innerText || "").replace(/\s+/g, " ").trim();
    const words = text ? text.split(" ").filter(Boolean).length : 0;
    els.wordCount.textContent = String(words);
    els.charCount.textContent = String(text.length);
    els.readTime.textContent = String(words ? Math.max(1, Math.ceil(words / 200)) : 0);
    els.titleCount.textContent = `${els.title.value.length}/160`;
    els.summaryCount.textContent = `${els.summary.value.length}/500`;
    els.seoTitleCount.textContent = `${els.seoTitle.value.length}/70`;
    els.seoDescriptionCount.textContent = `${els.seoDescription.value.length}/180`;
  }

  function snapshotEditor() {
    return {
      savedAt: Date.now(),
      id: els.id.value || null,
      title: els.title.value,
      slug: els.slug.value,
      category: els.category.value,
      tags: els.tags.value,
      summary: els.summary.value,
      content_html: sanitizeHtml(els.content.innerHTML),
      cover_alt: els.coverAlt.value,
      featured: els.featured.checked,
      author_name: els.author.value,
      content_language: els.language.value,
      seo_title: els.seoTitle.value,
      seo_description: els.seoDescription.value,
      source_label: els.sourceLabel.value,
      source_url: els.sourceUrl.value
    };
  }

  function scheduleRecovery() {
    clearTimeout(recoveryTimer);
    recoveryTimer = setTimeout(() => {
      try {
        const snapshot = snapshotEditor();
        if (snapshot.title.trim() || els.content.innerText.trim()) {
          localStorage.setItem(RECOVERY_KEY, JSON.stringify(snapshot));
          els.autosaveStatus.textContent = "Recovered locally just now";
        }
      } catch (_) {}
    }, 700);
  }

  function recoverySnapshot() {
    try {
      const data = JSON.parse(localStorage.getItem(RECOVERY_KEY) || "null");
      return data && typeof data === "object" ? data : null;
    } catch (_) {
      return null;
    }
  }

  function maybeShowRecovery() {
    const data = recoverySnapshot();
    const meaningful = data && (safeText(data.title) || safeText(data.content_html));
    els.recoveryPanel.hidden = !meaningful;
  }

  function clearRecovery() {
    localStorage.removeItem(RECOVERY_KEY);
    els.recoveryPanel.hidden = true;
    els.autosaveStatus.textContent = "Local recovery ready";
  }

  function applySnapshot(data) {
    if (!data) return;
    els.id.value = data.id || "";
    els.title.value = data.title || "";
    els.slug.value = data.slug || "";
    els.category.value = categories.has(data.category) ? data.category : "Study Topics";
    els.tags.value = data.tags || "";
    els.summary.value = data.summary || "";
    els.content.innerHTML = sanitizeHtml(data.content_html || "");
    els.coverAlt.value = data.cover_alt || "";
    els.featured.checked = !!data.featured;
    els.author.value = data.author_name || "POLY PMNA";
    els.language.value = ["en", "ml", "mixed"].includes(data.content_language) ? data.content_language : "en";
    els.seoTitle.value = data.seo_title || "";
    els.seoDescription.value = data.seo_description || "";
    els.sourceLabel.value = data.source_label || "";
    els.sourceUrl.value = data.source_url || "";
    slugTouched = !!els.slug.value;
    markDirty();
  }

  async function login(email, password) {
    const response = await fetch(`${cfg.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: cfg.publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok || !data.access_token || !data.user) throw new Error(data.error_description || data.msg || "Login failed");
    session = data;
    const profile = await api(`/rest/v1/profiles?id=eq.${encodeURIComponent(data.user.id)}&select=username,role`);
    if (!profile?.[0] || profile[0].role !== "admin") {
      session = null;
      throw new Error("This account is not an admin account.");
    }
    session.profile = profile[0];
    sessionStorage.setItem("poly_blog_admin_session", JSON.stringify(session));
    showPublisher();
  }

  async function restoreSession() {
    try {
      const stored = JSON.parse(sessionStorage.getItem("poly_blog_admin_session") || "null");
      if (!stored?.access_token || !stored?.user?.id) return;
      session = stored;
      const profile = await api(`/rest/v1/profiles?id=eq.${encodeURIComponent(stored.user.id)}&select=username,role`);
      if (!profile?.[0] || profile[0].role !== "admin") throw new Error("Not admin");
      session.profile = profile[0];
      showPublisher();
    } catch (_) {
      session = null;
      sessionStorage.removeItem("poly_blog_admin_session");
    }
  }

  function showPublisher() {
    els.loginPanel.hidden = true;
    els.publisher.hidden = false;
    els.identity.textContent = session.profile?.username || session.user?.email || "Admin";
    loadPosts();
    maybeShowRecovery();
    updateMetrics();
  }

  function revokePreviewUrl() {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = "";
  }

  function showCoverPreview(src) {
    if (src) {
      els.coverPreview.src = src;
      els.coverPreview.hidden = false;
      els.coverPlaceholder.hidden = true;
    } else {
      els.coverPreview.removeAttribute("src");
      els.coverPreview.hidden = true;
      els.coverPlaceholder.hidden = false;
    }
  }

  function resetEditor({ focus = true } = {}) {
    currentPost = null;
    slugTouched = false;
    coverRemoved = false;
    if (htmlMode) toggleHtmlMode();
    revokePreviewUrl();
    els.form.reset();
    els.id.value = "";
    els.content.innerHTML = "";
    els.htmlSource.value = "";
    els.coverCurrent.textContent = "";
    els.author.value = "POLY PMNA";
    els.language.value = "en";
    showCoverPreview("");
    els.editorHeading.textContent = "New post";
    els.state.textContent = "Draft";
    els.state.className = "state-pill";
    els.unpublish.hidden = true;
    els.remove.hidden = true;
    setStatus(els.editorStatus, "");
    [...els.list.querySelectorAll(".post-list-item")].forEach(x => x.classList.remove("active"));
    markSaved();
    updateMetrics();
    if (focus) els.title.focus();
  }

  function renderStats() {
    els.statTotal.textContent = String(posts.length);
    els.statPublished.textContent = String(posts.filter(p => p.status === "published").length);
    els.statDrafts.textContent = String(posts.filter(p => p.status === "draft").length);
    els.statFeatured.textContent = String(posts.filter(p => p.featured).length);
  }

  function renderPosts() {
    const q = els.search.value.trim().toLowerCase();
    const status = els.statusFilter.value;
    const category = els.categoryFilter.value;
    const shown = posts.filter(p => {
      const haystack = [p.title, p.category, p.slug, ...(p.tags || [])].join(" ").toLowerCase();
      return (!q || haystack.includes(q)) && (!status || p.status === status) && (!category || p.category === category);
    });
    els.count.textContent = `${shown.length} ${shown.length === 1 ? "post" : "posts"}`;
    els.list.replaceChildren();
    if (!shown.length) {
      const p = document.createElement("p");
      p.textContent = "No posts found.";
      els.list.append(p);
      return;
    }
    shown.forEach(post => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "post-list-item";
      button.dataset.id = post.id;
      const copy = document.createElement("span");
      const title = document.createElement("span");
      title.className = "post-list-title";
      title.textContent = post.title;
      const meta = document.createElement("span");
      meta.className = "post-list-meta";
      meta.textContent = `${post.category} · ${new Date(post.updated_at).toLocaleDateString("en-IN")}`;
      copy.append(title, meta);
      const state = document.createElement("span");
      state.className = `status-dot ${post.status}`;
      state.textContent = post.status === "published" ? "Published · Edit available" : "Draft";
      button.append(copy, state);
      button.addEventListener("click", () => openPost(post.id));
      els.list.append(button);
    });
  }

  async function loadPosts() {
    els.list.textContent = "Loading posts…";
    try {
      posts = await api(`/rest/v1/${cfg.postsTable}?select=*&order=updated_at.desc`);
      renderStats();
      renderPosts();
    } catch (error) {
      els.list.textContent = `Could not load posts: ${error.message}`;
    }
  }

  function openPost(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    currentPost = post;
    slugTouched = true;
    coverRemoved = false;
    revokePreviewUrl();
    els.id.value = post.id;
    els.title.value = post.title;
    els.slug.value = post.slug;
    els.category.value = post.category;
    els.tags.value = (post.tags || []).join(", ");
    els.summary.value = post.summary;
    els.content.innerHTML = sanitizeHtml(post.content_html);
    els.htmlSource.value = els.content.innerHTML;
    if (htmlMode) toggleHtmlMode();
    els.coverAlt.value = post.cover_alt || "";
    els.coverCurrent.textContent = post.cover_url ? "Current cover image is saved." : "No cover image.";
    els.featured.checked = !!post.featured;
    els.author.value = post.author_name || "POLY PMNA";
    els.language.value = ["en", "ml", "mixed"].includes(post.content_language) ? post.content_language : "en";
    els.seoTitle.value = post.seo_title || "";
    els.seoDescription.value = post.seo_description || "";
    els.sourceLabel.value = post.source_label || "";
    els.sourceUrl.value = post.source_url || "";
    showCoverPreview(post.cover_url || "");
    els.editorHeading.textContent = post.title;
    els.state.textContent = post.status === "published" ? "Published" : "Draft";
    els.state.className = `state-pill${post.status === "published" ? " published" : ""}`;
    els.unpublish.hidden = post.status !== "published";
    els.remove.hidden = false;
    setStatus(els.editorStatus, "");
    [...els.list.querySelectorAll(".post-list-item")].forEach(x => x.classList.toggle("active", x.dataset.id === id));
    markSaved();
    updateMetrics();
    els.editorHeading.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validateEditor() {
    if (htmlMode) syncHtmlSourceToVisual();
    if (!els.form.reportValidity()) return false;
    const content = sanitizeHtml(els.content.innerHTML).trim();
    if (!content || !els.content.textContent.trim()) {
      setStatus(els.editorStatus, "Write some article content before saving.", "error");
      els.content.focus();
      return false;
    }
    if (!categories.has(els.category.value)) {
      setStatus(els.editorStatus, "Choose a valid category.", "error");
      return false;
    }
    if (els.sourceUrl.value.trim() && !safeHref(els.sourceUrl.value.trim())) {
      setStatus(els.editorStatus, "Source URL must be a valid http/https link.", "error");
      return false;
    }
    return true;
  }

  async function uploadCover(slug) {
    if (coverRemoved) return null;
    const file = els.cover.files?.[0];
    if (!file) return currentPost?.cover_url || null;
    if (file.size > 5 * 1024 * 1024) throw new Error("Cover image must be 5 MB or smaller.");
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) throw new Error("Use JPEG, PNG, WebP or AVIF for the cover image.");
    const ext = (file.name.split(".").pop() || "img").toLowerCase().replace(/[^a-z0-9]/g, "");
    const objectPath = `${slug}/${Date.now()}-cover.${ext}`;
    const response = await fetch(`${cfg.supabaseUrl}/storage/v1/object/${cfg.imageBucket}/${objectPath}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": file.type, "x-upsert": "false" }),
      body: file
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Image upload failed: ${body || response.status}`);
    }
    return `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.imageBucket}/${objectPath}`;
  }

  async function save(status) {
    if (!validateEditor()) return;
    setStatus(els.editorStatus, status === "published" ? "Publishing…" : "Saving draft…");
    try {
      const slug = slugify(els.slug.value || els.title.value);
      if (!slug) throw new Error("A valid URL slug is required.");
      els.slug.value = slug;
      const coverUrl = await uploadCover(slug);
      if (els.featured.checked) {
        await api(`/rest/v1/${cfg.postsTable}?featured=eq.true${currentPost?.id ? `&id=neq.${currentPost.id}` : ""}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ featured: false, updated_at: new Date().toISOString(), updated_by: session.user.id })
        });
      }
      const now = new Date().toISOString();
      if (htmlMode) syncHtmlSourceToVisual();
      const payload = {
        title: els.title.value.trim(),
        slug,
        category: els.category.value,
        summary: els.summary.value.trim(),
        content_html: sanitizeHtml(els.content.innerHTML),
        tags: tagsFromInput(els.tags.value),
        cover_url: coverUrl,
        cover_alt: els.coverAlt.value.trim() || null,
        featured: els.featured.checked,
        author_name: els.author.value.trim() || "POLY PMNA",
        content_language: els.language.value,
        seo_title: els.seoTitle.value.trim() || null,
        seo_description: els.seoDescription.value.trim() || null,
        source_label: els.sourceLabel.value.trim() || null,
        source_url: els.sourceUrl.value.trim() ? safeHref(els.sourceUrl.value.trim()) : null,
        status,
        published_at: status === "published" ? (currentPost?.published_at || now) : currentPost?.published_at || null,
        updated_at: now,
        updated_by: session.user.id
      };
      let saved;
      if (currentPost?.id) {
        saved = await api(`/rest/v1/${cfg.postsTable}?id=eq.${encodeURIComponent(currentPost.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(payload)
        });
      } else {
        payload.created_by = session.user.id;
        saved = await api(`/rest/v1/${cfg.postsTable}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(payload)
        });
      }
      currentPost = saved?.[0] || currentPost;
      els.cover.value = "";
      coverRemoved = false;
      clearRecovery();
      markSaved();
      setStatus(els.editorStatus, status === "published" ? "Published successfully." : "Draft saved.", "success");
      await loadPosts();
      if (currentPost?.id) openPost(currentPost.id);
    } catch (error) {
      setStatus(els.editorStatus, error.message, "error");
    }
  }

  async function unpublish() {
    if (!currentPost?.id || !confirm("Unpublish this post? It will disappear from the public blog but remain editable here.")) return;
    try {
      await api(`/rest/v1/${cfg.postsTable}?id=eq.${currentPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ status: "draft", featured: false, updated_at: new Date().toISOString(), updated_by: session.user.id })
      });
      await loadPosts();
      openPost(currentPost.id);
      setStatus(els.editorStatus, "Post unpublished and kept as a draft.", "success");
    } catch (error) {
      setStatus(els.editorStatus, error.message, "error");
    }
  }

  async function removePost() {
    if (!currentPost?.id || !confirm(`Delete “${currentPost.title}” permanently?`)) return;
    try {
      await api(`/rest/v1/${cfg.postsTable}?id=eq.${currentPost.id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
      clearRecovery();
      resetEditor();
      await loadPosts();
    } catch (error) {
      setStatus(els.editorStatus, error.message, "error");
    }
  }

  function preview() {
    if (!validateEditor()) return;
    els.previewContent.replaceChildren();
    const header = document.createElement("header");
    header.className = "blog-article-header";
    const meta = document.createElement("div");
    meta.className = "blog-meta-row";
    const category = document.createElement("span");
    category.className = "blog-category-pill";
    category.textContent = els.category.value;
    const date = document.createElement("span");
    date.textContent = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    meta.append(category, date);
    const h1 = document.createElement("h1");
    h1.textContent = els.title.value.trim() || "Untitled post";
    const deck = document.createElement("p");
    deck.className = "blog-article-deck";
    deck.textContent = els.summary.value.trim();
    header.append(meta, h1, deck);
    const coverSrc = els.coverPreview.hidden ? "" : els.coverPreview.src;
    if (coverSrc) {
      const image = document.createElement("img");
      image.className = "preview-cover";
      image.src = coverSrc;
      image.alt = els.coverAlt.value.trim() || h1.textContent;
      header.append(image);
    }
    const body = document.createElement("div");
    body.className = "blog-article-content";
    body.innerHTML = sanitizeHtml(els.content.innerHTML);
    els.previewContent.append(header, body);
    els.previewDialog.showModal();
  }

  function currentBlock() {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return null;
    let node = selection.anchorNode;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
    while (node && node !== els.content) {
      if (node.nodeType === Node.ELEMENT_NODE && alignableTags.has(node.tagName)) return node;
      node = node.parentElement;
    }
    return null;
  }

  function alignCurrentBlock(value) {
    els.content.focus();
    let block = currentBlock();
    if (!block) {
      document.execCommand("formatBlock", false, "p");
      block = currentBlock();
    }
    if (block) block.dataset.align = value;
    markDirty();
  }

  function wrapSelection(tagName) {
    els.content.focus();
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!els.content.contains(range.commonAncestorContainer)) return;
    const wrapper = document.createElement(tagName);
    try {
      range.surroundContents(wrapper);
    } catch (_) {
      const fragment = range.extractContents();
      wrapper.append(fragment);
      range.insertNode(wrapper);
    }
    selection.removeAllRanges();
    const after = document.createRange();
    after.selectNodeContents(wrapper);
    selection.addRange(after);
    markDirty();
  }

  function handleCoverSelection() {
    const file = els.cover.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Cover image must be 5 MB or smaller.");
      els.cover.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      alert("Use JPEG, PNG, WebP or AVIF for the cover image.");
      els.cover.value = "";
      return;
    }
    revokePreviewUrl();
    previewObjectUrl = URL.createObjectURL(file);
    coverRemoved = false;
    showCoverPreview(previewObjectUrl);
    els.coverCurrent.textContent = `Selected: ${file.name}`;
    markDirty();
  }

  els.loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    setStatus(els.loginStatus, "Signing in…");
    try {
      await login($("admin-email").value.trim(), $("admin-password").value);
      setStatus(els.loginStatus, "");
    } catch (error) {
      setStatus(els.loginStatus, error.message, "error");
    }
  });

  els.logout.addEventListener("click", () => {
    sessionStorage.removeItem("poly_blog_admin_session");
    session = null;
    location.reload();
  });

  els.newPost.addEventListener("click", () => resetEditor());
  els.refresh.addEventListener("click", loadPosts);
  els.search.addEventListener("input", renderPosts);
  els.statusFilter.addEventListener("change", renderPosts);
  els.categoryFilter.addEventListener("change", renderPosts);
  els.title.addEventListener("input", () => {
    if (!slugTouched) els.slug.value = slugify(els.title.value);
    markDirty();
  });
  els.slug.addEventListener("input", () => {
    slugTouched = true;
    els.slug.value = slugify(els.slug.value);
    markDirty();
  });

  [els.category, els.tags, els.summary, els.coverAlt, els.featured, els.author, els.language, els.seoTitle, els.seoDescription, els.sourceLabel, els.sourceUrl].forEach(el => {
    el.addEventListener("input", markDirty);
    el.addEventListener("change", markDirty);
  });

  document.querySelectorAll(".rich-toolbar [data-command]").forEach(button => button.addEventListener("click", () => {
    els.content.focus();
    document.execCommand(button.dataset.command, false, null);
    markDirty();
  }));

  document.querySelectorAll(".rich-toolbar [data-block]").forEach(button => button.addEventListener("click", () => {
    els.content.focus();
    document.execCommand("formatBlock", false, button.dataset.block);
    markDirty();
  }));

  document.querySelectorAll(".rich-toolbar [data-align]").forEach(button => button.addEventListener("click", () => alignCurrentBlock(button.dataset.align)));

  els.addLink.addEventListener("click", () => {
    const href = prompt("Paste the link URL:");
    if (!href) return;
    const safe = safeHref(href);
    if (!safe) return alert("Please enter a valid http/https URL.");
    els.content.focus();
    document.execCommand("createLink", false, safe);
    markDirty();
  });

  els.highlightText.addEventListener("click", () => wrapSelection("mark"));
  function applyFont(command, value) {
    els.content.focus();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value);
    markDirty();
  }
  els.fontName.addEventListener("change", () => applyFont("fontName", els.fontName.value));
  els.fontSize.addEventListener("change", () => applyFont("fontSize", els.fontSize.value));
  els.fontColor.addEventListener("input", () => applyFont("foreColor", els.fontColor.value));
  els.insertTable.addEventListener("click", () => {
    els.content.focus();
    document.execCommand("insertHTML", false, "<table><thead><tr><th>Heading 1</th><th>Heading 2</th><th>Heading 3</th></tr></thead><tbody><tr><td>Cell</td><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td><td>Cell</td></tr></tbody></table><p><br></p>");
    markDirty();
  });
  els.preview.addEventListener("click", preview);
  els.saveDraft.addEventListener("click", () => save("draft"));
  els.publish.addEventListener("click", () => save("published"));
  els.unpublish.addEventListener("click", unpublish);
  els.remove.addEventListener("click", removePost);
  els.cover.addEventListener("change", handleCoverSelection);
  els.removeCover.addEventListener("click", () => {
    coverRemoved = true;
    els.cover.value = "";
    revokePreviewUrl();
    showCoverPreview("");
    els.coverCurrent.textContent = "Cover will be removed when you save.";
    markDirty();
  });

  els.content.addEventListener("input", () => { markDirty(); if (!htmlMode) els.htmlSource.value = sanitizeHtml(els.content.innerHTML); });
  els.htmlSource.addEventListener("input", markDirty);
  els.htmlToggle.addEventListener("click", toggleHtmlMode);
  els.content.addEventListener("paste", event => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    markDirty();
  });

  els.restoreRecovery.addEventListener("click", () => {
    const data = recoverySnapshot();
    resetEditor({ focus: false });
    applySnapshot(data);
    els.recoveryPanel.hidden = true;
    setStatus(els.editorStatus, "Recovered your unsaved local draft.", "success");
  });

  els.discardRecovery.addEventListener("click", clearRecovery);

  window.addEventListener("beforeunload", event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  restoreSession();
})();
