"""Plot the Ask POLY benchmark: local-math vs AI fallback latency."""
import json
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

plt.style.use("seaborn-v0_8-whitegrid")


def main() -> None:
    path = sys.argv[1] if len(sys.argv) > 1 else "reports/ask-poly-benchmark-n10.json"
    with open(path, encoding="utf-8") as handle:
        report = json.load(handle)

    lm = report["local_math"]["cases"]
    ai = report["ai_fallback"]["cases"]

    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))

    ax = axes[0]
    labels = [c["question"] for c in lm]
    means = [c["warm_mean_ms"] for c in lm]
    mins = [c["warm_min_ms"] for c in lm]
    maxs = [c["warm_max_ms"] for c in lm]
    err_lo = [m - lo for m, lo in zip(means, mins)]
    err_hi = [hi - m for m, hi in zip(means, maxs)]
    ax.bar(labels, means, color="#2e7d32", capsize=4,
           yerr=[err_lo, err_hi], error_kw={"capsize": 4})
    ax.set_title("Local-math provider (deterministic)")
    ax.set_ylabel("Latency (ms, warm runs)")
    ax.tick_params(axis="x", rotation=45, labelsize=8)

    ax = axes[1]
    labels = [c["question"] for c in ai]
    means = [c["warm_mean_ms"] for c in ai]
    mins = [c["warm_min_ms"] for c in ai]
    maxs = [c["warm_max_ms"] for c in ai]
    err_lo = [m - lo for m, lo in zip(means, mins)]
    err_hi = [hi - m for m, hi in zip(means, maxs)]
    ax.bar(labels, means, color="#c62828", capsize=4,
           yerr=[err_lo, err_hi], error_kw={"capsize": 4})
    ax.set_title("AI fallback provider (nvidia)")
    ax.set_ylabel("Latency (ms, warm runs)")
    ax.tick_params(axis="x", rotation=45, labelsize=8)

    fig.suptitle("Ask POLY live-worker benchmark: local-math vs AI fallback "
                 f"({report['samples_per_case']} warm samples per question)",
                 fontsize=13)
    fig.tight_layout(rect=[0, 0, 1, 0.94])
    out = path.rsplit(".", 1)[0] + ".png"
    fig.savefig(out, dpi=140)
    print(f"Saved {out}")


if __name__ == "__main__":
    main()
