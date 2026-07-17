#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

VERSION = "20260717-site-shell1"
PATTERNS = (
    re.compile(r"(assets/js/subject-browser\.js)\?v=[^\"']+"),
    re.compile(r"(assets/js/revision-2026-browser\.js)\?v=[^\"']+"),
    re.compile(r"(assets/js/lesson-availability-hotfix\.js)\?v=[^\"']+"),
)


def main() -> None:
    changed = 0
    for path in Path(".").rglob("*.html"):
        if any(part.startswith(".") for part in path.parts):
            continue
        original = path.read_text(encoding="utf-8", errors="ignore")
        updated = original
        for pattern in PATTERNS:
            updated = pattern.sub(lambda match: f"{match.group(1)}?v={VERSION}", updated)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed += 1
    print(f"Updated subject-card asset versions in {changed} HTML files")


if __name__ == "__main__":
    main()
