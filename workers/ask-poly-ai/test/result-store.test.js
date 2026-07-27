/* Purpose: Result store authentication unit tests */
import test from "node:test";
import assert from "node:assert/strict";
import { authenticateStudent } from "../src/result-store.js";

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
    SUPABASE_SERVICE_ROLE_KEY: "service-key"
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://example.supabase.co/auth/v1/user");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    assert.equal(options.headers.apikey, "anon-key");
    return {
      ok: true,
      json: async () => ({ id: "user-123" })
    };
  };

  try {
    const student = await authenticateStudent(request, env);
    assert.equal(student.id, "user-123");
    assert.equal(student.token, "test-token");
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
