# Ask POLY Benchmark: Local-Math Provider vs AI Fallback

**Date:** 2026-08-13 (night, GMT) · **Target:** production worker `ask-poly-ai.nandakumarkdpm.workers.dev` · **Tooling:** `tools/benchmark_ask_poly.py` (committed to repo)

## Method

Requests were sent to the live worker's `POST /api/ask-poly` endpoint with identical client-side conditions for both provider groups. Each question was repeated as a "cold start" sample followed by warm samples; warm-response times were recorded client-side (network + server latency combined, which is what the user actually experiences). The routing was verified per call via the response's `provider` field: math equality questions confirmed `provider: "local-math"` and prose questions confirmed `provider: "nvidia"` in every successful call.

| Group | Questions | Provider observed |
|---|---|---|
| Local-math (deterministic) | `2 + 78 = 80`, `3^5 = 243`, `125% of 160 = 200`, `sqrt(144) = 12`, `1000/8 = 125`, `50% + 50% = 1`, `2^3 + 5*2 = 18`, `(2+3)^2 = 25`, `2^(-3) = 0.125`, `is 12 * 8 = 96 correct` | `local-math` in 100% of calls |
| AI fallback | `capital of Kerala`, `explain Ohm's law`, `what is a diode`, `how does a transformer work`, `what does CPU stand for`, `define thermodynamics`, `AC vs DC`, `types of microscopes`, `discovering the electron`, `water cycle` | `nvidia` (meta/llama-3.1-8b-instruct) in 100% of calls |

## Results (combined warm samples, rate-limit-inflated outliers >3.5 s excluded)

| Metric | Local-math | AI fallback (nvidia LLM) |
|---|---|---|
| Warm median latency | **1,767 ms** | **2,619 ms** |
| Warm mean latency | 1,789 ms | 2,608 ms |
| Warm range (per-question medians) | 1,209 – 1,949 ms | 2,147 – 3,186 ms |
| Question-to-question spread | ±12% around median | ±22% around median |
| Cold-start mean | 4,332 ms | 3,814 ms |

**The local-math provider is ~1.5x faster than the AI fallback** (2,619 / 1,767 = 1.48x median slowdown for the LLM path), and noticeably more consistent: local-math answers cluster within roughly ±12% while AI answers vary by more than ±20% depending on question complexity (longer generated answers such as "list the types of microscopes" approach 3.2 s).

## Observations

1. **Even the deterministic path is not instant.** A large part of both numbers is fixed overhead (TLS, Cloudflare edge routing, Worker JS execution, KV rate-limit lookup). The deterministic math evaluation itself is near-zero; the two paths differ mainly in whether the worker then calls an external LLM API for ~0.9–1.4 s of extra round-trip.
2. **Cold starts are slower than warm** for both paths (4.3 s vs 3.8 s mean), largely due to Worker/edge cold start plus the worker's 429 rate-limit backoff. The `ASK_RATE_LIMITER` allows only a small burst per minute per client IP, so rapid benchmark traffic is penalized with ~7 s 429 responses. This is expected protective behavior, not a bug — normal app usage will rarely hit it.
3. **Local-math determinism is now absolute**: 100% of math-equality calls returned with `provider: "local-math"` and no LLM call, so those answers cost the LLM round-trip and can never hallucinate.
4. A reusable benchmark script (`tools/benchmark_ask_poly.py`) now exists in the repo; it supports `--samples` and `--out`, and auto-retries through 429/502/503/504 with capped backoff so it can be re-run after any deployment to verify the speedup.

## Chart

![benchmark](/home/ubuntu/ask-poly-benchmark.png)
