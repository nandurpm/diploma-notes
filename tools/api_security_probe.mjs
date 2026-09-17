import assert from "node:assert/strict";
import secureIndex from "../workers/ask-poly-ai/src/secure-index.js";

const origin = "https://polypmna.dpdns.org";
const baseEnv = { ALLOWED_ORIGINS: origin };

function request(path, { method = "POST", body, headers = {}, url = `https://ask-poly-ai.example.workers.dev${path}` } = {}) {
  const init = { method, headers: new Headers({ Origin: origin, ...headers }) };
  if (body !== undefined) init.body = typeof body === "string" ? body : JSON.stringify(body);
  return new Request(url, init);
}

async function probe(name, expectedStatus, req, env = baseEnv) {
  const response = await secureIndex.fetch(req, env, {});
  assert.equal(response.status, expectedStatus, `${name}: expected ${expectedStatus}, got ${response.status}`);
  return response;
}

await probe("HTTPS downgrade", 400, request("/api/ask-poly", { url: "http://ask-poly-ai.example.workers.dev/api/ask-poly" }));
await probe("blocked origin", 403, request("/api/ask-poly", { headers: { "Content-Type": "application/json", Origin: "https://evil.example" }, body: { message: "hello" } }));
await probe("non-JSON upload", 415, request("/api/ask-poly", { headers: { "Content-Type": "multipart/form-data; boundary=x" }, body: "--x--" }));
await probe("oversized request", 413, request("/api/ask-poly", { headers: { "Content-Type": "application/json", "Content-Length": "50001" }, body: { message: "x" } }));
await probe("malformed JSON", 400, request("/api/ask-poly", { headers: { "Content-Type": "application/json" }, body: "{not-json" }));
await probe("unknown request field", 400, request("/api/ask-poly", { headers: { "Content-Type": "application/json" }, body: { message: "hello", extraField: "unexpected" } }));
await probe("wrong message type", 400, request("/api/ask-poly", { headers: { "Content-Type": "application/json" }, body: { message: ["SELECT * FROM users;", "$(id)", "<script>alert(1)</script>"] } }));
await probe("unsafe data URL upload", 400, request("/api/ask-poly", { headers: { "Content-Type": "application/json" }, body: { message: "inspect file", attachment: { name: "x.png", type: "image/png", size: 12, dataUrl: "data:image/png;base64,AAAA" } } }));
await probe("obvious automation client", 403, request("/api/ask-poly", { headers: { "Content-Type": "application/json", "User-Agent": "python-requests/2.32" }, body: { message: "hello" } }));
await probe("distributed ask rate limit", 429, request("/api/ask-poly", { headers: { "Content-Type": "application/json" }, body: { message: "hello" } }), { ...baseEnv, ASK_RATE_LIMITER: { limit: async () => ({ success: false }) } });
await probe("distributed image rate limit", 429, request("/api/ask-poly", { headers: { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.10" }, body: { message: "generate an image of a circuit" } }), { ...baseEnv, ASK_RATE_LIMITER: { limit: async () => ({ success: true }) }, IMAGE_RATE_LIMITER: { limit: async () => ({ success: false }) } });
await probe("daily quiz invalid subject", 400, request("/api/grade-daily-quiz", { headers: { "Content-Type": "application/json" }, body: { subject: "1;DROP TABLE", answers: {} } }));
await probe("mock exam unauthenticated", 401, request("/api/evaluate-mock-exam", { headers: { "Content-Type": "application/json" }, body: { paperId: "1004-applied-chemistry-model-75", subjectCode: "1004", answers: [] } }));

console.log("PASS: 13 non-destructive API security probes");
