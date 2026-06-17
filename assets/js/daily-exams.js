const FIREBASE_VERSION = "10.14.1";
const firebaseConfig = {
  apiKey: ["AIzaSyDgdpLgYNZL_", "KQguMmCI5wZH3b11PXpWvk"].join(""),
  authDomain: "diploma-notes-comments.firebaseapp.com",
  projectId: "diploma-notes-comments",
  storageBucket: "diploma-notes-comments.firebasestorage.app",
  messagingSenderId: "613766691091",
  appId: "1:613766691091:web:65c0929ee4b7a1e5c782e6",
  measurementId: "G-BS562FBTPN"
};

const statusBox = document.querySelector("#examStatus");
const examList = document.querySelector("#examList");
const greeting = document.querySelector("#studentGreeting");

initialize().catch((error) => {
  console.error("Daily exams initialization failed.", error);
  showError("Daily exams are temporarily unavailable.");
});

async function initialize() {
  const [appModule, authModule, firestoreModule] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
  ]);

  const app = appModule.initializeApp(firebaseConfig);
  const auth = authModule.getAuth(app);
  const db = firestoreModule.getFirestore(app);

  authModule.onAuthStateChanged(auth, async (user) => {
    if (user?.isAnonymous) {
      await authModule.signOut(auth);
      window.location.replace("/student-account.html?next=daily-exams");
      return;
    }

    if (!user) {
      window.location.replace("/student-account.html?next=daily-exams");
      return;
    }

    await user.reload();
    await user.getIdToken(true);
    if (!user.emailVerified) {
      window.location.replace("/student-account.html?verification=required");
      return;
    }

    const profileSnapshot = await firestoreModule.getDoc(firestoreModule.doc(db, "users", user.uid));
    const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
    greeting.textContent = `Welcome, ${profile.username || user.displayName || "Student"}. Only real published exams are shown here.`;
    await loadTodayExams(db, firestoreModule, profile);
  });
}

async function loadTodayExams(db, firestoreModule, profile) {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  const examsQuery = firestoreModule.query(
    firestoreModule.collection(db, "exams"),
    firestoreModule.where("dateKey", "==", dateKey),
    firestoreModule.where("status", "==", "published")
  );

  const snapshot = await firestoreModule.getDocs(examsQuery);
  const now = Date.now();
  const exams = snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() }))
    .filter((exam) => !exam.district || exam.district === profile.district)
    .filter((exam) => !exam.college || exam.college === profile.college)
    .sort((a, b) => timestampValue(a.startAt) - timestampValue(b.startAt));

  statusBox.hidden = true;
  examList.replaceChildren();

  if (!exams.length) {
    const empty = document.createElement("div");
    empty.className = "empty-exams";
    const title = document.createElement("h2");
    title.textContent = "No daily exam is scheduled";
    const message = document.createElement("p");
    message.textContent = "Published exams for today will appear here automatically.";
    empty.append(title, message);
    examList.append(empty);
    return;
  }

  exams.forEach((exam) => {
    const card = document.createElement("article");
    card.className = "exam-card";

    const title = document.createElement("h2");
    title.textContent = exam.title || "Daily Exam";

    const description = document.createElement("p");
    description.textContent = exam.description || "Open the exam to view instructions.";

    const meta = document.createElement("div");
    meta.className = "exam-meta";
    meta.append(
      metaLine(`Starts: ${formatTime(exam.startAt)}`),
      metaLine(`Ends: ${formatTime(exam.endAt)}`),
      metaLine(`Duration: ${Number(exam.durationMinutes || 0)} minutes`)
    );

    const startAt = timestampValue(exam.startAt);
    const endAt = timestampValue(exam.endAt);
    const link = document.createElement("a");
    link.className = "exam-start";

    if (startAt && now < startAt) {
      link.textContent = "Not open yet";
      link.setAttribute("aria-disabled", "true");
      link.removeAttribute("href");
    } else if (endAt && now > endAt) {
      link.textContent = "Exam closed";
      link.setAttribute("aria-disabled", "true");
      link.removeAttribute("href");
    } else if (isSafeSameSitePath(exam.playerUrl)) {
      link.textContent = "Open Exam";
      link.href = exam.playerUrl;
    } else {
      link.textContent = "Exam player not configured";
      link.setAttribute("aria-disabled", "true");
      link.removeAttribute("href");
    }

    card.append(title, description, meta, link);
    examList.append(card);
  });
}

function isSafeSameSitePath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return false;
  }

  try {
    return new URL(value, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

function metaLine(text) {
  const element = document.createElement("span");
  element.textContent = text;
  return element;
}

function timestampValue(value) {
  return value?.toMillis?.() || 0;
}

function formatTime(value) {
  if (!value?.toDate) return "To be announced";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value.toDate());
}

function showError(message) {
  statusBox.textContent = message;
  statusBox.className = "exam-status error";
}
