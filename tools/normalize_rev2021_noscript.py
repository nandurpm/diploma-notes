#!/usr/bin/env python3
"""Add the standard no-JavaScript fallback to older Revision 2021 templates."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EMPTY_GRID = re.compile(r'(<div\b[^>]*\bid=["\']subjectGrid["\'][^>]*>)\s*</div>', re.I)
FALLBACK = (
    '<noscript><section class="notice"><h2>JavaScript is disabled</h2>'
    '<p>The complete subject cards are rendered above. Search and semester filters require JavaScript. '
    'Official curriculum details remain available from the '
    '<a href="https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&amp;scheme=REV2021">'
    'SITTTR Revision 2021 syllabus page</a>.</p></section></noscript>'
)


def main() -> int:
    changed = 0
    for path in sorted((ROOT / "revision-2021").glob("*.html")):
        if path.name == "department-view.html":
            continue
        text = path.read_text(encoding="utf-8")
        if 'id="subjectGrid"' not in text or "<noscript" in text:
            continue
        updated, count = EMPTY_GRID.subn(lambda match: match.group(1) + "</div>" + FALLBACK, text, count=1)
        if count != 1:
            raise SystemExit(f"Could not normalize {path.relative_to(ROOT)}")
        path.write_text(updated, encoding="utf-8")
        changed += 1
    print(f"Normalized {changed} legacy Revision 2021 department templates.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
