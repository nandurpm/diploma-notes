#!/usr/bin/env python3
"""Remove identical duplicate POLY structured-data script blocks from generated HTML."""
from __future__ import annotations
from pathlib import Path

from structured_data_html import find_structured_data_blocks

ROOT = Path(__file__).resolve().parents[1]


def dedupe(text: str) -> tuple[str, int]:
    seen: set[str] = set()
    duplicates = []
    for block in find_structured_data_blocks(text):
        payload = block.payload.strip()
        if payload in seen:
            duplicates.append(block)
        else:
            seen.add(payload)
    result = text
    for block in reversed(duplicates):
        result = result[:block.start] + result[block.end:]
    return result, len(duplicates)


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
