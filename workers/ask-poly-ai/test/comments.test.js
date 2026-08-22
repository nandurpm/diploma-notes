import test from "node:test";
import assert from "node:assert/strict";
import { commentsHealth, handleComments } from "../src/comments.js";

function request(body, method = "POST") {
  return new Request("https://api.polypmna.dpdns.org/api/help-comments", {
    method,
    headers: { Origin: "https://polypmna.dpdns.org", "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify(body) : undefined
  });
}

test("comments health reports writes disabled without a service credential", async () => {
  const response = commentsHealth({}, "https://polypmna.dpdns.org");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "public-help-comments", configured: false, writes: "disabled" });
  assert.equal(response.headers.get("access-control-allow-origin"), "https://polypmna.dpdns.org");
});

test("comments endpoint rejects unknown fields without contacting Firestore", async () => {
  const response = await handleComments(request({ pageId: "help", author: "Student", message: "Valid message", unexpected: true }), {} , "https://polypmna.dpdns.org");
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /unsupported fields/i);
});

test("comments endpoint rejects excess links", async () => {
  const response = await handleComments(request({ pageId: "help", author: "Student", message: "a https://one.example https://two.example https://three.example" }), {}, "https://polypmna.dpdns.org");
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /two per message/i);
});

test("valid comment returns a generic 503 when the server credential is absent", async () => {
  const response = await handleComments(request({ pageId: "help", author: "Student", message: "Please check the subject notes." }), {}, "https://polypmna.dpdns.org");
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "The discussion service is temporarily unavailable. Please try again later." });
});

test("comments endpoint rejects non-POST methods", async () => {
  const response = await handleComments(request({}, "GET"), {}, "https://polypmna.dpdns.org");
  assert.equal(response.status, 405);
});
