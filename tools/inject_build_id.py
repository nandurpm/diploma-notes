#!/usr/bin/env python3
"""Inject one build ID into every local asset URL in complete public HTML documents."""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
ATTRIBUTE_RE = re.compile(r'(?P<prefix>\b(?:src|href|poster)=["\'])(?P<url>/assets/[^"\']+)(?P<suffix>["\'])', re.I)
META_RE = re.compile(r'<meta\s+name=["\']poly-build-id["\'][^>]*>', re.I)
HEAD_END_RE = re.compile(r'</head>', re.I)
DOCUMENT_RE = re.compile(r'<(?:!doctype\s+html|html\b)', re.I)
EXCLUDED_ROOTS = {
    "maintenance", "reports", "docs", "workers", "supabase", "android",
    "android-app", "tools", ".github", "tmp", "node_modules", "_site",
}
EXCLUDED_NAMES = {"department-view.html", "tools-v2-original.html"}


def versioned(url: str, build_id: str) -> str:
    split = urlsplit(url)
    query = [part for part in split.query.split("&") if part and not part.startswith("v=")]
    query.append(f"v={build_id}")
    return urlunsplit((split.scheme, split.netloc, split.path, "&".join(query), split.fragment))


def update(path: Path, build_id: str) -> bool:
    original = path.read_text(encoding="utf-8", errors="replace")
    if not DOCUMENT_RE.search(original) or not HEAD_END_RE.search(original):
        return False
    text = ATTRIBUTE_RE.sub(
        lambda match: match.group("prefix") + versioned(match.group("url"), build_id) + match.group("suffix"),
        original,
    )
    meta = f'<meta name="poly-build-id" content="{build_id}">'
    if META_RE.search(text):
        text = META_RE.sub(meta, text, count=1)
    else:
        text, count = HEAD_END_RE.subn(meta + "</head>", text, count=1)
        if count != 1:
            raise ValueError(f"Missing </head> in {path.relative_to(ROOT)}")
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("build_id")
    parser.add_argument("--root", type=Path, default=ROOT)
    args = parser.parse_args()
    build_id = re.sub(r"[^A-Za-z0-9._-]+", "-", args.build_id).strip("-")[:64]
    if not build_id:
        raise SystemExit("A non-empty build ID is required")
    changed = 0
    skipped = 0
    for path in args.root.rglob("*.html"):
        relative = path.relative_to(args.root)
        if relative.parts and relative.parts[0] in EXCLUDED_ROOTS:
            skipped += 1
            continue
        if path.name in EXCLUDED_NAMES:
            skipped += 1
            continue
        if update(path, build_id):
            changed += 1
    print(f"Injected build ID {build_id} into {changed} HTML files; skipped {skipped} excluded files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
