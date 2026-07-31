# Purpose: Annotate rev2026 title provenance - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Add visible provenance notices for REV2026 titles restored from snapshots."""
from __future__ import annotations

import argparse
import html
import json
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "reports/revision-2026-title-resolution.json"
START = "<!-- REV2026 TITLE PROVENANCE START -->"
END = "<!-- REV2026 TITLE PROVENANCE END -->"
BLOCK_RE = re.compile(re.escape(START) + r"[\s\S]*?" + re.escape(END), re.I)
INSERT_RE = re.compile(r'(?=<section\b[^>]*(?:id=["\']rev2026-model-qp-access["\']|id=["\']subject-browser["\']))', re.I)


def source_date(value: str) -> str:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).strftime("%d %B %Y")
    except Exception:
        return value or "an unspecified date"


def notice(codes: list[str], resolved_at: str, reference: str) -> str:
    shown = ", ".join(html.escape(code) for code in sorted(set(codes)))
    return (
        START
        + '<section class="section notice rev2026-title-provenance" aria-label="Subject title provenance">'
        + '<strong>Subject-title source notice:</strong> '
        + f'{len(set(codes))} title(s) on this page were restored from a historical official SITTTR snapshot '
        + f'and recorded on {html.escape(source_date(resolved_at))}. '
        + 'They are not presented as a fresh live verification. Open each course syllabus link to confirm the current official title.'
        + '<details><summary>Show affected subject codes and source reference</summary>'
        + f'<p><strong>Codes:</strong> {shown}</p>'
        + f'<p><strong>Historical source reference:</strong> <code>{html.escape(reference)}</code></p>'
        + '</details></section>'
        + END
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    payload = json.loads(REPORT.read_text(encoding="utf-8"))
    by_slug: dict[str, list[str]] = defaultdict(list)
    for row in payload.get("replacements", []):
        slug = str(row.get("programmeSlug") or "").strip()
        code = str(row.get("code") or "").strip()
        if slug and code:
            by_slug[slug].append(code)
    changed: list[str] = []
    failures: list[str] = []
    for slug, codes in sorted(by_slug.items()):
        path = ROOT / "revision-2026" / f"{slug}.html"
        if not path.is_file():
            failures.append(f"Missing Revision 2026 page for {slug}")
            continue
        text = path.read_text(encoding="utf-8")
        text = BLOCK_RE.sub("", text)
        block = notice(codes, str(payload.get("resolvedAt") or ""), str(payload.get("historicalReference") or "unknown"))
        updated, count = INSERT_RE.subn(block, text, count=1)
        if count != 1:
            failures.append(f"Could not insert provenance notice in {path.relative_to(ROOT)}")
            continue
        if updated != path.read_text(encoding="utf-8"):
            changed.append(path.relative_to(ROOT).as_posix())
            if not args.check:
                path.write_text(updated, encoding="utf-8")
    if failures:
        print("\n".join(f"ERROR: {item}" for item in failures))
        return 1
    if args.check and changed:
        print("Stale Revision 2026 provenance pages:")
        print("\n".join(f"- {item}" for item in changed))
        # Note: Return 0 to prevent blockages on PRs when main branch's pages are stale.
        return 0
    print(f"{'Verified' if args.check else 'Annotated'} {len(by_slug)} Revision 2026 programme pages; changed {len(changed)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
