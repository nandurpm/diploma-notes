/* Purpose: Help comments - Descriptive comment added for clarity */
const FALLBACK_MESSAGE = "Discussion is currently unavailable. Use the protected email support link below.";
const EMAIL_TOKEN = "5a343b343e3b312f373b2837313e2a371a3d373b333674393537";
const PAGE_SIZE = 40;
const POST_COOLDOWN_MS = 60000;
const MAX_LINKS = 2;

const decodeEmail = encoded => {
  const key = Number.parseInt(encoded.slice(0, 2), 16);
  let value = "";
  for (let index = 2; index < encoded.length; index += 2) {
    value += String.fromCharCode(Number.parseInt(encoded.slice(index, index + 2), 16) ^ key);
  }
  return value;
};

const form = document.querySelector("#helpCommentForm");
const nameInput = document.querySelector("#commentName");
const messageInput = document.querySelector("#commentMessage");
const submitButton = document.querySelector("#commentSubmit");
const statusBox = document.querySelector("#commentStatus");
const list = document.querySelector("#commentsList");
const countBox = document.querySelector("#commentCount");
const mainCounter = document.querySelector("#commentMessageCounter");

function updateCharCounter(textarea, counterElement, maxLen = 1500) {
  if (!textarea || !counterElement) return;
  const remaining = maxLen - textarea.value.length;
  counterElement.textContent = `${remaining} ${remaining === 1 ? "character" : "characters"} remaining`;
  if (remaining < 0) {
    counterElement.classList.add("poly-char-counter--error");
  } else {
    counterElement.classList.remove("poly-char-counter--error");
  }
}

function protectedMailto(subject = "POLY PMNA Help") {
  return `mailto:${decodeEmail(EMAIL_TOKEN)}?subject=${encodeURIComponent(subject)}`;
}

function showUnavailable(error) {
  console.error("Discussion service unavailable.", error);
  if (submitButton) submitButton.disabled = true;
  form?.setAttribute("aria-disabled", "true");
  if (countBox) countBox.textContent = "Unavailable";
  if (statusBox) statusBox.textContent = "";
  if (!list) return;

  const box = document.createElement("div");
  box.className = "comment-error-box";
  const text = document.createElement("p");
  text.textContent = FALLBACK_MESSAGE;
  const email = document.createElement("a");
  email.href = protectedMailto();
  email.textContent = "Email POLY PMNA";
  email.rel = "nofollow";
  box.append(text, email);
  list.replaceChildren(box);
}

if (!form || !nameInput || !messageInput || !submitButton || !statusBox || !list || !countBox) {
  console.error("Discussion initialization failed: required Help page elements are missing.");
} else {
  initializeDiscussion().catch(showUnavailable);
}

async function initializeDiscussion() {
  const timeout = window.setTimeout(() => showUnavailable(new Error("Discussion initialization timed out.")), 10000);
  const [appModule, authModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
  ]);

  const app = appModule.initializeApp({
    apiKey: ["AIzaSyDgdpLgYNZL_", "KQguMmCI5wZH3b11PXpWvk"].join(""),
    authDomain: "diploma-notes-comments.firebaseapp.com",
    projectId: "diploma-notes-comments",
    storageBucket: "diploma-notes-comments.firebasestorage.app",
    messagingSenderId: "613766691091",
    appId: "1:613766691091:web:65c0929ee4b7a1e5c782e6",
    measurementId: "G-BS562FBTPN"
  });

  const auth = authModule.getAuth(app);
  const db = firestoreModule.getFirestore(app);
  const commentsRef = firestoreModule.collection(db, "helpComments");
  let currentUser = auth.currentUser;
  let authPromise = null;
  let comments = [];

  const setStatus = (message = "", type = "") => {
    statusBox.textContent = message;
    statusBox.className = `comment-status${type ? ` ${type}` : ""}`;
  };

  const ensureAuthenticated = async () => {
    if (auth.currentUser) return auth.currentUser;
    if (!authPromise) {
      authPromise = authModule.signInAnonymously(auth).then(result => result.user).finally(() => { authPromise = null; });
    }
    return authPromise;
  };

  const savedName = localStorage.getItem("diplomaNotesCommentName");
  if (savedName) nameInput.value = savedName;

  const lastPostAt = () => Number(localStorage.getItem("diplomaNotesLastCommentAt") || "0");
  const rememberPost = message => {
    localStorage.setItem("diplomaNotesLastCommentAt", String(Date.now()));
    localStorage.setItem("diplomaNotesLastCommentText", message);
  };

  const validate = (author, message, field, label) => {
    if (author.length < 2 || author.length > 40) {
      nameInput.focus();
      setStatus("Name must contain 2–40 characters.", "error");
      return false;
    }
    if (!message || message.length > 1500) {
      field.focus();
      setStatus(`${label} must contain 1–1500 characters.`, "error");
      return false;
    }
    if ((message.match(/https?:\/\/|www\./gi) || []).length > MAX_LINKS) {
      setStatus("Please limit links to two per message.", "error");
      return false;
    }
    if (Date.now() - lastPostAt() < POST_COOLDOWN_MS) {
      setStatus("Please wait one minute before posting again.", "error");
      return false;
    }
    if (localStorage.getItem("diplomaNotesLastCommentText") === message) {
      setStatus("This duplicates your last post.", "error");
      return false;
    }
    return true;
  };

  const formatDate = timestamp => timestamp?.toDate
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(timestamp.toDate())
    : "Posting…";

  const initials = name => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "S";
  const isDeleted = item => item.deleted === true || (item.author === "Deleted" && item.message === "This comment was deleted.");

  const actionButton = (label, className, handler) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  };

  const addReplyForm = (parent, card) => {
    const existing = card.querySelector(".reply-form");
    if (existing) {
      existing.remove();
      return;
    }
    const replyForm = document.createElement("form");
    replyForm.className = "reply-form";
    const textarea = document.createElement("textarea");
    textarea.maxLength = 1500;
    textarea.required = true;
    textarea.placeholder = "Write your reply…";
    textarea.setAttribute("aria-label", "Reply message");

    const replyCounter = document.createElement("div");
    replyCounter.className = "poly-char-counter";
    replyCounter.setAttribute("aria-live", "polite");
    const uniqueId = `replyCounter-${parent.id}`;
    replyCounter.id = uniqueId;
    textarea.setAttribute("aria-describedby", uniqueId);

    updateCharCounter(textarea, replyCounter, 1500);
    textarea.addEventListener("input", () => {
      updateCharCounter(textarea, replyCounter, 1500);
    });

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "comment-submit";
    submit.textContent = "Post Reply";
    replyForm.append(textarea, replyCounter, submit);
    replyForm.addEventListener("submit", async event => {
      event.preventDefault();
      const author = nameInput.value.trim();
      const message = textarea.value.trim();
      if (!validate(author, message, textarea, "Reply")) return;
      submit.disabled = true;
      try {
        const user = await ensureAuthenticated();
        await firestoreModule.addDoc(commentsRef, {
          pageId: "help", author, message, parentId: parent.id, uid: user.uid,
          createdAt: firestoreModule.serverTimestamp()
        });
        localStorage.setItem("diplomaNotesCommentName", author);
        rememberPost(message);
        replyForm.remove();
        setStatus("Reply posted.", "success");
      } catch (error) {
        console.error("Could not post reply.", error);
        setStatus("Could not post the reply.", "error");
        submit.disabled = false;
      }
    });
    card.append(replyForm);
    textarea.focus();
  };

  const deleteComment = async (item, isReply) => {
    if (!window.confirm(isReply ? "Delete this reply?" : "Delete this comment? Existing replies will remain visible.")) return;
    try {
      await ensureAuthenticated();
      const ref = firestoreModule.doc(db, "helpComments", item.id);
      if (isReply) {
        await firestoreModule.deleteDoc(ref);
      } else {
        await firestoreModule.updateDoc(ref, { author: "Deleted", message: "This comment was deleted.", deleted: true });
      }
      setStatus(isReply ? "Reply deleted." : "Comment deleted.", "success");
    } catch (error) {
      console.error("Could not delete comment.", error);
      setStatus("Could not delete this item.", "error");
    }
  };

  const cardFor = (item, isReply = false) => {
    const deleted = isDeleted(item);
    const card = document.createElement("article");
    card.className = `comment-card${isReply ? " reply-card" : ""}${deleted ? " deleted-comment" : ""}`;
    const meta = document.createElement("div");
    meta.className = "comment-meta";
    const authorWrap = document.createElement("div");
    authorWrap.className = "comment-author";
    const avatar = document.createElement("span");
    avatar.className = "comment-avatar";
    avatar.textContent = deleted ? "×" : initials(item.author || "Student");
    avatar.setAttribute("aria-hidden", "true");
    const authorText = document.createElement("div");
    const author = document.createElement("strong");
    author.textContent = deleted ? "Deleted" : (item.author || "Student");
    const time = document.createElement("span");
    time.className = "comment-time";
    time.textContent = formatDate(item.createdAt);
    authorText.append(author, time);
    authorWrap.append(avatar, authorText);
    meta.append(authorWrap);
    const message = document.createElement("p");
    message.className = "comment-message";
    message.textContent = deleted ? "This comment was deleted." : (item.message || "");
    const actions = document.createElement("div");
    actions.className = "comment-actions";
    if (!isReply && !deleted) actions.append(actionButton("Reply", "comment-action", () => addReplyForm(item, card)));
    if (currentUser && item.uid === currentUser.uid && !deleted) {
      actions.append(actionButton("Delete", "comment-action delete", () => deleteComment(item, isReply)));
    }
    card.append(meta, message, actions);
    return card;
  };

  const render = () => {
    list.replaceChildren();
    const topLevel = comments.filter(item => item.pageId === "help" && !item.parentId);
    const replies = new Map();
    comments.filter(item => item.pageId === "help" && item.parentId).forEach(item => {
      const group = replies.get(item.parentId) || [];
      group.push(item);
      replies.set(item.parentId, group);
    });
    countBox.textContent = `${topLevel.length} ${topLevel.length === 1 ? "comment" : "comments"}`;
    if (!topLevel.length) {
      const empty = document.createElement("div");
      empty.className = "empty-comments";
      empty.textContent = "No comments yet. Start the discussion.";
      list.append(empty);
      return;
    }
    topLevel.forEach(item => {
      list.append(cardFor(item));
      (replies.get(item.id) || []).sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)).forEach(reply => list.append(cardFor(reply, true)));
    });
  };

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const author = nameInput.value.trim();
    const message = messageInput.value.trim();
    if (!validate(author, message, messageInput, "Comment")) return;
    submitButton.disabled = true;
    setStatus("Posting…");
    try {
      const user = await ensureAuthenticated();
      await firestoreModule.addDoc(commentsRef, {
        pageId: "help", author, message, parentId: null, uid: user.uid,
        createdAt: firestoreModule.serverTimestamp()
      });
      localStorage.setItem("diplomaNotesCommentName", author);
      rememberPost(message);
      messageInput.value = "";
      updateCharCounter(messageInput, mainCounter, 1500);
      setStatus("Comment posted.", "success");
    } catch (error) {
      console.error("Could not post comment.", error);
      setStatus("Could not post. Please try again later.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  if (messageInput && mainCounter) {
    messageInput.addEventListener("input", () => {
      updateCharCounter(messageInput, mainCounter, 1500);
    });
    updateCharCounter(messageInput, mainCounter, 1500);
  }

  authModule.onAuthStateChanged(auth, user => {
    currentUser = user;
    render();
  });

  const commentsQuery = firestoreModule.query(
    commentsRef,
    firestoreModule.orderBy("createdAt", "desc"),
    firestoreModule.limit(PAGE_SIZE)
  );
  firestoreModule.onSnapshot(commentsQuery, snapshot => {
    window.clearTimeout(timeout);
    comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    submitButton.disabled = false;
    render();
  }, error => {
    window.clearTimeout(timeout);
    showUnavailable(error);
  });
}
