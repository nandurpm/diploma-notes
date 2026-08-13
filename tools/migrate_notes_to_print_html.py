#!/usr/bin/env python3
"""Replace legacy downloadable-note PDF paths in lesson HTML with print-mode HTML paths.

The static Revision 2021 and Revision 2026 PDF payload is intentionally excluded
from the deployable site. Each retained lesson page is the canonical printable
source, opened with ?autoPrintNotes=1 so visitors can save it as a PDF locally.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSON_DIRS = (ROOT / "lessons", ROOT / "revision-2026-content" / "lessons")
PDF_PATTERN = re.compile(
    r"(?:/revision-2026-content/notes|/notes|\.\./notes)/downloadable-notes-([A-Za-z0-9_$\{\}]+)\.pdf",
    re.IGNORECASE,
)
INLINE_PDF_PATTERN = re.compile(
    r"/revision-2026-content/notes/downloadable-notes-([^;\n]+?)\.pdf",
    re.IGNORECASE,
)
PRINT_ANCHOR_PATTERN = re.compile(
    r"(<a\b(?=[^>]*\bhref=[\"'][^\"']*autoPrintNotes=1[^\"']*[\"'])[^>]*)(>)",
    re.IGNORECASE,
)
DOWNLOAD_ATTRIBUTE_PATTERN = re.compile(
    r"\s+download(?:\s*=\s*(?:[\"'][^\"']*[\"']|[^\s>]+))?",
    re.IGNORECASE,
)
NEW_WINDOW_ATTRIBUTE_PATTERN = re.compile(r"\s+target\s*=\s*[\"']_blank[\"']", re.IGNORECASE)
REL_ATTRIBUTE_PATTERN = re.compile(r"\s+rel\s*=\s*[\"'][^\"']*[\"']", re.IGNORECASE)


def printable_path(path: Path, code: str) -> str:
    revision_2026 = "revision-2026-content" in path.parts
    prefix = "/revision-2026-content" if revision_2026 else ""
    return f"{prefix}/lessons/lessons-{code}.html?autoPrintNotes=1"


def normalize_print_anchor(match: re.Match[str]) -> str:
    opening = DOWNLOAD_ATTRIBUTE_PATTERN.sub("", match.group(1))
    opening = NEW_WINDOW_ATTRIBUTE_PATTERN.sub("", opening)
    opening = REL_ATTRIBUTE_PATTERN.sub("", opening)
    return opening + match.group(2)


def transform(path: Path, text: str) -> str:
    updated = PDF_PATTERN.sub(lambda match: printable_path(path, match.group(1)), text)
    updated = INLINE_PDF_PATTERN.sub(lambda match: printable_path(path, match.group(1)), updated)
    return PRINT_ANCHOR_PATTERN.sub(normalize_print_anchor, updated)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Report stale pages without modifying them.")
    args = parser.parse_args()

    stale: list[Path] = []
    for directory in LESSON_DIRS:
        for path in sorted(directory.glob("lessons-*.html")):
            before = path.read_text(encoding="utf-8")
            after = transform(path, before)
            if after == before:
                continue
            stale.append(path.relative_to(ROOT))
            if not args.check:
                path.write_text(after, encoding="utf-8")

    if stale:
        label = "would update" if args.check else "updated"
        print(f"{label} {len(stale)} lesson page(s):")
        for path in stale:
            print(path)
        return 1 if args.check else 0
    print("All lesson pages already use print-mode HTML note paths.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
