/* Purpose: Help comments - REST-based Firebase discussion client */
const FIREBASE_API_KEY = ["AIzaSyDgdpLgYNZL_", "KQguMmCI5wZH3b11PXpWvk"].join("");
const FIRESTORE_REST_URL = "https://firestore.googleapis.com/v1/projects/diploma-notes-comments/databases/(default)/documents/helpComments";
const AUTH_REST_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
const EMAIL_TOKEN = "5a343b343e3b312f373b2837313e2a371a3d373b333674393537";
const PAGE_SIZE = 40;
const POST_COOLDOWN_MS = 60000;
const MAX_LINKS = 2;

const form = document.querySelector("#helpCommentForm");
const nameInput = document.querySelector("#commentName");
const messageInput = document.querySelector("#commentMessage");
const submitButton = document.querySelector("#commentSubmit");
const statusBox = document.querySelector("#commentStatus");
const list = document.querySelector("#commentsList");
const countBox = document.querySelector("#commentCount");

const decodeEmail = encoded => {
  const key = Number.parseInt(encoded.slice(0, 2), 16);
  let value = "";
  for (let index = 2; index < encoded.length; index += 2) {
    value += String.fromCharCode(Number.parseInt(encoded.slice(index, index + 2), 16) ^ key);
  }
  return value;
};
const protectedMailto = (subject = "POLY PMNA Help") => `mailto:${decodeEmail(EMAIL_TOKEN)}?subject=${encodeURIComponent(subject)}`;
const restValue = field => field?.stringValue ?? field?.integerValue ?? field?.timestampValue ?? field?.booleanValue ?? "";
const firestoreFields = values => Object.fromEntries(Object.entries(values).map(([key, value]) => {
  if (typeof value === "boolean") return [key, { booleanValue: value }];
  if (value instanceof Date) return [key, { timestampValue: value.toISOString() }];
  return [key, { stringValue: String(value ?? "") }];
}));
const parseComment = document => {
  const fields = document.fields || {};
  return {
    id: document.name?.split("/").pop() || "",
    pageId: restValue(fields.pageId),
    author: restValue(fields.author),
    message: restValue(fields.message),
    parentId: restValue(fields.parentId) || "",
    uid: restValue(fields.uid),
    deleted: restValue(fields.deleted) === true || restValue(fields.deleted) === "true",
    createdAt: restValue(fields.createdAt)
  };
};
const formatDate = timestamp => timestamp ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp)) : "Posting…";
const initials = name => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "S";
const savedName = () => localStorage.getItem("diplomaNotesCommentName") || "";
const lastPostAt = () => Number(localStorage.getItem("diplomaNotesLastCommentAt") || "0");
const rememberPost = message => {
  localStorage.setItem("diplomaNotesLastCommentAt", String(Date.now()));
  localStorage.setItem("diplomaNotesLastCommentText", message);
};
let currentUser = null;
let comments = [];

function setStatus(message = "", type = "") {
  statusBox.textContent = message;
  statusBox.className = `comment-status${type ? ` ${type}` : ""}`;
}
function validate(author, message, field, label) {
  if (author.length < 2 || author.length > 40) {
    nameInput.focus(); setStatus("Name must contain 2–40 characters.", "error"); return false;
  }
  if (!message || message.length > 1500) {
    field.focus(); setStatus(`${label} must contain 1–1500 characters.`, "error"); return false;
  }
  if ((message.match(/https?:\/\/|www\./gi) || []).length > MAX_LINKS) {
    setStatus("Please limit links to two per message.", "error"); return false;
  }
  if (Date.now() - lastPostAt() < POST_COOLDOWN_MS) {
    setStatus("Please wait one minute before posting again.", "error"); return false;
  }
  if (localStorage.getItem("diplomaNotesLastCommentText") === message) {
    setStatus("This duplicates your last post.", "error"); return false;
  }
  return true;
}
async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Request failed: ${response.status}`);
  return payload;
}
async function ensureAuthenticated() {
  if (currentUser?.idToken && currentUser.expiresAt > Date.now() + 60000) return currentUser;
  const payload = await requestJson(AUTH_REST_URL, { method: "POST", body: JSON.stringify({ returnSecureToken: true }) });
  currentUser = { uid: payload.localId, idToken: payload.idToken, expiresAt: Date.now() + Number(payload.expiresIn || 3600) * 1000 };
  return currentUser;
}
async function fetchComments() {
  const query = new URLSearchParams({ pageSize: String(PAGE_SIZE), orderBy: "createdAt desc" });
  const payload = await requestJson(`${FIRESTORE_REST_URL}?${query}`);
  comments = (payload.documents || []).map(parseComment).filter(item => item.pageId === "help");
  render();
}
async function createComment(values) {
  const user = await ensureAuthenticated();
  return requestJson(FIRESTORE_REST_URL, { method: "POST", headers: { Authorization: `Bearer ${user.idToken}` }, body: JSON.stringify({ fields: firestoreFields({ ...values, uid: user.uid, createdAt: new Date() }) }) });
}
async function updateComment(item) {
  const user = await ensureAuthenticated();
  const query = new URLSearchParams();
  ["author", "message", "deleted"].forEach(field => query.append("updateMask.fieldPaths", field));
  return requestJson(`${FIRESTORE_REST_URL}/${encodeURIComponent(item.id)}?${query}`, { method: "PATCH", headers: { Authorization: `Bearer ${user.idToken}` }, body: JSON.stringify({ fields: firestoreFields({ author: "Deleted", message: "This comment was deleted.", deleted: true }) }) });
}
async function deleteComment(item, isReply) {
  if (!window.confirm(isReply ? "Delete this reply?" : "Delete this comment? Existing replies will remain visible.")) return;
  try {
    const user = await ensureAuthenticated();
    if (isReply) await requestJson(`${FIRESTORE_REST_URL}/${encodeURIComponent(item.id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${user.idToken}` } });
    else await updateComment(item);
    setStatus(isReply ? "Reply deleted." : "Comment deleted.", "success");
    await fetchComments();
  } catch (error) {
    console.error("Could not delete discussion item.", error); setStatus("Could not delete this item.", "error");
  }
}
function actionButton(label, className, handler) {
  const button = document.createElement("button");
  button.type = "button"; button.className = className; button.textContent = label; button.addEventListener("click", handler); return button;
}
function addReplyForm(parent, card) {
  const existing = card.querySelector(".reply-form");
  if (existing) { existing.remove(); return; }
  const replyForm = document.createElement("form"); replyForm.className = "reply-form";
  const textarea = document.createElement("textarea"); textarea.maxLength = 1500; textarea.required = true; textarea.placeholder = "Write your reply…"; textarea.setAttribute("aria-label", "Reply message");
  const submit = document.createElement("button"); submit.type = "submit"; submit.className = "comment-submit"; submit.textContent = "Post Reply";
  replyForm.append(textarea, submit);
  replyForm.addEventListener("submit", async event => {
    event.preventDefault();
    const author = nameInput.value.trim(); const message = textarea.value.trim();
    if (!validate(author, message, textarea, "Reply")) return;
    submit.disabled = true; setStatus("Posting reply…");
    try {
      await createComment({ pageId: "help", author, message, parentId: parent.id });
      localStorage.setItem("diplomaNotesCommentName", author); rememberPost(message); replyForm.remove(); setStatus("Reply posted.", "success"); await fetchComments();
    } catch (error) { console.error("Could not post reply.", error); setStatus("Could not post the reply. Please try again.", "error"); submit.disabled = false; }
  });
  card.append(replyForm); textarea.focus();
}
function cardFor(item, isReply = false) {
  const deleted = item.deleted || item.author === "Deleted";
  const card = document.createElement("article"); card.className = `comment-card${isReply ? " reply-card" : ""}${deleted ? " deleted-comment" : ""}`;
  const meta = document.createElement("div"); meta.className = "comment-meta";
  const authorWrap = document.createElement("div"); authorWrap.className = "comment-author";
  const avatar = document.createElement("span"); avatar.className = "comment-avatar"; avatar.textContent = deleted ? "×" : initials(item.author || "Student"); avatar.setAttribute("aria-hidden", "true");
  const authorText = document.createElement("div"); const author = document.createElement("strong"); author.textContent = deleted ? "Deleted" : (item.author || "Student");
  const time = document.createElement("span"); time.className = "comment-time"; time.textContent = formatDate(item.createdAt); authorText.append(author, time); authorWrap.append(avatar, authorText); meta.append(authorWrap);
  const message = document.createElement("p"); message.className = "comment-message"; message.textContent = deleted ? "This comment was deleted." : (item.message || "");
  const actions = document.createElement("div"); actions.className = "comment-actions";
  if (!isReply && !deleted) actions.append(actionButton("Reply", "comment-action", () => addReplyForm(item, card)));
  if (currentUser?.uid === item.uid && !deleted) actions.append(actionButton("Delete", "comment-action delete", () => deleteComment(item, isReply)));
  card.append(meta, message, actions); return card;
}
function render() {
  list.replaceChildren();
  const topLevel = comments.filter(item => !item.parentId && !item.deleted);
  const replies = new Map(); comments.filter(item => item.parentId && !item.deleted).forEach(item => replies.set(item.parentId, [...(replies.get(item.parentId) || []), item]));
  countBox.textContent = `${topLevel.length} loaded ${topLevel.length === 1 ? "comment" : "comments"}`;
  if (!topLevel.length) { const empty = document.createElement("div"); empty.className = "empty-comments"; empty.textContent = "No public comments yet."; list.append(empty); return; }
  topLevel.forEach(item => { list.append(cardFor(item)); (replies.get(item.id) || []).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))).forEach(reply => list.append(cardFor(reply, true))); });
}
function showUnavailable(error) {
  console.error("Discussion service unavailable.", error);
  submitButton.disabled = true; form?.setAttribute("aria-disabled", "true"); countBox.textContent = "Unavailable"; setStatus("");
  const box = document.createElement("div"); box.className = "comment-error-box";
  const text = document.createElement("p"); text.textContent = "Discussion is currently unavailable. Use the protected email support link below.";
  const email = document.createElement("a"); email.href = protectedMailto(); email.textContent = "Email POLY PMNA"; email.rel = "nofollow";
  box.append(text, email); list.replaceChildren(box);
}
async function initializeDiscussion() {
  nameInput.value = savedName(); submitButton.disabled = true; countBox.textContent = "Loading…";
  try { await fetchComments(); submitButton.disabled = false; form?.removeAttribute("aria-disabled"); setStatus(""); }
  catch (error) { showUnavailable(error); }
}
form?.addEventListener("submit", async event => {
  event.preventDefault();
  const author = nameInput.value.trim(); const message = messageInput.value.trim();
  if (!validate(author, message, messageInput, "Comment")) return;
  submitButton.disabled = true; setStatus("Posting…");
  try { await createComment({ pageId: "help", author, message, parentId: "" }); localStorage.setItem("diplomaNotesCommentName", author); rememberPost(message); messageInput.value = ""; setStatus("Comment posted.", "success"); await fetchComments(); }
  catch (error) { console.error("Could not post comment.", error); setStatus("Could not post. Please try again later.", "error"); }
  finally { submitButton.disabled = false; }
});
if (!form || !nameInput || !messageInput || !submitButton || !statusBox || !list || !countBox) console.error("Discussion initialization failed: required Help page elements are missing.");
else initializeDiscussion();

/* Purpose: Help comments - REST-only runtime avoids third-party module loading failures. */
const refreshDiscussion = () => initializeDiscussion();
window.addEventListener("focus", () => { if (document.visibilityState === "visible") refreshDiscussion(); });
window.addEventListener("online", refreshDiscussion);
