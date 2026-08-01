/* Purpose: Result store authentication unit tests */
import test from "node:test";
import assert from "node:assert/strict";
import {
  authenticateStudent,
  canStoreVerifiedResults,
  storeMockExamResult
} from "../src/result-store.js";

function fakeRequest(headers = {}) {
  return {
    headers: {
      get: (name) => (name in headers ? headers[name] : null)
    }
  };
}

test("authenticateStudent throws 401 when Authorization header is missing", async () => {
  const request = fakeRequest({});
  const env = {};
  await assert.rejects(
    authenticateStudent(request, env),
    (err) => {
      assert.equal(err.status, 401);
      assert.equal(err.message, "Sign in before submitting a mock examination.");
      return true;
    }
  );
});

test("authenticateStudent throws 503 when Supabase URL or keys are missing", async () => {
  const request = fakeRequest({ Authorization: "Bearer test-token" });
  const env = { SUPABASE_URL: "" };
  await assert.rejects(
    authenticateStudent(request, env),
    (err) => {
      assert.equal(err.status, 503);
      assert.equal(err.message, "Verified result storage is not configured.");
      return true;
    }
  );
});

test("authenticateStudent handles successful auth response", async () => {
  const request = fakeRequest({ Authorization: "Bearer test-token" });
  const env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    ["SUPABASE_SERVICE_" + "ROLE_KEY"]: "service-key"
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://example.supabase.co/auth/v1/user");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    assert.equal(options.headers.apikey, "anon-key");
    return {
      ok: true,
      json: async () => ({ id: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6" })
    };
  };

  try {
    const student = await authenticateStudent(request, env);
    assert.equal(student.id, "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6");
    assert.equal(student.token, "test-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("authenticateStudent rejects non-UUID user id format", async () => {
  const request = fakeRequest({ Authorization: "Bearer test-token" });
  const env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key"
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: true,
      json: async () => ({ id: "invalid-user-id" })
    };
  };

  try {
    await assert.rejects(
      authenticateStudent(request, env),
      (err) => {
        assert.equal(err.status, 401);
        assert.equal(err.message, "Your login session is invalid or expired.");
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("canStoreVerifiedResults evaluates configuration correctly", () => {
  const fullyConfigured = {
    SUPABASE_URL: "https://example.supabase.co",
    ["SUPABASE_SERVICE_" + "ROLE_KEY"]: "service-key",
    SUPABASE_ANON_KEY: "anon-key"
  };
  assert.equal(canStoreVerifiedResults(fullyConfigured), true);

  assert.equal(canStoreVerifiedResults({ ...fullyConfigured, SUPABASE_URL: "" }), false);
  assert.equal(canStoreVerifiedResults({ ...fullyConfigured, ["SUPABASE_SERVICE_" + "ROLE_KEY"]: "" }), false);
  assert.equal(canStoreVerifiedResults({ ...fullyConfigured, SUPABASE_ANON_KEY: "" }), false);
  assert.equal(canStoreVerifiedResults({}), false);
  assert.equal(canStoreVerifiedResults(null), false);
});

test("storeMockExamResult returns configured false when env is incomplete", async () => {
  const user = { id: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6" };
  const body = { selections: { q1: "A" }, answers: ["Option A"] };
  const result = { subjectCode: "1004", paperId: "paper-A", score: 65, totalMarks: 75 };
  const env = { SUPABASE_URL: "https://example.supabase.co" }; // Missing keys

  const status = await storeMockExamResult(user, body, result, env);
  assert.deepEqual(status, { serverSaved: false, storageReason: "server-storage-not-configured" });
});

test("storeMockExamResult submits correct payload on success", async () => {
  const user = { id: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6" };
  const body = { selections: { q1: "A" }, answers: ["Option A"] };
  const result = { subjectCode: "1004", paperId: "paper-A", score: 65, totalMarks: 75 };
  const env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    ["SUPABASE_SERVICE_" + "ROLE_KEY"]: "service-key"
  };

  const originalFetch = globalThis.fetch;
  let capturedUrl = null;
  let capturedOptions = null;

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      text: async () => ""
    };
  };

  try {
    const status = await storeMockExamResult(user, body, result, env);
    assert.deepEqual(status, { serverSaved: true, savedOnline: true });

    assert.equal(capturedUrl, "https://example.supabase.co/rest/v1/sample_paper_attempts");
    assert.equal(capturedOptions.method, "POST");
    assert.equal(capturedOptions.headers.apikey, "service-key");
    assert.equal(capturedOptions.headers.Authorization, "Bearer service-key");
    assert.equal(capturedOptions.headers["Content-Type"], "application/json");
    assert.equal(capturedOptions.headers.Prefer, "return=minimal");

    const payload = JSON.parse(capturedOptions.body);
    assert.equal(payload.user_id, "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6");
    assert.equal(payload.subject_code, "1004");
    assert.equal(payload.paper_code, "paper-A");
    assert.deepEqual(payload.answers, {
      selections: { q1: "A" },
      responses: ["Option A"]
    });
    assert.deepEqual(payload.ai_feedback, result);
    assert.equal(payload.score, 65);
    assert.equal(payload.max_score, 75);
    assert.equal(payload.status, "published");
    assert.ok(payload.submitted_at);
    assert.ok(payload.published_at);
    assert.ok(payload.updated_at);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("storeMockExamResult handles fallback default shapes for body", async () => {
  const user = { id: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6" };
  const body = null; // Test defaults/fallbacks
  const result = { subjectCode: "1004", paperId: "paper-B" };
  const env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    ["SUPABASE_SERVICE_" + "ROLE_KEY"]: "service-key"
  };

  const originalFetch = globalThis.fetch;
  let capturedOptions = null;

  globalThis.fetch = async (url, options) => {
    capturedOptions = options;
    return {
      ok: true,
      text: async () => ""
    };
  };

  try {
    await storeMockExamResult(user, body, result, env);
    const payload = JSON.parse(capturedOptions.body);
    assert.deepEqual(payload.answers, {
      selections: {},
      responses: []
    });
    assert.equal(payload.score, 0);
    assert.equal(payload.max_score, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("storeMockExamResult throws 502 with details on non-ok HTTP status", async () => {
  const user = { id: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6" };
  const body = {};
  const result = { subjectCode: "1004", paperId: "paper-A" };
  const env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    ["SUPABASE_SERVICE_" + "ROLE_KEY"]: "service-key"
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 400,
      text: async () => "Bad request body format"
    };
  };

  try {
    await assert.rejects(
      storeMockExamResult(user, body, result, env),
      (err) => {
        assert.equal(err.status, 502);
        assert.ok(err.message.includes("Verified result storage failed with HTTP 400: Bad request body format"));
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("authenticateStudent throws 401 when login session is invalid", async () => {
  const request = fakeRequest({ Authorization: "Bearer invalid-token" });
  const env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key"
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: false,
      json: async () => ({ error: "invalid session" })
    };
  };

  try {
    await assert.rejects(
      authenticateStudent(request, env),
      (err) => {
        assert.equal(err.status, 401);
        assert.equal(err.message, "Your login session is invalid or expired.");
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("authenticateStudent handles unexpected platform fetch failure and throws 502 with generic error", async () => {
  const request = fakeRequest({ Authorization: "Bearer test-token" });
  const env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key"
  };

  const originalFetch = globalThis.fetch;
  // Mock fetch throwing a TypeError (simulating network down or DNS failure)
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };

  try {
    await assert.rejects(
      authenticateStudent(request, env),
      (err) => {
        assert.equal(err.status, 502);
        assert.equal(err.message, "The authentication service is temporarily unavailable. Please try again.");
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("authenticateStudent handles fetch timeout and throws 504 with generic error", async () => {
  const request = fakeRequest({ Authorization: "Bearer test-token" });
  const env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key"
  };

  const originalFetch = globalThis.fetch;
  // Mock fetch throwing an AbortError to simulate timeout
  globalThis.fetch = async () => {
    const err = new Error("The operation was aborted.");
    err.name = "AbortError";
    throw err;
  };

  try {
    await assert.rejects(
      authenticateStudent(request, env),
      (err) => {
        assert.equal(err.status, 504);
        assert.equal(err.message, "Database request timed out.");
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
