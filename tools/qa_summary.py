"""Summarize the Ask POLY whole-site QA run from reports/ask-poly-whole-site-qa.json."""
import json
import sys

path = "/home/ubuntu/diploma-notes/reports/ask-poly-whole-site-qa.json"
if len(sys.argv) > 1:
    path = sys.argv[1]

data = json.load(open(path, encoding="utf-8"))
checks = data.get("checks", [])
passed = [c for c in checks if c.get("passed")]
failed = [c for c in checks if not c.get("passed")]
print(f"Total checks: {len(checks)}, passed: {len(passed)}, failed: {len(failed)}")
for c in failed:
    print("FAILED:", c.get("name"))
