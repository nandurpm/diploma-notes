import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  limit
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDgdpLgYNZL_KQguMmCI5wZH3b11PXpWvk',
  authDomain: 'diploma-notes-comments.firebaseapp.com',
  projectId: 'diploma-notes-comments',
  storageBucket: 'diploma-notes-comments.firebasestorage.app',
  messagingSenderId: '613766691091',
  appId: '1:613766691091:web:65c0929ee4b7a1e5c782e6',
  measurementId: 'G-BS562FBTPN'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const commentsRef = collection(db, 'helpComments');

const form = document.querySelector('#helpCommentForm');
const nameInput = document.querySelector('#commentName');
const messageInput = document.querySelector('#commentMessage');
const submitButton = document.querySelector('#commentSubmit');
const statusBox = document.querySelector('#commentStatus');
const list = document.querySelector('#commentsList');
const countBox = document.querySelector('#commentCount');

let currentUser = null;
let comments = [];

const savedName = localStorage.getItem('diplomaNotesCommentName');
if (savedName) nameInput.value = savedName;

function setStatus(message = '', type = '') {
  statusBox.textContent = message;
  statusBox.className = `comment-status${type ? ` ${type}` : ''}`;
}

function formatDate(timestamp) {
  if (!timestamp?.toDate) return 'Posting…';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(timestamp.toDate());
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('') || 'S';
}

function makeButton(label, className, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', handler);
  return button;
}

function createReplyForm(parentId, parentCard) {
  const existing = parentCard.querySelector('.reply-form');
  if (existing) {
    existing.remove();
    return;
  }

  const replyForm = document.createElement('form');
  replyForm.className = 'reply-form';

  const textarea = document.createElement('textarea');
  textarea.maxLength = 1500;
  textarea.required = true;
  textarea.placeholder = 'Write your reply…';
  textarea.setAttribute('aria-label', 'Reply message');

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'comment-submit';
  button.textContent = 'Post Reply';

  replyForm.append(textarea, button);
  replyForm.addEventListener('submit', async event => {
    event.preventDefault();
    const author = nameInput.value.trim();
    const message = textarea.value.trim();
    if (!author) {
      nameInput.focus();
      setStatus('Enter your name before replying.', 'error');
      return;
    }
    if (!currentUser || !message) return;

    button.disabled = true;
    try {
      localStorage.setItem('diplomaNotesCommentName', author);
      await addDoc(commentsRef, {
        pageId: 'help',
        author,
        message,
        parentId,
        uid: currentUser.uid,
        createdAt: serverTimestamp()
      });
      replyForm.remove();
      setStatus('Reply posted.', 'success');
    } catch (error) {
      console.error(error);
      setStatus('Could not post the reply. Check Firebase rules and try again.', 'error');
      button.disabled = false;
    }
  });

  parentCard.append(replyForm);
  textarea.focus();
}

function createCommentCard(comment, isReply = false) {
  const card = document.createElement('article');
  card.className = `comment-card${isReply ? ' reply-card' : ''}`;
  card.dataset.commentId = comment.id;

  const meta = document.createElement('div');
  meta.className = 'comment-meta';

  const authorWrap = document.createElement('div');
  authorWrap.className = 'comment-author';

  const avatar = document.createElement('span');
  avatar.className = 'comment-avatar';
  avatar.textContent = initials(comment.author || 'Student');

  const authorText = document.createElement('div');
  const author = document.createElement('strong');
  author.textContent = comment.author || 'Student';
  const time = document.createElement('span');
  time.className = 'comment-time';
  time.textContent = formatDate(comment.createdAt);
  authorText.append(author, time);
  authorWrap.append(avatar, authorText);
  meta.append(authorWrap);

  const message = document.createElement('p');
  message.className = 'comment-message';
  message.textContent = comment.message || '';

  const actions = document.createElement('div');
  actions.className = 'comment-actions';

  actions.append(makeButton('Reply', 'comment-action', () => createReplyForm(comment.id, card)));

  if (currentUser && comment.uid === currentUser.uid) {
    actions.append(makeButton('Delete', 'comment-action delete', async () => {
      if (!window.confirm('Delete this comment?')) return;
      try {
        await deleteDoc(doc(db, 'helpComments', comment.id));
      } catch (error) {
        console.error(error);
        setStatus('Could not delete this comment.', 'error');
      }
    }));
  }

  card.append(meta, message, actions);
  return card;
}

function renderComments() {
  list.replaceChildren();
  const visible = comments.filter(item => item.pageId === 'help');
  countBox.textContent = `${visible.length} ${visible.length === 1 ? 'comment' : 'comments'}`;

  if (!visible.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-comments';
    empty.textContent = 'No comments yet. Start the discussion.';
    list.append(empty);
    return;
  }

  const topLevel = visible.filter(item => !item.parentId);
  const repliesByParent = new Map();
  visible.filter(item => item.parentId).forEach(reply => {
    const replies = repliesByParent.get(reply.parentId) || [];
    replies.push(reply);
    repliesByParent.set(reply.parentId, replies);
  });

  topLevel.forEach(comment => {
    list.append(createCommentCard(comment));
    (repliesByParent.get(comment.id) || []).forEach(reply => {
      list.append(createCommentCard(reply, true));
    });
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const author = nameInput.value.trim();
  const message = messageInput.value.trim();

  if (!currentUser) {
    setStatus('Connecting to the discussion service. Try again in a moment.', 'error');
    return;
  }
  if (author.length < 2 || author.length > 40) {
    setStatus('Name must contain 2–40 characters.', 'error');
    nameInput.focus();
    return;
  }
  if (!message || message.length > 1500) {
    setStatus('Comment must contain 1–1500 characters.', 'error');
    messageInput.focus();
    return;
  }

  submitButton.disabled = true;
  setStatus('Posting…');
  try {
    localStorage.setItem('diplomaNotesCommentName', author);
    await addDoc(commentsRef, {
      pageId: 'help',
      author,
      message,
      parentId: null,
      uid: currentUser.uid,
      createdAt: serverTimestamp()
    });
    messageInput.value = '';
    setStatus('Comment posted.', 'success');
  } catch (error) {
    console.error(error);
    setStatus('Could not post. Confirm your Firestore rules and authorized domain.', 'error');
  } finally {
    submitButton.disabled = false;
  }
});

onAuthStateChanged(auth, user => {
  currentUser = user;
  submitButton.disabled = !user;
  renderComments();
});

signInAnonymously(auth).catch(error => {
  console.error(error);
  setStatus('Discussion login failed. Add polypmna.dpdns.org to Firebase Authorized domains.', 'error');
});

const commentsQuery = query(commentsRef, orderBy('createdAt', 'asc'), limit(250));
onSnapshot(commentsQuery, snapshot => {
  comments = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  renderComments();
}, error => {
  console.error(error);
  list.innerHTML = '<div class="comment-error-box">Comments could not be loaded. Check the published Firestore rules.</div>';
});
