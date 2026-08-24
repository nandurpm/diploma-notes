#!/usr/bin/env python3
"""Repair broken SITTTR diploma-modelqp-courses-show links.

The official SITTTR route ``diploma-modelqp-courses-show`` returns a page with
"not found" content (verified 2026-08-23), so every link that used it for model
question papers was dead. This tool rewrites those occurrences to the
revision-specific official model-paper index:

    https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp&scheme=REV20xx

--- no. Only the revision-specific index exists for every supported revision
(REV2015, REV2021, REV2026), so the replacement is revision-aware and never
guesses a direct file.

Run:  python3 tools/repair_modelqp_broken_routes.py [--check]
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

BROKEN_ROUTE_RE = re.compile(
    r"https?://(?:www\.)?sitttrkerala\.ac\.in/index\.php\?r=site%2Fdiploma-modelqp-courses-show&(?:amp;)?course=[A-Za-z0-9]+[^\"'\s]*",
    re.I,
)


def modelqp_index(scheme: str) -> str:
    return f"https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp&scheme={scheme}"


def fix_json_file(path: Path, field: str, scheme: str, check: bool) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    changed = 0

    def walk(node):
        nonlocal changed
        if isinstance(node, dict):
            for k, v in node.items():
                if isinstance(v, str) and BROKEN_ROUTE_RE.fullmatch(v.strip()):
                    node[k] = modelqp_index(scheme)
                    changed += 1
                else:
                    walk(v)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(data)
    if not check and changed:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changed


def fix_lesson_page(path: Path, scheme: str, check: bool = False) -> int:
    text = path.read_text(encoding="utf-8", errors="replace")
    new_text, n = BROKEN_ROUTE_RE.subn(modelqp_index(scheme), text)
    if not check and n:
        path.write_text(new_text, encoding="utf-8")
    return n


def infer_scheme(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel.startswith("revision-2026"):
        return "REV2026"
    if rel.startswith("revision-2015") or "rev2015" in rel:
        return "REV2015"
    return "REV2021"


def sweep_html(check: bool) -> int:
    """Scan every served HTML page for the dead route and repair it."""
    total = 0
    dirs = [ROOT / d for d in ("revision-2021", "revision-2026",
                               "revision-2026-content/lessons", "lessons")]
    files: list[Path] = list(ROOT.glob("*.html"))
    for d in dirs:
        if d.is_dir():
            files.extend(d.rglob("*.html"))
    for p in sorted(set(files)):
        n = fix_lesson_page(p, infer_scheme(p), check)
        total += n
    return total


def main() -> int:
    check = "--check" in sys.argv
    total = 0
    plans = [
        (ROOT / "data/knowledge-base.json", "modelQuestionUrl", "REV2021"),
        (ROOT / "assets/data/revision-2015-subjects.json", "modelQuestionPaperUrl", "REV2015"),
        (ROOT / "lessons/lessons-3032.html", None, "REV2021"),
        (ROOT / "lessons/lessons-3044.html", None, "REV2021"),
        (ROOT / "revision-2026-content/lessons/lessons-1021.html", None, "REV2026"),
        (ROOT / "revision-2026-content/lessons/lessons-1182.html", None, "REV2026"),
    ]
    for path, field, scheme in plans:
        if not path.exists():
            print(f"SKIP (missing): {path.relative_to(ROOT)}")
            continue
        n = fix_json_file(path, field, scheme, check) if field else fix_lesson_page(path, scheme, check)
        total += n
        print(f"{'CHECK' if check else 'FIX  '} {scheme:8s} {path.relative_to(ROOT)}: {n} replaced")

    # Provenance-only archive map (no runtime consumer) - derive scheme from each entry's pdfUrl path.
    archive = ROOT / "assets/data/sitttr-archive-links.json"
    if archive.exists():
        data = json.loads(archive.read_text(encoding="utf-8"))
        n = 0

        def walk(node):
            nonlocal n
            if isinstance(node, dict):
                if "sourceUrl" in node and BROKEN_ROUTE_RE.search(str(node.get("sourceUrl", ""))):
                    m = re.search(r"revision-(20\d\d)/", str(node.get("pdfUrl", "")))
                    node["sourceUrl"] = modelqp_index(f"REV{(m.group(1) if m else '2015')}")
                    n += 1
                for v in node.values():
                    walk(v)
            elif isinstance(node, list):
                for item in node:
                    walk(item)

        walk(data)
        if not check and n:
            archive.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"{'CHECK' if check else 'FIX  '} assets/data/sitttr-archive-links.json: {n} provenance URLs replaced")
        total += n

    html_n = sweep_html(check)
    print(f"{'CHECK' if check else 'FIX  '} served HTML pages: {html_n} dead routes")
    total += html_n

    print(f"\nTotal occurrences: {total} ({'in check mode' if check else 'fixed'}).")
    return 1 if check and total else 0


if __name__ == "__main__":
    raise SystemExit(main())