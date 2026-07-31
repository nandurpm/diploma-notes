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
