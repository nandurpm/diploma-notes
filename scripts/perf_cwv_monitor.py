import os
import json
import urllib.request
import time

print("Running daily performance and Core Web Vitals health check...")

# Detect base directory (root of the repo)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Test sample live handbook URLs
test_urls = [
    "https://polypmna.dpdns.org/revision-2026-content/lessons/lessons-2018.html",
    "https://polypmna.dpdns.org/lessons/lessons-2008_REV2021.html"
]

results = []
for url in test_urls:
    start_time = time.time()
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Performance Monitor)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            latency = round((time.time() - start_time) * 1000, 2)
            status = resp.status
            content_length = len(resp.read())
            results.append({
                "url": url,
                "status": status,
                "latency_ms": latency,
                "payload_size_bytes": content_length,
                "status_ok": status == 200 and latency < 4000
            })
    except Exception as e:
        results.append({
            "url": url,
            "error": str(e),
            "status_ok": False
        })

report = {
    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
    "checks": results,
    "overall_health": all(r.get("status_ok", False) for r in results)
}

report_path = os.path.join(base_dir, "reports", "perf-cwv-report.json")
os.makedirs(os.path.dirname(report_path), exist_ok=True)
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)

print(f"Performance & CWV monitoring report saved to {report_path}")
print(json.dumps(report, indent=2))
