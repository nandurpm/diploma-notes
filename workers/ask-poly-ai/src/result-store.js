/* Purpose: Result store - Descriptive comment added for clarity */
const clean = (value, maximum = 500) => String(value || "").replace(/\u0000/g, "").trim().slice(0, maximum);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Secure fetch wrapper with AbortController timeout to prevent hanging connections */
async function fetchWithTimeout(url, options = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError" || String(error?.message || "").toLowerCase().includes("abort")) {
      const timeoutError = new Error("Database request timed out.");
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

function supabaseBase(env) {
  return clean(env?.SUPABASE_URL, 300).replace(/\/$/, "");
}

function bearerToken(request) {
  const value = request.headers.get("Authorization") || "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? clean(match[1], 4096).replace(/[\x00-\x1F\x7F]/g, "") : "";
}

export function canStoreVerifiedResults(env) {
  return Boolean(supabaseBase(env) && clean(env?.SUPABASE_SERVICE_ROLE_KEY, 4096) && clean(env?.SUPABASE_ANON_KEY, 4096));
}

export async function authenticateStudent(request, env) {
  const token = bearerToken(request);
  if (!token) throw Object.assign(new Error("Sign in before submitting a mock examination."), { status: 401 });
  const base = supabaseBase(env);
  const anonKey = clean(env?.SUPABASE_ANON_KEY, 4096);
  if (!base || !anonKey) throw Object.assign(new Error("Verified result storage is not configured."), { status: 503 });

  try {
    const response = await fetchWithTimeout(`${base}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        "X-Client-Info": "poly-pmna-worker/verified-results"
      }
    });
    const user = await response.json().catch(() => ({}));
    const userId = clean(user?.id, 80);
    if (!response.ok || !userId || !UUID_REGEX.test(userId)) {
      throw Object.assign(new Error("Your login session is invalid or expired."), { status: 401 });
    }
    return { id: userId, token };
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }
    console.error("Unexpected student authentication failure:", error);
    throw Object.assign(
      new Error("The authentication service is temporarily unavailable. Please try again."),
      { status: 502 }
    );
  }
}

export async function storeMockExamResult(user, body, result, env) {
  if (!canStoreVerifiedResults(env)) return { serverSaved: false, storageReason: "server-storage-not-configured" };
  const base = supabaseBase(env);
  const serviceKey = clean(env.SUPABASE_SERVICE_ROLE_KEY, 4096);
  const now = new Date().toISOString();
  const payload = {
    user_id: user.id,
    subject_code: result.subjectCode,
    paper_code: result.paperId,
    answers: {
      selections: body?.selections || {},
      responses: Array.isArray(body?.answers) ? body.answers : []
    },
    ai_feedback: result,
    score: Number(result.score || 0),
    max_score: Number(result.totalMarks || 0),
    status: "published",
    submitted_at: now,
    published_at: now,
    updated_at: now
  };

  const response = await fetchWithTimeout(`${base}/rest/v1/sample_paper_attempts`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const detail = clean(await response.text(), 500);
    const error = new Error(`Verified result storage failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}.`);
    error.status = 502;
    throw error;
  }
  return { serverSaved: true, savedOnline: true };
}
