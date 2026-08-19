#!/usr/bin/env python3
"""Remove identical duplicate POLY structured-data script blocks from generated HTML."""
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOCK_RE = re.compile(r'<script\b(?=[^>]*\btype="application/ld\+json")(?=[^>]*\bdata-poly-structured-data(?:="")?)[^>]*>(.*?)</script>', re.DOTALL | re.IGNORECASE)


def dedupe(text: str) -> tuple[str, int]:
    seen: set[str] = set()
    removed = 0
    def replace(match: re.Match[str]) -> str:
        nonlocal removed
        block = match.group(0)
        payload = match.group(1).strip()
        if payload in seen:
            removed += 1
            return ""
        seen.add(payload)
        return block
    return BLOCK_RE.sub(replace, text), removed


def main() -> int:
    files = removed = 0
    for path in sorted(ROOT.rglob("*.html")):
        if any(part in {".git", "node_modules", "_site"} for part in path.parts):
            continue
        original = path.read_text(encoding="utf-8", errors="ignore")
        updated, count = dedupe(original)
        if count:
            path.write_text(updated, encoding="utf-8")
            files += 1
            removed += count
    print(f"Removed {removed} identical duplicate structured-data blocks from {files} HTML files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
