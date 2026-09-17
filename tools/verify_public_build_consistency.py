#!/usr/bin/env python3
"""Verify that one public artifact has one coherent deployment identity."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

META_RE = re.compile(r'<meta\s+name=["\']poly-build-id["\']\s+content=["\']([^"\']+)', re.I)
DOCUMENT_RE = re.compile(r'<(?:!doctype\s+html|html\b)', re.I)
HEAD_RE = re.compile(r'</head>', re.I)
EXCLUDED_ROOTS = {".git", ".github", "android", "android-app", "docs", "maintenance", "reports", "supabase", "tools", "workers", "node_modules", "_site"}
EXCLUDED_NAMES = {"department-view.html", "tools-v2-original.html"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--expected-commit", default="")
    args = parser.parse_args()
    root = args.root.resolve()
    info_path = root / "build-info.json"
    if not info_path.is_file():
        raise SystemExit("Build consistency failed: build-info.json is missing")
    info = json.loads(info_path.read_text(encoding="utf-8"))
    build_id = str(info.get("buildId", ""))
    commit = str(info.get("commit", ""))
    expected = args.expected_commit.strip()
    if not build_id or not commit:
        raise SystemExit("Build consistency failed: build-info.json lacks buildId or commit")
    if expected and commit != expected:
        raise SystemExit(f"Build consistency failed: build-info commit {commit} != {expected}")
    found: dict[str, list[str]] = {}
    for path in root.rglob("*.html"):
        relative = path.relative_to(root)
        if (relative.parts and relative.parts[0] in EXCLUDED_ROOTS) or path.name in EXCLUDED_NAMES:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if not DOCUMENT_RE.search(text) or not HEAD_RE.search(text):
            continue
        match = META_RE.search(text)
        if not match:
            raise SystemExit(f"Build consistency failed: {relative} has no poly-build-id")
        found.setdefault(match.group(1), []).append(str(path.relative_to(root)))
    if set(found) != {build_id}:
        details = "; ".join(f"{key}: {len(value)} pages" for key, value in sorted(found.items()))
        raise SystemExit(f"Build consistency failed: mixed page build IDs ({details}); expected {build_id}")
    total = sum(len(value) for value in found.values())
    print(f"Public build consistency passed: {total} HTML pages share build {build_id} ({commit}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
