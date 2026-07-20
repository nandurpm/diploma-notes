#!/usr/bin/env python3
"""Generate and validate POLY PMNA JSON-LD from canonical page metadata."""
from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://polypmna.dpdns.org"
EXCLUDED_ROOTS = {".github", "android", "android-app", "docs", "maintenance", "reports", "supabase", "tools", "workers", "node_modules", "_site"}
EXCLUDED_NAMES = {"department-view.html", "tools-v2-original.html", "new-year-theme-preview.html", "404.html"}
BLOCK_RE = re.compile(r'<script\s+type=["\']application/ld\+json["\']\s+data-poly-structured-data>[\s\S]*?</script>\s*', re.I)
HEAD_END_RE = re.compile(r"</head>", re.I)
DOCUMENT_RE = re.compile(r"<(?:!doctype\s+html|html\b)", re.I)
TITLE_RE = re.compile(r"<title>([\s\S]*?)</title>", re.I)
CANONICAL_RE = re.compile(r'<link\s+[^>]*rel=["\'][^"\']*canonical[^"\']*["\'][^>]*href=["\']([^"\']+)', re.I)
CANONICAL_RE_REVERSED = re.compile(r'<link\s+[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\'][^"\']*canonical', re.I)
DESCRIPTION_RE = re.compile(r'<meta\s+[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)', re.I)
DESCRIPTION_RE_REVERSED = re.compile(r'<meta\s+[^>]*content=["\']([^"\']*)["\'][^>]*name=["\']description["\']', re.I)
COURSE_CODE_RE = re.compile(r'<meta\s+[^>]*name=["\']course-code["\'][^>]*content=["\']([^"\']+)', re.I)


def read_page(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def clean_markup(value: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", value)).split())


def metadata(text: str) -> tuple[str, str, str, str]:
    title_match = TITLE_RE.search(text)
    canonical_match = CANONICAL_RE.search(text) or CANONICAL_RE_REVERSED.search(text)
    description_match = DESCRIPTION_RE.search(text) or DESCRIPTION_RE_REVERSED.search(text)
    title = clean_markup(title_match.group(1)) if title_match else ""
    canonical = html.unescape(canonical_match.group(1).strip()) if canonical_match else ""
    description = html.unescape(description_match.group(1).strip()) if description_match else ""
    code_match = COURSE_CODE_RE.search(text)
    code = html.unescape(code_match.group(1).strip()) if code_match else ""
    return title, canonical, description, code


def page_type(relative: str) -> str:
    if relative == "index.html":
        return "WebSite"
    if relative in {"revision-2021.html", "revision-2026.html", "materials-2015.html", "tools-catalog.html"}:
        return "CollectionPage"
    if relative.startswith(("revision-2021/", "revision-2026/")):
        return "CollectionPage"
    if relative.startswith(("lessons/", "revision-2026-content/lessons/")):
        return "LearningResource"
    return "WebPage"


def payload(relative: str, text: str) -> dict[str, object]:
    title, canonical, description, code = metadata(text)
    if not title or not canonical:
        raise ValueError(f"{relative} is missing title or canonical URL")
    kind = page_type(relative)
    data: dict[str, object] = {
        "@context": "https://schema.org",
        "@type": kind,
        "name": title,
        "url": canonical,
        "description": description,
        "isPartOf": {"@type": "WebSite", "name": "POLY PMNA", "url": ORIGIN + "/"},
        "publisher": {"@type": "Organization", "name": "POLY PMNA", "url": ORIGIN + "/"},
        "inLanguage": ["en", "ml"],
    }
    if kind == "WebSite":
        data.pop("isPartOf", None)
    elif kind == "CollectionPage":
        revision = "Revision 2026" if "2026" in relative else "Revision 2021" if "2021" in relative else "Revision 2015"
        data["about"] = {"@type": "EducationalOccupationalProgram", "name": f"Kerala Polytechnic {revision}"}
    elif kind == "LearningResource":
        data.update({
            "learningResourceType": "Course handbook",
            "educationalLevel": "Diploma",
            "audience": {"@type": "EducationalAudience", "educationalRole": "student"},
        })
        if code:
            data["identifier"] = code
    return data


def public_pages() -> list[Path]:
    result: list[Path] = []
    for path in ROOT.rglob("*.html"):
        relative = path.relative_to(ROOT)
        if relative.parts and relative.parts[0] in EXCLUDED_ROOTS:
            continue
        if path.name in EXCLUDED_NAMES:
            continue
        source = read_page(path)
        # Only canonical, complete documents are public schema targets. HTML
        # snippets/templates are intentionally excluded even when they use .html.
        if not DOCUMENT_RE.search(source) or not HEAD_END_RE.search(source):
            continue
        if not (CANONICAL_RE.search(source) or CANONICAL_RE_REVERSED.search(source)):
            continue
        if not TITLE_RE.search(source):
            continue
        result.append(path)
    return sorted(result)


def updated_text(path: Path) -> str:
    relative = path.relative_to(ROOT).as_posix()
    source = BLOCK_RE.sub("", read_page(path))
    data = payload(relative, source)
    block = '<script type="application/ld+json" data-poly-structured-data>' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "</script>\n"
    updated, count = HEAD_END_RE.subn(block + "</head>", source, count=1)
    if count != 1:
        raise ValueError(f"Missing </head> in {relative}")
    return updated


def validate(text: str, relative: str) -> None:
    matches = re.findall(r'<script\s+type=["\']application/ld\+json["\']\s+data-poly-structured-data>([\s\S]*?)</script>', text, re.I)
    if len(matches) != 1:
        raise ValueError(f"Expected one POLY JSON-LD block in {relative}; found {len(matches)}")
    data = json.loads(matches[0])
    for key in ("@context", "@type", "name", "url"):
        if not data.get(key):
            raise ValueError(f"Structured data missing {key} in {relative}")
    if data["@context"] != "https://schema.org":
        raise ValueError(f"Invalid schema context in {relative}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    pages = public_pages()
    changed: list[str] = []
    failures: list[str] = []
    for path in pages:
        relative = path.relative_to(ROOT).as_posix()
        try:
            updated = updated_text(path)
            validate(updated, relative)
        except (ValueError, json.JSONDecodeError) as error:
            failures.append(str(error))
            continue
        current = read_page(path)
        if current != updated:
            changed.append(relative)
            if not args.check:
                path.write_text(updated, encoding="utf-8")
    if failures:
        print("\n".join(f"ERROR: {item}" for item in failures))
        return 1
    if args.check and changed:
        print("Stale structured-data pages:")
        print("\n".join(f"- {item}" for item in changed))
        return 1
    print(f"{'Verified' if args.check else 'Generated'} structured data on {len(pages)} public pages; changed {len(changed)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
