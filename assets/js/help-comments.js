const FALLBACK_MESSAGE = "Discussion is currently unavailable. Please contact us by email.";
const EMAIL = "nandakumarmkdpm@gmail.com";
const PAGE_SIZE = 20;
const POST_COOLDOWN_MS = 60000;
const MAX_LINKS = 2;

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
  const timeout = window.setTimeout(
    () => showUnavailable(new Error("Discussion initialization timed out.")),
    10000
  );

  try {
    const [appModule, authModule, firestoreModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
    ]);

    const firebaseConfig = {
      apiKey: ["AIzaSyDgdpLgYNZL_", "KQguMmCI5wZH3b11PXpWvk"].join(""),
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

    let currentUser = auth.currentUser;
    let authPromise = null;
    let liveComments = [];
    let olderComments = [];
    let comments = [];
    let repliesByParent = new Map();
    let oldestLoadedDoc = null;
    let hasMoreComments = false;
    let loadingOlderComments = false;

    const savedName = localStorage.getItem("diplomaNotesCommentName");
    if (savedName) {
      nameInput.value = savedName;
    }

    const setStatus = (message = "", type = "") => {
      statusBox.textContent = message;
      statusBox.className = `comment-status${type ? ` ${type}` : ""}`;
    };

    const getLastPost = () => Number(localStorage.getItem("diplomaNotesLastCommentAt") || "0");
    const rememberPost = (message) => {
      localStorage.setItem("diplomaNotesLastCommentAt", String(Date.now()));
      localStorage.setItem("diplomaNotesLastCommentText", message);
    };
    const hasUrlSpam = (message) => (message.match(/https?:\/\/|www\./gi) || []).length > MAX_LINKS;

    const validatePost = (author, message, textarea, label) => {
      if (author.length < 2 || author.length > 40) {
        nameInput.focus();
        setStatus("Name must contain 2-40 characters.", "error");
        return false;
      }
      if (!message || message.length > 1500) {
        setStatus(`${label} must contain 1-1500 characters.`, "error");
        textarea.focus();
        return false;
      }
      if (Date.now() - getLastPost() < POST_COOLDOWN_MS) {
        setStatus("Please wait a minute before posting again.", "error");
        return false;
      }
      if (localStorage.getItem("diplomaNotesLastCommentText") === message) {
        setStatus("This looks like a duplicate of your last post.", "error");
        return false;
      }
      if (hasUrlSpam(message)) {
        setStatus("Please limit links in a comment. Too many links look like spam.", "error");
        return false;
      }
      return true;
    };

    const ensureAuthenticated = async () => {
      if (auth.currentUser) {
        currentUser = auth.currentUser;
        return currentUser;
      }

      if (!authPromise) {
        authPromise = authModule
          .signInAnonymously(auth)
          .then((credential) => {
            currentUser = credential.user;
            return credential.user;
          })
          .finally(() => {
            authPromise = null;
          });
      }

      return authPromise;
    };

    const formatDate = (timestamp) => {
      if (!timestamp?.toDate) {
        return "Posting…";
      }

      return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(timestamp.toDate());
    };

    const initials = (name) =>
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "S";

    const button = (label, className, handler) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = className;
      element.textContent = label;
      element.addEventListener("click", handler);
      return element;
    };

    const isDeletedComment = (comment) =>
      comment?.deleted === true ||
      (comment?.author === "Deleted" && comment?.message === "This comment was deleted.");

    const mergeComments = () => {
      const byId = new Map();

      [...liveComments, ...olderComments].forEach((comment) => {
        byId.set(comment.id, comment);
      });

      comments = [...byId.values()].sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    };

    const createReplyForm = (parentId, card) => {
      const parentComment = comments.find((item) => item.id === parentId);

      if (!parentComment || parentComment.parentId || isDeletedComment(parentComment)) {
        setStatus("Replies can only be added to an active top-level comment.", "error");
        return;
      }

      const existing = card.querySelector(".reply-form");
      if (existing) {
        existing.remove();
        return;
      }

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

        if (!validatePost(author, message, textarea, "Reply")) return;

        const currentParent = comments.find((item) => item.id === parentId);
        if (!currentParent || currentParent.parentId || isDeletedComment(currentParent)) {
          replyForm.remove();
          setStatus("This comment is no longer available for replies.", "error");
          return;
        }

        submit.disabled = true;
        setStatus("Connecting…");

        try {
          const user = await ensureAuthenticated();
          localStorage.setItem("diplomaNotesCommentName", author);

          await firestoreModule.addDoc(commentsRef, {
            pageId: "help",
            author,
            message,
            parentId,
            uid: user.uid,
            createdAt: firestoreModule.serverTimestamp()
          });
          rememberPost(message);

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
      const deleted = isDeletedComment(comment);
      const card = document.createElement("article");
      card.className = `comment-card${isReply ? " reply-card" : ""}${deleted ? " deleted-comment" : ""}`;
      card.dataset.commentId = comment.id;

      const meta = document.createElement("div");
      meta.className = "comment-meta";

      const authorWrap = document.createElement("div");
      authorWrap.className = "comment-author";

      const avatar = document.createElement("span");
      avatar.className = "comment-avatar";
      avatar.textContent = deleted ? "×" : initials(comment.author || "Student");
      avatar.setAttribute("aria-hidden", "true");

      const authorText = document.createElement("div");
      const author = document.createElement("strong");
      author.textContent = deleted ? "Deleted" : (comment.author || "Student");

      const time = document.createElement("span");
      time.className = "comment-time";
      time.textContent = formatDate(comment.createdAt);

      authorText.append(author, time);
      authorWrap.append(avatar, authorText);
      meta.append(authorWrap);

      const message = document.createElement("p");
      message.className = "comment-message";
      message.textContent = deleted ? "This comment was deleted." : (comment.message || "");

      const actions = document.createElement("div");
      actions.className = "comment-actions";

      if (!isReply && !deleted) {
        actions.append(
          button("Reply", "comment-action", () => createReplyForm(comment.id, card))
        );
      }

      if (currentUser && comment.uid === currentUser.uid && !deleted) {
        actions.append(
          button("Delete", "comment-action delete", async () => {
            const confirmation = isReply
              ? "Delete this reply?"
              : "Delete this comment? Existing replies will remain visible.";

            if (!window.confirm(confirmation)) {
              return;
            }

            const commentRef = firestoreModule.doc(db, "helpComments", comment.id);

            try {
              await ensureAuthenticated();

              if (isReply) {
                await firestoreModule.deleteDoc(commentRef);
                olderComments = olderComments.filter((item) => item.id !== comment.id);
                mergeComments();
                renderComments();
                setStatus("Reply deleted.", "success");
              } else {
                await firestoreModule.updateDoc(commentRef, {
                  author: "Deleted",
                  message: "This comment was deleted.",
                  deleted: true
                });

                olderComments = olderComments.map((item) =>
                  item.id === comment.id
                    ? { ...item, author: "Deleted", message: "This comment was deleted.", deleted: true }
                    : item
                );
                mergeComments();
                renderComments();
                setStatus("Comment deleted. Existing replies were preserved.", "success");
              }
            } catch (error) {
              console.error("Could not delete comment.", error);
              setStatus("Could not delete this comment.", "error");
            }
          })
        );
      }

      card.append(meta, message, actions);
      return card;
    };

    const loadOlderComments = async () => {
      if (loadingOlderComments || !hasMoreComments || !oldestLoadedDoc) {
        return;
      }

      loadingOlderComments = true;
      renderComments();
      setStatus("Loading older comments…");

      try {
        const olderQuery = firestoreModule.query(
          commentsRef,
          firestoreModule.orderBy("createdAt", "desc"),
          firestoreModule.startAfter(oldestLoadedDoc),
          firestoreModule.limit(PAGE_SIZE * 3)
        );
        const snapshot = await firestoreModule.getDocs(olderQuery);
        const batch = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.pageId === "help" && !item.parentId)
          .slice(0, PAGE_SIZE);

        olderComments = [...olderComments, ...batch];
        if (!snapshot.empty) {
          oldestLoadedDoc = snapshot.docs[snapshot.docs.length - 1];
        }
        hasMoreComments = snapshot.size === PAGE_SIZE;
        mergeComments();
        await loadRepliesForParents(comments.filter((item) => !item.parentId));
        setStatus(batch.length ? `${batch.length} older comments loaded.` : "No older comments.", "success");
      } catch (error) {
        console.error("Could not load older comments.", error);
        setStatus("Could not load older comments. Please try again.", "error");
      } finally {
        loadingOlderComments = false;
        renderComments();
      }
    };

    const appendLoadMoreButton = () => {
      if (!hasMoreComments) {
        return;
      }

      const wrap = document.createElement("div");
      wrap.className = "comment-pagination";

      const loadMoreButton = button(
        loadingOlderComments ? "Loading…" : "Load older comments",
        "comment-submit load-older-comments",
        loadOlderComments
      );
      loadMoreButton.disabled = loadingOlderComments;
      loadMoreButton.setAttribute("aria-label", "Load older discussion comments");

      wrap.append(loadMoreButton);
      list.append(wrap);
    };

    const renderComments = () => {
      list.replaceChildren();

      const visible = comments.filter((item) => item.pageId === "help" && !item.parentId);
      countBox.textContent = `${visible.length}${hasMoreComments ? "+" : ""} loaded ${visible.length === 1 ? "comment" : "comments"}`;

      if (!visible.length) {
        const empty = document.createElement("div");
        empty.className = "empty-comments";
        empty.textContent = "No comments yet. Start the discussion.";
        list.append(empty);
        appendLoadMoreButton();
        return;
      }

      visible.forEach((comment) => {
        list.append(createCommentCard(comment));
        (repliesByParent.get(comment.id) || []).forEach((reply) => {
          list.append(createCommentCard(reply, true));
        });
      });

      appendLoadMoreButton();
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const author = nameInput.value.trim();
      const message = messageInput.value.trim();

      if (!validatePost(author, message, messageInput, "Comment")) return;

      submitButton.disabled = true;
      setStatus("Connecting…");

      try {
        const user = await ensureAuthenticated();
        setStatus("Posting…");
        localStorage.setItem("diplomaNotesCommentName", author);

        await firestoreModule.addDoc(commentsRef, {
          pageId: "help",
          author,
          message,
          parentId: null,
          uid: user.uid,
          createdAt: firestoreModule.serverTimestamp()
        });
        rememberPost(message);

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
      renderComments();
    });

    submitButton.disabled = false;

    const loadRepliesForParents = async (parents) => {
      const parentIds = parents.map((item) => item.id).filter(Boolean);
      const next = new Map();

      for (let index = 0; index < parentIds.length; index += 10) {
        const batch = parentIds.slice(index, index + 10);
        if (!batch.length) continue;

        const repliesQuery = firestoreModule.query(
          commentsRef,
          firestoreModule.where("parentId", "in", batch)
        );
        const snapshot = await firestoreModule.getDocs(repliesQuery);
        snapshot.docs.forEach((item) => {
          const reply = { id: item.id, ...item.data() };
          if (reply.pageId !== "help") return;
          const items = next.get(reply.parentId) || [];
          items.push(reply);
          next.set(reply.parentId, items);
        });
      }

      next.forEach((items) => {
        items.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
      });
      repliesByParent = next;
    };

    const commentsQuery = firestoreModule.query(
      commentsRef,
      firestoreModule.orderBy("createdAt", "desc"),
      firestoreModule.limit(PAGE_SIZE * 3)
    );

    firestoreModule.onSnapshot(
      commentsQuery,
      (snapshot) => {
        window.clearTimeout(timeout);

        liveComments = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.pageId === "help" && !item.parentId)
          .slice(0, PAGE_SIZE);
        if (olderComments.length === 0) {
          oldestLoadedDoc = snapshot.empty ? null : snapshot.docs[snapshot.docs.length - 1];
          hasMoreComments = snapshot.size === PAGE_SIZE;
        }

        mergeComments();
        loadRepliesForParents(comments.filter((item) => !item.parentId))
          .catch((error) => console.error("Could not load replies.", error))
          .finally(renderComments);
      },
      (error) => {
        window.clearTimeout(timeout);
        showUnavailable(error);
      }
    );
  } catch (error) {
    window.clearTimeout(timeout);
    throw error;
  }
}
