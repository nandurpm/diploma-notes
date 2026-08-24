import assert from "node:assert/strict";
import test from "node:test";
import { askPoly, askPolyStream, configuredProviders } from "../src/ask-handler.js";

const baseEnv = {
  AI_PROVIDER_ORDER: "openrouter,nvidia,gemini",
  OPENROUTER_API_KEY: "test-openrouter-key",
  NVIDIA_API_KEY: "test-nvidia-key",
  GEMINI_API_KEY: "test-gemini-key",
  OPENROUTER_MODEL: "test/openrouter-model",
  NVIDIA_MODEL: "test/nvidia-model",
  GEMINI_MODEL: "gemini-2.0-flash",
  PROVIDER_TIMEOUT_MS: "1000",
  MAX_OUTPUT_TOKENS: "128",
  AI_TEMPERATURE: "0.2",
  AI_TOP_P: "0.9"
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function sseResponse(text) {
  const body = `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`;
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" }
  });
}

function installFetch({ openrouter = "fail", nvidia = "success", gemini = "success", calls }) {
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url);
    const mode = target.includes("openrouter.ai")
      ? openrouter
      : target.includes("integrate.api.nvidia.com")
        ? nvidia
        : target.includes("generativelanguage.googleapis.com")
          ? gemini
          : "unexpected";
    calls.push({ provider: mode, url: target, body: options.body || "" });

    if (mode === "fail") return jsonResponse({ error: { message: "simulated outage" } }, 503);
    if (mode === "success") {
      if (target.includes("generativelanguage.googleapis.com")) {
        return jsonResponse({
          candidates: [{ content: { parts: [{ text: "Gemini fallback answer" }] } }]
        });
      }
      return jsonResponse({
        model: target.includes("nvidia") ? "test/nvidia-model" : "test/openrouter-model",
        choices: [{ message: { content: target.includes("nvidia") ? "NVIDIA fallback answer" : "OpenRouter answer" } }]
      });
    }
    throw new Error(`Unexpected test mode: ${mode}`);
  };
}

test("configured provider order includes OpenRouter, NVIDIA, then Gemini", () => {
  assert.deepEqual(configuredProviders(baseEnv), ["openrouter", "nvidia", "gemini"]);
});

test("NVIDIA answers when OpenRouter is intentionally unavailable", async () => {
  const calls = [];
  installFetch({ openrouter: "fail", nvidia: "success", gemini: "success", calls });
  const result = await askPoly({ message: "Explain Ohm's law", history: [] }, baseEnv);
  assert.equal(result.provider, "nvidia");
  assert.equal(result.answer, "NVIDIA fallback answer");
  assert.equal(calls[0].provider, "fail");
  assert.equal(calls.at(-1).provider, "success");
  assert.ok(calls.slice(0, -1).every((call) => call.provider === "fail"));
  assert.ok(calls.some((call) => /openrouter\.ai/.test(call.url)));
  assert.match(calls.at(-1).url, /integrate\.api\.nvidia\.com/);
});

test("Gemini answers when both OpenRouter and NVIDIA are unavailable", async () => {
  const calls = [];
  installFetch({ openrouter: "fail", nvidia: "fail", gemini: "success", calls });
  const result = await askPoly({ message: "Explain a transformer", history: [] }, baseEnv);
  assert.equal(result.provider, "gemini");
  assert.equal(result.answer, "Gemini fallback answer");
  assert.ok(calls.length >= 3);
  assert.equal(calls.at(-1).provider, "success");
  assert.ok(calls.slice(0, -1).every((call) => call.provider === "fail"));
  assert.match(calls.at(-1).url, /generativelanguage\.googleapis\.com/);
});

test("streaming fallback reaches NVIDIA after OpenRouter fails", async () => {
  const calls = [];
  installFetch({ openrouter: "fail", nvidia: "success", gemini: "success", calls });
  const result = await askPolyStream({ message: "Explain voltage", history: [] }, baseEnv);
  assert.equal(result.provider, "nvidia");
  const text = await new Response(result.stream).text();
  assert.match(text, /NVIDIA fallback answer/);
  assert.equal(calls[0].provider, "fail");
  assert.equal(calls.at(-1).provider, "success");
  assert.match(calls.at(-1).url, /integrate\.api\.nvidia\.com/);
});

// Keep the imported streaming API exercised while making this test file safe for Node's test runner.
void sseResponse;
