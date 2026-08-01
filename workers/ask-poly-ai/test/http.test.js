/* Purpose: Http - Descriptive comment added for clarity */
import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanText,
  allowedOrigins,
  isOriginAllowed,
  corsHeaders,
  jsonResponse,
  createRateLimiter
} from "../src/http.js";
import secureIndex from "../src/secure-index.js";

function fakeRequest(headers = {}) {
  return {
    headers: {
      get: (name) => (name in headers ? headers[name] : null)
    }
  };
}

test("cleanText coerces non-strings and trims", () => {
  assert.equal(cleanText("  hello  "), "hello");
  assert.equal(cleanText(null), "");
  assert.equal(cleanText(undefined), "");
  assert.equal(cleanText(0), "");
  assert.equal(cleanText(123), "123");
});

test("cleanText strips null bytes and enforces max length", () => {
  assert.equal(cleanText("a\u0000b"), "ab");
  assert.equal(cleanText("abcdef", 3), "abc");
  assert.equal(cleanText("x".repeat(20000)).length, 10000);
});

test("allowedOrigins falls back to defaults when unset", () => {
  const origins = allowedOrigins({});
  assert.ok(origins instanceof Set);
  assert.ok(origins.has("https://polypmna.dpdns.org"));
  assert.ok(origins.has("http://localhost:8000"));
});

test("allowedOrigins parses a configured comma list", () => {
  const origins = allowedOrigins({ ALLOWED_ORIGINS: "https://a.com, https://b.com ," });
  assert.deepEqual([...origins], ["https://a.com", "https://b.com"]);
  assert.ok(!origins.has("https://polypmna.dpdns.org"));
});

test("isOriginAllowed permits empty origin and configured origins", () => {
  const env = { ALLOWED_ORIGINS: "https://a.com" };
  assert.equal(isOriginAllowed("", env), true);
  assert.equal(isOriginAllowed(undefined, env), true);
  assert.equal(isOriginAllowed("https://a.com", env), true);
  assert.equal(isOriginAllowed("https://evil.com", env), false);
});

test("corsHeaders echoes allowed origin and defaults otherwise", () => {
  const env = { ALLOWED_ORIGINS: "https://a.com" };
  assert.equal(corsHeaders("https://a.com", env)["Access-Control-Allow-Origin"], "https://a.com");
  assert.equal(
    corsHeaders("https://evil.com", env)["Access-Control-Allow-Origin"],
    "https://polypmna.dpdns.org"
  );
  const headers = corsHeaders("", {});
  assert.equal(headers["Access-Control-Allow-Methods"], "GET, POST, OPTIONS");
  assert.equal(headers["Access-Control-Allow-Headers"], "Content-Type, Authorization");
  assert.equal(headers.Vary, "Origin");
});

test("jsonResponse serialises body, status and hardening headers", async () => {
  const env = { ALLOWED_ORIGINS: "https://a.com" };
  const response = jsonResponse({ ok: true }, 201, "https://a.com", env);
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Content-Type"), "application/json; charset=utf-8");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
  assert.equal(response.headers.get("Content-Security-Policy"), "default-src 'none'");
  assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://a.com");
  assert.deepEqual(await response.json(), { ok: true });
});

test("createRateLimiter allows up to the maximum then blocks", () => {
  const limiter = createRateLimiter(3);
  const request = fakeRequest({ "CF-Connecting-IP": "1.1.1.1" });
  assert.equal(limiter(request), true);
  assert.equal(limiter(request), true);
  assert.equal(limiter(request), true);
  assert.equal(limiter(request), false);
});

test("createRateLimiter tracks callers independently and reads X-Forwarded-For", () => {
  const limiter = createRateLimiter(1);
  const a = fakeRequest({ "CF-Connecting-IP": "1.1.1.1" });
  const b = fakeRequest({ "X-Forwarded-For": "2.2.2.2, 9.9.9.9" });
  const unknown = fakeRequest();
  assert.equal(limiter(a), true);
  assert.equal(limiter(a), false);
  assert.equal(limiter(b), true);
  assert.equal(limiter(b), false);
  assert.equal(limiter(unknown), true);
  assert.equal(limiter(unknown), false);
});

test("createRateLimiter sanitizes and limits key length for IP address", () => {
  const limiter = createRateLimiter(1);
  const malicious = fakeRequest({ "CF-Connecting-IP": "1.2.3.4; ghk xyz" });
  const superLong = fakeRequest({ "CF-Connecting-IP": "a".repeat(100) });

  // "1.2.3.4; ghk xyz" should be sanitized to "1.2.3.4"
  // "a".repeat(100) should be sanitized to "a".repeat(45) and allowed (since a-f are valid hex chars)
  assert.equal(limiter(malicious), true);
  assert.equal(limiter(malicious), false);

  // A different request with the same sanitized IP "1.2.3.4" should be blocked because it maps to the same sanitized key
  const identicalSanitized = fakeRequest({ "CF-Connecting-IP": "1.2.3.4" });
  assert.equal(limiter(identicalSanitized), false);

  assert.equal(limiter(superLong), true);
  assert.equal(limiter(superLong), false);
});

test("secureIndex fetch rejects oversized POST request early", async () => {
  const request = {
    method: "POST",
    url: "https://example.com/api/ask-poly",
    headers: {
      get: (name) => {
        if (name.toLowerCase() === "content-length") return "1000000"; // > 40000
        if (name.toLowerCase() === "origin") return "https://polypmna.dpdns.org";
        return null;
      }
    }
  };
  const env = {};
  const response = await secureIndex.fetch(request, env, {});
  assert.equal(response.status, 413);
  const data = await response.json();
  assert.equal(data.error, "The request is too large.");
});

test("createRateLimiter prunes expired buckets when size exceeds 2000", () => {
  const originalDateNow = Date.now;
  let mockTime = 1000000;
  Date.now = () => mockTime;

  try {
    const limiter = createRateLimiter(1, 1000); // 1-request maximum, 1000ms window

    // Request for 10.0.0.0 is allowed once, but blocked on the second request at the same mockTime
    const initialRequest = fakeRequest({ "CF-Connecting-IP": "10.0.0.0" });
    assert.equal(limiter(initialRequest), true);
    assert.equal(limiter(initialRequest), false);

    // Populate remaining 1999 unique IP buckets at mockTime = 1000000
    for (let i = 1; i < 2000; i++) {
      const request = fakeRequest({ "CF-Connecting-IP": `10.0.0.${i}` });
      assert.equal(limiter(request), true);
    }

    // Advance time so all 2000 entries are expired (more than 1000ms later)
    mockTime += 5000;

    // Add a 2001st unique IP bucket. This triggers the pruning process.
    const triggeringRequest = fakeRequest({ "CF-Connecting-IP": "10.0.0.2000" });
    assert.equal(limiter(triggeringRequest), true);

    // Revert mockTime to verify which buckets were pruned and which were retained.
    // Since pruning reduces the map size to exactly 1500 elements, the oldest 501
    // buckets (10.0.0.0 to 10.0.0.500) should have been deleted (thus are no longer blocked).
    // The remaining buckets (10.0.0.501 to 10.0.0.1999) should have been retained (thus are still blocked).
    mockTime -= 5000;

    // 10.0.0.0 (oldest) should be pruned/deleted, so querying it at the original mockTime is allowed again
    assert.equal(limiter(initialRequest), true);

    // 10.0.0.500 (also in the first 501) should be pruned
    const prunedRequest = fakeRequest({ "CF-Connecting-IP": "10.0.0.500" });
    assert.equal(limiter(prunedRequest), true);

    // 10.0.0.501 (the 502nd element) should NOT be pruned and still be blocked at initial mockTime
    const retainedRequest = fakeRequest({ "CF-Connecting-IP": "10.0.0.501" });
    assert.equal(limiter(retainedRequest), false);

    // 10.0.0.1999 should also NOT be pruned and still be blocked
    const anotherRetained = fakeRequest({ "CF-Connecting-IP": "10.0.0.1999" });
    assert.equal(limiter(anotherRetained), false);

  } finally {
    Date.now = originalDateNow;
  }
});
