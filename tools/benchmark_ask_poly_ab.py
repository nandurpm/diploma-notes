"""Randomized paired A/B benchmark for Ask POLY token-limit arms.

Run two separately deployed endpoints, one configured with MAX_OUTPUT_TOKENS=1200
and one with MAX_OUTPUT_TOKENS=6000. Each pair uses the same payload and randomizes
which arm receives the first request. The script records raw timings locally only.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import random
import statistics
import time
import urllib.error
import urllib.request
from pathlib import Path

CONTEXT = ("Course 5032 detailed syllabus context. " * 4000)[:14000]
MESSAGE = "Explain the key examination topics in this course and give a concise study plan."


def post(url: str, arm: str, pair_id: int, sequence: int) -> dict:
    payload = json.dumps({
        "message": MESSAGE,
        "history": [],
        "pageTitle": "Course 5032 syllabus",
        "pageContext": CONTEXT,
        "preferredLanguage": "en",
        "retrievalMeta": {
            "intent": "lesson",
            "contextBudget": 14000,
            "contextChars": len(CONTEXT),
            "matchCounts": {"facts": 0, "faq": 0, "programmes": 0, "subjects": 0, "pages": 0},
        },
    }).encode("utf-8")
    request = urllib.request.Request(url, data=payload, method="POST", headers={
        "Content-Type": "application/json",
        "Origin": "https://polypmna.dpdns.org",
        "User-Agent": "POLY-PMNA-Randomized-AB/1.0",
        "X-Benchmark-Pair": str(pair_id),
        "X-Benchmark-Sequence": str(sequence),
    })
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            body = json.loads(response.read().decode("utf-8"))
            status = response.status
        return {"arm": arm, "pair_id": pair_id, "sequence": sequence, "ok": status == 200,
                "status": status, "provider": body.get("provider"),
                "answer_chars": len(str(body.get("answer") or "")),
                "elapsed_ms": round((time.perf_counter() - started) * 1000, 1)}
    except urllib.error.HTTPError as error:
        return {"arm": arm, "pair_id": pair_id, "sequence": sequence, "ok": False,
                "status": error.code, "error": str(error.reason),
                "elapsed_ms": round((time.perf_counter() - started) * 1000, 1)}
    except Exception as error:
        return {"arm": arm, "pair_id": pair_id, "sequence": sequence, "ok": False,
                "status": None, "error": type(error).__name__,
                "elapsed_ms": round((time.perf_counter() - started) * 1000, 1)}


def summarize(rows: list[dict]) -> dict:
    output = {}
    for arm in ("A_1200", "B_6000"):
        successful = [row["elapsed_ms"] for row in rows if row["arm"] == arm and row["ok"]]
        ordered = sorted(successful)
        p = lambda fraction: ordered[min(len(ordered) - 1, int((len(ordered) - 1) * fraction))] if ordered else None
        output[arm] = {"n": len(successful), "mean_ms": round(statistics.mean(successful), 1) if successful else None,
                       "median_ms": round(statistics.median(successful), 1) if successful else None,
                       "p50_ms": p(0.50), "p75_ms": p(0.75), "p90_ms": p(0.90), "p95_ms": p(0.95),
                       "p99_ms": p(0.99), "min_ms": min(successful) if successful else None,
                       "max_ms": max(successful) if successful else None,
                       "success_rate": round(len(successful) / max(1, sum(1 for row in rows if row["arm"] == arm)), 4)}
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--arm-1200-url", required=True)
    parser.add_argument("--arm-6000-url", required=True)
    parser.add_argument("--pairs", type=int, default=30)
    parser.add_argument("--concurrency", type=int, default=1)
    parser.add_argument("--seed", type=int, default=20260823)
    parser.add_argument("--output", default="reports/ask-poly-randomized-ab.json")
    args = parser.parse_args()
    rng = random.Random(args.seed)
    jobs = []
    for pair_id in range(1, args.pairs + 1):
        first_is_1200 = rng.choice([True, False])
        order = [("A_1200", args.arm_1200_url), ("B_6000", args.arm_6000_url)] if first_is_1200 else [("B_6000", args.arm_6000_url), ("A_1200", args.arm_1200_url)]
        jobs.extend((url, arm, pair_id, sequence) for sequence, (arm, url) in enumerate(order, start=1))
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.concurrency)) as pool:
        rows = list(pool.map(lambda job: post(*job), jobs))
    report = {"generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
              "seed": args.seed, "pairs": args.pairs, "concurrency": args.concurrency,
              "same_payload": True, "randomized_order_per_pair": True,
              "arms": {"A_1200": args.arm_1200_url, "B_6000": args.arm_6000_url},
              "workload": {"context_chars": len(CONTEXT), "message": MESSAGE},
              "summary": summarize(rows), "results": rows}
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"summary": report["summary"], "output": str(output)}, indent=2))


if __name__ == "__main__":
    main()
