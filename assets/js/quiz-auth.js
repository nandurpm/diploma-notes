/* Purpose: Quiz auth - Descriptive comment added for clarity */
window.PolyQuizAuth = (() => {
  "use strict";

  let client = null;
  let user = null;
  let guest = false;
  let lastActivityAt = 0;
  let activityTimer = null;

  const SITE_URL = window.PolyUtils?.getAuthRedirectOrigin?.() || "https://polypmna.dpdns.org";
  const PASSWORD_MIN_LENGTH = 12;
  const SESSION_IDLE_LIMIT_MS = 30 * 60 * 1000;
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOGIN_BACKOFF_MS = 15 * 60 * 1000;
  const MAX_SIGNUP_ATTEMPTS = 3;
  const SIGNUP_BACKOFF_MS = 30 * 60 * 1000;
  const loginFailures = new Map();
  const signupFailures = new Map();
  const GENERIC_LOGIN_ERROR = "Wrong email or password. Check your details or use Forgot password.";

  function isNetworkOrPausedProjectError(error) {
    const text = String(error?.message || error || "").toLowerCase();
    return (
      text.includes("failed to fetch") ||
      text.includes("networkerror") ||
      text.includes("network request failed") ||
      text.includes("load failed") ||
      text.includes("connection") ||
      text.includes("timeout") ||
      text.includes("fetch")
    );
  }

  /* Robust helper to perform client-side email format input validation */
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email || "").toLowerCase());
  }

  function friendly(error) {
    const text = String(error?.message || error || "").toLowerCase();

    if (isNetworkOrPausedProjectError(error)) {
      return "The online login service is currently unreachable. Continue as Guest or try online login again later.";
    }
    if (text.includes("invalid login credentials")) {
      return "Wrong email or password. Check the password, or use Forgot password.";
    }
    if (text.includes("email not confirmed")) {
      return "Email is not confirmed yet. Check your inbox/spam and confirm the account, then login.";
    }
    if (text.includes("email rate limit") || text.includes("rate limit") || error?.status === 429) {
      return "Signup email limit reached. Try again later or use Continue as Guest. The site administrator may need to configure Custom SMTP in Supabase.";
    }
    if (text.includes("already registered") || text.includes("already exists") || text.includes("user already registered")) {
      return "This email is already registered. Please use Login or Forgot password.";
    }
    if (text.includes("not authorized")) {
      return "This email cannot receive Supabase test emails. The site administrator must configure Custom SMTP or update the Supabase email settings.";
    }
    return error?.message || "Authentication failed. Please try again.";
  }

  function getClient() {
    if (client) return client;

    client = window.PolyUtils.createSupabaseBrowserClient({
      auth: { flowType: "pkce" },
      global: {
        headers: {
          "X-Client-Info": "poly-pmna-quiz-auth-20260717",
        },
      },
    });
    if (client?.auth?.onAuthStateChange) {
      client.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          user = null;
          return;
        }
        user = session.user;
        lastActivityAt = Date.now();
      });
    }
    return client;
  }

  function normalizedEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function touchActivity() {
    lastActivityAt = Date.now();
    if (!activityTimer) {
      activityTimer = window.setInterval(() => {
        if (user && lastActivityAt && Date.now() - lastActivityAt > SESSION_IDLE_LIMIT_MS) {
          logout().catch(() => null);
        }
      }, 60 * 1000);
    }
  }

  function isEmailVerified(currentUser) {
    return Boolean(currentUser?.email_confirmed_at || currentUser?.confirmed_at);
  }

  function loginLock(email) {
    const record = loginFailures.get(email);
    if (!record) return false;
    if (Date.now() >= record.lockedUntil) {
      loginFailures.delete(email);
      return false;
    }
    return record.attempts >= MAX_LOGIN_ATTEMPTS;
  }

  function recordLoginFailure(email) {
    const record = loginFailures.get(email) || { attempts: 0, lockedUntil: 0 };
    record.attempts += 1;
    if (record.attempts >= MAX_LOGIN_ATTEMPTS) record.lockedUntil = Date.now() + LOGIN_BACKOFF_MS;
    loginFailures.set(email, record);
  }

  function clearLoginFailures(email) {
    loginFailures.delete(email);
  }

  function signupLock(email) {
    const record = signupFailures.get(email);
    if (!record) return false;
    if (Date.now() >= record.lockedUntil) {
      signupFailures.delete(email);
      return false;
    }
    return record.attempts >= MAX_SIGNUP_ATTEMPTS;
  }

  function recordSignupFailure(email) {
    const record = signupFailures.get(email) || { attempts: 0, lockedUntil: 0 };
    record.attempts += 1;
    if (record.attempts >= MAX_SIGNUP_ATTEMPTS) record.lockedUntil = Date.now() + SIGNUP_BACKOFF_MS;
    signupFailures.set(email, record);
  }

  function clearSignupFailures(email) {
    signupFailures.delete(email);
  }

  async function requireVerifiedUser(currentUser, db) {
    if (!currentUser || isEmailVerified(currentUser)) return currentUser;
    await db.auth.signOut().catch(() => null);
    user = null;
    throw new Error("Email is not confirmed yet. Check your inbox, confirm the account, then login.");
  }

  async function profile(currentUser, name) {
    const fallback = name || currentUser.user_metadata?.username || currentUser.email?.split("@")[0] || "student";
    const db = getClient();
    if (!db) return fallback;

    try {
      const result = await db.from("profiles").select("username").eq("id", currentUser.id).maybeSingle();
      if (result.data?.username) return result.data.username;
      await db.from("profiles").upsert({ id: currentUser.id, username: fallback });
    } catch (error) {
      console.warn("Profile lookup failed; using fallback username.", error);
    }
    return fallback;
  }

  async function login(email, password) {
    email = normalizedEmail(email);
    try {
      if (!isValidEmail(email) || !password) throw new Error(GENERIC_LOGIN_ERROR);
      if (loginLock(email)) throw new Error("Too many login attempts. Please wait 15 minutes and try again.");
      const db = getClient();
      if (!db) throw new Error("Login system did not load. Continue as Guest or check internet.");

      const result = await db.auth.signInWithPassword({ email, password });
      if (result.error) {
        recordLoginFailure(email);
        throw new Error(GENERIC_LOGIN_ERROR);
      }

      user = await requireVerifiedUser(result.data.user, db);
      clearLoginFailures(email);
      guest = false;
      touchActivity();
      return { user, name: await profile(user) };
    } catch (error) {
      throw new Error(friendly(error));
    }
  }

  async function register(username, email, password, confirm) {
    try {
      if (!username || !email || !password || password !== confirm) {
        throw new Error("Check username, email, password and confirmation.");
      }
      if (!isValidEmail(email)) {
        throw new Error("Please enter a valid email address.");
      }
      if (password.length < PASSWORD_MIN_LENGTH) {
        throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      }

      email = normalizedEmail(email);
      if (signupLock(email)) throw new Error("Too many account-creation attempts. Please wait 30 minutes and try again.");
      const db = getClient();
      if (!db) throw new Error("Registration system did not load. Continue as Guest or check internet.");

      const result = await db.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${SITE_URL}/daily-quiz.html`,
        },
      });
      if (result.error) {
        recordSignupFailure(email);
        throw result.error;
      }

      clearSignupFailures(email);
      if (result.data?.session?.user) {
        user = await requireVerifiedUser(result.data.user, db);
        guest = false;
        touchActivity();
        return { user, name: await profile(user, username) };
      }

      return { pending: true, message: "Registered. Please check your email to confirm the account, then login." };
    } catch (error) {
      throw new Error(friendly(error));
    }
  }

  async function requestPasswordReset(email) {
    const genericMessage = "If an account exists for that email, a password reset link will be sent shortly. Check your inbox or spam folder.";
    try {
      const db = getClient();
      email = String(email || "").trim();
      if (!db) throw new Error("Password reset system did not load. Check internet and try again.");
      if (!email) throw new Error("Enter your registered email first.");
      if (!isValidEmail(email)) {
        throw new Error("Please enter a valid email address.");
      }

      const result = await db.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/reset-password.html` });
      if (result.error) throw result.error;
      return { message: genericMessage };
    } catch (error) {
      const text = String(error?.message || error || "").toLowerCase();
      if (isNetworkOrPausedProjectError(error)) {
        throw new Error("The online password-reset service is currently unreachable. Please try again later.");
      }
      if (text.includes("rate limit") || error?.status === 429) {
        throw new Error("Too many reset requests were made. Please wait and try again later.");
      }
      if (text.includes("enter your registered email") || text.includes("valid email address")) {
        throw new Error(error.message);
      }
      throw new Error(genericMessage);
    }
  }

  async function updatePassword(password, confirm) {
    try {
      const db = getClient();
      if (!db) throw new Error("Password reset system did not load.");
      if (!password || password.length < PASSWORD_MIN_LENGTH) throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      if (password !== confirm) throw new Error("Passwords do not match.");

      const result = await db.auth.updateUser({ password });
      if (result.error) throw result.error;
      user = result.data.user || user;
      guest = false;
      touchActivity();
      return { message: "Password changed successfully. Login with your new password." };
    } catch (error) {
      throw new Error(friendly(error));
    }
  }

  function asGuest() {
    guest = true;
    user = null;
    return { name: "Guest" };
  }

  async function logout() {
    const db = getClient();
    if (!guest && db) await db.auth.signOut().catch(() => null);
    user = null;
    guest = false;
  }

  async function restore() {
    const db = getClient();
    if (!db) return null;

    try {
      const { data } = await db.auth.getSession();
      if (data?.session?.user) {
        user = await requireVerifiedUser(data.session.user, db);
        guest = false;
        touchActivity();
        return { user, name: await profile(user) };
      }
    } catch (error) {
      console.warn("Quiz auth restore failed.", error);
    }
    return null;
  }

  return {
    getClient,
    login,
    register,
    requestPasswordReset,
    updatePassword,
    asGuest,
    logout,
    restore,
    get user() { return user; },
    get guest() { return guest; },
  };
})();
