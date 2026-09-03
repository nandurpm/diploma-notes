import assert from "node:assert/strict";
import test from "node:test";
import { askPoly, askPolyStream, configuredProviders } from "../src/ask-handler.js";
import { resolvePreferredLanguage } from "../src/language-policy.js";

const baseEnv = {
  AI_PROVIDER_ORDER: "nvidia,openrouter,gemini",
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

test("configured provider order includes NVIDIA, OpenRouter, then Gemini", () => {
  assert.deepEqual(configuredProviders(baseEnv), ["nvidia", "openrouter", "gemini"]);
});

test("English is the default even when context and history contain Malayalam", async () => {
  assert.equal(resolvePreferredLanguage({ message: "What are diodes?", preferredLanguage: "" }), "en");
  const calls = [];
  installFetch({ openrouter: "success", nvidia: "success", gemini: "success", calls });
  await askPoly({
    message: "What are diodes?",
    history: [{ role: "assistant", content: "മലയാളം കുറിപ്പുകൾ" }],
    pageContext: "Malayalam concept note: ഡയോഡ് ഒരു അർദ്ധചാലക ഉപകരണമാണ്."
  }, baseEnv);
  const payload = JSON.parse(calls[0].body);
  assert.match(payload.messages[0].content, /Default to English/);
  assert.match(payload.messages.at(-1).content, /Preferred language: English/);
});

test("Explicit Malayalam request is honored", async () => {
  assert.equal(resolvePreferredLanguage({ message: "Explain diodes in Malayalam, please." }), "ml");
  const calls = [];
  installFetch({ openrouter: "fail", nvidia: "success", gemini: "success", calls });
  await askPoly({ message: "Explain diodes in Malayalam, please.", history: [] }, baseEnv);
  const payload = JSON.parse(calls.at(-1).body);
  assert.match(payload.messages[0].content, /Default to English/);
  assert.match(payload.messages.at(-1).content, /Preferred language: Malayalam/);
});

test("OpenRouter answers when NVIDIA is intentionally unavailable", async () => {
  const calls = [];
  installFetch({ nvidia: "fail", openrouter: "success", gemini: "success", calls });
  const result = await askPoly({ message: "Explain Ohm's law", history: [] }, baseEnv);
  assert.equal(result.provider, "openrouter");
  assert.equal(result.answer, "OpenRouter answer");
  assert.equal(calls[0].provider, "fail");
  assert.equal(calls.at(-1).provider, "success");
  assert.ok(calls.slice(0, -1).every((call) => call.provider === "fail"));
  assert.match(calls[0].url, /integrate\.api\.nvidia\.com/);
  assert.match(calls.at(-1).url, /openrouter\.ai/);
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

test("streaming prefers Workers AI binding and normalizes native response SSE", async () => {
  const calls = [];
  let runModel = "";
  let runInput = null;
  const env = {
    ...baseEnv,
    AI_PROVIDER_ORDER: "nvidia,openrouter",
    AI: {
      run: async (model, input) => {
        runModel = model;
        runInput = input;
        const body = [
          JSON.stringify({ response: "Workers" }),
          JSON.stringify({ response: " AI" }),
          JSON.stringify({ response: " answer" }),
          "[DONE]"
        ].map((chunk) => `data: ${chunk}`).join("\n\n") + "\n\n";
        return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
      }
    }
  };
  installFetch({ nvidia: "fail", openrouter: "fail", calls });
  const result = await askPolyStream({ message: "Explain voltage", history: [] }, env);
  assert.equal(result.provider, "cloudflare-workers-ai");
  assert.equal(runModel, "@cf/meta/llama-3.1-8b-instruct-fp8");
  assert.equal(runInput.stream, true);
  const text = await new Response(result.stream).text();
  assert.match(text, /"content":"Workers"/);
  assert.match(text, /"content":" AI"/);
  assert.match(text, /"content":" answer"/);
  assert.match(text, /delta/);
  assert.equal(calls.length, 0);
});

test("streaming fallback reaches OpenRouter after NVIDIA fails", async () => {
  const calls = [];
  installFetch({ nvidia: "fail", openrouter: "success", gemini: "success", calls });
  const result = await askPolyStream({ message: "Explain voltage", history: [] }, baseEnv);
  assert.equal(result.provider, "openrouter");
  const text = await new Response(result.stream).text();
  assert.match(text, /OpenRouter answer/);
  assert.equal(calls[0].provider, "fail");
  assert.equal(calls.at(-1).provider, "success");
  assert.match(calls[0].url, /integrate\.api\.nvidia\.com/);
  assert.match(calls.at(-1).url, /openrouter\.ai/);
});

// Keep the imported streaming API exercised while making this test file safe for Node's test runner.
void sseResponse;
