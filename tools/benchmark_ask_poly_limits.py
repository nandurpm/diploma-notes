"""Compare the current Ask POLY 1,200-token deployment with the prior 6,000-token baseline.

The historical 6,000-token reference is the controlled 10-concurrent run recorded in
ask-poly-stress-telemetry-report.md. This harness repeats the same 10-concurrent,
14,000-character-context workload against production, without changing production
configuration or sending raw prompts to telemetry.
"""
from __future__ import annotations

import concurrent.futures
import json
import statistics
import time
import urllib.error
import urllib.request

BASE = "https://api.polypmna.dpdns.org/api/ask-poly"
ORIGIN = "https://polypmna.dpdns.org"
CONCURRENCY = 10
CONTEXT = ("Course 5032 detailed syllabus context. " * 4000)[:14000]
CASES = [
    "Explain the key examination topics in this course and give a concise study plan.",
] * CONCURRENCY


def post(message: str) -> dict:
    payload = json.dumps({
        "message": message,
        "history": [],
        "pageTitle": "Course 5032 syllabus",
        "pageContext": CONTEXT,
        "preferredLanguage": "en",
        # This synthetic benchmark does not run browser retrieval; declare that explicitly
        # so telemetry distinguishes zero matched records from missing metadata.
        "retrievalMeta": {
            "intent": "lesson",
            "contextBudget": 14000,
            "contextChars": len(CONTEXT),
            "matchCounts": {"facts": 0, "faq": 0, "programmes": 0, "subjects": 0, "pages": 0},
        },
    }).encode("utf-8")
    request = urllib.request.Request(
        BASE,
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Origin": ORIGIN,
            "User-Agent": "POLY-PMNA-Limit-Benchmark/1.0",
        },
    )
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            body = json.loads(response.read().decode("utf-8"))
            status = response.status
        return {
            "ok": status == 200,
            "status": status,
            "provider": body.get("provider"),
            "model": body.get("model"),
            "answer_chars": len(str(body.get("answer") or "")),
            "elapsed_ms": round((time.perf_counter() - started) * 1000, 1),
        }
    except urllib.error.HTTPError as error:
        return {
            "ok": False,
            "status": error.code,
            "error": str(error.reason),
            "elapsed_ms": round((time.perf_counter() - started) * 1000, 1),
        }
    except Exception as error:  # network timeout and transport failures are benchmark data
        return {
            "ok": False,
            "status": None,
            "error": type(error).__name__,
            "elapsed_ms": round((time.perf_counter() - started) * 1000, 1),
        }


def percentile(values: list[float], p: float) -> float | None:
    if not values:
        return None
    values = sorted(values)
    index = min(len(values) - 1, max(0, int((len(values) - 1) * p)))
    return round(values[index], 1)


def main() -> None:
    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        results = list(pool.map(post, CASES))
    wall_ms = round((time.perf_counter() - started) * 1000, 1)
    successful = [r for r in results if r["ok"]]
    times = [r["elapsed_ms"] for r in successful]
    report = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "endpoint": BASE,
        "tested_deployment": "current production; MAX_OUTPUT_TOKENS=1200",
        "reference_deployment": "historical controlled run; MAX_OUTPUT_TOKENS=6000",
        "workload": {
            "concurrency": CONCURRENCY,
            "context_chars": len(CONTEXT),
            "same_context_as_reference": True,
            "case": CASES[0],
        },
        "current_1200": {
            "successful": len(successful),
            "failed": len(results) - len(successful),
            "wall_ms": wall_ms,
            "min_ms": min(times) if times else None,
            "mean_ms": round(statistics.mean(times), 1) if times else None,
            "median_ms": round(statistics.median(times), 1) if times else None,
            "p95_ms": percentile(times, 0.95),
            "max_ms": max(times) if times else None,
            "providers": sorted({r.get("provider") for r in successful if r.get("provider")}),
            "results": results,
        },
        "historical_6000_reference": {
            "successful": 10,
            "failed": 0,
            "wall_ms": 7545,
            "min_ms": 4160,
            "median_ms": 5072,
            "p95_ms": 7541,
            "max_ms": 7541,
            "provider": "nvidia",
            "model": "meta/llama-3.1-8b-instruct",
            "source": "ask-poly-stress-telemetry-report.md",
        },
    }
    reference = report["historical_6000_reference"]
    current = report["current_1200"]
    if current["median_ms"] is not None:
        current["median_delta_pct_vs_6000"] = round((current["median_ms"] - reference["median_ms"]) / reference["median_ms"] * 100, 1)
    if current["p95_ms"] is not None:
        current["p95_delta_pct_vs_6000"] = round((current["p95_ms"] - reference["p95_ms"]) / reference["p95_ms"] * 100, 1)
    with open("reports/ask-poly-token-limit-benchmark.json", "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print(json.dumps({k: v for k, v in report.items() if k != "current_1200" or True}, indent=2))
    print("Saved reports/ask-poly-token-limit-benchmark.json")


if __name__ == "__main__":
    main()
