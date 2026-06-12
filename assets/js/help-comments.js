const FALLBACK_MESSAGE = "Discussion is currently unavailable. Please contact us by email.";
const EMAIL = "nandakumarmkdpm@gmail.com";

const form = document.querySelector("#helpCommentForm");
const nameInput = document.querySelector("#commentName");
const messageInput = document.querySelector("#commentMessage");
const submitButton = document.querySelector("#commentSubmit");
const statusBox = document.querySelector("#commentStatus");
const list = document.querySelector("#commentsList");
const countBox = document.querySelector("#commentCount");

if (!form || !nameInput || !messageInput || !submitButton || !statusBox || !list || !countBox) {
  console.error("Discussion initialization failed: required contact-page elements are missing.");
} else {
  initializeDiscussion().catch((error) => showUnavailable(error));
}

function showUnavailable(error) {
  console.error("Discussion service unavailable.", error);
  submitButton.disabled = true;
  form.setAttribute("aria-disabled", "true");
  countBox.textContent = "Unavailable";
  statusBox.textContent = "";
  const box = document.createElement("div");
  box.className = "comment-error-box";
  const text = document.createElement("p");
  text.textContent = FALLBACK_MESSAGE;
  const email = document.createElement("a");
  email.href = `mailto:${EMAIL}?subject=Diploma%20Notes%20Help`;
  email.textContent = "Email us";
  box.append(text, email);
  list.replaceChildren(box);
}

async function initializeDiscussion() {
  const timeout = window.setTimeout(() => showUnavailable(new Error("Discussion initialization timed out.")), 10000);
  try {
    const [appModule, authModule, firestoreModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
    ]);

    const firebaseConfig = {
      apiKey: "AIzaSyDgdpLgYNZL_KQguMmCI5wZH3b11PXpWvk",
      authDomain: "diploma-notes-comments.firebaseapp.com",
      projectId: "diploma-notes-comments",
      storageBucket: "diploma-notes-comments.firebasestorage.app",
      messagingSenderId: "613766691091",
      appId: "1:613766691091:web:65c0929ee4b7a1e5c782e6",
      measurementId: "G-BS562FBTPN"
    };

    const app = appModule.initializeApp(firebaseConfig);
    const auth = authModule.getAuth(app);
    const db = firestoreModule.getFirestore(app);
    const commentsRef = firestoreModule.collection(db, "helpComments");
    let currentUser = null;
    let comments = [];

    const savedName = localStorage.getItem("diplomaNotesCommentName");
    if (savedName) nameInput.value = savedName;

    const setStatus = (message = "", type = "") => {
      statusBox.textContent = message;
      statusBox.className = `comment-status${type ? ` ${type}` : ""}`;
    };

    const formatDate = (timestamp) => {
      if (!timestamp?.toDate) return "Posting…";
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(timestamp.toDate());
    };

    const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "S";

    const button = (label, className, handler) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = className;
      element.textContent = label;
      element.addEventListener("click", handler);
      return element;
    };

    const createReplyForm = (parentId, card) => {
      const existing = card.querySelector(".reply-form");
      if (existing) { existing.remove(); return; }
      const replyForm = document.createElement("form");
      replyForm.className = "reply-form";
      const label = document.createElement("label");
      const textareaId = `reply-${parentId}`;
      label.className = "sr-only";
      label.htmlFor = textareaId;
      label.textContent = "Reply message";
      const textarea = document.createElement("textarea");
      textarea.id = textareaId;
      textarea.maxLength = 1500;
      textarea.required = true;
      textarea.placeholder = "Write your reply…";
      const submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "comment-submit";
      submit.textContent = "Post Reply";
      replyForm.append(label, textarea, submit);
      replyForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const author = nameInput.value.trim();
        const message = textarea.value.trim();
        if (!author) { nameInput.focus(); setStatus("Enter your name before replying.", "error"); return; }
        if (!currentUser || !message) return;
        submit.disabled = true;
        try {
          localStorage.setItem("diplomaNotesCommentName", author);
          await firestoreModule.addDoc(commentsRef, {
            pageId: "help", author, message, parentId, uid: currentUser.uid, createdAt: firestoreModule.serverTimestamp()
          });
          replyForm.remove();
          setStatus("Reply posted.", "success");
        } catch (error) {
          console.error("Could not post reply.", error);
          setStatus("Could not post the reply. Please try again later.", "error");
          submit.disabled = false;
        }
      });
      card.append(replyForm);
      textarea.focus();
    };

    const createCommentCard = (comment, isReply = false) => {
      const card = document.createElement("article");
      card.className = `comment-card${isReply ? " reply-card" : ""}`;
      card.dataset.commentId = comment.id;
      const meta = document.createElement("div");
      meta.className = "comment-meta";
      const authorWrap = document.createElement("div");
      authorWrap.className = "comment-author";
      const avatar = document.createElement("span");
      avatar.className = "comment-avatar";
      avatar.textContent = initials(comment.author || "Student");
      avatar.setAttribute("aria-hidden", "true");
      const authorText = document.createElement("div");
      const author = document.createElement("strong");
      author.textContent = comment.author || "Student";
      const time = document.createElement("span");
      time.className = "comment-time";
      time.textContent = formatDate(comment.createdAt);
      authorText.append(author, time);
      authorWrap.append(avatar, authorText);
      meta.append(authorWrap);
      const message = document.createElement("p");
      message.className = "comment-message";
      message.textContent = comment.message || "";
      const actions = document.createElement("div");
      actions.className = "comment-actions";
      actions.append(button("Reply", "comment-action", () => createReplyForm(comment.id, card)));
      if (currentUser && comment.uid === currentUser.uid) {
        actions.append(button("Delete", "comment-action delete", async () => {
          if (!window.confirm("Delete this comment?")) return;
          try { await firestoreModule.deleteDoc(firestoreModule.doc(db, "helpComments", comment.id)); }
          catch (error) { console.error("Could not delete comment.", error); setStatus("Could not delete this comment.", "error"); }
        }));
      }
      card.append(meta, message, actions);
      return card;
    };

    const renderComments = () => {
      list.replaceChildren();
      const visible = comments.filter((item) => item.pageId === "help");
      countBox.textContent = `${visible.length} ${visible.length === 1 ? "comment" : "comments"}`;
      if (!visible.length) {
        const empty = document.createElement("div");
        empty.className = "empty-comments";
        empty.textContent = "No comments yet. Start the discussion.";
        list.append(empty);
        return;
      }
      const topLevel = visible.filter((item) => !item.parentId);
      const replies = new Map();
      visible.filter((item) => item.parentId).forEach((reply) => {
        const items = replies.get(reply.parentId) || [];
        items.push(reply);
        replies.set(reply.parentId, items);
      });
      topLevel.forEach((comment) => {
        list.append(createCommentCard(comment));
        (replies.get(comment.id) || []).forEach((reply) => list.append(createCommentCard(reply, true)));
      });
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const author = nameInput.value.trim();
      const message = messageInput.value.trim();
      if (!currentUser) { setStatus("Discussion is still connecting. Please try again.", "error"); return; }
      if (author.length < 2 || author.length > 40) { setStatus("Name must contain 2–40 characters.", "error"); nameInput.focus(); return; }
      if (!message || message.length > 1500) { setStatus("Comment must contain 1–1500 characters.", "error"); messageInput.focus(); return; }
      submitButton.disabled = true;
      setStatus("Posting…");
      try {
        localStorage.setItem("diplomaNotesCommentName", author);
        await firestoreModule.addDoc(commentsRef, {
          pageId: "help", author, message, parentId: null, uid: currentUser.uid, createdAt: firestoreModule.serverTimestamp()
        });
        messageInput.value = "";
        setStatus("Comment posted.", "success");
      } catch (error) {
        console.error("Could not post comment.", error);
        setStatus("Could not post. Please try again later.", "error");
      } finally {
        submitButton.disabled = false;
      }
    });

    authModule.onAuthStateChanged(auth, (user) => {
      currentUser = user;
      submitButton.disabled = !user;
      renderComments();
    });

    await authModule.signInAnonymously(auth);
    const commentsQuery = firestoreModule.query(commentsRef, firestoreModule.orderBy("createdAt", "asc"), firestoreModule.limit(250));
    firestoreModule.onSnapshot(commentsQuery, (snapshot) => {
      window.clearTimeout(timeout);
      comments = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      renderComments();
    }, (error) => showUnavailable(error));
  } catch (error) {
    window.clearTimeout(timeout);
    throw error;
  }
}
