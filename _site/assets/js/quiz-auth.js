/* Purpose: Quiz auth - Descriptive comment added for clarity */
window.PolyQuizAuth = (() => {
  "use strict";

  let client = null;
  let user = null;
  let guest = false;

  const SITE_URL = window.location.origin;

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
    return client;
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
    try {
      const db = getClient();
      if (!db) throw new Error("Login system did not load. Continue as Guest or check internet.");

      const result = await db.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;

      user = result.data.user;
      guest = false;
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
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

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
      if (result.error) throw result.error;

      if (result.data?.session?.user) {
        user = result.data.user;
        guest = false;
        return { user, name: await profile(user, username) };
      }

      return { pending: true, message: "Registered. Please check your email to confirm the account, then login." };
    } catch (error) {
      throw new Error(friendly(error));
    }
  }

  async function requestPasswordReset(email) {
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
      return { message: "Password reset link sent. Check your email inbox or spam folder." };
    } catch (error) {
      throw new Error(friendly(error));
    }
  }

  async function updatePassword(password, confirm) {
    try {
      const db = getClient();
      if (!db) throw new Error("Password reset system did not load.");
      if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");
      if (password !== confirm) throw new Error("Passwords do not match.");

      const result = await db.auth.updateUser({ password });
      if (result.error) throw result.error;
      user = result.data.user || user;
      guest = false;
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
        user = data.session.user;
        guest = false;
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
