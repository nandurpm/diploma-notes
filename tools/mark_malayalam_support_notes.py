#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = (ROOT / "lessons", ROOT / "revision-2026-content" / "lessons")
OLD = '<div class="call tip"><b>Malayalam Support Note:</b>'
NEW = '<div class="call tip" lang="ml"><b>Malayalam Support Note:</b>'

changed = 0
for directory in TARGETS:
    for path in sorted(directory.glob("lessons-*.html")):
        source = path.read_text(encoding="utf-8", errors="ignore")
        updated = source.replace(OLD, NEW)
        if updated != source:
            path.write_text(updated, encoding="utf-8")
            changed += 1
print(f"Marked Malayalam support notes in {changed} lesson pages.")
