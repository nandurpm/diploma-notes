const FIREBASE_VERSION = "10.14.1";
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._]{2,18}[a-z0-9])$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const FUNCTIONS_REGION = "asia-south1";
const VERIFY_EMAIL_COOLDOWN_MS = 60_000;

const firebaseConfig = {
  apiKey: ["AIzaSyDgdpLgYNZL_", "KQguMmCI5wZH3b11PXpWvk"].join(""),
  authDomain: "diploma-notes-comments.firebaseapp.com",
  projectId: "diploma-notes-comments",
  storageBucket: "diploma-notes-comments.firebasestorage.app",
  messagingSenderId: "613766691091",
  appId: "1:613766691091:web:65c0929ee4b7a1e5c782e6",
  measurementId: "G-BS562FBTPN"
};

const elements = {
  signedOutView: document.querySelector("#signedOutView"),
  signedInView: document.querySelector("#signedInView"),
  status: document.querySelector("#accountStatus"),
  tabs: [...document.querySelectorAll(".account-tab")],
  panels: [...document.querySelectorAll(".account-panel")],
  loginForm: document.querySelector("#loginForm"),
  createForm: document.querySelector("#createAccountForm"),
  recoveryForm: document.querySelector("#recoveryForm"),
  createUsername: document.querySelector("#createUsername"),
  usernameAvailability: document.querySelector("#usernameAvailability"),
  district: document.querySelector("#districtSelect"),
  college: document.querySelector("#collegeSelect"),
  studentUsername: document.querySelector("#studentUsername"),
  studentDistrict: document.querySelector("#studentDistrict"),
  studentCollege: document.querySelector("#studentCollege"),
  studentEmail: document.querySelector("#studentEmail"),
  studentAvatar: document.querySelector("#studentAvatar"),
  verificationNotice: document.querySelector("#verificationNotice"),
  resendVerification: document.querySelector("#resendVerificationButton"),
  openExamButton: document.querySelector("#openExamButton"),
  logoutButton: document.querySelector("#logoutButton")
};

let auth;
let db;
let authModule;
let firestoreModule;
let functionsModule;
let callable = {};
let collegeDirectory = new Map();
let usernameCheckTimer = null;
let lastCheckedUsername = "";
let lastUsernameAvailable = false;

initialize().catch((error) => {
  console.error("Student account initialization failed.", error);
  setStatus("Student accounts are temporarily unavailable. Please try again later.", "error");
  disableForms();
});

async function initialize() {
  const [appModule, importedAuth, importedFirestore, importedFunctions, collegeResponse] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-functions.js`),
    fetch("/assets/data/polytechnic-colleges.json", { cache: "no-cache" })
  ]);

  if (!collegeResponse.ok) {
    throw new Error(`College directory could not be loaded (${collegeResponse.status}).`);
  }

  authModule = importedAuth;
  firestoreModule = importedFirestore;
  functionsModule = importedFunctions;

  const app = appModule.initializeApp(firebaseConfig);
  auth = authModule.getAuth(app);
  db = firestoreModule.getFirestore(app);
  const functions = functionsModule.getFunctions(app, FUNCTIONS_REGION);

  callable = {
    checkUsername: functionsModule.httpsCallable(functions, "checkUsernameAvailability"),
    createAccount: functionsModule.httpsCallable(functions, "createStudentAccount"),
    login: functionsModule.httpsCallable(functions, "loginWithUsername"),
    requestReset: functionsModule.httpsCallable(functions, "requestPasswordReset")
  };

  const directory = await collegeResponse.json();
  collegeDirectory = new Map(
    directory.districts.map((item) => [item.name, [...item.colleges].sort((a, b) => a.localeCompare(b))])
  );

  populateDistricts();
  bindTabs();
  bindPasswordToggles();
  bindForms();
  handleQueryState();

  authModule.onAuthStateChanged(auth, async (user) => {
    if (user?.isAnonymous) {
      await authModule.signOut(auth);
      return;
    }

    renderAuthState(user).catch((error) => {
      console.error("Could not render account state.", error);
      setStatus("Could not load the student profile.", "error");
    });
  });
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function setStatus(message = "", type = "") {
  elements.status.textContent = message;
  elements.status.className = `account-status${type ? ` ${type}` : ""}`;
}

function setButtonBusy(button, busy, busyText = "Please wait…") {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function disableForms() {
  document.querySelectorAll("#signedOutView input, #signedOutView select, #signedOutView button").forEach((control) => {
    control.disabled = true;
  });
}

function bindTabs() {
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => showPanel(tab.dataset.panel));
  });
}

function showPanel(panelName) {
  elements.tabs.forEach((tab) => {
    const active = tab.dataset.panel === panelName;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  elements.panels.forEach((panel) => {
    const active = panel.id === `${panelName}Panel`;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });

  setStatus();
}

function bindPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (!input) return;
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.textContent = showing ? "Show" : "Hide";
      button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });
  });
}

function populateDistricts() {
  const districtNames = [...collegeDirectory.keys()];
  elements.district.replaceChildren(new Option("Select district", ""));
  districtNames.forEach((district) => elements.district.add(new Option(district, district)));

  elements.district.addEventListener("change", () => {
    const district = elements.district.value;
    elements.college.replaceChildren();

    if (!district || !collegeDirectory.has(district)) {
      elements.college.add(new Option("Select district first", ""));
      elements.college.disabled = true;
      return;
    }

    elements.college.add(new Option("Select college", ""));
    collegeDirectory.get(district).forEach((college) => {
      elements.college.add(new Option(college, college));
    });
    elements.college.disabled = false;
    elements.college.focus();
  });
}

function bindForms() {
  elements.createUsername.addEventListener("input", () => {
    const username = normalizeUsername(elements.createUsername.value);
    elements.createUsername.value = username;
    lastCheckedUsername = "";
    lastUsernameAvailable = false;
    window.clearTimeout(usernameCheckTimer);

    if (!username) {
      setUsernameFeedback();
      return;
    }

    if (!USERNAME_PATTERN.test(username)) {
      setUsernameFeedback("Use 4–20 lowercase letters, numbers, dot or underscore.", "unavailable");
      return;
    }

    setUsernameFeedback("Checking username…");
    usernameCheckTimer = window.setTimeout(() => checkUsername(username), 450);
  });

  elements.loginForm.addEventListener("submit", handleLogin);
  elements.createForm.addEventListener("submit", handleCreateAccount);
  elements.recoveryForm.addEventListener("submit", handleRecovery);
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.resendVerification.addEventListener("click", handleResendVerification);
}

async function checkUsername(username) {
  try {
    const result = await callable.checkUsername({ username });
    if (normalizeUsername(elements.createUsername.value) !== username) return;

    lastCheckedUsername = username;
    lastUsernameAvailable = result.data.available === true;
    setUsernameFeedback(
      lastUsernameAvailable ? "Username is available." : "Username is already taken.",
      lastUsernameAvailable ? "available" : "unavailable"
    );
  } catch (error) {
    console.error("Username availability check failed.", error);
    if (normalizeUsername(elements.createUsername.value) === username) {
      setUsernameFeedback("Availability could not be checked. It will be checked again when you submit.", "unavailable");
    }
  }
}

function setUsernameFeedback(message = "", className = "") {
  elements.usernameAvailability.textContent = message;
  elements.usernameAvailability.className = `field-feedback${className ? ` ${className}` : ""}`;
}

function markInvalid(control, invalid) {
  control.setAttribute("aria-invalid", String(Boolean(invalid)));
}

function validateUsername(username, control) {
  const valid = USERNAME_PATTERN.test(username);
  markInvalid(control, !valid);
  return valid;
}

function validatePassword(password, control) {
  const valid = PASSWORD_PATTERN.test(password);
  markInvalid(control, !valid);
  return valid;
}

function collegeBelongsToDistrict(district, college) {
  return Boolean(district && college && collegeDirectory.get(district)?.includes(college));
}

async function handleCreateAccount(event) {
  event.preventDefault();
  setStatus();

  const form = new FormData(elements.createForm);
  const username = normalizeUsername(form.get("username"));
  const password = String(form.get("password") || "");
  const confirmation = String(form.get("confirmPassword") || "");
  const district = String(form.get("district") || "");
  const college = String(form.get("college") || "");
  const email = String(form.get("email") || "").trim().toLowerCase();
  const consent = form.get("consent") === "on";

  const usernameValid = validateUsername(username, elements.createUsername);
  const passwordValid = validatePassword(password, document.querySelector("#createPassword"));
  const confirmationValid = password === confirmation;
  const districtValid = collegeDirectory.has(district);
  const collegeValid = collegeBelongsToDistrict(district, college);
  const emailInput = document.querySelector("#recoveryEmail");
  const emailValid = emailInput.checkValidity();

  markInvalid(document.querySelector("#confirmPassword"), !confirmationValid);
  markInvalid(elements.district, !districtValid);
  markInvalid(elements.college, !collegeValid);
  markInvalid(emailInput, !emailValid);

  if (!usernameValid) {
    setStatus("Enter a valid username using 4–20 lowercase letters, numbers, dot or underscore.", "error");
    elements.createUsername.focus();
    return;
  }
  if (!passwordValid) {
    setStatus("Password must contain at least 8 characters, including a letter and a number.", "error");
    document.querySelector("#createPassword").focus();
    return;
  }
  if (!confirmationValid) {
    setStatus("Password and Confirm Password do not match.", "error");
    document.querySelector("#confirmPassword").focus();
    return;
  }
  if (!districtValid || !collegeValid) {
    setStatus("Select a valid Kerala district and a college from that district.", "error");
    (districtValid ? elements.college : elements.district).focus();
    return;
  }
  if (!emailValid) {
    setStatus("Enter a valid recovery email address.", "error");
    emailInput.focus();
    return;
  }
  if (!consent) {
    setStatus("Accept the Terms and Privacy Policy to create an account.", "error");
    document.querySelector("#accountConsent").focus();
    return;
  }

  if (lastCheckedUsername === username && !lastUsernameAvailable) {
    setStatus("This username is already taken. Choose another username.", "error");
    elements.createUsername.focus();
    return;
  }

  const submitButton = elements.createForm.querySelector('[type="submit"]');
  setButtonBusy(submitButton, true, "Creating account…");

  try {
    const result = await callable.createAccount({ username, password, district, college, email });
    await authModule.signInWithCustomToken(auth, result.data.customToken);
    await sendVerificationEmail(auth.currentUser);

    elements.createForm.reset();
    elements.college.replaceChildren(new Option("Select district first", ""));
    elements.college.disabled = true;
    setUsernameFeedback();
    setStatus("Account created. A verification link has been sent to your recovery email.", "success");
  } catch (error) {
    console.error("Account creation failed.", error);
    setStatus(accountErrorMessage(error, "Account could not be created. Please check the details and try again."), "error");
  } finally {
    setButtonBusy(submitButton, false);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  setStatus();

  const form = new FormData(elements.loginForm);
  const username = normalizeUsername(form.get("username"));
  const password = String(form.get("password") || "");

  if (!validateUsername(username, document.querySelector("#loginUsername")) || !password) {
    setStatus("Enter your username and password.", "error");
    return;
  }

  const submitButton = elements.loginForm.querySelector('[type="submit"]');
  setButtonBusy(submitButton, true, "Logging in…");

  try {
    const result = await callable.login({ username, password });
    const credential = await authModule.signInWithCustomToken(auth, result.data.customToken);
    await credential.user.reload();
    await credential.user.getIdToken(true);

    if (!credential.user.emailVerified) {
      await maybeSendVerificationEmail(credential.user);
      setStatus("Verify your recovery email before accessing daily exams. A verification email has been sent again.", "info");
    } else {
      setStatus("Login successful.", "success");
    }
    elements.loginForm.reset();
  } catch (error) {
    console.error("Login failed.", error);
    setStatus(accountErrorMessage(error, "Invalid username or password."), "error");
  } finally {
    setButtonBusy(submitButton, false);
  }
}

async function handleRecovery(event) {
  event.preventDefault();
  setStatus();

  const form = new FormData(elements.recoveryForm);
  const username = normalizeUsername(form.get("username"));

  if (!validateUsername(username, document.querySelector("#recoveryUsername"))) {
    setStatus("Enter a valid username.", "error");
    return;
  }

  const submitButton = elements.recoveryForm.querySelector('[type="submit"]');
  setButtonBusy(submitButton, true, "Sending link…");

  try {
    await callable.requestReset({ username });
    elements.recoveryForm.reset();
    setStatus("If an account exists for this username, a password-reset link has been sent to the registered recovery email.", "success");
  } catch (error) {
    console.error("Password recovery request failed.", error);
    setStatus("The reset request could not be completed. Please try again later.", "error");
  } finally {
    setButtonBusy(submitButton, false);
  }
}

async function handleLogout() {
  elements.logoutButton.disabled = true;
  try {
    await authModule.signOut(auth);
    showPanel("login");
    setStatus("You have been logged out.", "success");
  } finally {
    elements.logoutButton.disabled = false;
  }
}

async function renderAuthState(user) {
  elements.signedOutView.hidden = Boolean(user);
  elements.signedInView.hidden = !user;

  if (!user) return;

  await user.reload();
  await user.getIdToken(true);
  const profileRef = firestoreModule.doc(db, "users", user.uid);
  const profileSnapshot = await firestoreModule.getDoc(profileRef);
  const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};

  const username = profile.username || user.displayName || "Student";
  elements.studentUsername.textContent = username;
  elements.studentDistrict.textContent = profile.district || "—";
  elements.studentCollege.textContent = profile.college || "—";
  elements.studentEmail.textContent = maskEmail(user.email || profile.recoveryEmail || "");
  elements.studentAvatar.textContent = username.charAt(0).toUpperCase() || "S";

  const verified = user.emailVerified === true;
  elements.verificationNotice.hidden = verified;
  elements.openExamButton.hidden = !verified;
  elements.openExamButton.setAttribute("aria-disabled", String(!verified));
}

async function handleResendVerification() {
  if (!auth.currentUser) return;
  elements.resendVerification.disabled = true;

  try {
    await maybeSendVerificationEmail(auth.currentUser, true);
    setStatus("Verification email sent. Check the inbox and spam folder.", "success");
  } catch (error) {
    console.error("Verification email could not be sent.", error);
    setStatus(accountErrorMessage(error, "Verification email could not be sent. Please try again later."), "error");
  } finally {
    elements.resendVerification.disabled = false;
  }
}

async function sendVerificationEmail(user) {
  if (!user || user.emailVerified) return;
  await authModule.sendEmailVerification(user, {
    url: "https://polypmna.dpdns.org/student-account.html?verified=1",
    handleCodeInApp: false
  });
  localStorage.setItem("polyPmnaVerificationSentAt", String(Date.now()));
}

async function maybeSendVerificationEmail(user, force = false) {
  const lastSentAt = Number(localStorage.getItem("polyPmnaVerificationSentAt") || "0");
  if (!force && Date.now() - lastSentAt < VERIFY_EMAIL_COOLDOWN_MS) return;
  await sendVerificationEmail(user);
}

function maskEmail(email) {
  const [localPart, domain] = String(email).split("@");
  if (!localPart || !domain) return "—";
  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"*".repeat(Math.max(2, localPart.length - visible.length))}@${domain}`;
}

function accountErrorMessage(error, fallback) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");

  if (code.includes("already-exists")) {
    return message.includes("email")
      ? "This recovery email is already connected to another account."
      : "This username is already taken.";
  }
  if (code.includes("invalid-argument")) return message || "Some account details are invalid.";
  if (code.includes("resource-exhausted")) return "Too many attempts. Please wait and try again.";
  if (code.includes("failed-precondition")) return message || "This account cannot be used yet.";
  if (code.includes("permission-denied")) return "This account is not permitted to sign in.";
  if (code.includes("unavailable")) return "The account service is temporarily unavailable.";
  return fallback;
}

function handleQueryState() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("verified") === "1") {
    setStatus("Email verification completed. You can now log in.", "success");
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
