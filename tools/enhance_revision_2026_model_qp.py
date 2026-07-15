#!/usr/bin/env python3
"""Add permanent official model-question-paper access to generated REV2026 pages."""
from __future__ import annotations

from pathlib import Path

INDEX_URL = "https://sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp&scheme=REV2026"
ACCESS_SECTION = (
    '<section class="section notice" id="rev2026-model-qp-access">'
    '<strong>Official Revision 2026 sample question papers:</strong> '
    f'<a class="btn ghost" href="{INDEX_URL}" target="_blank" rel="noopener noreferrer">'
    'Open all REV2026 sample papers</a>'
    '</section>'
)


def enhance(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    updated = text.replace(">Sample QP</a>", ">Sample Question Paper</a>")
    if 'id="rev2026-model-qp-access"' not in updated:
        page_title = updated.find('<section class="page-title')
        if page_title < 0:
            raise RuntimeError(f"Page title section not found in {path}")
        end = updated.find("</section>", page_title)
        if end < 0:
            raise RuntimeError(f"Page title closing tag not found in {path}")
        end += len("</section>")
        updated = updated[:end] + ACCESS_SECTION + updated[end:]
    if updated == text:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def main() -> int:
    pages = [Path("revision-2026.html"), *sorted(Path("revision-2026").glob("*.html"))]
    if len(pages) < 39:
        raise RuntimeError(f"Expected the index plus 38 department pages; found {len(pages)}")
    changed = sum(enhance(path) for path in pages)
    print(f"Enhanced {changed} of {len(pages)} Revision 2026 pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
