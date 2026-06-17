"use strict";

const crypto = require("node:crypto");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const collegeDirectory = require("./data/polytechnic-colleges.json");

initializeApp();
setGlobalOptions({
  region: "asia-south1",
  maxInstances: 20,
  memory: "256MiB",
  timeoutSeconds: 30
});

const db = getFirestore();
const auth = getAuth();
const WEB_API_KEY = process.env.WEB_API_KEY || "AIzaSyDgdpLgYNZL_KQguMmCI5wZH3b11PXpWvk";
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._]{2,18}[a-z0-9])$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESERVATION_TTL_MS = 10 * 60 * 1000;

const collegesByDistrict = new Map(
  collegeDirectory.districts.map((item) => [item.name, new Set(item.colleges)])
);

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validateUsername(username) {
  if (!USERNAME_PATTERN.test(username)) {
    throw new HttpsError(
      "invalid-argument",
      "Username must contain 4–20 lowercase letters, numbers, dot or underscore."
    );
  }
}

function validatePassword(password) {
  if (!PASSWORD_PATTERN.test(password)) {
    throw new HttpsError(
      "invalid-argument",
      "Password must contain at least 8 characters, including a letter and a number."
    );
  }
}

function validateEmail(email) {
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new HttpsError("invalid-argument", "Enter a valid recovery email address.");
  }
}

function validateCollege(district, college) {
  if (!collegesByDistrict.has(district) || !collegesByDistrict.get(district).has(college)) {
    throw new HttpsError(
      "invalid-argument",
      "Select a valid college from the selected Kerala district."
    );
  }
}

function safeRequestFingerprint(request, action) {
  const forwarded = request.rawRequest?.headers?.["x-forwarded-for"];
  const ip = String(Array.isArray(forwarded) ? forwarded[0] : forwarded || request.rawRequest?.ip || "unknown")
    .split(",")[0]
    .trim();
  const agent = String(request.rawRequest?.headers?.["user-agent"] || "").slice(0, 180);
  return crypto.createHash("sha256").update(`${action}|${ip}|${agent}`).digest("hex");
}

async function enforceRateLimit(request, action, maximum, windowMs) {
  const bucket = Math.floor(Date.now() / windowMs);
  const fingerprint = safeRequestFingerprint(request, action);
  const reference = db.doc(`privateRateLimits/${action}_${fingerprint}_${bucket}`);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    const current = snapshot.exists ? Number(snapshot.data().count || 0) : 0;

    if (current >= maximum) {
      throw new HttpsError("resource-exhausted", "Too many attempts. Please wait and try again.");
    }

    transaction.set(
      reference,
      {
        action,
        count: current + 1,
        expiresAt: Timestamp.fromMillis((bucket + 2) * windowMs),
        updatedAt: Timestamp.now()
      },
      { merge: true }
    );
  });
}

async function identityToolkitRequest(endpoint, body) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${encodeURIComponent(WEB_API_KEY)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = String(payload?.error?.message || "IDENTITY_TOOLKIT_ERROR");
    const error = new Error(code);
    error.identityCode = code;
    throw error;
  }

  return payload;
}

function isStaleReservation(data) {
  return (
    data?.state === "reserved" &&
    data?.reservedAt?.toMillis &&
    data.reservedAt.toMillis() < Date.now() - RESERVATION_TTL_MS
  );
}

function genericCredentialError() {
  return new HttpsError("unauthenticated", "Invalid username or password.");
}

exports.checkUsernameAvailability = onCall(async (request) => {
  await enforceRateLimit(request, "username-check", 60, 10 * 60 * 1000);

  const username = normalizeUsername(request.data?.username);
  validateUsername(username);

  const snapshot = await db.doc(`usernames/${username}`).get();
  return { available: !snapshot.exists || isStaleReservation(snapshot.data()) };
});

exports.createStudentAccount = onCall(async (request) => {
  await enforceRateLimit(request, "account-create", 8, 30 * 60 * 1000);

  const username = normalizeUsername(request.data?.username);
  const password = String(request.data?.password || "");
  const email = normalizeEmail(request.data?.email);
  const district = String(request.data?.district || "").trim();
  const college = String(request.data?.college || "").trim();

  validateUsername(username);
  validatePassword(password);
  validateEmail(email);
  validateCollege(district, college);

  const usernameReference = db.doc(`usernames/${username}`);
  const reservationId = crypto.randomUUID();
  let createdUser = null;

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(usernameReference);

    if (snapshot.exists && !isStaleReservation(snapshot.data())) {
      throw new HttpsError("already-exists", "This username is already taken.");
    }

    transaction.set(usernameReference, {
      state: "reserved",
      reservationId,
      reservedAt: Timestamp.now()
    });
  });

  try {
    createdUser = await auth.createUser({
      email,
      password,
      displayName: username,
      emailVerified: false,
      disabled: false
    });

    const userReference = db.doc(`users/${createdUser.uid}`);
    const batch = db.batch();

    batch.set(userReference, {
      username,
      recoveryEmail: email,
      district,
      college,
      role: "student",
      status: "pending-verification",
      emailVerified: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    batch.set(usernameReference, {
      uid: createdUser.uid,
      email,
      state: "active",
      status: "pending-verification",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await batch.commit();

    const customToken = await auth.createCustomToken(createdUser.uid, {
      role: "student",
      username
    });

    return {
      customToken,
      username,
      verificationRequired: true
    };
  } catch (error) {
    logger.error("Student account creation failed.", {
      code: error?.code || error?.identityCode || "unknown",
      username
    });

    if (createdUser) {
      await auth.deleteUser(createdUser.uid).catch(() => undefined);
    }

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(usernameReference);
      if (snapshot.exists && snapshot.data().reservationId === reservationId) {
        transaction.delete(usernameReference);
      }
    }).catch(() => undefined);

    if (error instanceof HttpsError) throw error;
    if (error?.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "This recovery email is already connected to another account.");
    }
    if (error?.code === "auth/invalid-password" || error?.code === "auth/invalid-email") {
      throw new HttpsError("invalid-argument", "The account details are invalid.");
    }
    throw new HttpsError("internal", "Account creation failed.");
  }
});

exports.loginWithUsername = onCall(async (request) => {
  await enforceRateLimit(request, "account-login", 15, 15 * 60 * 1000);

  const username = normalizeUsername(request.data?.username);
  const password = String(request.data?.password || "");

  if (!USERNAME_PATTERN.test(username) || !password || password.length > 128) {
    throw genericCredentialError();
  }

  const usernameSnapshot = await db.doc(`usernames/${username}`).get();
  if (!usernameSnapshot.exists || usernameSnapshot.data().state !== "active") {
    throw genericCredentialError();
  }

  const mapping = usernameSnapshot.data();
  let signInResult;

  try {
    signInResult = await identityToolkitRequest("accounts:signInWithPassword", {
      email: mapping.email,
      password,
      returnSecureToken: true
    });
  } catch (error) {
    const invalidCodes = new Set([
      "INVALID_LOGIN_CREDENTIALS",
      "EMAIL_NOT_FOUND",
      "INVALID_PASSWORD",
      "USER_DISABLED"
    ]);

    if (invalidCodes.has(error.identityCode)) {
      throw genericCredentialError();
    }

    logger.error("Identity Toolkit login failed.", {
      code: error.identityCode || "unknown",
      username
    });
    throw new HttpsError("unavailable", "The login service is temporarily unavailable.");
  }

  if (signInResult.localId !== mapping.uid) {
    logger.error("Username mapping UID mismatch.", { username });
    throw new HttpsError("failed-precondition", "This account requires administrator review.");
  }

  const [userRecord, profileSnapshot] = await Promise.all([
    auth.getUser(mapping.uid),
    db.doc(`users/${mapping.uid}`).get()
  ]);

  const profile = profileSnapshot.exists ? profileSnapshot.data() : {};
  if (userRecord.disabled || ["suspended", "deleted", "blocked"].includes(profile.status)) {
    throw new HttpsError("permission-denied", "This account is not permitted to sign in.");
  }

  if (userRecord.emailVerified) {
    const batch = db.batch();
    batch.set(
      db.doc(`users/${mapping.uid}`),
      {
        emailVerified: true,
        status: "active",
        lastLoginAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      { merge: true }
    );
    batch.set(
      db.doc(`usernames/${username}`),
      {
        status: "active",
        updatedAt: Timestamp.now()
      },
      { merge: true }
    );
    await batch.commit();
  } else {
    await db.doc(`users/${mapping.uid}`).set(
      { lastLoginAt: Timestamp.now(), updatedAt: Timestamp.now() },
      { merge: true }
    );
  }

  const customToken = await auth.createCustomToken(mapping.uid, {
    role: "student",
    username
  });

  return {
    customToken,
    username,
    emailVerified: userRecord.emailVerified
  };
});

exports.requestPasswordReset = onCall(async (request) => {
  await enforceRateLimit(request, "password-reset", 6, 30 * 60 * 1000);

  const username = normalizeUsername(request.data?.username);
  if (!USERNAME_PATTERN.test(username)) {
    return { accepted: true };
  }

  const snapshot = await db.doc(`usernames/${username}`).get();
  if (!snapshot.exists || snapshot.data().state !== "active") {
    return { accepted: true };
  }

  try {
    await identityToolkitRequest("accounts:sendOobCode", {
      requestType: "PASSWORD_RESET",
      email: snapshot.data().email,
      continueUrl: "https://polypmna.dpdns.org/student-account.html",
      canHandleCodeInApp: false
    });
  } catch (error) {
    logger.warn("Password reset email request was not sent.", {
      code: error.identityCode || "unknown",
      username
    });
  }

  return { accepted: true };
});
