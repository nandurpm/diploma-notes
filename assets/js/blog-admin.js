(() => {
  "use strict";

  const cfg = window.POLY_BLOG_CONFIG;
  if (!cfg) return;

  const $ = id => document.getElementById(id);
  const els = {
    loginPanel: $("login-panel"), loginForm: $("login-form"), loginStatus: $("login-status"),
    publisher: $("publisher"), identity: $("admin-identity"), logout: $("logout"), newPost: $("new-post"), refresh: $("refresh-posts"),
    list: $("post-list"), count: $("post-count"), search: $("post-search"), form: $("post-form"), editorHeading: $("editor-heading"), state: $("editor-state"),
    id: $("post-id"), title: $("post-title"), slug: $("post-slug"), category: $("post-category"), tags: $("post-tags"), summary: $("post-summary"),
    content: $("post-content"), cover: $("cover-image"), coverAlt: $("cover-alt"), coverCurrent: $("cover-current"), featured: $("post-featured"),
    preview: $("preview-post"), saveDraft: $("save-draft"), publish: $("publish-post"), unpublish: $("unpublish-post"), remove: $("delete-post"), editorStatus: $("editor-status"),
    previewDialog: $("preview-dialog"), previewContent: $("preview-content"), addLink: $("add-link")
  };

  let session = null;
  let posts = [];
  let currentPost = null;
  let slugTouched = false;

  const categories = new Set(["Study Topics","General Knowledge","Daily Blogs","Exam Tips","Announcements"]);
  const allowedTags = new Set(["P","H2","H3","UL","OL","LI","STRONG","B","EM","I","BLOCKQUOTE","A","BR"]);

  const setStatus = (el, message, type = "") => {
    el.textContent = message;
    el.className = `admin-status${type ? ` ${type}` : ""}`;
  };

  const slugify = value => String(value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);
  const tagsFromInput = value => [...new Set(String(value || "").split(",").map(v => v.trim()).filter(Boolean))].slice(0, 12);
  const authHeaders = (extra = {}) => ({ apikey: cfg.publishableKey, Authorization: `Bearer ${session.access_token}`, ...extra });

  async function api(path, options = {}) {
    const response = await fetch(`${cfg.supabaseUrl}${path}`, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } });
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try { const data = await response.json(); message = data.message || data.error_description || data.error || message; } catch (_) {}
      throw new Error(message);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  function safeHref(raw) {
    try {
      const u = new URL(raw, location.origin);
      return ["http:","https:"].includes(u.protocol) ? u.href : "";
    } catch (_) { return ""; }
  }

  function sanitizeHtml(input) {
    const parsed = new DOMParser().parseFromString(`<div>${input || ""}</div>`, "text/html");
    const root = document.createElement("div");
    function copy(node, target) {
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) { target.append(document.createTextNode(child.textContent || "")); return; }
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        if (!allowedTags.has(child.tagName)) { copy(child, target); return; }
        const clean = document.createElement(child.tagName.toLowerCase());
        if (child.tagName === "A") {
          const href = safeHref(child.getAttribute("href") || "");
          if (href) { clean.href = href; clean.rel = "noopener noreferrer"; if (new URL(href).origin !== location.origin) clean.target = "_blank"; }
        }
        copy(child, clean); target.append(clean);
      });
    }
    copy(parsed.body.firstElementChild, root);
    return root.innerHTML;
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
    if (!profile?.[0] || profile[0].role !== "admin") { session = null; throw new Error("This account is not an admin account."); }
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
  }

  function resetEditor() {
    currentPost = null; slugTouched = false;
    els.form.reset(); els.id.value = ""; els.content.innerHTML = ""; els.coverCurrent.textContent = "";
    els.editorHeading.textContent = "New post"; els.state.textContent = "Draft"; els.state.className = "state-pill";
    els.unpublish.hidden = true; els.remove.hidden = true; setStatus(els.editorStatus, "");
    [...els.list.querySelectorAll(".post-list-item")].forEach(x => x.classList.remove("active"));
    els.title.focus();
  }

  function renderPosts() {
    const q = els.search.value.trim().toLowerCase();
    const shown = posts.filter(p => !q || [p.title,p.category,p.slug,...(p.tags || [])].join(" ").toLowerCase().includes(q));
    els.count.textContent = `${shown.length} ${shown.length === 1 ? "post" : "posts"}`;
    els.list.replaceChildren();
    if (!shown.length) { const p = document.createElement("p"); p.textContent = "No posts found."; els.list.append(p); return; }
    shown.forEach(post => {
      const button = document.createElement("button"); button.type = "button"; button.className = "post-list-item"; button.dataset.id = post.id;
      const copy = document.createElement("span"); const title = document.createElement("span"); title.className = "post-list-title"; title.textContent = post.title;
      const meta = document.createElement("span"); meta.className = "post-list-meta"; meta.textContent = `${post.category} · ${new Date(post.updated_at).toLocaleDateString("en-IN")}`;
      copy.append(title, meta);
      const state = document.createElement("span"); state.className = `status-dot ${post.status}`; state.textContent = post.status === "published" ? "Published" : "Draft";
      button.append(copy, state); button.addEventListener("click", () => openPost(post.id)); els.list.append(button);
    });
  }

  async function loadPosts() {
    els.list.textContent = "Loading posts…";
    try {
      posts = await api(`/rest/v1/${cfg.postsTable}?select=*&order=updated_at.desc`);
      renderPosts();
    } catch (error) { els.list.textContent = `Could not load posts: ${error.message}`; }
  }

  function openPost(id) {
    const post = posts.find(p => p.id === id); if (!post) return;
    currentPost = post; slugTouched = true;
    els.id.value = post.id; els.title.value = post.title; els.slug.value = post.slug; els.category.value = post.category;
    els.tags.value = (post.tags || []).join(", "); els.summary.value = post.summary; els.content.innerHTML = sanitizeHtml(post.content_html);
    els.coverAlt.value = post.cover_alt || ""; els.coverCurrent.textContent = post.cover_url ? `Current image: ${post.cover_url}` : "No cover image."; els.featured.checked = !!post.featured;
    els.editorHeading.textContent = post.title; els.state.textContent = post.status === "published" ? "Published" : "Draft"; els.state.className = `state-pill${post.status === "published" ? " published" : ""}`;
    els.unpublish.hidden = post.status !== "published"; els.remove.hidden = false; setStatus(els.editorStatus, "");
    [...els.list.querySelectorAll(".post-list-item")].forEach(x => x.classList.toggle("active", x.dataset.id === id));
    els.editorHeading.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validateEditor() {
    if (!els.form.reportValidity()) return false;
    const content = sanitizeHtml(els.content.innerHTML).trim();
    if (!content || !els.content.textContent.trim()) { setStatus(els.editorStatus, "Write some article content before saving.", "error"); els.content.focus(); return false; }
    if (!categories.has(els.category.value)) { setStatus(els.editorStatus, "Choose a valid category.", "error"); return false; }
    return true;
  }

  async function uploadCover(slug) {
    const file = els.cover.files?.[0]; if (!file) return currentPost?.cover_url || null;
    if (file.size > 5 * 1024 * 1024) throw new Error("Cover image must be 5 MB or smaller.");
    if (!["image/jpeg","image/png","image/webp","image/avif"].includes(file.type)) throw new Error("Use JPEG, PNG, WebP or AVIF for the cover image.");
    const ext = (file.name.split(".").pop() || "img").toLowerCase().replace(/[^a-z0-9]/g, "");
    const objectPath = `${slug}/${Date.now()}-cover.${ext}`;
    const response = await fetch(`${cfg.supabaseUrl}/storage/v1/object/${cfg.imageBucket}/${objectPath}`, {
      method: "POST", headers: authHeaders({ "Content-Type": file.type, "x-upsert": "false" }), body: file
    });
    if (!response.ok) { const body = await response.text(); throw new Error(`Image upload failed: ${body || response.status}`); }
    return `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.imageBucket}/${objectPath}`;
  }

  async function save(status) {
    if (!validateEditor()) return;
    setStatus(els.editorStatus, status === "published" ? "Publishing…" : "Saving draft…");
    try {
      const slug = slugify(els.slug.value || els.title.value); if (!slug) throw new Error("A valid URL slug is required."); els.slug.value = slug;
      const coverUrl = await uploadCover(slug);
      if (els.featured.checked) {
        await api(`/rest/v1/${cfg.postsTable}?featured=eq.true${currentPost?.id ? `&id=neq.${currentPost.id}` : ""}`, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ featured: false, updated_at: new Date().toISOString(), updated_by: session.user.id }) });
      }
      const now = new Date().toISOString();
      const payload = {
        title: els.title.value.trim(), slug, category: els.category.value, summary: els.summary.value.trim(), content_html: sanitizeHtml(els.content.innerHTML),
        tags: tagsFromInput(els.tags.value), cover_url: coverUrl, cover_alt: els.coverAlt.value.trim() || null, featured: els.featured.checked,
        status, published_at: status === "published" ? (currentPost?.published_at || now) : currentPost?.published_at || null,
        updated_at: now, updated_by: session.user.id
      };
      let saved;
      if (currentPost?.id) {
        saved = await api(`/rest/v1/${cfg.postsTable}?id=eq.${encodeURIComponent(currentPost.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(payload) });
      } else {
        payload.created_by = session.user.id;
        saved = await api(`/rest/v1/${cfg.postsTable}`, { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(payload) });
      }
      currentPost = saved?.[0] || currentPost; els.cover.value = "";
      setStatus(els.editorStatus, status === "published" ? "Published successfully." : "Draft saved.", "success");
      await loadPosts(); if (currentPost?.id) openPost(currentPost.id);
    } catch (error) { setStatus(els.editorStatus, error.message, "error"); }
  }

  async function unpublish() {
    if (!currentPost?.id || !confirm("Unpublish this post? It will disappear from the public blog but remain editable here.")) return;
    try {
      await api(`/rest/v1/${cfg.postsTable}?id=eq.${currentPost.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ status: "draft", featured: false, updated_at: new Date().toISOString(), updated_by: session.user.id }) });
      await loadPosts(); openPost(currentPost.id); setStatus(els.editorStatus, "Post unpublished and kept as a draft.", "success");
    } catch (error) { setStatus(els.editorStatus, error.message, "error"); }
  }

  async function removePost() {
    if (!currentPost?.id || !confirm(`Delete “${currentPost.title}” permanently?`)) return;
    try { await api(`/rest/v1/${cfg.postsTable}?id=eq.${currentPost.id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }); resetEditor(); await loadPosts(); }
    catch (error) { setStatus(els.editorStatus, error.message, "error"); }
  }

  function preview() {
    if (!validateEditor()) return;
    els.previewContent.replaceChildren();
    const header = document.createElement("header"); header.className = "blog-article-header";
    const meta = document.createElement("div"); meta.className = "blog-meta-row";
    const category = document.createElement("span"); category.className = "blog-category-pill"; category.textContent = els.category.value;
    const date = document.createElement("span"); date.textContent = new Date().toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }); meta.append(category, date);
    const h1 = document.createElement("h1"); h1.textContent = els.title.value.trim() || "Untitled post";
    const deck = document.createElement("p"); deck.className = "blog-article-deck"; deck.textContent = els.summary.value.trim(); header.append(meta, h1, deck);
    const body = document.createElement("div"); body.className = "blog-article-content"; body.innerHTML = sanitizeHtml(els.content.innerHTML);
    els.previewContent.append(header, body); els.previewDialog.showModal();
  }

  els.loginForm.addEventListener("submit", async event => {
    event.preventDefault(); setStatus(els.loginStatus, "Signing in…");
    try { await login($("admin-email").value.trim(), $("admin-password").value); setStatus(els.loginStatus, ""); }
    catch (error) { setStatus(els.loginStatus, error.message, "error"); }
  });
  els.logout.addEventListener("click", () => { sessionStorage.removeItem("poly_blog_admin_session"); session = null; location.reload(); });
  els.newPost.addEventListener("click", resetEditor); els.refresh.addEventListener("click", loadPosts); els.search.addEventListener("input", renderPosts);
  els.title.addEventListener("input", () => { if (!slugTouched) els.slug.value = slugify(els.title.value); });
  els.slug.addEventListener("input", () => { slugTouched = true; els.slug.value = slugify(els.slug.value); });
  document.querySelectorAll(".rich-toolbar [data-command]").forEach(button => button.addEventListener("click", () => { els.content.focus(); document.execCommand(button.dataset.command, false, null); }));
  document.querySelectorAll(".rich-toolbar [data-block]").forEach(button => button.addEventListener("click", () => { els.content.focus(); document.execCommand("formatBlock", false, button.dataset.block); }));
  els.addLink.addEventListener("click", () => { const href = prompt("Paste the link URL:"); if (!href) return; const safe = safeHref(href); if (!safe) return alert("Please enter a valid http/https URL."); els.content.focus(); document.execCommand("createLink", false, safe); });
  els.preview.addEventListener("click", preview); els.saveDraft.addEventListener("click", () => save("draft")); els.publish.addEventListener("click", () => save("published")); els.unpublish.addEventListener("click", unpublish); els.remove.addEventListener("click", removePost);
  els.content.addEventListener("paste", event => { event.preventDefault(); const text = event.clipboardData.getData("text/plain"); document.execCommand("insertText", false, text); });

  restoreSession();
})();
