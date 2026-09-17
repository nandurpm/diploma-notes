#!/usr/bin/env python3
"""Bump cache-busting query strings for print-only note rendering assets."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
REPLACEMENTS = {
    "subjects.js?v=20260630-4023-auto1": "subjects.js?v=20260813-print-html1",
    "subjects.js?v=20260716-revision-switch1": "subjects.js?v=20260813-print-html1",
    "subject-browser.js?v=20260716-rev2026-modelqp-direct3": "subject-browser.js?v=20260813-print-html1",
}
GENERIC_REPLACEMENTS = (
    (re.compile(r"subjects\\.js\\?v=[^\"'\\s>]+"), "subjects.js?v=20260813-print-html1"),
    (re.compile(r"subject-browser\\.js\\?v=[^\"'\\s>]+"), "subject-browser.js?v=20260813-print-html1"),
)

changed = 0
for path in ROOT.rglob("*.html"):
    if any(part in {".git", "_site", "tmp"} for part in path.parts):
        continue
    text = path.read_text(encoding="utf-8")
    updated = text
    for old, new in REPLACEMENTS.items():
        updated = updated.replace(old, new)
    for pattern, new in GENERIC_REPLACEMENTS:
        updated = pattern.sub(new, updated)
    if updated != text:
        path.write_text(updated, encoding="utf-8")
        changed += 1
print(f"Updated cache-busting references in {changed} HTML files")

for path in ROOT.rglob("*.html"):
    if any(part in {".git", "_site", "tmp"} for part in path.parts):
        continue
    text = path.read_text(encoding="utf-8")
    if any(old in text for old in REPLACEMENTS) or any(pattern.search(text) for pattern, _ in GENERIC_REPLACEMENTS):
        raise SystemExit(f"stale print asset version remains in {path}")
print("No stale print asset versions remain")
