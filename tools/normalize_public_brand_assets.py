#!/usr/bin/env python3
"""Idempotently replace legacy public-page favicons with the POLY PMNA icon."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAVICON = '<link rel="icon" type="image/svg+xml" href="/assets/media/poly-pmna-favicon.svg">'


def public_pages() -> list[Path]:
    pages = list(ROOT.glob("*.html"))
    pages.extend((ROOT / "revision-2021").glob("*.html"))
    pages.extend((ROOT / "revision-2026").glob("*.html"))
    return sorted(path for path in pages if path.name != "department-view.html")


def normalize(path: Path) -> bool:
    source = path.read_text(encoding="utf-8", errors="ignore")
    original = source
    pattern = re.compile(
        r'<link\b(?=[^>]*\brel\s*=\s*(["\'])[^"\']*\bicon\b[^"\']*\1)[^>]*>',
        flags=re.I,
    )
    source = pattern.sub("", source)
    source = source.replace("</head>", f"  {FAVICON}\n</head>", 1)
    if source != original:
        path.write_text(source, encoding="utf-8")
        return True
    return False


def main() -> int:
    changed = [path for path in public_pages() if normalize(path)]
    print(f"Public favicons normalized: {len(changed)}")
    for path in changed:
        print(f"  - {path.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
