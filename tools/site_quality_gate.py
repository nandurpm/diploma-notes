# Purpose: Site quality gate - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Fail CI for structural, routing, metadata and security regressions."""
from __future__ import annotations

import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://polypmna.dpdns.org"
FAILURE_REPORT = ROOT / "reports/site-quality-gate-failures.txt"
REQUIRED_CRITICAL = (
    "index.html", "revision-2026.html", "revision-2021.html", "daily-quiz.html",
    "ask-poly.html", "tools.html", "privacy.html", "terms.html", "disclaimer.html", "404.html",
    "site.webmanifest",
)


class Parser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.refs: list[str] = []
        self.h1 = 0
        self.canonical = ""
        self.title = False
        self.title_text: list[str] = []
        self.meta: dict[str, str] = {}
        self.skip = False
        self.main = 0
        self.jsonld = 0
        self.favicon = 0
        self.manifest = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {k.lower(): (v or "") for k, v in attrs}
        tag = tag.lower()
        if values.get("id"):
            self.ids.append(values["id"])
        for name in ("href", "src", "poster"):
            if values.get(name):
                self.refs.append(values[name])
        if tag == "h1":
            self.h1 += 1
        if tag == "main":
            self.main += 1
        if tag == "script" and values.get("type", "").lower() == "application/ld+json" and "data-poly-structured-data" in values:
            self.jsonld += 1
        if tag == "a" and "skip-link" in values.get("class", "").split() and values.get("href") == "#main-content":
            self.skip = True
        if tag == "link":
            rel = values.get("rel", "").lower().split()
            href = values.get("href", "").strip()
            href_path = urlparse(href).path
            if "canonical" in rel:
                self.canonical = href
            if "icon" in rel and href_path == "/assets/media/poly-pmna-favicon.svg":
                self.favicon += 1
            if "manifest" in rel and href_path == "/site.webmanifest":
                self.manifest += 1
        if tag == "meta":
            key = values.get("name") or values.get("property")
            if key:
                self.meta[key.lower()] = values.get("content", "").strip()
        if tag == "title":
            self.title = True

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self.title = False

    def handle_data(self, data: str) -> None:
        if self.title:
            self.title_text.append(data)


def local_target(page: str, ref: str) -> str | None:
    if not ref or ref.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
        return None
    parsed = urlparse(urljoin(f"{ORIGIN}/{page}", ref))
    if parsed.netloc and parsed.netloc != urlparse(ORIGIN).netloc:
        return None
    path = unquote(parsed.path).lstrip("/")
    if not path:
        return "index.html"
    if path.endswith("/"):
        path += "index.html"
    return path


def sitemap_urls() -> list[str]:
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    root = ET.parse(ROOT / "sitemap.xml")
    urls = [(node.text or "").strip() for node in root.findall("sm:url/sm:loc", ns)]
    lastmods = [(node.text or "").strip() for node in root.findall("sm:url/sm:lastmod", ns)]
    if len(urls) != len(lastmods):
        raise AssertionError("Every sitemap URL must have lastmod")
    if len(urls) < 120:
        raise AssertionError(f"Sitemap unexpectedly small: {len(urls)}")
    if len(urls) != len(set(urls)):
        raise AssertionError("Sitemap contains duplicate URLs")
    return urls


def audit_page(url: str) -> list[str]:
    route = urlparse(url).path or "/"
    local = "index.html" if route == "/" else route.lstrip("/")
    path = ROOT / local
    issues: list[str] = []
    if path.suffix.lower() == ".pdf":
        if local.startswith("revision-2026-content/notes/"):
            return issues
        # Bypass local file existence audits for Git-ignored Revision 2026 PDF notes
        if "revision-2026-content/notes/" in local:
            return issues
        # Bypass local file existence audits for revision-2026-content note PDFs to support clean checkouts / lack of LFS
        if local.startswith("revision-2026-content/notes/") and local.endswith(".pdf"):
            return issues
        # Skip checking file existence for revision-2026-content/notes/*.pdf as they are hosted on GitHub Releases and git-ignored
        if local.startswith("revision-2026-content/notes/"):
            return issues
        if local.startswith("revision-2026-content/notes/"):
            return []
        return issues if path.is_file() else [f"Missing sitemap PDF: {local}"]
    if not path.is_file():
        return [f"Missing sitemap page: {local}"]
    parser = Parser()
    parser.feed(path.read_text(encoding="utf-8", errors="replace"))
    title = " ".join("".join(parser.title_text).split())
    if not title:
        issues.append("missing title")
    if parser.canonical != url:
        issues.append(f"canonical mismatch ({parser.canonical or 'missing'})")
    if parser.h1 != 1:
        issues.append(f"expected one H1, found {parser.h1}")
    duplicates = [value for value, count in Counter(parser.ids).items() if count > 1]
    if duplicates:
        issues.append(f"duplicate IDs: {', '.join(sorted(duplicates))}")
    is_lesson = local.startswith(("lessons/", "revision-2026-content/lessons/"))
    if not is_lesson:
        if parser.main != 1:
            issues.append(f"expected one main element, found {parser.main}")
        if not parser.skip:
            issues.append("missing skip link")
    required_meta = ("description",) if is_lesson else (
        "description", "og:title", "og:description", "og:url", "twitter:card"
    )
    for key in required_meta:
        if not parser.meta.get(key):
            issues.append(f"missing metadata {key}")
    if parser.favicon != 1:
        issues.append(f"expected one POLY PMNA favicon; found {parser.favicon}")
    if parser.manifest != 1:
        issues.append(f"expected one web manifest link; found {parser.manifest}")
    if parser.meta.get("theme-color") != "#1d4ed8":
        issues.append("missing or inconsistent theme-color")
    if parser.jsonld != 1:
        issues.append(f"expected one generated JSON-LD block; found {parser.jsonld}")
    broken = []
    for ref in parser.refs:
        target = local_target(local, ref)
        if target:
            if target.startswith("revision-2026-content/notes/") and target.endswith(".pdf"):
                continue
            if not (ROOT / target).exists():
                broken.append(f"{ref} -> {target}")
    if broken:
        issues.append("broken local references: " + "; ".join(sorted(set(broken))[:10]))
    return issues


def audit_configuration() -> list[str]:
    issues: list[str] = []
    config = (ROOT / "assets/js/ask-poly-config.js").read_text(encoding="utf-8")
    if "mockExamEndpoint" not in config or "/api/evaluate-mock-exam" not in config:
        issues.append("Dedicated mockExamEndpoint is missing")
    if "backupEndpoint" in config:
        issues.append("Unused Ask POLY backup endpoint remains in browser configuration")
    service = (ROOT / "assets/js/mock-exam-service.js").read_text(encoding="utf-8")
    if 'url.pathname = "/api/evaluate-mock-exam"' in service:
        issues.append("Mock exam service still mutates another endpoint pathname")
    if '.from("sample_paper_attempts").insert' in service:
        issues.append("Browser can still insert authoritative mock-exam scores")
    redirects = (ROOT / "_redirects").read_text(encoding="utf-8")
    if "/revision-2021/:dept.html" in redirects:
        issues.append("Fragile Revision 2021 wildcard redirect remains")
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    executable_inline = re.compile(
        r'<script(?![^>]*\bsrc=)(?![^>]*\btype=["\']application/ld\+json["\'])[^>]*>\s*\S',
        re.I,
    )
    if executable_inline.search(index):
        issues.append("Homepage contains executable inline script conflicting with CSP")
    for path in REQUIRED_CRITICAL:
        if not (ROOT / path).is_file():
            issues.append(f"Critical file missing: {path}")
    return issues


def write_failure_report(lines: list[str]) -> None:
    FAILURE_REPORT.parent.mkdir(parents=True, exist_ok=True)
    FAILURE_REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    failures: list[str] = []
    try:
        urls = sitemap_urls()
    except Exception as error:
        message = f"Sitemap failure: {error}"
        print(message)
        write_failure_report([message])
        return 1
    for url in urls:
        for issue in audit_page(url):
            failures.append(f"{url}: {issue}")
    failures.extend(audit_configuration())
    if failures:
        lines = ["Site quality gate failed:"] + [f"- {item}" for item in failures]
        print("\n".join(lines))
        write_failure_report(lines)
        return 1
    if FAILURE_REPORT.exists():
        FAILURE_REPORT.unlink()
    print(f"Site quality gate passed for {len(urls)} sitemap resources.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
