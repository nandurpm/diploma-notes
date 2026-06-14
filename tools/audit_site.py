#!/usr/bin/env python3
"""Audit sitemap pages, metadata, IDs, and local links/assets."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://polypmna.dpdns.org"
REPORT_DIR = ROOT / "reports"
REQUIRED_META = (
    "description",
    "og:type",
    "og:title",
    "og:description",
    "og:url",
    "og:image",
    "og:image:type",
    "og:image:width",
    "og:image:height",
    "og:image:alt",
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
)


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.in_title = False
        self.meta: dict[str, str] = {}
        self.canonical = ""
        self.ids: list[str] = []
        self.refs: list[tuple[str, str]] = []
        self.main_ids: list[str] = []
        self.has_skip_link = False
        self.has_breadcrumb = False
        self.h1_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {key.lower(): (value or "") for key, value in attrs}
        lower = tag.lower()
        if lower == "title":
            self.in_title = True
        if "id" in attr:
            self.ids.append(attr["id"])
        if lower == "meta":
            key = attr.get("name") or attr.get("property")
            if key:
                self.meta[key.lower()] = attr.get("content", "").strip()
        if lower == "link" and "canonical" in attr.get("rel", "").lower().split():
            self.canonical = attr.get("href", "").strip()
        if lower == "main":
            self.main_ids.append(attr.get("id", ""))
        classes = set(attr.get("class", "").split())
        if lower == "a" and "skip-link" in classes and attr.get("href") == "#main-content":
            self.has_skip_link = True
        if lower == "nav" and "site-breadcrumbs" in classes:
            self.has_breadcrumb = True
        if lower == "h1":
            self.h1_count += 1
        for name in ("href", "src", "poster"):
            if name in attr and attr[name]:
                self.refs.append((name, attr[name].strip()))

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)

    @property
    def title(self) -> str:
        return " ".join("".join(self.title_parts).split())


def sitemap_entries() -> list[tuple[str, str]]:
    tree = ET.parse(ROOT / "sitemap.xml")
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    result: list[tuple[str, str]] = []
    for loc in tree.findall("sm:url/sm:loc", ns):
        url = (loc.text or "").strip()
        route = urlparse(url).path or "/"
        local = "index.html" if route == "/" else route.lstrip("/")
        result.append((local, url))
    return result


def local_target(page_local: str, reference: str) -> str | None:
    if not reference or reference.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
        return None
    absolute = urljoin(f"{ORIGIN}/{page_local}", reference)
    parsed = urlparse(absolute)
    if parsed.netloc and parsed.netloc != urlparse(ORIGIN).netloc:
        return None
    path = unquote(parsed.path)
    if path == "/":
        return "index.html"
    target = path.lstrip("/")
    if target.endswith("/"):
        target += "index.html"
    return target or "index.html"


def audit_page(local: str, expected_url: str) -> dict[str, object]:
    path = ROOT / local
    issues: list[str] = []
    if not path.is_file():
        return {"path": local, "url": expected_url, "issues": ["Sitemap page file is missing"]}

    parser = PageParser()
    text = path.read_text(encoding="utf-8")
    parser.feed(text)

    if not parser.title:
        issues.append("Missing or empty <title>")
    if parser.h1_count != 1:
        issues.append(f"Expected exactly one H1; found {parser.h1_count}")
    if parser.canonical != expected_url:
        issues.append(f"Canonical mismatch: {parser.canonical or 'missing'}")
    for key in REQUIRED_META:
        if not parser.meta.get(key):
            issues.append(f"Missing metadata: {key}")
    if parser.meta.get("og:url") != expected_url:
        issues.append("og:url does not match sitemap URL")
    if parser.meta.get("og:image:width") != "1200" or parser.meta.get("og:image:height") != "630":
        issues.append("Social-image dimensions are not 1200x630")

    duplicates = sorted(item for item, count in Counter(parser.ids).items() if item and count > 1)
    for duplicate in duplicates:
        issues.append(f"Duplicate ID: {duplicate}")

    is_non_lesson = not local.startswith("lessons/")
    if is_non_lesson:
        if parser.main_ids != ["main-content"]:
            issues.append("Main content target is missing or duplicated")
        if not parser.has_skip_link:
            issues.append("Skip-to-content link is missing")
        if local != "index.html" and not parser.has_breadcrumb:
            issues.append("Breadcrumb navigation is missing")

    broken: set[str] = set()
    for _, reference in parser.refs:
        target = local_target(local, reference)
        if target is None:
            continue
        target_path = ROOT / target
        if not target_path.exists():
            broken.add(f"{reference} -> {target}")
    for item in sorted(broken):
        issues.append(f"Broken local reference: {item}")

    return {
        "path": local,
        "url": expected_url,
        "title": parser.title,
        "canonical": parser.canonical,
        "issues": issues,
    }


def audit_css_assets() -> list[str]:
    issues: list[str] = []
    url_pattern = re.compile(r"url\((?:['\"])?([^)'\"]+)", flags=re.I)
    for css in ROOT.glob("assets/css/*.css"):
        text = css.read_text(encoding="utf-8")
        for reference in url_pattern.findall(text):
            reference = reference.strip()
            target = local_target(css.relative_to(ROOT).as_posix(), reference)
            if target and not (ROOT / target).exists():
                issues.append(f"{css.relative_to(ROOT)}: {reference} -> {target}")
    return sorted(set(issues))


def write_reports(pages: list[dict[str, object]], css_issues: list[str]) -> tuple[Path, Path]:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    failing_pages = [page for page in pages if page["issues"]]
    payload = {
        "pages_checked": len(pages),
        "pages_with_issues": len(failing_pages),
        "css_asset_issues": css_issues,
        "pages": pages,
        "runtime_console_audit": "pending",
    }
    json_path = REPORT_DIR / "site-integrity-audit.json"
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [
        "# Site Integrity Audit",
        "",
        f"- Sitemap pages checked: **{len(pages)}**",
        f"- Pages with static issues: **{len(failing_pages)}**",
        f"- Broken CSS asset references: **{len(css_issues)}**",
        "- Runtime console audit: **Pending workflow browser check**",
        "",
    ]
    if not failing_pages and not css_issues:
        lines.extend(["## Static result", "", "All static integrity checks passed.", ""])
    else:
        lines.extend(["## Static issues", ""])
        for page in failing_pages:
            lines.append(f"### `{page['path']}`")
            for issue in page["issues"]:
                lines.append(f"- {issue}")
            lines.append("")
        if css_issues:
            lines.append("### CSS assets")
            lines.extend(f"- {item}" for item in css_issues)
            lines.append("")
    md_path = REPORT_DIR / "site-integrity-audit.md"
    md_path.write_text("\n".join(lines), encoding="utf-8")
    return json_path, md_path


def main() -> int:
    pages = [audit_page(local, url) for local, url in sitemap_entries()]
    css_issues = audit_css_assets()
    json_path, md_path = write_reports(pages, css_issues)
    issue_count = sum(len(page["issues"]) for page in pages) + len(css_issues)
    print(f"Sitemap pages checked: {len(pages)}")
    print(f"Static issues found: {issue_count}")
    print(f"JSON report: {json_path.relative_to(ROOT)}")
    print(f"Markdown report: {md_path.relative_to(ROOT)}")
    return 1 if issue_count else 0


if __name__ == "__main__":
    sys.exit(main())
