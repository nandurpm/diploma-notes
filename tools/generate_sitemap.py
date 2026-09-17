# Purpose: Generate sitemap - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Generate sitemap.xml from canonical public HTML pages and static blog entries."""
from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://polypmna.dpdns.org"
EXCLUDED_PREFIXES = (
    ".github/", "android/", "docs/", "maintenance/", "reports/", "supabase/", "tools/", "workers/"
)
EXCLUDED_FILES = {
    "404.html", "ask-poly-v2.html", "new-year-theme-preview.html", "reset-password.html",
    "tools-v2.html", "tools-v2-original.html", "revision-2026/department-view.html",
}
CANONICAL_RE = re.compile(r'<link\s+[^>]*rel=["\'][^"\']*canonical[^"\']*["\'][^>]*href=["\']([^"\']+)', re.I)
CANONICAL_RE_REVERSED = re.compile(r'<link\s+[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\'][^"\']*canonical', re.I)
NOINDEX_RE = re.compile(r'<meta\s+[^>]*name=["\']robots["\'][^>]*content=["\'][^"\']*noindex', re.I)


def git_lastmod(path: Path) -> str:
    relative = path.relative_to(ROOT).as_posix()
    try:
        value = subprocess.check_output(
            ["git", "log", "-1", "--no-merges", "--format=%cs", "--", relative],
            cwd=ROOT, text=True, stderr=subprocess.DEVNULL,
        ).strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            return value
    except Exception:
        pass
    return date.today().isoformat()


def canonical_for(path: Path) -> str | None:
    relative = path.relative_to(ROOT).as_posix()
    if relative in EXCLUDED_FILES or relative.startswith(EXCLUDED_PREFIXES):
        return None
    text = path.read_text(encoding="utf-8", errors="replace")
    if NOINDEX_RE.search(text):
        return None
    match = CANONICAL_RE.search(text) or CANONICAL_RE_REVERSED.search(text)
    if not match:
        return None
    url = html.unescape(match.group(1).strip())
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != urlparse(ORIGIN).netloc:
        return None
    return url


def static_blog_entries() -> list[tuple[str, str]]:
    index = ROOT / "data/blog-index.json"
    if not index.is_file():
        return []
    raw = json.loads(index.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("data/blog-index.json must contain an array")
    result: list[tuple[str, str]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        path = str(item.get("url") or "").strip()
        published = str(item.get("date") or "").strip()
        if not path.startswith("/") or path.startswith("//"):
            continue
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", published):
            published = git_lastmod(index)
        result.append((ORIGIN + path, published))
    return result


def entries() -> list[tuple[str, str]]:
    found: dict[str, str] = {}
    for path in ROOT.rglob("*.html"):
        url = canonical_for(path)
        if url:
            found[url] = git_lastmod(path)
    for url, lastmod in static_blog_entries():
        found[url] = max(found.get(url, "0000-00-00"), lastmod)
    return sorted(found.items(), key=lambda item: (item[0] != f"{ORIGIN}/", item[0]))


def render() -> str:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url, lastmod in entries():
        lines += ["  <url>", f"    <loc>{html.escape(url)}</loc>", f"    <lastmod>{lastmod}</lastmod>", "  </url>"]
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail if sitemap.xml is not current")
    args = parser.parse_args()
    generated = render()
    target = ROOT / "sitemap.xml"
    if args.check:
        current = target.read_text(encoding="utf-8") if target.exists() else ""
        normalize = lambda value: re.sub(r"<lastmod>\d{4}-\d{2}-\d{2}</lastmod>", "<lastmod>YYYY-MM-DD</lastmod>", value)
        if normalize(current) != normalize(generated):
            print("sitemap.xml is stale. Run: python tools/generate_sitemap.py")
            return 1
        print(f"sitemap.xml is current with {generated.count('<url>')} entries.")
        return 0
    target.write_text(generated, encoding="utf-8")
    print(f"Wrote {target.relative_to(ROOT)} with {generated.count('<url>')} entries.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
