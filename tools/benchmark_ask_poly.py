"""Benchmark Ask POLY production worker: local-math provider vs AI fallback.

Measures end-to-end latency of POST /api/ask-poly requests on the live worker.
Deterministic local-math questions must route to provider "local-math";
knowledge/prose questions must route to the AI provider ("nvidia", etc.).

Usage: python3 tools/benchmark_ask_poly.py [--samples N] [--out reports/benchmark.json]
"""
import json
import statistics
import sys
import time
import urllib.request

BASE = "https://ask-poly-ai.nandakumarkdpm.workers.dev/api/ask-poly"
ORIGIN = "https://polypmna.dpdns.org"

# Local-math questions (must be answered deterministically, provider local-math)
MATH_CASES = [
    "2 + 78 = 80",
    "3^5 = 243",
    "125% of 160 = 200",
    "sqrt(144) = 12",
    "1000/8 = 125",
]

# AI fallback questions (must be answered by the LLM provider)
AI_CASES = [
    "what is the capital of Kerala",
    "explain Ohm's law briefly",
    "what is a diode",
    "how does a transformer work",
    "what does CPU stand for",
]


def post(message: str) -> dict:
    payload = json.dumps({
        "message": message,
        "history": [],
        "pageTitle": "benchmark",
        "pageContext": "",
    }).encode("utf-8")
    request = urllib.request.Request(
        BASE,
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Origin": ORIGIN,
            "User-Agent": "POLY-PMNA-Benchmark/1.0",
        },
    )
    start = time.perf_counter()
    for attempt in range(1, 13):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                body = json.loads(response.read().decode("utf-8"))
            break
        except (urllib.error.HTTPError, TimeoutError, OSError) as error:
            retryable = getattr(error, "code", None) in (429, 502, 503, 504) or isinstance(error, (TimeoutError, OSError))
            if not retryable:
                raise
            wait = min(20, 10 * attempt)
            time.sleep(wait)
            continue
    else:
        return {
            "question": message,
            "provider": "rate_limited",
            "model": "",
            "answer": "",
            "elapsed_ms": None,
            "skipped": True,
        }
    elapsed = time.perf_counter() - start
    return {
        "question": message,
        "provider": body.get("provider"),
        "model": body.get("model"),
        "answer": str(body.get("answer") or "")[:100],
        "elapsed_ms": round(elapsed * 1000, 1),
    }


def warmup() -> None:
    post("Reply with exactly: warmup")
    time.sleep(1.0)


def bench_cases(cases: list[str], label: str, samples: int) -> list[dict]:
    results = []
    print(f"--- {label} ({samples} samples each) ---")
    for case in cases:
        times = []
        provider = None
        skipped = 0
        for i in range(samples):
            print(f"  [{label}] {case!r} sample {i+1}/{samples} ...", flush=True)
            rec = post(case)
            if rec.get("skipped"):
                skipped += 1
                continue
            times.append(rec["elapsed_ms"])
            if provider is None:
                provider = rec["provider"]
            time.sleep(62)
        if not times:
            results.append({"question": case, "provider": "rate_limited",
                            "skipped": True, "cold_start_ms": None})
            print(f"  {case!r:32s} provider=rate_limited (skipped)")
            continue
        first = times[0]
        rest = times[1:]
        row = {
            "question": case,
            "provider": provider,
            "cold_start_ms": first,
            "warm_times_ms": rest,
            "warm_mean_ms": round(statistics.mean(rest), 1),
            "warm_median_ms": round(statistics.median(rest), 1),
            "warm_min_ms": round(min(rest), 1),
            "warm_max_ms": round(max(rest), 1),
            "warm_p95_ms": round(sorted(rest)[int(len(rest) * 0.95) - 1], 1),
            "skipped": skipped,
        }
        results.append(row)
        print(f"  {case!r:32s} provider={provider:<10s} cold={first:>7.1f}ms "
              f"warm mean={row['warm_mean_ms']:.1f} median={row['warm_median_ms']:.1f} "
              f"p95={row['warm_p95_ms']:.1f}")
    return results


def summary(results: list[dict]) -> dict:
    warm_means = [r["warm_mean_ms"] for r in results if not r.get("skipped")]
    colds = [r["cold_start_ms"] for r in results if not r.get("skipped")]
    return {
        "case_count": len(results),
        "warm_mean_overall_ms": round(statistics.mean(warm_means), 1),
        "warm_median_overall_ms": round(statistics.median(warm_means), 1),
        "warm_min_ms": round(min(warm_means), 1),
        "warm_max_ms": round(max(warm_means), 1),
        "cold_start_mean_ms": round(statistics.mean(colds), 1),
        "providers_seen": sorted({r["provider"] for r in results}),
    }


def main() -> None:
    samples = 4
    out = "reports/ask-poly-benchmark.json"
    argv = sys.argv[1:]
    if "--samples" in argv:
        samples = int(argv[argv.index("--samples") + 1])
    if "--out" in argv:
        out = argv[argv.index("--out") + 1]

    warmup()
    math_results = bench_cases(MATH_CASES, "local-math", samples)
    ai_results = bench_cases(AI_CASES, "AI fallback", samples)

    report = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "endpoint": BASE,
        "samples_per_case": samples,
        "local_math": {
            "summary": summary(math_results),
            "cases": math_results,
        },
        "ai_fallback": {
            "summary": summary(ai_results),
            "cases": ai_results,
        },
    }
    lm = report["local_math"]["summary"]
    ai = report["ai_fallback"]["summary"]
    print("\n=== Summary ===")
    print(f"local-math : warm mean {lm['warm_mean_overall_ms']:.1f}ms "
          f"(range {lm['warm_min_ms']}–{lm['warm_max_ms']}ms), "
          f"cold mean {lm['cold_start_mean_ms']:.1f}ms, "
          f"providers={lm['providers_seen']}")
    print(f"AI fallback: warm mean {ai['warm_mean_overall_ms']:.1f}ms "
          f"(range {ai['warm_min_ms']}–{ai['warm_max_ms']}ms), "
          f"cold mean {ai['cold_start_mean_ms']:.1f}ms, "
          f"providers={ai['providers_seen']}")
    if ai["warm_mean_overall_ms"]:
        print(f"speedup      : {ai['warm_mean_overall_ms'] / max(lm['warm_mean_overall_ms'], 0.1):.1f}x faster locally")
    with open(out, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print(f"\nSaved: {out}")


if __name__ == "__main__":
    main()
