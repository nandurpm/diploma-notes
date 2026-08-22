import { cleanText, isPlainObject, jsonResponse, rejectUnknownKeys, requestLogContext, securityLog, strictJsonObject, strictText } from "./http.js";

const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects";
const MAX_LINKS = 2;
const TOKEN_SKEW_SECONDS = 60;
let tokenCache = { accessToken: "", expiresAt: 0, projectId: "" };

function baseUrl(projectId) {
  return `${FIRESTORE_BASE}/${encodeURIComponent(projectId)}/databases/(default)/documents/helpComments`;
}

function base64Url(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToBytes(pem) {
  const beginMarker = `-----${["BEGIN", "PRIVATE KEY"].join(" ")}-----`;
  const endMarker = `-----${["END", "PRIVATE KEY"].join(" ")}-----`;
  const body = String(pem || "")
    .replace(new RegExp(beginMarker, "g"), "")
    .replace(new RegExp(endMarker, "g"), "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function serviceAccount(env) {
  const raw = String(env?.FIREBASE_SERVICE_ACCOUNT_JSON || "").trim();
  if (!raw) return null;
  try {
    const account = JSON.parse(raw);
    const projectId = cleanText(account.project_id, 140);
    const clientEmail = cleanText(account.client_email, 240);
    const privateKey = String(account.private_key || "");
    if (!projectId || !clientEmail || !privateKey.includes(["BEGIN", "PRIVATE KEY"].join(" "))) return null;
    return { projectId, clientEmail, privateKey };
  } catch {
    return null;
  }
}

async function accessToken(env) {
  const account = serviceAccount(env);
  if (!account) throw new Error("Firebase comments service is not configured.");
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache.projectId === account.projectId && tokenCache.accessToken && tokenCache.expiresAt - TOKEN_SKEW_SECONDS > now) {
    return { account, token: tokenCache.accessToken };
  }

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: account.clientEmail,
    scope: FIRESTORE_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600
  }));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(account.privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claim}`));
  const assertion = `${header}.${claim}.${base64Url(signature)}`;
  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion })
  });
  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new Error(`Firebase token exchange failed with HTTP ${tokenResponse.status}.`);
  }
  tokenCache = {
    accessToken: String(tokenPayload.access_token),
    expiresAt: now + Number(tokenPayload.expires_in || 3600),
    projectId: account.projectId
  };
  return { account, token: tokenCache.accessToken };
}

function validatePayload(value) {
  const body = strictJsonObject(value);
  rejectUnknownKeys(body, ["pageId", "author", "message", "parentId"]);
  const pageId = strictText(body.pageId, "pageId", { min: 1, max: 20 });
  if (pageId !== "help") throw new TypeError("pageId is invalid.");
  const author = strictText(body.author, "author", { min: 2, max: 40 });
  const message = strictText(body.message, "message", { min: 1, max: 1500 });
  const parentId = body.parentId === undefined || body.parentId === null
    ? ""
    : strictText(body.parentId, "parentId", { max: 160, pattern: /^[A-Za-z0-9_-]*$/ });
  if ((message.match(/https?:\/\/|www\./gi) || []).length > MAX_LINKS) throw new TypeError("Please limit links to two per message.");
  return { pageId, author, message, parentId };
}

function firestoreFields(values) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { stringValue: String(value ?? "") }]));
}

async function createFirestoreComment(payload, env) {
  const { account, token } = await accessToken(env);
  const response = await fetch(baseUrl(account.projectId), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: firestoreFields({
        ...payload,
        uid: "public",
        createdAt: new Date().toISOString()
      })
    })
  });
  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Firestore write failed with HTTP ${response.status}.`);
  return responseBody;
}

export function commentsHealth(env, origin = "") {
  const configured = Boolean(serviceAccount(env));
  return jsonResponse({ ok: true, service: "public-help-comments", configured, writes: configured ? "enabled" : "disabled" }, 200, origin, env);
}

export async function handleComments(request, env, origin = "") {
  const logContext = requestLogContext(request);
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405, origin, env);
  let body;
  try {
    body = validatePayload(await request.json());
  } catch (error) {
    securityLog("comment_validation_failed", { ...logContext, route: "help_comments", severity: "warning", error: error?.message });
    return jsonResponse({ error: error?.message || "Invalid comment." }, 400, origin, env);
  }
  try {
    const document = await createFirestoreComment(body, env);
    securityLog("comment_created", { ...logContext, route: "help_comments", parent: Boolean(body.parentId) });
    return jsonResponse({ ok: true, id: String(document.name || "").split("/").pop() || "", comment: { ...body, uid: "public", createdAt: new Date().toISOString() } }, 201, origin, env);
  } catch (error) {
    securityLog("comment_write_failed", { ...logContext, route: "help_comments", severity: "error", error: error?.message });
    console.error("Public help comment write failed.", error);
    return jsonResponse({ error: "The discussion service is temporarily unavailable. Please try again later." }, 503, origin, env);
  }
}
