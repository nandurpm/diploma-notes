#!/usr/bin/env python3
"""Idempotently normalize POLY PMNA icon, manifest and theme metadata."""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_ROOTS = {".github", "android", "android-app", "docs", "maintenance", "reports", "supabase", "tools", "workers", "node_modules", "_site"}
FAVICON = '<link rel="icon" type="image/svg+xml" href="/assets/media/poly-pmna-favicon.svg">'
MANIFEST = '<link rel="manifest" href="/site.webmanifest">'
THEME = '<meta name="theme-color" content="#1d4ed8">'
HEAD_END_RE = re.compile(r"</head>", re.I)
ICON_RE = re.compile(r'<link\b(?=[^>]*\brel\s*=\s*(["\'])[^"\']*\bicon\b[^"\']*\1)[^>]*>\s*', re.I)
MANIFEST_RE = re.compile(r'<link\b(?=[^>]*\brel\s*=\s*(["\'])[^"\']*\bmanifest\b[^"\']*\1)[^>]*>\s*', re.I)
THEME_RE = re.compile(r'<meta\b(?=[^>]*\bname\s*=\s*(["\'])theme-color\1)[^>]*>\s*', re.I)


def public_pages() -> list[Path]:
    result: list[Path] = []
    for path in ROOT.rglob("*.html"):
        relative = path.relative_to(ROOT)
        if relative.parts and relative.parts[0] in EXCLUDED_ROOTS:
            continue
        if path.name in {"department-view.html", "tools-v2-original.html", "new-year-theme-preview.html"}:
            continue
        result.append(path)
    return sorted(result)


def normalized_text(path: Path) -> str:
    source = path.read_text(encoding="utf-8", errors="strict")
    source = ICON_RE.sub("", source)
    source = MANIFEST_RE.sub("", source)
    source = THEME_RE.sub("", source)
    injection = f"  {FAVICON}\n  {MANIFEST}\n  {THEME}\n"
    updated, count = HEAD_END_RE.subn(injection + "</head>", source, count=1)
    if count != 1:
        raise ValueError(f"Missing </head> in {path.relative_to(ROOT)}")
    return updated


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    changed: list[Path] = []
    failures: list[str] = []
    for path in public_pages():
        try:
            updated = normalized_text(path)
        except ValueError as error:
            failures.append(str(error))
            continue
        current = path.read_text(encoding="utf-8")
        if current != updated:
            changed.append(path)
            if not args.check:
                path.write_text(updated, encoding="utf-8")
    if failures:
        print("\n".join(f"ERROR: {item}" for item in failures))
        return 1
    if args.check and changed:
        print("Stale public brand metadata:")
        print("\n".join(f"- {path.relative_to(ROOT).as_posix()}" for path in changed))
        return 1
    print(f"{'Verified' if args.check else 'Normalized'} brand metadata on {len(public_pages())} public pages; changed {len(changed)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
