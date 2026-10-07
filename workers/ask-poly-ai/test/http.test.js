/* Purpose: Http - Descriptive comment added for clarity */
import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanText,
  allowedOrigins,
  isOriginAllowed,
  corsHeaders,
  jsonResponse,
  createRateLimiter,
  safeLogValue,
  isSafeExternalUrl
} from "../src/http.js";
import { askPoly } from "../src/ask-handler.js";
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
  assert.ok(origins.has("https://gptcperinthalmanna.vercel.app"));
  assert.ok(origins.has("https://gptcperinthalmanna.dpdns.org"));
  assert.ok(origins.has("http://localhost:8000"));
});


test("allowedOrigins handles a missing environment object", () => {
  const origins = allowedOrigins();
  assert.ok(origins.has("https://polypmna.dpdns.org"));
  assert.equal(isOriginAllowed("https://polypmna.dpdns.org"), true);
  assert.equal(corsHeaders("https://polypmna.dpdns.org")["Access-Control-Allow-Origin"], "https://polypmna.dpdns.org");
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

test("default CORS headers allow the Vercel production site", () => {
  const origin = "https://gptcperinthalmanna.vercel.app";
  assert.equal(isOriginAllowed(origin, {}), true);
  assert.equal(corsHeaders(origin, {})["Access-Control-Allow-Origin"], origin);
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

test("createRateLimiter tracks trusted callers and ignores spoofed X-Forwarded-For", () => {
  const limiter = createRateLimiter(1);
  const a = fakeRequest({ "CF-Connecting-IP": "1.1.1.1" });
  const b = fakeRequest({ "X-Forwarded-For": "2.2.2.2, 9.9.9.9" });
  const unknown = fakeRequest();
  assert.equal(limiter(a), true);
  assert.equal(limiter(a), false);
  assert.equal(limiter(b), true);
  assert.equal(limiter(b), false);
  assert.equal(limiter(unknown), false);
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

test("secureIndex handles auth failure and validates HTTP status code within safe range", async () => {
  const request = {
    method: "POST",
    url: "https://example.com/api/evaluate-mock-exam",
    headers: {
      get: (name) => {
        if (name.toLowerCase() === "origin") return "https://polypmna.dpdns.org";
        return null;
      }
    }
  };
  const env = {};
  const response = await secureIndex.fetch(request, env, {});
  assert.equal(response.status, 401);
  const data = await response.json();
  assert.ok(data.error);
});

test("safeLogValue redacts sensitive keys and embedded secret tokens", () => {
  const sample = {
    route: "mock_exam",
    status: 401,
    private_key: "secret-data",
    auth: "token-data",
    jwt: "jwt-data",
    credential: "cred-data",
    error: "Failed to authenticate Bearer eyJhbGciOiJIUzI1NiJ9 using sk_live_1234567890abc"
  };
  const sanitized = safeLogValue(sample);
  assert.equal(sanitized.route, "mock_exam");
  assert.equal(sanitized.status, 401);
  assert.equal(sanitized.private_key, "[REDACTED]");
  assert.equal(sanitized.auth, "[REDACTED]");
  assert.equal(sanitized.jwt, "[REDACTED]");
  assert.equal(sanitized.credential, "[REDACTED]");
  assert.equal(
    sanitized.error,
    "Failed to authenticate Bearer [REDACTED] using [REDACTED_KEY]"
  );
});

test("safeLogValue filters prototype properties and dangerous keys", () => {
  const baseObj = { inheritedProp: "should_be_ignored" };
  const testObj = Object.create(baseObj);
  testObj.route = "ask";
  testObj.constructor = "malicious_constructor";
  testObj.__proto__ = "malicious_proto";
  testObj.prototype = "malicious_prototype";

  const sanitized = safeLogValue(testObj);
  assert.equal(sanitized.route, "ask");
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, "inheritedProp"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, "constructor"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, "__proto__"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, "prototype"), false);
});
 test("safeLogValue redacts OpenAI project keys", () => {
  assert.equal(safeLogValue("failure sk-proj-testkey"), "failure [REDACTED_KEY]");
});

test("isSafeExternalUrl permits valid public http/https URLs and blocks SSRF targets", () => {
  assert.equal(isSafeExternalUrl("https://api.openai.com/v1"), true);
  assert.equal(isSafeExternalUrl("http://external-ai-provider.org/v1/chat"), true);

  // Non-HTTP(S) schemes
  assert.equal(isSafeExternalUrl("ftp://example.com"), false);
  assert.equal(isSafeExternalUrl("file:///etc/passwd"), false);
  assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);

  // Hostnames
  assert.equal(isSafeExternalUrl("http://localhost"), false);
  assert.equal(isSafeExternalUrl("http://localhost:8080"), false);
  assert.equal(isSafeExternalUrl("https://app.local"), false);
  assert.equal(isSafeExternalUrl("https://service.internal"), false);

  // IPv4 Private & Loopback & Metadata
  assert.equal(isSafeExternalUrl("http://127.0.0.1"), false);
  assert.equal(isSafeExternalUrl("http://127.0.0.1:8000"), false);
  assert.equal(isSafeExternalUrl("http://10.0.0.1"), false);
  assert.equal(isSafeExternalUrl("http://172.16.0.1"), false);
  assert.equal(isSafeExternalUrl("http://192.168.1.1"), false);
  assert.equal(isSafeExternalUrl("http://169.254.169.254/latest/meta-data/"), false);
  assert.equal(isSafeExternalUrl("http://100.64.0.1"), false);

  // IPv6 Loopback & Private & IPv4-mapped IPv6
  assert.equal(isSafeExternalUrl("http://[::1]"), false);
  assert.equal(isSafeExternalUrl("http://[::]"), false);
  assert.equal(isSafeExternalUrl("http://[0:0:0:0:0:0:0:0]"), false);
  assert.equal(isSafeExternalUrl("http://[fe80::1]"), false);
  assert.equal(isSafeExternalUrl("http://[fc00::1]"), false);
  assert.equal(isSafeExternalUrl("http://[::ffff:127.0.0.1]"), false);
  assert.equal(isSafeExternalUrl("http://[::ffff:7f00:1]"), false);
  assert.equal(isSafeExternalUrl("http://[::ffff:a9fe:a9fe]"), false);
  assert.equal(isSafeExternalUrl("http://[::ffff:10.0.0.1]"), false);
  assert.equal(isSafeExternalUrl("http://[::ffff:192.168.1.1]"), false);
});

test("askPoly with FREE_API_URL rejects SSRF targets", async () => {
  const env = {
    AI_PROVIDER_ORDER: "free-api",
    FREE_API_URL: "http://169.254.169.254/latest/meta-data/"
  };
  await assert.rejects(
    async () => {
      await askPoly({ message: "Hello AI" }, env);
    },
    (err) => {
      assert.match(err.message, /targets an unpermitted internal network resource/i);
      return true;
    }
  );
});

test('production rejects provider requests when rate-limit binding is missing or unavailable', async () => {
  for (const binding of [undefined, {limit: async () => {throw new Error('unavailable');}}]) {
    const response = await secureIndex.fetch(new Request('https://api.example.test/api/ask-poly', {
      method:'POST', headers:{'Content-Type':'application/json','CF-Connecting-IP':'1.2.3.4'}, body:JSON.stringify({message:'test'})
    }), {ENVIRONMENT:'production',ASK_RATE_LIMITER:binding}, {});
    assert.equal(response.status,429);
  }
});
