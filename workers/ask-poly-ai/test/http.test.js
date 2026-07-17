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
  assert.equal(headers["Access-Control-Allow-Headers"], "Content-Type");
  assert.equal(headers.Vary, "Origin");
});

test("jsonResponse serialises body, status and hardening headers", async () => {
  const env = { ALLOWED_ORIGINS: "https://a.com" };
  const response = jsonResponse({ ok: true }, 201, "https://a.com", env);
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Content-Type"), "application/json; charset=utf-8");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
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
