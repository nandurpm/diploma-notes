#!/usr/bin/env python3
"""Verify same-document fragment links without assuming a checkout location."""

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DIRECTORIES = (ROOT / "revision-2026-content" / "lessons", ROOT / "lessons")
HREF_RE = re.compile(r"\bhref\s*=\s*(['\"])#([^'\"]+)\1", re.IGNORECASE)
ID_RE = re.compile(r"\bid\s*=\s*(['\"])([^'\"]+)\1", re.IGNORECASE)


def verify_links(directory: Path) -> tuple[int, int]:
    """Return the number of HTML files and broken fragment references found."""
    total_broken = 0
    files = sorted(directory.glob("*.html"))

    for path in files:
        content = path.read_text(encoding="utf-8", errors="replace")
        # Template literals are runtime-generated references, not static fragments.
        links = [
            match.group(2)
            for match in HREF_RE.finditer(content)
            if "${" not in match.group(2)
        ]
        ids = {match.group(2) for match in ID_RE.finditer(content)}
        broken = sorted({fragment for fragment in links if fragment not in ids})
        if broken:
            print(f"File: {path.relative_to(ROOT)} - Broken links: {broken}")
            total_broken += len(broken)

    print(f"Verification complete for {len(files)} files in {directory.relative_to(ROOT)}.")
    print(f"Total broken internal links found: {total_broken}")
    return len(files), total_broken


def main() -> int:
    directories = tuple(Path(value).resolve() for value in sys.argv[1:]) or DEFAULT_DIRECTORIES
    broken = 0
    for directory in directories:
        if not directory.is_dir():
            print(f"Directory does not exist: {directory}", file=sys.stderr)
            return 2
        _, directory_broken = verify_links(directory)
        broken += directory_broken
    return 1 if broken else 0


if __name__ == "__main__":
    raise SystemExit(main())
